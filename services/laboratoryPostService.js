// Service pour les publications / actualités des laboratoires

import { supabase } from '../lib/supabase';

export const laboratoryPostService = {
  // ==========================================
  // POSTS
  // ==========================================

  /**
   * Crée un post
   */
  async createPost(laboratoryId, postData) {
    const { data, error } = await supabase
      .from('laboratory_posts')
      .insert({
        laboratory_id: laboratoryId,
        type: postData.type,
        title: postData.title,
        content: postData.content || null,
        image_url: postData.imageUrl || null,
        video_url: postData.videoUrl || null,
        event_date: postData.eventDate || null,
        event_location: postData.eventLocation || null,
        target_user_types: postData.targetUserTypes || [],
        is_published: postData.isPublished || false,
        is_sponsored: postData.isSponsored || false,
        published_at: postData.isPublished ? new Date().toISOString() : null,
        expires_at: postData.expiresAt || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Met à jour un post
   */
  async updatePost(postId, updates) {
    const { data, error } = await supabase
      .from('laboratory_posts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Supprime un post
   */
  async deletePost(postId) {
    const { error } = await supabase
      .from('laboratory_posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  },

  /**
   * Publie un post (brouillon → publié)
   */
  async publishPost(postId) {
    const { data, error } = await supabase
      .from('laboratory_posts')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Dépublie un post
   */
  async unpublishPost(postId) {
    const { data, error } = await supabase
      .from('laboratory_posts')
      .update({
        is_published: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Récupère les posts d'un labo (pour le dashboard labo)
   */
  async getPostsByLab(laboratoryId, filters = {}) {
    let query = supabase
      .from('laboratory_posts')
      .select('*')
      .eq('laboratory_id', laboratoryId)
      .order('created_at', { ascending: false });

    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.isPublished !== undefined) {
      query = query.eq('is_published', filters.isPublished);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // ==========================================
  // FEED (côté utilisateur)
  // ==========================================

  /**
   * Récupère les posts pour le feed d'un utilisateur
   * - Posts des labos suivis
   * - Filtrés par target_user_types
   * - Triés par published_at DESC
   */
  async getPostsForUser(userId, userType, limit = 20) {
    // 1. Récupérer les labos suivis
    const { data: follows, error: followError } = await supabase
      .from('laboratory_followers')
      .select('laboratory_id')
      .eq('user_id', userId);

    if (followError) throw followError;

    const followedLabIds = (follows || []).map(f => f.laboratory_id);
    if (followedLabIds.length === 0) return [];

    // 2. Récupérer les posts publiés de ces labos
    const { data, error } = await supabase
      .from('laboratory_posts')
      .select(`
        *,
        laboratory:laboratory_profiles(
          id,
          company_name,
          brand_name,
          logo_url,
          siret_verified
        )
      `)
      .in('laboratory_id', followedLabIds)
      .eq('is_published', true)
      .contains('target_user_types', [userType])
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère les derniers posts publiés (tous types confondus)
   */
  async getRecentPosts(limit = 10) {
    const { data, error } = await supabase
      .from('laboratory_posts')
      .select(`
        *,
        laboratory:laboratory_profiles(
          id,
          company_name,
          brand_name,
          logo_url,
          siret_verified
        )
      `)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère un post par son ID
   */
  async getPostById(postId) {
    const { data, error } = await supabase
      .from('laboratory_posts')
      .select(`
        *,
        laboratory:laboratory_profiles(
          id,
          company_name,
          brand_name,
          logo_url,
          siret_verified
        )
      `)
      .eq('id', postId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Récupère les posts sponsorisés / labos en vedette
   */
  async getFeaturedPosts(limit = 10) {
    const { data, error } = await supabase
      .from('laboratory_posts')
      .select(`
        *,
        laboratory:laboratory_profiles(
          id,
          company_name,
          brand_name,
          logo_url,
          siret_verified,
          subscription_tier
        )
      `)
      .eq('is_published', true)
      .eq('is_sponsored', true)
      .gt('expires_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère les labos en vedette (sponsorisés ou Pro/Business)
   */
  async getFeaturedLabs(limit = 10) {
    const { data, error } = await supabase
      .from('laboratory_profiles')
      .select('id, company_name, brand_name, logo_url, siret_verified, subscription_tier, description')
      .in('subscription_tier', ['pro', 'business'])
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // ==========================================
  // FOLLOWERS
  // ==========================================

  /**
   * Suivre un laboratoire
   */
  async followLab(userId, laboratoryId) {
    const { data, error } = await supabase
      .from('laboratory_followers')
      .insert({
        user_id: userId,
        laboratory_id: laboratoryId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return; // Déjà suivi
      throw error;
    }
    return data;
  },

  /**
   * Ne plus suivre un laboratoire
   */
  async unfollowLab(userId, laboratoryId) {
    const { error } = await supabase
      .from('laboratory_followers')
      .delete()
      .eq('user_id', userId)
      .eq('laboratory_id', laboratoryId);

    if (error) throw error;
  },

  /**
   * Vérifie si l'utilisateur suit un labo
   */
  async isFollowing(userId, laboratoryId) {
    const { data, error } = await supabase
      .from('laboratory_followers')
      .select('id')
      .eq('user_id', userId)
      .eq('laboratory_id', laboratoryId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  /**
   * Nombre de followers d'un labo
   */
  async getFollowersCount(laboratoryId) {
    const { count, error } = await supabase
      .from('laboratory_followers')
      .select('*', { count: 'exact', head: true })
      .eq('laboratory_id', laboratoryId);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Labos suivis par un utilisateur
   */
  async getFollowedLabs(userId) {
    const { data, error } = await supabase
      .from('laboratory_followers')
      .select(`
        laboratory_id,
        followed_at,
        notifications_enabled,
        laboratory:laboratory_profiles(
          id,
          company_name,
          brand_name,
          logo_url,
          siret_verified
        )
      `)
      .eq('user_id', userId)
      .order('followed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Modifier les prefs de notifs pour un follow
   */
  async updateFollowNotifications(userId, laboratoryId, enabled) {
    const { error } = await supabase
      .from('laboratory_followers')
      .update({ notifications_enabled: enabled })
      .eq('user_id', userId)
      .eq('laboratory_id', laboratoryId);

    if (error) throw error;
  },

  // ==========================================
  // ANALYTICS
  // ==========================================

  /**
   * Incrémente le compteur de vues
   */
  async incrementView(postId) {
    const { error } = await supabase.rpc('increment_post_views', {
      post_id: postId,
    });

    // Fallback si la fonction RPC n'existe pas
    if (error) {
      const { data } = await supabase
        .from('laboratory_posts')
        .select('views_count')
        .eq('id', postId)
        .single();

      await supabase
        .from('laboratory_posts')
        .update({ views_count: (data?.views_count || 0) + 1 })
        .eq('id', postId);
    }
  },

  /**
   * Incrémente le compteur de clics
   */
  async incrementClick(postId) {
    const { error } = await supabase.rpc('increment_post_clicks', {
      post_id: postId,
    });

    // Fallback si la fonction RPC n'existe pas
    if (error) {
      const { data } = await supabase
        .from('laboratory_posts')
        .select('clicks_count')
        .eq('id', postId)
        .single();

      await supabase
        .from('laboratory_posts')
        .update({ clicks_count: (data?.clicks_count || 0) + 1 })
        .eq('id', postId);
    }
  },

  // ==========================================
  // PHOTOS
  // ==========================================

  /**
   * Récupère les photos d'un labo
   */
  async getPhotos(laboratoryId) {
    const { data, error } = await supabase
      .from('laboratory_photos')
      .select('*')
      .eq('laboratory_id', laboratoryId)
      .order('order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Ajoute une photo
   */
  async addPhoto(laboratoryId, url, caption = null) {
    // Récupérer l'ordre max actuel
    const { data: existing } = await supabase
      .from('laboratory_photos')
      .select('order')
      .eq('laboratory_id', laboratoryId)
      .order('order', { ascending: false })
      .limit(1);

    const nextOrder = existing?.length > 0 ? existing[0].order + 1 : 0;

    const { data, error } = await supabase
      .from('laboratory_photos')
      .insert({
        laboratory_id: laboratoryId,
        url,
        caption,
        order: nextOrder,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Supprime une photo
   */
  async deletePhoto(photoId) {
    const { error } = await supabase
      .from('laboratory_photos')
      .delete()
      .eq('id', photoId);

    if (error) throw error;
  },

  /**
   * Met à jour l'ordre des photos
   */
  async reorderPhotos(laboratoryId, photoIds) {
    const updates = photoIds.map((id, index) => ({
      id,
      laboratory_id: laboratoryId,
      order: index,
    }));

    const { error } = await supabase
      .from('laboratory_photos')
      .upsert(updates);

    if (error) throw error;
  },
};
