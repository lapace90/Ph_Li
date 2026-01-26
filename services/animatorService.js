// Gestion des profils animateurs freelance

import { supabase } from '../lib/supabase';

export const animatorService = {
  // ==========================================
  // PROFIL ANIMATEUR
  // ==========================================

  /**
   * Récupère le profil animateur d'un utilisateur
   */
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('animator_profiles')
      .select(`
        *,
        profile:profiles(
          first_name,
          last_name,
          phone,
          photo_url,
          bio,
          experience_years,
          current_city,
          current_region,
          current_department,
          current_latitude,
          current_longitude
        )
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Crée ou met à jour le profil animateur
   */
  async upsertProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('animator_profiles')
      .upsert({
        id: userId,
        animation_specialties: profileData.specialties || [],
        brands_experience: profileData.brands || [],
        daily_rate_min: profileData.dailyRateMin,
        daily_rate_max: profileData.dailyRateMax,
        mobility_zones: profileData.mobilityZones || [],
        has_vehicle: profileData.hasVehicle || false,
        siret_number: profileData.siret?.replace(/\s/g, '') || null,
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
      .from('animator_profiles')
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
  // DISPONIBILITÉ "DISPO MAINTENANT"
  // ==========================================

  /**
   * Active/désactive le mode "Dispo maintenant"
   */
  async setAvailableNow(userId, available, durationDays = 7) {
    const availableUntil = available
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('animator_profiles')
      .update({
        available_now: available,
        available_now_until: availableUntil,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Vérifie si le mode "Dispo maintenant" est encore valide
   */
  async checkAvailableNowStatus(userId) {
    const { data, error } = await supabase
      .from('animator_profiles')
      .select('available_now, available_now_until')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Si expiré, désactiver automatiquement
    if (data.available_now && data.available_now_until) {
      const expiresAt = new Date(data.available_now_until);
      if (expiresAt < new Date()) {
        await this.setAvailableNow(userId, false);
        return { available: false, expired: true };
      }
    }

    return {
      available: data.available_now,
      until: data.available_now_until,
      expired: false,
    };
  },

  // ==========================================
  // CALENDRIER DE DISPONIBILITÉS
  // ==========================================

  /**
   * Récupère les disponibilités sur une période
   */
  async getAvailability(animatorId, startDate, endDate) {
    const { data, error } = await supabase
      .from('animator_availability')
      .select('*')
      .eq('animator_id', animatorId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) throw error;
    return data || [];
  },

  /**
   * Définit la disponibilité pour une date
   */
  async setAvailability(animatorId, date, status) {
    const { data, error } = await supabase
      .from('animator_availability')
      .upsert({
        animator_id: animatorId,
        date,
        status,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'animator_id,date'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Définit la disponibilité pour plusieurs dates
   */
  async setAvailabilityBulk(animatorId, dates, status) {
    const records = dates.map(date => ({
      animator_id: animatorId,
      date,
      status,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('animator_availability')
      .upsert(records)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Supprime une disponibilité
   */
  async removeAvailability(animatorId, date) {
    const { error } = await supabase
      .from('animator_availability')
      .delete()
      .eq('animator_id', animatorId)
      .eq('date', date);

    if (error) throw error;
    return true;
  },

  // ==========================================
  // RECHERCHE D'ANIMATEURS
  // ==========================================

  /**
   * Recherche des animateurs avec filtres
   */
  async search(filters = {}) {
    let query = supabase
      .from('animator_profiles')
      .select(`
        *,
        profile:profiles(
          first_name,
          last_name,
          photo_url,
          current_city,
          current_region,
          current_latitude,
          current_longitude
        ),
        user:users(
          profile_completed
        )
      `)
      .eq('user.profile_completed', true);

    // Filtre par spécialité
    if (filters.specialties?.length > 0) {
      query = query.overlaps('animation_specialties', filters.specialties);
    }

    // Filtre par zone de mobilité
    if (filters.region) {
      query = query.contains('mobility_zones', [filters.region]);
    }

    // Filtre par tarif max
    if (filters.maxDailyRate) {
      query = query.lte('daily_rate_min', filters.maxDailyRate);
    }

    // Filtre "Dispo maintenant" en premier
    if (filters.availableNowFirst) {
      query = query.order('available_now', { ascending: false });
    }

    // Filtre par note minimum
    if (filters.minRating) {
      query = query.gte('average_rating', filters.minRating);
    }

    // Limite
    query = query.limit(filters.limit || 20);

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  },

  /**
   * Recherche géolocalisée des animateurs
   */
  async searchNearby(latitude, longitude, radiusKm, filters = {}) {
    // Utiliser la fonction PostGIS
    const { data, error } = await supabase.rpc('find_animators_for_urgent_alert', {
      alert_lat: latitude,
      alert_lng: longitude,
      alert_radius_km: radiusKm,
      alert_specialties: filters.specialties || [],
    });

    if (error) throw error;

    // Enrichir avec les profils complets si nécessaire
    if (data?.length > 0 && filters.includeProfiles) {
      const ids = data.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from('animator_profiles')
        .select(`
          *,
          profile:profiles(first_name, last_name, photo_url, current_city)
        `)
        .in('id', ids);

      // Merger les données
      return data.map(a => ({
        ...a,
        ...profiles?.find(p => p.id === a.user_id),
      }));
    }

    return data || [];
  },

  // ==========================================
  // STATISTIQUES
  // ==========================================

  /**
   * Récupère les stats d'un animateur
   */
  async getStats(animatorId) {
    // Missions complétées
    const { count: missionsCount } = await supabase
      .from('animation_missions')
      .select('*', { count: 'exact', head: true })
      .eq('animator_id', animatorId)
      .eq('status', 'completed');

    // Note moyenne
    const { data: ratings } = await supabase
      .from('mission_reviews')
      .select('rating_overall')
      .eq('reviewee_id', animatorId)
      .eq('visible', true);

    const avgRating = ratings?.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating_overall, 0) / ratings.length
      : 0;

    // Vues du profil (30 derniers jours)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: viewsCount } = await supabase
      .from('animator_profile_views')
      .select('*', { count: 'exact', head: true })
      .eq('animator_id', animatorId)
      .gte('viewed_at', thirtyDaysAgo);

    return {
      missionsCompleted: missionsCount || 0,
      averageRating: Math.round(avgRating * 10) / 10,
      reviewsCount: ratings?.length || 0,
      profileViews30d: viewsCount || 0,
    };
  },

  /**
   * Enregistre une vue de profil
   */
  async recordProfileView(animatorId, viewerId, viewerType) {
    const { error } = await supabase
      .from('animator_profile_views')
      .insert({
        animator_id: animatorId,
        viewer_id: viewerId,
        viewer_type: viewerType,
      });

    // Ignorer les erreurs (pas critique)
    if (error) console.warn('Erreur enregistrement vue profil:', error);
  },
};