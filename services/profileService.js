import { supabase } from '../lib/supabase';

export const profileService = {
  async getById(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(userId, profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
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

  async upsert(userId, profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLocation(userId, locationData) {
    return this.update(userId, {
      current_latitude: locationData.latitude,
      current_longitude: locationData.longitude,
      current_city: locationData.city,
      current_postal_code: locationData.postalCode,
      current_region: locationData.region,
      current_department: locationData.department,
    });
  },

  async updateAvailability(userId, date) {
    return this.update(userId, { availability_date: date });
  },

  async updateSearchRadius(userId, radiusKm) {
    return this.update(userId, { search_radius_km: radiusKm });
  },
};