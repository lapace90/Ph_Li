import { supabase } from '../lib/supabase';

export const pharmacyListingService = {
  async getAll(filters = {}) {
    let query = supabase
      .from('pharmacy_listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (filters.listing_type) {
      query = query.eq('listing_type', filters.listing_type);
    }
    if (filters.region) {
      query = query.eq('region', filters.region);
    }
    if (filters.price_max) {
      query = query.lte('price', filters.price_max);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('pharmacy_listings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getByUserId(userId) {
    const { data, error } = await supabase
      .from('pharmacy_listings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(userId, listingData) {
    const { data, error } = await supabase
      .from('pharmacy_listings')
      .insert({
        user_id: userId,
        ...listingData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('pharmacy_listings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('pharmacy_listings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async close(id) {
    return this.update(id, { status: 'closed' });
  },
};