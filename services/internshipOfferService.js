import { supabase } from '../lib/supabase';

// Durée de validité par défaut (en jours)
const DEFAULT_EXPIRATION_DAYS = 30;

export const internshipOfferService = {
  /**
   * Récupère toutes les annonces stage/alternance d'un employeur
   */
  async getByOwnerId(ownerId) {
    const { data, error } = await supabase
      .from('internship_offers')
      .select('*')
      .eq('pharmacy_owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère une annonce par son ID
   */
  async getById(offerId) {
    const { data, error } = await supabase
      .from('internship_offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Crée une nouvelle annonce stage/alternance
   * Par défaut, expire après 30 jours
   */
  async create(ownerId, offerData) {
    // Convertir 'asap' en null pour la base de données
    // 'asap' sera interprété comme "dès que possible" à l'affichage
    const startDate = offerData.start_date === 'asap' ? null : offerData.start_date;

    // Calculer la date d'expiration (30 jours par défaut)
    const expirationDays = offerData.expiration_days || DEFAULT_EXPIRATION_DAYS;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    const { data, error } = await supabase
      .from('internship_offers')
      .insert({
        pharmacy_owner_id: ownerId,
        type: offerData.type, // 'stage' ou 'alternance'
        title: offerData.title,
        description: offerData.description,
        duration_months: offerData.duration_months,
        remuneration: offerData.remuneration || null,
        benefits: offerData.benefits?.length > 0 ? offerData.benefits : null,
        required_level: offerData.required_level || null,
        start_date: startDate,
        latitude: offerData.latitude,
        longitude: offerData.longitude,
        city: offerData.city,
        postal_code: offerData.postal_code,
        region: offerData.region,
        department: offerData.department,
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
      .from('internship_offers')
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
      .from('internship_offers')
      .delete()
      .eq('id', offerId);

    if (error) throw error;
    return true;
  },

  /**
   * Change le statut d'une annonce
   */
  async setStatus(offerId, status) {
    return this.update(offerId, { status });
  },

  /**
   * Récupère les annonces actives avec filtres
   * Exclut automatiquement les offres expirées
   */
  async search(filters = {}) {
    let query = supabase
      .from('internship_offers')
      .select('*')
      .eq('status', 'active');

    // Exclure les offres expirées (sauf si on veut les inclure)
    if (!filters.includeExpired) {
      query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
    }

    // Filtres
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.region) {
      query = query.eq('region', filters.region);
    }
    if (filters.department) {
      query = query.eq('department', filters.department);
    }
    if (filters.required_level) {
      query = query.eq('required_level', filters.required_level);
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
   * Récupère les annonces proches d'une position
   */
  async searchNearby(latitude, longitude, radiusKm = 50, filters = {}) {
    const { data, error } = await supabase.rpc('search_nearby_internships', {
      user_lat: latitude,
      user_lng: longitude,
      radius_km: radiusKm,
      type_filter: filters.type || null,
    });

    if (error) {
      console.warn('PostGIS function not available, using basic search');
      return this.search(filters);
    }
    return data || [];
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