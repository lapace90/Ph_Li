// Gestion des profils laboratoires B2B

import { supabase } from '../lib/supabase';

export const laboratoryService = {
  // ==========================================
  // PROFIL LABORATOIRE
  // ==========================================

  /**
   * Récupère le profil laboratoire
   */
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('laboratory_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Crée ou met à jour le profil laboratoire
   */
  async upsertProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('laboratory_profiles')
      .upsert({
        id: userId,
        company_name: profileData.companyName,
        brand_name: profileData.brandName || null,
        logo_url: profileData.logoUrl || null,
        description: profileData.description || null,
        website_url: profileData.websiteUrl || null,
        siret: profileData.siret?.replace(/\s/g, '') || null,
        siret_verified: profileData.siretVerified || false,
        product_categories: profileData.productCategories || [],
        contact_email: profileData.contactEmail,
        contact_phone: profileData.contactPhone || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Met à jour des champs spécifiques
   */
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('laboratory_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ==========================================
  // ABONNEMENT
  // ==========================================

  /**
   * Récupère les infos d'abonnement
   */
  async getSubscription(userId) {
    const { data, error } = await supabase
      .from('laboratory_profiles')
      .select('subscription_tier, subscription_started_at, subscription_expires_at, contacts_used_this_month, missions_used_this_month')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Met à jour l'abonnement
   */
  async updateSubscription(userId, tier, durationMonths = 1) {
    const startDate = new Date();
    const expiresAt = new Date(startDate);
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    const { data, error } = await supabase
      .from('laboratory_profiles')
      .update({
        subscription_tier: tier,
        subscription_started_at: startDate.toISOString(),
        subscription_expires_at: expiresAt.toISOString(),
        contacts_used_this_month: 0,  // Reset
        missions_used_this_month: 0,  // Reset
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Vérifie les limites d'abonnement
   */
  async checkLimits(userId) {
    const { data, error } = await supabase
      .from('laboratory_profiles')
      .select('subscription_tier, contacts_used_this_month, missions_used_this_month')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const limits = {
      free: { contacts: 0, missions: 0 },
      starter: { contacts: 5, missions: 1 },
      pro: { contacts: Infinity, missions: Infinity },
      business: { contacts: Infinity, missions: Infinity },
    };

    const tierLimits = limits[data.subscription_tier] || limits.free;

    return {
      tier: data.subscription_tier,
      contacts: {
        used: data.contacts_used_this_month,
        limit: tierLimits.contacts,
        remaining: Math.max(0, tierLimits.contacts - data.contacts_used_this_month),
        canContact: data.contacts_used_this_month < tierLimits.contacts,
      },
      missions: {
        used: data.missions_used_this_month,
        limit: tierLimits.missions,
        remaining: Math.max(0, tierLimits.missions - data.missions_used_this_month),
        canCreate: data.missions_used_this_month < tierLimits.missions,
      },
    };
  },

  /**
   * Incrémente le compteur de contacts utilisés
   */
  async incrementContactsUsed(userId) {
    const { data, error } = await supabase.rpc('increment_lab_contacts', {
      lab_id: userId,
    });

    // Si la fonction RPC n'existe pas, faire manuellement
    if (error) {
      const { data: profile } = await supabase
        .from('laboratory_profiles')
        .select('contacts_used_this_month')
        .eq('id', userId)
        .single();

      await supabase
        .from('laboratory_profiles')
        .update({
          contacts_used_this_month: (profile?.contacts_used_this_month || 0) + 1,
        })
        .eq('id', userId);
    }

    return data;
  },

  /**
   * Incrémente le compteur de missions créées
   */
  async incrementMissionsUsed(userId) {
    const { data: profile } = await supabase
      .from('laboratory_profiles')
      .select('missions_used_this_month')
      .eq('id', userId)
      .single();

    await supabase
      .from('laboratory_profiles')
      .update({
        missions_used_this_month: (profile?.missions_used_this_month || 0) + 1,
      })
      .eq('id', userId);
  },

  // ==========================================
  // FAVORIS / SHORTLIST
  // ==========================================

  /**
   * Récupère les favoris d'un labo
   */
  async getFavorites(laboratoryId) {
    const { data, error } = await supabase
      .from('laboratory_favorites')
      .select(`
        *,
        animator:animator_profiles(
          id,
          animation_specialties,
          brands_experience,
          daily_rate_min,
          daily_rate_max,
          average_rating,
          missions_completed,
          available_now,
          profile:profiles(
            first_name,
            last_name,
            photo_url,
            current_city,
            current_region
          )
        )
      `)
      .eq('laboratory_id', laboratoryId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Ajoute un animateur aux favoris
   */
  async addFavorite(laboratoryId, animatorId, notes = null) {
    const { data, error } = await supabase
      .from('laboratory_favorites')
      .insert({
        laboratory_id: laboratoryId,
        animator_id: animatorId,
        notes,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Cet animateur est déjà dans vos favoris');
      }
      throw error;
    }
    return data;
  },

  /**
   * Met à jour les notes sur un favori
   */
  async updateFavoriteNotes(laboratoryId, animatorId, notes) {
    const { data, error } = await supabase
      .from('laboratory_favorites')
      .update({ notes })
      .eq('laboratory_id', laboratoryId)
      .eq('animator_id', animatorId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Supprime un animateur des favoris
   */
  async removeFavorite(laboratoryId, animatorId) {
    const { error } = await supabase
      .from('laboratory_favorites')
      .delete()
      .eq('laboratory_id', laboratoryId)
      .eq('animator_id', animatorId);

    if (error) throw error;
    return true;
  },

  /**
   * Vérifie si un animateur est en favori
   */
  async isFavorite(laboratoryId, animatorId) {
    const { data, error } = await supabase
      .from('laboratory_favorites')
      .select('id')
      .eq('laboratory_id', laboratoryId)
      .eq('animator_id', animatorId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  // ==========================================
  // VÉRIFICATION SIRET
  // ==========================================

  /**
   * Vérifie un SIRET via l'API INSEE
   */
  async verifySiret(siret) {
    const cleanSiret = siret.replace(/\s/g, '');

    if (cleanSiret.length !== 14) {
      throw new Error('Le SIRET doit contenir 14 chiffres');
    }

    try {
      const response = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${cleanSiret}`
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la vérification');
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        throw new Error('SIRET non trouvé');
      }

      const company = data.results[0];
      const etablissement = company.matching_etablissements?.find(e => e.siret === cleanSiret)
        || (company.siege?.siret === cleanSiret ? company.siege : null);

      if (!etablissement) {
        throw new Error('SIRET non trouvé');
      }

      return {
        valid: true,
        data: {
          siret: cleanSiret,
          companyName: company.nom_complet || company.nom_raison_sociale || '',
          isActive: etablissement.etat_administratif === 'A',
        },
      };
    } catch (error) {
      console.error('Erreur vérification SIRET:', error);
      throw error;
    }
  },

  /**
   * Marque le SIRET comme vérifié
   */
  async markSiretVerified(userId) {
    const { data, error } = await supabase
      .from('laboratory_profiles')
      .update({
        siret_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ==========================================
  // STATISTIQUES
  // ==========================================

  /**
   * Récupère les stats d'un laboratoire
   */
  async getStats(laboratoryId) {
    // Missions créées
    const { data: missions } = await supabase
      .from('animation_missions')
      .select('status')
      .eq('client_id', laboratoryId);

    const missionStats = {
      total: missions?.length || 0,
      completed: missions?.filter(m => m.status === 'completed').length || 0,
      active: missions?.filter(m => ['open', 'assigned', 'in_progress'].includes(m.status)).length || 0,
    };

    // Animateurs contactés (favoris)
    const { count: favoritesCount } = await supabase
      .from('laboratory_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('laboratory_id', laboratoryId);

    // Notes moyennes reçues
    const { data: reviews } = await supabase
      .from('mission_reviews')
      .select('rating_overall')
      .eq('reviewee_id', laboratoryId)
      .eq('visible', true);

    const avgRating = reviews?.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating_overall, 0) / reviews.length
      : null;

    return {
      missions: missionStats,
      favoritesCount: favoritesCount || 0,
      averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      reviewsCount: reviews?.length || 0,
    };
  },
};