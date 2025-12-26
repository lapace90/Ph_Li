import { supabase } from '../lib/supabase';

export const userService = {
  async getById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(userId, email, userType) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        user_type: userType,
        profile_completed: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(userId, updates) {
    const { data, error } = await supabase
      .from('users')
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

  async setUserType(userId, userType) {
    return this.update(userId, { user_type: userType });
  },

  async setProfileCompleted(userId, completed = true) {
    return this.update(userId, { profile_completed: completed });
  },
};