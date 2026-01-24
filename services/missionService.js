// Gestion des missions d'animation

import { supabase } from '../lib/supabase';

export const missionService = {
  // ==========================================
  // CRUD MISSIONS
  // ==========================================

  /**
   * Récupère une mission par son ID
   */
  async getById(missionId) {
    const { data, error } = await supabase
      .from('animation_missions')
      .select(`
        *,
        animator:animator_profiles(
          id,
          average_rating,
          missions_completed,
          profile:profiles(first_name, last_name, photo_url)
        ),
        client:users!animation_missions_client_id_fkey(
          id,
          user_type
        )
      `)
      .eq('id', missionId)
      .single();

    if (error) throw error;

    // Enrichir avec les infos du client selon son type
    if (data.client_type === 'laboratory') {
      const { data: labProfile } = await supabase
        .from('laboratory_profiles')
        .select('company_name, brand_name, logo_url')
        .eq('id', data.client_id)
        .single();
      data.client_profile = labProfile;
    } else {
      const { data: pharmacyProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, photo_url')
        .eq('id', data.client_id)
        .single();
      data.client_profile = pharmacyProfile;
    }

    return data;
  },

  /**
   * Crée une nouvelle mission
   */
  async create(clientId, clientType, missionData) {
    const { data, error } = await supabase
      .from('animation_missions')
      .insert({
        client_id: clientId,
        client_type: clientType,
        pharmacy_id: missionData.pharmacyId || null,
        title: missionData.title,
        description: missionData.description || null,
        mission_type: missionData.missionType,
        specialties_required: missionData.specialties || [],
        start_date: missionData.startDate,
        end_date: missionData.endDate,
        daily_rate_min: missionData.dailyRateMin || missionData.dailyRate,
        daily_rate_max: missionData.dailyRateMax || missionData.dailyRate,
        latitude: missionData.latitude,
        longitude: missionData.longitude,
        city: missionData.city,
        department: missionData.department,
        region: missionData.region,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Met à jour une mission
   */
  async update(missionId, updates) {
    const { data, error } = await supabase
      .from('animation_missions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', missionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Supprime une mission (seulement si draft)
   */
  async delete(missionId) {
    const { error } = await supabase
      .from('animation_missions')
      .delete()
      .eq('id', missionId)
      .eq('status', 'draft');

    if (error) throw error;
    return true;
  },

  // ==========================================
  // GESTION DU STATUT
  // ==========================================

  /**
   * Publie une mission (draft → open)
   */
  async publish(missionId) {
    return this.update(missionId, { status: 'open' });
  },

  /**
   * Assigne un animateur à une mission
   */
  async assignAnimator(missionId, animatorId) {
    const { data, error } = await supabase
      .from('animation_missions')
      .update({
        animator_id: animatorId,
        status: 'assigned',
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', missionId)
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour les disponibilités de l'animateur
    const mission = data;
    const dates = this._getDatesBetween(mission.start_date, mission.end_date);

    for (const date of dates) {
      await supabase
        .from('animator_availability')
        .upsert({
          animator_id: animatorId,
          date,
          status: 'booked',
          mission_id: missionId,
        });
    }

    return data;
  },

  /**
   * Démarre une mission (assigned → in_progress)
   */
  async start(missionId) {
    return this.update(missionId, { status: 'in_progress' });
  },

  /**
   * Termine une mission (in_progress → completed)
   */
  async complete(missionId) {
    const { data, error } = await supabase
      .from('animation_missions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', missionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Annule une mission
   */
  async cancel(missionId, reason = null) {
    const { data, error } = await supabase
      .from('animation_missions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', missionId)
      .select()
      .single();

    if (error) throw error;

    // Libérer les disponibilités de l'animateur si assigné
    if (data.animator_id) {
      await supabase
        .from('animator_availability')
        .delete()
        .eq('mission_id', missionId);
    }

    return data;
  },

  // ==========================================
  // CONFLITS DE MATCHING
  // ==========================================

  /**
   * Vérifie si l'animateur a des matches confirmés qui chevauchent ces dates
   * (Uniquement les matches avec chat ouvert, pas les simples likes)
   */
  async checkMatchConflicts(animatorId, startDate, endDate) {
    const { data, error } = await supabase
      .from('animator_matches')
      .select(`
        id,
        mission:animation_missions(
          id,
          title,
          start_date,
          end_date
        )
      `)
      .eq('animator_id', animatorId)
      .eq('status', 'matched') // Seulement les matches confirmés (chat ouvert)
      .gte('mission.end_date', startDate)
      .lte('mission.start_date', endDate);

    if (error) throw error;
    return data || [];
  },

  // ==========================================
  // RECHERCHE / LISTING
  // ==========================================

  /**
   * Récupère les missions d'un client (labo ou titulaire)
   */
  async getByClientId(clientId, filters = {}) {
    let query = supabase
      .from('animation_missions')
      .select(`
        *,
        animator:animator_profiles(
          id,
          average_rating,
          profile:profiles(first_name, last_name, photo_url)
        )
      `)
      .eq('client_id', clientId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.statuses) {
      query = query.in('status', filters.statuses);
    }

    query = query.order('created_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère les missions d'un animateur
   */
  async getByAnimatorId(animatorId, filters = {}) {
    let query = supabase
      .from('animation_missions')
      .select('*')
      .eq('animator_id', animatorId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.statuses) {
      query = query.in('status', filters.statuses);
    }

    query = query.order('start_date', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    // Enrichir avec les infos client
    for (const mission of data || []) {
      if (mission.client_type === 'laboratory') {
        const { data: lab } = await supabase
          .from('laboratory_profiles')
          .select('company_name, brand_name, logo_url')
          .eq('id', mission.client_id)
          .single();
        mission.client_profile = lab;
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, photo_url')
          .eq('id', mission.client_id)
          .single();
        mission.client_profile = profile;
      }
    }

    return data || [];
  },

  /**
   * Recherche les missions ouvertes pour un animateur
   */
  async searchOpen(animatorId, filters = {}) {
    // Récupérer le profil animateur pour les spécialités et zones
    const { data: animatorProfile } = await supabase
      .from('animator_profiles')
      .select('animation_specialties, mobility_zones')
      .eq('id', animatorId)
      .single();

    let query = supabase
      .from('animation_missions')
      .select('*')
      .eq('status', 'open')
      .gte('start_date', new Date().toISOString().split('T')[0]);

    // Filtre par région si l'animateur a des zones de mobilité
    if (animatorProfile?.mobility_zones?.length > 0 && !filters.ignoreZones) {
      query = query.in('region', animatorProfile.mobility_zones);
    }

    // Filtre par type de mission
    if (filters.missionType) {
      query = query.eq('mission_type', filters.missionType);
    }

    //  Filtre : missions dont le tarif max couvre le tarif minimum de l'animateur
    if (filters.minDailyRate) {
        query = query.gte('daily_rate_max', filters.minDailyRate);
    }

    // Filtre par spécialités
    if (filters.specialties?.length > 0) {
      query = query.overlaps('specialties_required', filters.specialties);
    }

    query = query.order('start_date', { ascending: true });
    query = query.limit(filters.limit || 20);

    const { data, error } = await query;
    if (error) throw error;

    // Enrichir avec les infos client
    for (const mission of data || []) {
      if (mission.client_type === 'laboratory') {
        const { data: lab } = await supabase
          .from('laboratory_profiles')
          .select('company_name, brand_name, logo_url, siret_verified')
          .eq('id', mission.client_id)
          .single();
        mission.client_profile = lab;
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', mission.client_id)
          .single();

        const { data: pharmacy } = await supabase
          .from('pharmacy_details')
          .select('name, siret_verified')
          .eq('owner_id', mission.client_id)
          .maybeSingle();

        mission.client_profile = { ...profile, pharmacy };
      }
    }

    return data || [];
  },

  /**
   * Recherche géolocalisée des missions
   */
  async searchNearby(latitude, longitude, radiusKm, filters = {}) {
    const { data, error } = await supabase
      .from('animation_missions')
      .select('*')
      .eq('status', 'open')
      .gte('start_date', new Date().toISOString().split('T')[0]);

    if (error) throw error;

    // Filtrer par distance (côté client car PostGIS sur cette table est optionnel)
    const filtered = (data || []).filter(mission => {
      if (!mission.latitude || !mission.longitude) return false;
      const distance = this._calculateDistance(
        latitude, longitude,
        mission.latitude, mission.longitude
      );
      mission.distance_km = Math.round(distance * 10) / 10;
      return distance <= radiusKm;
    });

    // Trier par distance
    filtered.sort((a, b) => a.distance_km - b.distance_km);

    return filtered;
  },

  // ==========================================
  // CANDIDATURES
  // ==========================================

  /**
   * Candidater à une mission (pour animateur)
   */
  async apply(missionId, animatorId, message = null) {
    // Vérifier que la mission est ouverte
    const { data: mission } = await supabase
      .from('animation_missions')
      .select('status')
      .eq('id', missionId)
      .single();

    if (mission.status !== 'open') {
      throw new Error('Cette mission n\'est plus disponible');
    }

    // Créer une application (on réutilise la table applications existante)
    const { data, error } = await supabase
      .from('applications')
      .insert({
        job_offer_id: null,  // Pas une offre d'emploi
        internship_offer_id: null,
        candidate_id: animatorId,
        message,
        status: 'pending',
      })
      .select()
      .single();

    // Note: Idéalement, créer une table mission_applications
    // Pour l'instant on peut stocker dans le champ data de notifications

    if (error) throw error;
    return data;
  },

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Génère les dates entre start et end
   */
  _getDatesBetween(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  },

  /**
   * Calcule la distance entre deux points (formule Haversine)
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this._toRad(lat2 - lat1);
    const dLon = this._toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  _toRad(deg) {
    return deg * (Math.PI / 180);
  },
};