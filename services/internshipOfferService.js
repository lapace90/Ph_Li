import { supabase } from '../lib/supabase';

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
   */
  async create(ownerId, offerData) {
    // Convertir 'asap' en null pour la base de données
    // 'asap' sera interprété comme "dès que possible" à l'affichage
    const startDate = offerData.start_date === 'asap' ? null : offerData.start_date;

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
   */
  async search(filters = {}) {
    let query = supabase
      .from('internship_offers')
      .select('*')
      .eq('status', 'active');

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
};