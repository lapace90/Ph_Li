import { supabase } from '../lib/supabase';

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
    const { data, error } = await supabase
      .from('job_offers')
      .select(`
        *,
        profiles:pharmacy_owner_id (
          id,
          first_name,
          last_name,
          photo_url,
          current_city,
          current_region
        )
      `)
      .eq('id', offerId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Crée une nouvelle annonce
   */
  async create(ownerId, offerData) {
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
   */
  async search(filters = {}) {
    let query = supabase
      .from('job_offers')
      .select(`
        *,
        profiles:pharmacy_owner_id (
          id,
          first_name,
          current_city,
          current_region
        )
      `)
      .eq('status', 'active');

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
};