// Service générique pour tous les favoris

import { supabase } from '../lib/supabase';
import { subscriptionService } from './subscriptionService';

// Types de cibles possibles
export const FAVORITE_TYPES = {
  CANDIDATE: 'candidate',       // Titulaire → Candidat
  ANIMATOR: 'animator',         // Labo → Animateur
  LABORATORY: 'laboratory',     // Animateur → Labo
  JOB_OFFER: 'job_offer',       // Candidat → Offre
  MISSION: 'mission',           // Animateur → Mission
  PHARMACY_LISTING: 'pharmacy_listing', // Tous → Pharmacie marketplace
};

export const favoritesService = {
  // ==========================================
  // CRUD
  // ==========================================

  /**
   * Récupère tous les favoris d'un utilisateur
   */
  async getAll(userId) {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère les favoris d'un type spécifique
   */
  async getByType(userId, targetType) {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Ajoute un favori
   */
  async add(userId, targetType, targetId, notes = null) {
    // Verifier le quota pour les favoris animateurs (labos uniquement)
    if (targetType === FAVORITE_TYPES.ANIMATOR) {
      const quota = await this.canAddFavorite(userId);
      if (!quota.allowed) {
        throw new Error(quota.message || 'Limite de favoris atteinte.');
      }
    }

    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
        notes,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Déjà dans vos favoris');
      }
      throw error;
    }
    return data;
  },

  /**
   * Supprime un favori
   */
  async remove(userId, targetType, targetId) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (error) throw error;
    return true;
  },

  /**
   * Toggle un favori (ajoute ou supprime)
   */
  async toggle(userId, targetType, targetId, notes = null) {
    const isFav = await this.isFavorite(userId, targetType, targetId);
    
    if (isFav) {
      await this.remove(userId, targetType, targetId);
      return { added: false };
    } else {
      const data = await this.add(userId, targetType, targetId, notes);
      return { added: true, favorite: data };
    }
  },

  /**
   * Vérifie si un élément est en favori
   */
  async isFavorite(userId, targetType, targetId) {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  /**
   * Met à jour les notes d'un favori
   */
  async updateNotes(userId, targetType, targetId, notes) {
    const { data, error } = await supabase
      .from('favorites')
      .update({ notes })
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ==========================================
  // QUOTAS
  // ==========================================

  /**
   * Compte les favoris d'un utilisateur
   * @param {string} userId
   * @param {string|null} targetType - Si fourni, filtre par type
   * @returns {number}
   */
  async getFavoritesCount(userId, targetType = null) {
    let query = supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (targetType) {
      query = query.eq('target_type', targetType);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  /**
   * Verifie si l'utilisateur peut ajouter un favori animateur
   * Seuls les labos ont une limite (free=3, starter=10, pro=50, business=Infinity)
   * @returns {{ allowed: boolean, current: number, limit: number, message: string|null }}
   */
  async canAddFavorite(userId) {
    const { limits, userType, tier } = await subscriptionService.getLimits(userId);

    if (userType !== 'laboratoire') {
      return { allowed: true, current: 0, limit: Infinity };
    }

    const limit = limits.favorites;
    if (limit === Infinity || limit == null) {
      return { allowed: true, current: 0, limit: Infinity };
    }

    const current = await this.getFavoritesCount(userId, FAVORITE_TYPES.ANIMATOR);
    const allowed = current < limit;

    let message = null;
    if (!allowed) {
      const nextLabel = tier === 'free' ? 'Starter' : tier === 'starter' ? 'Pro' : 'Business';
      const nextLimit = tier === 'free' ? 10 : tier === 'starter' ? 50 : 'illimites';
      message = `Limite de favoris atteinte (${current}/${limit}). Passez au forfait ${nextLabel} pour sauvegarder jusqu'a ${nextLimit} animateurs.`;
    }

    return { allowed, current, limit, message };
  },

  // ==========================================
  // COMPTEURS ANONYMES (pour la cible)
  // ==========================================

  /**
   * Compte combien de fois une cible est en favori
   */
  async countForTarget(targetType, targetId) {
    const { count, error } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Vérifie si c'est le premier favori (pour notification)
   */
  async isFirstFavorite(targetType, targetId) {
    const count = await this.countForTarget(targetType, targetId);
    return count === 1;
  },

  // ==========================================
  // RÉCUPÉRATION ENRICHIE PAR TYPE
  // ==========================================

  /**
   * Récupère les candidats favoris d'un titulaire (avec profils)
   */
  async getCandidateFavorites(userId) {
    const favorites = await this.getByType(userId, FAVORITE_TYPES.CANDIDATE);
    
    if (favorites.length === 0) return [];

    const ids = favorites.map(f => f.target_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, photo_url, current_city, current_region')
      .in('id', ids);

    return favorites.map(f => ({
      ...f,
      profile: profiles?.find(p => p.id === f.target_id),
    }));
  },

  /**
   * Récupère les animateurs favoris d'un labo (avec profils)
   */
  async getAnimatorFavorites(userId) {
    const favorites = await this.getByType(userId, FAVORITE_TYPES.ANIMATOR);
    
    if (favorites.length === 0) return [];

    const ids = favorites.map(f => f.target_id);
    const { data: animators } = await supabase
      .from('animator_profiles')
      .select(`
        id,
        animation_specialties,
        daily_rate_min,
        daily_rate_max,
        average_rating,
        missions_completed,
        available_now,
        profile:profiles(first_name, last_name, photo_url, current_city, current_region)
      `)
      .in('id', ids);

    return favorites.map(f => ({
      ...f,
      animator: animators?.find(a => a.id === f.target_id),
    }));
  },

  /**
   * Récupère les labos favoris d'un animateur (avec profils)
   */
  async getLaboratoryFavorites(userId) {
    const favorites = await this.getByType(userId, FAVORITE_TYPES.LABORATORY);
    
    if (favorites.length === 0) return [];

    const ids = favorites.map(f => f.target_id);
    const { data: labs } = await supabase
      .from('laboratory_profiles')
      .select('id, company_name, brand_name, logo_url, product_categories, siret_verified')
      .in('id', ids);

    return favorites.map(f => ({
      ...f,
      laboratory: labs?.find(l => l.id === f.target_id),
    }));
  },

  /**
   * Récupère les offres favorites d'un candidat (avec détails)
   */
  async getJobOfferFavorites(userId) {
    const favorites = await this.getByType(userId, FAVORITE_TYPES.JOB_OFFER);
    
    if (favorites.length === 0) return [];

    const ids = favorites.map(f => f.target_id);
    const { data: offers } = await supabase
      .from('job_offers')
      .select('*')
      .in('id', ids);

    return favorites.map(f => ({
      ...f,
      offer: offers?.find(o => o.id === f.target_id),
    }));
  },

  /**
   * Récupère les missions favorites d'un animateur (avec détails)
   */
  async getMissionFavorites(userId) {
    const favorites = await this.getByType(userId, FAVORITE_TYPES.MISSION);
    
    if (favorites.length === 0) return [];

    const ids = favorites.map(f => f.target_id);
    const { data: missions } = await supabase
      .from('animation_missions')
      .select('*')
      .in('id', ids);

    // Enrichir avec les infos client
    for (const mission of missions || []) {
      if (mission.client_type === 'laboratory') {
        const { data: lab } = await supabase
          .from('laboratory_profiles')
          .select('company_name, brand_name, logo_url')
          .eq('id', mission.client_id)
          .single();
        mission.client_profile = lab;
      }
    }

    return favorites.map(f => ({
      ...f,
      mission: missions?.find(m => m.id === f.target_id),
    }));
  },

  /**
   * Récupère les pharmacies favorites (marketplace)
   */
  async getPharmacyListingFavorites(userId) {
    const favorites = await this.getByType(userId, FAVORITE_TYPES.PHARMACY_LISTING);
    
    if (favorites.length === 0) return [];

    const ids = favorites.map(f => f.target_id);
    const { data: listings } = await supabase
      .from('pharmacy_listings')
      .select('*')
      .in('id', ids);

    return favorites.map(f => ({
      ...f,
      listing: listings?.find(l => l.id === f.target_id),
    }));
  },

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Récupère les IDs des favoris d'un type (pour filtrage rapide)
   */
  async getFavoriteIds(userId, targetType) {
    const { data, error } = await supabase
      .from('favorites')
      .select('target_id')
      .eq('user_id', userId)
      .eq('target_type', targetType);

    if (error) throw error;
    return (data || []).map(f => f.target_id);
  },
};