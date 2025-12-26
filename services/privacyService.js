import { supabase } from '../lib/supabase';

const DEFAULT_PRIVACY = {
  profile_visibility: 'anonymous',
  show_full_name: false,
  show_photo: false,
  show_exact_location: false,
  show_current_employer: false,
  searchable_by_recruiters: false,
};

export const privacyService = {
  async getByUserId(userId) {
    const { data, error } = await supabase
      .from('privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(userId, settings = {}) {
    const { data, error } = await supabase
      .from('privacy_settings')
      .insert({
        user_id: userId,
        ...DEFAULT_PRIVACY,
        ...settings,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(userId, updates) {
    const { data, error } = await supabase
      .from('privacy_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async upsert(userId, settings = {}) {
    const { data, error } = await supabase
      .from('privacy_settings')
      .upsert({
        user_id: userId,
        ...DEFAULT_PRIVACY,
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async setSearchable(userId, searchable) {
    return this.update(userId, { searchable_by_recruiters: searchable });
  },

  async setVisibility(userId, visibility) {
    return this.update(userId, { profile_visibility: visibility });
  },
};