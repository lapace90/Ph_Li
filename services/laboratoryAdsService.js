// Service pour la gestion des publicites laboratoire

import { supabase } from '../lib/supabase';

export const laboratoryAdsService = {
  // ==========================================
  // LECTURE
  // ==========================================

  /**
   * Recupere les publicites actives d'un laboratoire
   */
  async getActiveAds(userId) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('laboratory_ads')
      .select('*')
      .eq('user_id', userId)
      .gt('ends_at', now)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      // Table n'existe peut-etre pas encore
      if (error.code === '42P01') return [];
      throw error;
    }

    return data || [];
  },

  /**
   * Recupere l'historique des achats par type
   * Retourne un objet { featured: true, sponsored_card: false, ... }
   */
  async getPurchaseHistory(userId) {
    const { data, error } = await supabase
      .from('laboratory_ads')
      .select('ad_type')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      if (error.code === '42P01') return {};
      throw error;
    }

    const history = {};
    (data || []).forEach(ad => {
      history[ad.ad_type] = true;
    });

    return history;
  },

  /**
   * Verifie si c'est le premier achat pour un type de pub
   */
  async isFirstPurchase(userId, adType) {
    const { count, error } = await supabase
      .from('laboratory_ads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('ad_type', adType);

    if (error) {
      if (error.code === '42P01') return true;
      throw error;
    }

    return count === 0;
  },

  // ==========================================
  // ACHAT
  // ==========================================

  /**
   * Achete une publicite
   * @param {string} userId - ID utilisateur
   * @param {string} adType - Type de pub (featured, sponsored_card, priority_placement)
   * @param {number} price - Prix paye
   * @param {number} durationWeeks - Duree en semaines
   */
  async purchaseAd(userId, adType, price, durationWeeks = 1) {
    // Calculer les dates
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + (durationWeeks * 7));

    // Creer l'enregistrement de pub
    const { data, error } = await supabase
      .from('laboratory_ads')
      .insert({
        user_id: userId,
        ad_type: adType,
        price_paid: price,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: 'active',
        views: 0,
        clicks: 0,
      })
      .select()
      .single();

    if (error) throw error;

    // TODO: Integrer avec Stripe pour le paiement reel
    // Pour l'instant on simule un paiement reussi

    return data;
  },

  /**
   * Active une pub incluse dans l'abonnement (utilise le quota)
   */
  async useIncludedAd(userId, adType, targetId, durationWeeks = 1) {
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + (durationWeeks * 7));

    const { data, error } = await supabase
      .from('laboratory_ads')
      .insert({
        user_id: userId,
        ad_type: adType,
        target_id: targetId, // ID du post/mission a promouvoir
        price_paid: 0,
        is_included: true, // Indique que c'est inclus dans l'abo
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: 'active',
        views: 0,
        clicks: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  // ==========================================
  // STATS
  // ==========================================

  /**
   * Incremente les vues d'une pub
   */
  async incrementViews(adId) {
    const { error } = await supabase.rpc('increment_ad_views', { p_ad_id: adId });
    if (error && error.code !== '42883') throw error; // Ignore si fonction n'existe pas
  },

  /**
   * Incremente les clics d'une pub
   */
  async incrementClicks(adId) {
    const { error } = await supabase.rpc('increment_ad_clicks', { p_ad_id: adId });
    if (error && error.code !== '42883') throw error;
  },

  /**
   * Recupere les stats d'une pub
   */
  async getAdStats(adId) {
    const { data, error } = await supabase
      .from('laboratory_ads')
      .select('views, clicks, starts_at, ends_at')
      .eq('id', adId)
      .single();

    if (error) throw error;

    const ctr = data.views > 0 ? ((data.clicks / data.views) * 100).toFixed(2) : 0;

    return {
      ...data,
      ctr,
    };
  },

  /**
   * Recupere toutes les stats des pubs d'un utilisateur
   */
  async getUserAdsStats(userId) {
    const { data, error } = await supabase
      .from('laboratory_ads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') return { total: 0, active: 0, totalViews: 0, totalClicks: 0, ads: [] };
      throw error;
    }

    const now = new Date();
    const ads = data || [];

    const stats = {
      total: ads.length,
      active: ads.filter(ad => new Date(ad.ends_at) > now && ad.status === 'active').length,
      totalViews: ads.reduce((sum, ad) => sum + (ad.views || 0), 0),
      totalClicks: ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0),
      totalSpent: ads.reduce((sum, ad) => sum + (ad.price_paid || 0), 0),
      ads,
    };

    stats.averageCtr = stats.totalViews > 0
      ? ((stats.totalClicks / stats.totalViews) * 100).toFixed(2)
      : 0;

    return stats;
  },

  // ==========================================
  // AFFICHAGE (pour le front)
  // ==========================================

  /**
   * Recupere les labos a mettre en avant (pour carrousel Home)
   */
  async getFeaturedLabs(limit = 10) {
    const now = new Date().toISOString();

    // Labos avec pub "featured" active
    const { data: adsData, error: adsError } = await supabase
      .from('laboratory_ads')
      .select(`
        user_id,
        laboratory:laboratory_profiles!inner(
          id,
          company_name,
          brand_name,
          logo_url,
          description,
          siret_verified
        )
      `)
      .eq('ad_type', 'featured')
      .eq('status', 'active')
      .gt('ends_at', now)
      .limit(limit);

    if (adsError && adsError.code !== '42P01') throw adsError;

    // Aussi recuperer les labos Pro/Business avec posts featured
    const { data: proLabs, error: proError } = await supabase
      .from('laboratory_profiles')
      .select('id, company_name, brand_name, logo_url, description, siret_verified, subscription_tier, priority_visibility')
      .in('subscription_tier', ['pro', 'business'])
      .eq('priority_visibility', true)
      .limit(limit);

    if (proError) throw proError;

    // Combiner et dedupliquer
    const labsFromAds = (adsData || []).map(ad => ad.laboratory);
    const allLabs = [...labsFromAds, ...(proLabs || [])];

    // Dedupliquer par ID
    const seen = new Set();
    const uniqueLabs = allLabs.filter(lab => {
      if (!lab || seen.has(lab.id)) return false;
      seen.add(lab.id);
      return true;
    });

    return uniqueLabs.slice(0, limit);
  },

  /**
   * Recupere les cards sponsorisees (pour deck swipe)
   */
  async getSponsoredCards(limit = 5) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('laboratory_ads')
      .select(`
        id,
        user_id,
        laboratory:laboratory_profiles!inner(
          id,
          company_name,
          brand_name,
          logo_url,
          description
        )
      `)
      .eq('ad_type', 'sponsored_card')
      .eq('status', 'active')
      .gt('ends_at', now)
      .limit(limit);

    if (error) {
      if (error.code === '42P01') return [];
      throw error;
    }

    return (data || []).map(ad => ({
      ...ad.laboratory,
      adId: ad.id, // Pour tracker les vues/clics
      isSponsored: true,
    }));
  },

  // ==========================================
  // ADMIN
  // ==========================================

  /**
   * [ADMIN] Recupere toutes les pubs avec filtres
   */
  async adminGetAllAds(filters = {}) {
    let query = supabase
      .from('laboratory_ads')
      .select(`
        *,
        user:profiles(first_name, last_name),
        laboratory:laboratory_profiles(company_name, brand_name)
      `)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.adType) {
      query = query.eq('ad_type', filters.adType);
    }
    if (filters.active) {
      const now = new Date().toISOString();
      query = query.gt('ends_at', now).eq('status', 'active');
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * [ADMIN] Statistiques globales des pubs
   */
  async adminGetStats() {
    const { data, error } = await supabase
      .from('laboratory_ads')
      .select('ad_type, price_paid, views, clicks, status, ends_at');

    if (error) {
      if (error.code === '42P01') {
        return {
          total: 0,
          active: 0,
          revenue: 0,
          totalViews: 0,
          totalClicks: 0,
          byType: {},
        };
      }
      throw error;
    }

    const now = new Date();
    const ads = data || [];

    const stats = {
      total: ads.length,
      active: ads.filter(ad => new Date(ad.ends_at) > now && ad.status === 'active').length,
      revenue: ads.reduce((sum, ad) => sum + (ad.price_paid || 0), 0),
      totalViews: ads.reduce((sum, ad) => sum + (ad.views || 0), 0),
      totalClicks: ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0),
      byType: {},
    };

    // Stats par type
    ads.forEach(ad => {
      if (!stats.byType[ad.ad_type]) {
        stats.byType[ad.ad_type] = { count: 0, revenue: 0, views: 0, clicks: 0 };
      }
      stats.byType[ad.ad_type].count++;
      stats.byType[ad.ad_type].revenue += ad.price_paid || 0;
      stats.byType[ad.ad_type].views += ad.views || 0;
      stats.byType[ad.ad_type].clicks += ad.clicks || 0;
    });

    return stats;
  },

  /**
   * [ADMIN] Desactive une pub
   */
  async adminDeactivateAd(adId) {
    const { error } = await supabase
      .from('laboratory_ads')
      .update({ status: 'cancelled' })
      .eq('id', adId);

    if (error) throw error;
  },

  /**
   * [ADMIN] Prolonge une pub
   */
  async adminExtendAd(adId, additionalWeeks) {
    const { data: ad, error: fetchError } = await supabase
      .from('laboratory_ads')
      .select('ends_at')
      .eq('id', adId)
      .single();

    if (fetchError) throw fetchError;

    const currentEnd = new Date(ad.ends_at);
    currentEnd.setDate(currentEnd.getDate() + (additionalWeeks * 7));

    const { error } = await supabase
      .from('laboratory_ads')
      .update({ ends_at: currentEnd.toISOString() })
      .eq('id', adId);

    if (error) throw error;
  },
};
