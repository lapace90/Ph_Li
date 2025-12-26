import { supabase } from '../lib/supabase';

export const cvService = {
  async getByUserId(userId) {
    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(cvId) {
    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', cvId)
      .single();

    if (error) throw error;
    return data;
  },

  async getDefault(userId) {
    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(userId, cvData) {
    // Si c'est le premier CV, le mettre par défaut
    const existingCvs = await this.getByUserId(userId);
    const isFirst = existingCvs.length === 0;

    const { data, error } = await supabase
      .from('cvs')
      .insert({
        user_id: userId,
        is_default: isFirst,
        visibility: 'anonymous',
        ...cvData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(cvId, updates) {
    const { data, error } = await supabase
      .from('cvs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cvId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(cvId) {
    const { error } = await supabase
      .from('cvs')
      .delete()
      .eq('id', cvId);

    if (error) throw error;
    return true;
  },

  async setDefault(userId, cvId) {
    // Retirer le défaut des autres CV
    await supabase
      .from('cvs')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Mettre ce CV par défaut
    return this.update(cvId, { is_default: true });
  },

  async uploadFile(userId, file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('cvs')
      .upload(fileName, file, { contentType: 'application/pdf' });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('cvs')
      .getPublicUrl(fileName);

    return publicUrl;
  },
};