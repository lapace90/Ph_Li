import { supabase } from '../lib/supabase';

// Durée de validité par défaut (en jours)
const DEFAULT_EXPIRATION_DAYS = 30;

export const jobOfferService = {
  /**
   * Récupère toutes les annonces d'un employeur (titulaire)
   */
  async getByOwnerId(ownerId) {
    const { data, error } = await supabase
      .from('job_offers')
      .select('*')
      .eq('pharmacy_owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère une annonce par son ID avec le profil du propriétaire
   */
  async getById(offerId) {
    // Récupérer l'offre
    const { data: offer, error: offerError } = await supabase
      .from('job_offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (offerError) throw offerError;

    // Récupérer le profil du propriétaire séparément
    if (offer?.pharmacy_owner_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, photo_url, current_city, current_region')
        .eq('id', offer.pharmacy_owner_id)
        .single();

      return { ...offer, profiles: profile };
    }

    return offer;
  },

  /**
   * Crée une nouvelle annonce
   * Par défaut, expire après 30 jours
   */
  async create(ownerId, offerData) {
    // Calculer la date d'expiration (30 jours par défaut)
    const expirationDays = offerData.expiration_days || DEFAULT_EXPIRATION_DAYS;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    const { data, error } = await supabase
      .from('job_offers')
      .insert({
        pharmacy_owner_id: ownerId,
        title: offerData.title,
        description: offerData.description,
        contract_type: offerData.contract_type,
        position_type: offerData.position_type,
        salary_range: offerData.salary_range || null,
        latitude: offerData.latitude,
        longitude: offerData.longitude,
        address: offerData.address,
        city: offerData.city,
        postal_code: offerData.postal_code,
        region: offerData.region,
        department: offerData.department,
        required_experience: offerData.required_experience || null,
        required_diplomas: offerData.required_diplomas || null,
        start_date: offerData.start_date || null,
        status: offerData.status || 'active',
        expires_at: expiresAt.toISOString(),
        // Pharmacy selector fields
        pharmacy_id: offerData.pharmacy_id || null,
        pharmacy_name: offerData.pharmacy_name || null,
        pharmacy_siret: offerData.pharmacy_siret || null,
        pharmacy_siret_verified: offerData.pharmacy_siret_verified || false,
        discrete_mode: offerData.discrete_mode || false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Met à jour une annonce
   */
  async update(offerId, updates) {
    const { data, error } = await supabase
      .from('job_offers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', offerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Supprime une annonce
   */
  async delete(offerId) {
    const { error } = await supabase
      .from('job_offers')
      .delete()
      .eq('id', offerId);

    if (error) throw error;
    return true;
  },

  /**
   * Change le statut d'une annonce (active, paused, closed)
   */
  async setStatus(offerId, status) {
    return this.update(offerId, { status });
  },

  /**
   * Réactive une annonce
   */
  async reactivate(offerId) {
    return this.update(offerId, { status: 'active' });
  },

  /**
   * Récupère les annonces actives avec filtres
   * Exclut automatiquement les offres expirées
   */
  async search(filters = {}) {
    let query = supabase
      .from('job_offers')
      .select('*')
      .eq('status', 'active');

    // Exclure les offres expirées (sauf si on veut les inclure)
    if (!filters.includeExpired) {
      query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
    }

    // Filtres
    if (filters.position_type) {
      query = query.eq('position_type', filters.position_type);
    }
    if (filters.contract_type) {
      query = query.eq('contract_type', filters.contract_type);
    }
    if (filters.region) {
      query = query.eq('region', filters.region);
    }
    if (filters.department) {
      query = query.eq('department', filters.department);
    }
    if (filters.max_experience !== undefined) {
      query = query.lte('required_experience', filters.max_experience);
    }

    // Tri
    const orderBy = filters.orderBy || 'created_at';
    const ascending = filters.ascending ?? false;
    query = query.order(orderBy, { ascending });

    // Limite
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère les annonces proches d'une position (si PostGIS configuré)
   */
  async searchNearby(latitude, longitude, radiusKm = 50, filters = {}) {
    const { data, error } = await supabase.rpc('search_nearby_jobs', {
      user_lat: latitude,
      user_lng: longitude,
      radius_km: radiusKm,
      position_type_filter: filters.position_type || null,
      contract_type_filter: filters.contract_type || null,
    });

    if (error) {
      console.warn('PostGIS function not available, using basic search');
      return this.search(filters);
    }
    return data || [];
  },

  /**
   * Compte les candidatures pour une annonce
   */
  async getApplicationsCount(offerId) {
    const { count, error } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_offer_id', offerId);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Compte les matchs pour une annonce
   */
  async getMatchesCount(offerId) {
    const { count, error } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('job_offer_id', offerId);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Récupère les stats d'une annonce
   */
  async getStats(offerId) {
    const [applicationsCount, matchesCount] = await Promise.all([
      this.getApplicationsCount(offerId),
      this.getMatchesCount(offerId),
    ]);

    return {
      applications: applicationsCount,
      matches: matchesCount,
    };
  },

  /**
   * Prolonge la date d'expiration d'une annonce
   * @param {string} offerId - ID de l'offre
   * @param {number} days - Nombre de jours à ajouter (défaut: 30)
   */
  async extendExpiration(offerId, days = DEFAULT_EXPIRATION_DAYS) {
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + days);

    return this.update(offerId, { expires_at: newExpiresAt.toISOString() });
  },

  /**
   * Vérifie si une offre est expirée ou proche de l'expiration
   * @returns {{ isExpired: boolean, isExpiringSoon: boolean, daysRemaining: number }}
   */
  getExpirationStatus(offer) {
    if (!offer?.expires_at) {
      return { isExpired: false, isExpiringSoon: false, daysRemaining: null };
    }

    const now = new Date();
    const expiresAt = new Date(offer.expires_at);
    const diffMs = expiresAt - now;
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      isExpired: daysRemaining <= 0,
      isExpiringSoon: daysRemaining > 0 && daysRemaining <= 7,
      daysRemaining: Math.max(0, daysRemaining),
    };
  },

  /**
   * Réactive une offre expirée (remet en active + nouvelle expiration)
   */
  async reactivateExpired(offerId, days = DEFAULT_EXPIRATION_DAYS) {
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + days);

    return this.update(offerId, {
      status: 'active',
      expires_at: newExpiresAt.toISOString(),
    });
  },
};