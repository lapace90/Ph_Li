// Gestion des alertes urgentes (titulaires + labos)

import { supabase } from '../lib/supabase';

export const urgentAlertService = {
  // ==========================================
  // CRUD ALERTES
  // ==========================================

  /**
   * Récupère une alerte par son ID
   */
  async getById(alertId) {
    const { data, error } = await supabase
      .from('urgent_alerts')
      .select('*')
      .eq('id', alertId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Crée une alerte urgente (titulaire)
   */
  async createForPharmacy(ownerId, alertData) {
    const { data, error } = await supabase
      .from('urgent_alerts')
      .insert({
        pharmacy_owner_id: ownerId,
        creator_id: ownerId,
        creator_type: 'pharmacy',
        title: alertData.title,
        description: alertData.description || null,
        position_type: alertData.positionType,
        start_date: alertData.startDate,
        end_date: alertData.endDate,
        latitude: alertData.latitude,
        longitude: alertData.longitude,
        radius_km: alertData.radiusKm || 30,
        city: alertData.city,
        hourly_rate: alertData.hourlyRate || null,
        status: 'active',
        expires_at: this._calculateExpiry(alertData.endDate),
      })
      .select()
      .single();

    if (error) throw error;

    // Notifier les candidats éligibles
    await this._notifyCandidates(data);

    return data;
  },

  /**
   * Crée une alerte urgente (laboratoire) - pour animateurs
   */
  async createForLaboratory(labId, alertData) {
    const { data, error } = await supabase
      .from('urgent_alerts')
      .insert({
        pharmacy_owner_id: labId,  // On réutilise le champ pour compatibilité
        creator_id: labId,
        creator_type: 'laboratory',
        title: alertData.title,
        description: alertData.description || null,
        position_type: 'animateur',  // Toujours animateur pour les labos
        required_specialties: alertData.specialties || [],
        start_date: alertData.startDate,
        end_date: alertData.endDate,
        latitude: alertData.latitude,
        longitude: alertData.longitude,
        radius_km: alertData.radiusKm || 30,
        city: alertData.city,
        hourly_rate: alertData.dailyRate ? alertData.dailyRate / 8 : null,  // Convertir en horaire
        status: 'active',
        expires_at: this._calculateExpiry(alertData.endDate),
      })
      .select()
      .single();

    if (error) throw error;

    // Notifier les animateurs éligibles
    await this._notifyAnimators(data);

    return data;
  },

  /**
   * Met à jour une alerte
   */
  async update(alertId, updates) {
    const { data, error } = await supabase
      .from('urgent_alerts')
      .update(updates)
      .eq('id', alertId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Annule une alerte
   */
  async cancel(alertId) {
    return this.update(alertId, { status: 'cancelled' });
  },

  /**
   * Marque comme pourvue
   */
  async markAsFilled(alertId) {
    return this.update(alertId, { 
      status: 'filled',
      filled_at: new Date().toISOString(),
    });
  },

  // ==========================================
  // LISTING
  // ==========================================

  /**
   * Récupère les alertes d'un créateur
   */
  async getByCreatorId(creatorId, filters = {}) {
    let query = supabase
      .from('urgent_alerts')
      .select('*')
      .eq('creator_id', creatorId);

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
   * Récupère les alertes actives pour un candidat
   */
  async getActiveForCandidate(candidateId, userType) {
    // Récupérer les préférences et localisation du candidat
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_latitude, current_longitude')
      .eq('id', candidateId)
      .single();

    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('urgent_alerts_enabled, urgent_alerts_radius_km')
      .eq('user_id', candidateId)
      .single();

    if (!prefs?.urgent_alerts_enabled || !profile?.current_latitude) {
      return [];
    }

    // Utiliser la fonction PostGIS pour les alertes de titulaires
    const { data, error } = await supabase.rpc('find_candidates_for_urgent_alert', {
      alert_lat: profile.current_latitude,
      alert_lng: profile.current_longitude,
      alert_radius_km: prefs.urgent_alerts_radius_km || 30,
      alert_position_type: userType,
    });

    // Récupérer les détails des alertes
    // TODO: Optimiser cette requête
    const { data: alerts } = await supabase
      .from('urgent_alerts')
      .select('*')
      .eq('status', 'active')
      .eq('position_type', userType)
      .eq('creator_type', 'pharmacy');

    // Filtrer par distance
    const filtered = (alerts || []).filter(alert => {
      if (!alert.latitude || !alert.longitude) return false;
      const distance = this._calculateDistance(
        profile.current_latitude, profile.current_longitude,
        alert.latitude, alert.longitude
      );
      alert.distance_km = Math.round(distance * 10) / 10;
      return distance <= Math.min(alert.radius_km, prefs.urgent_alerts_radius_km || 30);
    });

    return filtered.sort((a, b) => a.distance_km - b.distance_km);
  },

  /**
   * Récupère les alertes actives pour un animateur
   */
  async getActiveForAnimator(animatorId) {
    // Récupérer le profil animateur
    const { data: animatorProfile } = await supabase
      .from('animator_profiles')
      .select(`
        animation_specialties,
        profile:profiles(current_latitude, current_longitude)
      `)
      .eq('id', animatorId)
      .single();

    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('urgent_alerts_enabled, urgent_alerts_radius_km')
      .eq('user_id', animatorId)
      .single();

    if (!prefs?.urgent_alerts_enabled || !animatorProfile?.profile?.current_latitude) {
      return [];
    }

    // Récupérer les alertes de labos pour animateurs
    const { data: alerts } = await supabase
      .from('urgent_alerts')
      .select('*')
      .eq('status', 'active')
      .eq('creator_type', 'laboratory');

    // Filtrer par distance et spécialités
    const filtered = (alerts || []).filter(alert => {
      if (!alert.latitude || !alert.longitude) return false;
      
      // Distance
      const distance = this._calculateDistance(
        animatorProfile.profile.current_latitude, 
        animatorProfile.profile.current_longitude,
        alert.latitude, 
        alert.longitude
      );
      alert.distance_km = Math.round(distance * 10) / 10;
      
      if (distance > Math.min(alert.radius_km, prefs.urgent_alerts_radius_km || 30)) {
        return false;
      }

      // Spécialités (si requises)
      if (alert.required_specialties?.length > 0) {
        const hasMatch = alert.required_specialties.some(
          s => animatorProfile.animation_specialties?.includes(s)
        );
        if (!hasMatch) return false;
      }

      return true;
    });

    // Enrichir avec les infos du labo
    for (const alert of filtered) {
      const { data: lab } = await supabase
        .from('laboratory_profiles')
        .select('company_name, brand_name, logo_url')
        .eq('id', alert.creator_id)
        .single();
      alert.creator_profile = lab;
    }

    return filtered.sort((a, b) => a.distance_km - b.distance_km);
  },

  // ==========================================
  // RÉPONSES
  // ==========================================

  /**
   * Récupère les réponses à une alerte
   */
  async getResponses(alertId) {
    const { data, error } = await supabase
      .from('urgent_alert_responses')
      .select(`
        *,
        candidate:users!urgent_alert_responses_candidate_fkey(
          id,
          user_type
        )
      `)
      .eq('alert_id', alertId)
      .order('response_time', { ascending: true });

    if (error) throw error;

    // Enrichir avec les profils
    for (const response of data || []) {
      if (response.candidate.user_type === 'animateur') {
        const { data: animator } = await supabase
          .from('animator_profiles')
          .select(`
            average_rating,
            missions_completed,
            daily_rate_min,
            profile:profiles(first_name, last_name, photo_url, current_city)
          `)
          .eq('id', response.candidate_id)
          .single();
        response.candidate_profile = animator;
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, photo_url, current_city, experience_years')
          .eq('id', response.candidate_id)
          .single();
        response.candidate_profile = profile;
      }
    }

    return data || [];
  },

  /**
   * Répondre à une alerte (candidat/animateur)
   */
  async respond(alertId, candidateId, message = null) {
    const { data, error } = await supabase
      .from('urgent_alert_responses')
      .insert({
        alert_id: alertId,
        candidate_id: candidateId,
        status: 'interested',
        message,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Vous avez déjà répondu à cette alerte');
      }
      throw error;
    }
    return data;
  },

  /**
   * Accepter un candidat (créateur de l'alerte)
   */
  async acceptCandidate(alertId, candidateId) {
    const { data, error } = await supabase
      .from('urgent_alert_responses')
      .update({ status: 'accepted' })
      .eq('alert_id', alertId)
      .eq('candidate_id', candidateId)
      .select()
      .single();

    if (error) throw error;

    // Marquer l'alerte comme pourvue
    await this.markAsFilled(alertId);

    return data;
  },

  /**
   * Rejeter un candidat
   */
  async rejectCandidate(alertId, candidateId) {
    const { data, error } = await supabase
      .from('urgent_alert_responses')
      .update({ status: 'rejected' })
      .eq('alert_id', alertId)
      .eq('candidate_id', candidateId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Vérifier si un candidat a déjà répondu
   */
  async hasResponded(alertId, candidateId) {
    const { data } = await supabase
      .from('urgent_alert_responses')
      .select('id')
      .eq('alert_id', alertId)
      .eq('candidate_id', candidateId)
      .maybeSingle();

    return !!data;
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  /**
   * Notifie les candidats éligibles (pour alertes titulaires)
   */
  async _notifyCandidates(alert) {
    try {
      const { data: candidates } = await supabase.rpc('find_candidates_for_urgent_alert', {
        alert_lat: alert.latitude,
        alert_lng: alert.longitude,
        alert_radius_km: alert.radius_km,
        alert_position_type: alert.position_type,
      });

      if (!candidates?.length) return;

      // Mettre à jour le compteur
      await this.update(alert.id, { notified_count: candidates.length });

      // Créer les notifications
      const notifications = candidates.map(c => ({
        user_id: c.user_id,
        type: 'urgent_alert',
        title: '🚨 Alerte urgente près de chez vous',
        content: alert.title,
        data: { alert_id: alert.id, distance_km: c.distance_km },
      }));

      await supabase.from('notifications').insert(notifications);

      // TODO: Envoyer les push notifications via Expo

    } catch (error) {
      console.error('Erreur notification candidats:', error);
    }
  },

  /**
   * Notifie les animateurs éligibles (pour alertes labos)
   */
  async _notifyAnimators(alert) {
    try {
      const { data: animators } = await supabase.rpc('find_animators_for_urgent_alert', {
        alert_lat: alert.latitude,
        alert_lng: alert.longitude,
        alert_radius_km: alert.radius_km,
        alert_specialties: alert.required_specialties || [],
      });

      if (!animators?.length) return;

      // Mettre à jour le compteur
      await this.update(alert.id, { notified_count: animators.length });

      // Créer les notifications
      const notifications = animators.map(a => ({
        user_id: a.user_id,
        type: 'urgent_alert',
        title: '🚨 Mission urgente disponible',
        content: alert.title,
        data: { alert_id: alert.id, distance_km: a.distance_km },
      }));

      await supabase.from('notifications').insert(notifications);

      // TODO: Envoyer les push notifications via Expo

    } catch (error) {
      console.error('Erreur notification animateurs:', error);
    }
  },

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Calcule la date d'expiration (fin du remplacement + 1 jour)
   */
  _calculateExpiry(endDate) {
    const expiry = new Date(endDate);
    expiry.setDate(expiry.getDate() + 1);
    return expiry.toISOString();
  },

  /**
   * Calcule la distance entre deux points
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
};