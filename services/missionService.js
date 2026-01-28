// Gestion des missions d'animation

import { supabase } from '../lib/supabase';
import { subscriptionService } from './subscriptionService';
import { notificationService } from './notificationService';
import { logService } from './logService';

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

    // Log la création
    logService.mission.created(clientId, data.id, data.title, data.mission_type);

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
    const data = await this.update(missionId, { status: 'open' });

    // Log la publication
    logService.mission.published(data.client_id, missionId, data.title);

    return data;
  },

  // ==========================================
  // FLOW DE CONFIRMATION (5 étapes)
  // open → proposal_sent → animator_accepted → confirmed
  // ==========================================

  /**
   * Étape 2 : Le labo envoie une proposition détaillée à l'animateur matché
   * Met à jour la mission avec les détails finaux et passe en proposal_sent
   * @param {string} missionId
   * @param {string} animatorId
   * @param {string} matchId
   * @param {{ startDate, endDate, dailyRate, city, department, region, latitude, longitude, description }} proposalData
   */
  async sendProposal(missionId, animatorId, matchId, proposalData) {
    const { data, error } = await supabase
      .from('animation_missions')
      .update({
        animator_id: animatorId,
        status: 'proposal_sent',
        start_date: proposalData.startDate,
        end_date: proposalData.endDate,
        daily_rate_min: proposalData.dailyRate,
        daily_rate_max: proposalData.dailyRate,
        city: proposalData.city,
        department: proposalData.department || null,
        region: proposalData.region || null,
        latitude: proposalData.latitude || null,
        longitude: proposalData.longitude || null,
        description: proposalData.description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', missionId)
      .select()
      .single();

    if (error) throw error;

    // Notifier l'animateur
    await notificationService.createNotification(
      animatorId,
      'mission_proposal',
      'Nouvelle proposition de mission',
      `Vous avez reçu une proposition pour "${data.title}"`,
      { missionId, matchId }
    );

    return data;
  },

  /**
   * Étape 3 : L'animateur accepte la proposition
   * @param {string} missionId
   * @param {string} animatorId - pour vérification
   */
  async acceptProposal(missionId, animatorId) {
    const { data, error } = await supabase
      .from('animation_missions')
      .update({
        status: 'animator_accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', missionId)
      .eq('animator_id', animatorId)
      .select('*, client:client_id(*)')
      .single();

    if (error) throw error;

    // Notifier le labo/titulaire
    await notificationService.createNotification(
      data.client_id,
      'proposal_accepted',
      'Proposition acceptée !',
      `L'animateur a accepté votre proposition pour "${data.title}"`,
      { missionId }
    );

    return data;
  },

  /**
   * L'animateur décline la proposition → mission redevient open
   * @param {string} missionId
   * @param {string} animatorId
   */
  async declineProposal(missionId, animatorId) {
    const { data: mission } = await supabase
      .from('animation_missions')
      .select('title, client_id')
      .eq('id', missionId)
      .single();

    const { data, error } = await supabase
      .from('animation_missions')
      .update({
        animator_id: null,
        status: 'open',
        updated_at: new Date().toISOString(),
      })
      .eq('id', missionId)
      .eq('animator_id', animatorId)
      .select()
      .single();

    if (error) throw error;

    // Notifier le labo/titulaire
    if (mission) {
      await notificationService.createNotification(
        mission.client_id,
        'proposal_declined',
        'Proposition déclinée',
        `L'animateur a décliné votre proposition pour "${mission.title}"`,
        { missionId }
      );
    }

    return data;
  },

  /**
   * Étape 4 : Confirmation définitive par le labo → frais facturés
   * Assigne l'animateur, crée le frais, met le statut à 'confirmed'
   * @param {string} missionId
   * @param {string} animatorId
   * @param {string} payerId - le labo/titulaire qui paie
   */
  async confirmMission(missionId, animatorId, payerId) {
    // 1. Vérifier les frais
    const feeStatus = await this.checkFeeStatus(payerId, missionId);

    // 2. Mettre le statut à 'confirmed'
    const { data, error } = await supabase
      .from('animation_missions')
      .update({
        animator_id: animatorId,
        status: 'confirmed',
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', missionId)
      .select()
      .single();

    if (error) throw error;

    // 3. Bloquer les disponibilités de l'animateur
    const dates = this._getDatesBetween(data.start_date, data.end_date);
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

    // 4. Créer le frais de MER
    await this.createFee(missionId, payerId, feeStatus.amount, feeStatus.includedInSubscription);

    // 5. Notifier les deux parties
    await Promise.all([
      notificationService.createNotification(
        animatorId,
        'mission_confirmed',
        'Mission confirmée !',
        `La mission "${data.title}" est confirmée. Préparez-vous !`,
        { missionId }
      ),
      notificationService.createNotification(
        payerId,
        'mission_confirmed',
        'Mission confirmée !',
        `La mission "${data.title}" est officiellement confirmée.`,
        { missionId }
      ),
    ]);

    // Log la confirmation
    logService.mission.confirmed(payerId, missionId, animatorId, data.title);

    return { mission: data, fee: feeStatus };
  },

  /**
   * Assigne un animateur à une mission (legacy, utilisé hors flow 5 étapes)
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

    // Notifier les deux parties de laisser un avis
    if (data.animator_id && data.client_id) {
      const title = 'Mission terminee';
      const body = `La mission "${data.title}" est terminee. Laissez un avis !`;
      const notifData = { missionId, screen: 'missionReview' };

      await Promise.all([
        notificationService.createNotification(
          data.animator_id, 'mission_review_reminder', title, body, notifData
        ),
        notificationService.createNotification(
          data.client_id, 'mission_review_reminder', title, body, notifData
        ),
      ]).catch(err => console.warn('Erreur notif avis:', err));
    }

    // Log la completion
    logService.mission.completed(data.client_id, missionId, data.title);

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

    // Log l'annulation
    logService.mission.cancelled(data.client_id, missionId, data.title, reason);

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
  // FRAIS DE MISE EN RELATION
  // ==========================================

  /**
   * Calcule le montant des frais selon la durée de la mission
   * 1-2 jours = 10€, 3-5 jours = 15€, 6+ jours = 20€
   * @param {string} missionId
   * @returns {{ amount: number, days: number, startDate: string, endDate: string }}
   */
  async calculateFee(missionId) {
    const { data: mission, error } = await supabase
      .from('animation_missions')
      .select('start_date, end_date')
      .eq('id', missionId)
      .single();

    if (error) throw error;

    const days = this._getDatesBetween(mission.start_date, mission.end_date).length;

    let amount;
    if (days <= 2) {
      amount = 10;
    } else if (days <= 5) {
      amount = 15;
    } else {
      amount = 20;
    }

    return {
      amount,
      days,
      startDate: mission.start_date,
      endDate: mission.end_date,
    };
  },

  /**
   * Vérifie si la MER est incluse dans l'abonnement ou payante
   * @param {string} userId - le payeur (labo ou titulaire)
   * @param {string} missionId
   * @returns {{ amount, days, includedInSubscription, tier, contactsRemaining, contactsMax }}
   */
  async checkFeeStatus(userId, missionId) {
    const [feeInfo, contactCheck, limitsInfo] = await Promise.all([
      this.calculateFee(missionId),
      subscriptionService.canConfirmMission(userId),
      subscriptionService.getLimits(userId),
    ]);

    const tier = limitsInfo.tier;
    const includedInSubscription = contactCheck.allowed && contactCheck.max > 0;

    return {
      amount: feeInfo.amount,
      days: feeInfo.days,
      startDate: feeInfo.startDate,
      endDate: feeInfo.endDate,
      includedInSubscription,
      tier,
      contactsRemaining: contactCheck.remaining,
      contactsMax: contactCheck.max,
    };
  },

  /**
   * Crée l'entrée de frais dans mission_fees
   * Si inclus dans l'abo, le statut est 'waived' et on incrémente le compteur
   * Si payant, le statut est 'pending' (en attente de paiement)
   * @returns {Object} fee record
   */
  async createFee(missionId, payerId, amount, includedInSubscription) {
    const status = includedInSubscription ? 'waived' : 'pending';

    const { data, error } = await supabase
      .from('mission_fees')
      .upsert({
        mission_id: missionId,
        payer_id: payerId,
        amount,
        fee_type: 'mission_confirmation',
        included_in_subscription: includedInSubscription,
        status,
      }, { onConflict: 'mission_id' })
      .select()
      .single();

    if (error) throw error;

    // Si inclus dans l'abo, incrémenter le compteur de contacts
    if (includedInSubscription) {
      await subscriptionService.incrementMissionsConfirmed(payerId);
    }

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