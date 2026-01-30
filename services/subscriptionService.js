// Gestion centralisée des abonnements et quotas

import { supabase } from '../lib/supabase';
import { getSubscriptionTier, getSubscriptionLimits, getNextTier } from '../constants/profileOptions';
import { calculateMerFee as calcMerFee, getAnalyticsLevel, hasFeature } from './subscriptionLimitsService';

export const subscriptionService = {
  // ==========================================
  // LECTURE
  // ==========================================

  /**
   * Récupère l'abonnement actif d'un utilisateur
   */
  async getSubscription(userId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  },

  /**
   * Récupère l'usage du mois en cours (via RPC, crée si inexistant)
   */
  async getUsage(userId) {
    // Essayer la fonction RPC qui gère le partitionnement mensuel
    const { data, error } = await supabase
      .rpc('get_or_create_current_usage', { p_user_id: userId });

    // Si la fonction RPC échoue (ex: colonne month inexistante), fallback direct
    if (error) {
      // Fallback: query directe sans partitionnement mensuel
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('subscription_usage')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fallbackError && fallbackError.code !== 'PGRST116') throw fallbackError;

      // Si aucune donnée, créer une entrée vide
      if (!fallbackData) {
        const { data: newData, error: insertError } = await supabase
          .from('subscription_usage')
          .insert({ user_id: userId })
          .select()
          .single();

        if (insertError) throw insertError;
        return newData;
      }

      return fallbackData;
    }

    return data;
  },

  /**
   * Récupère le type d'utilisateur
   */
  async _getUserType(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data.user_type;
  },

  /**
   * Récupère les limites selon le tier et le type d'utilisateur
   * @returns {{ tier, tierInfo, limits, usage }}
   */
  async getLimits(userId) {
    const [subscription, usage, userType] = await Promise.all([
      this.getSubscription(userId),
      this.getUsage(userId),
      this._getUserType(userId),
    ]);

    const tier = subscription?.tier || 'free';
    const tierInfo = getSubscriptionTier(userType, tier);
    const limits = getSubscriptionLimits(userType, tier);

    return { tier, tierInfo, limits, usage, userType };
  },

  /**
   * Vérifie si une action est possible pour un type de limite donné
   * @param {string} userId
   * @param {string} limitType - Clé de limite (missions, offers, alertsPerMonth, etc.)
   * @returns {{ allowed: boolean, used: number, max: number, remaining: number }}
   */
  async checkLimit(userId, limitType) {
    const { limits, usage } = await this.getLimits(userId);
    const max = limits[limitType];

    if (max === undefined) {
      return { allowed: true, used: 0, max: Infinity, remaining: Infinity };
    }

    // Mapper les clés de limites vers les champs d'usage
    const usageFieldMap = {
      missions: 'missions_published',
      offers: 'missions_published', // offres = missions pour titulaires
      internships: 'missions_published', // comptabilisées ensemble
      contacts: 'missions_confirmed',
      animatorMissions: 'missions_published',
      alertsPerMonth: 'alerts_sent',
      favorites: 'favorites_count',
      superLikesPerDay: 'super_likes_today',
      // Nouvelles colonnes pour laboratoires
      postsPerMonth: 'posts_published',
      videosPerMonth: 'videos_published',
      sponsoredWeeks: 'sponsored_weeks_used',
      sponsoredCards: 'sponsored_cards_used',
      photosMax: 'photos_count',
    };

    const usageField = usageFieldMap[limitType];
    const used = usageField ? (usage?.[usageField] || 0) : 0;

    if (max === Infinity) {
      return { allowed: true, used, max: Infinity, remaining: Infinity };
    }

    return {
      allowed: used < max,
      used,
      max,
      remaining: Math.max(0, max - used),
    };
  },

  // ==========================================
  // QUOTAS - Vérifications spécifiques
  // ==========================================

  /**
   * Vérifie si l'utilisateur peut publier une mission/offre
   */
  async canPublishMission(userId) {
    const { userType } = await this.getLimits(userId);
    const limitKey = userType === 'laboratoire' ? 'missions' : 'offers';
    return this.checkLimit(userId, limitKey);
  },

  /**
   * Vérifie si l'utilisateur peut confirmer une mise en relation
   */
  async canConfirmMission(userId) {
    return this.checkLimit(userId, 'contacts');
  },

  /**
   * Vérifie si l'utilisateur peut envoyer une alerte urgente
   */
  async canSendAlert(userId) {
    return this.checkLimit(userId, 'alertsPerMonth');
  },

  /**
   * Vérifie si l'utilisateur peut ajouter un favori
   */
  async canAddFavorite(userId) {
    return this.checkLimit(userId, 'favorites');
  },

  /**
   * Vérifie si l'utilisateur peut utiliser un super like aujourd'hui
   * Gère le reset quotidien automatique
   */
  async canSuperLike(userId) {
    const usage = await this.getUsage(userId);

    // Reset quotidien si nécessaire
    if (usage && this._shouldResetSuperLikes(usage.super_likes_last_reset)) {
      await supabase.rpc('reset_daily_super_likes', { p_user_id: userId });
      return this.checkLimit(userId, 'superLikesPerDay');
    }

    return this.checkLimit(userId, 'superLikesPerDay');
  },

  /**
   * Vérifie si le laboratoire peut publier un post
   */
  async canPublishPost(userId) {
    return this.checkLimit(userId, 'postsPerMonth');
  },

  /**
   * Vérifie si le laboratoire peut publier une vidéo
   */
  async canPublishVideo(userId) {
    return this.checkLimit(userId, 'videosPerMonth');
  },

  /**
   * Vérifie si le laboratoire peut utiliser une semaine sponsorisée
   */
  async canUseSponsoredWeek(userId) {
    return this.checkLimit(userId, 'sponsoredWeeks');
  },

  /**
   * Vérifie si le laboratoire peut utiliser une carte sponsorisée
   */
  async canUseSponsoredCard(userId) {
    return this.checkLimit(userId, 'sponsoredCards');
  },

  /**
   * Vérifie si le laboratoire peut ajouter une photo
   */
  async canAddPhoto(userId) {
    return this.checkLimit(userId, 'photosMax');
  },

  /**
   * Vérifie si l'utilisateur a la visibilité prioritaire
   */
  async hasPriorityVisibility(userId) {
    const { limits } = await this.getLimits(userId);
    return limits.priorityVisibility === true;
  },

  /**
   * Calcule les frais de mise en relation (MER)
   * @param {string} userId - ID utilisateur
   * @param {number} missionDays - Nombre de jours de la mission
   * @returns {{ fee: number, included: boolean, message: string }}
   */
  async calculateMerFee(userId, missionDays) {
    const { userType, tier, usage } = await this.getLimits(userId);
    const merUsedThisMonth = usage?.missions_confirmed || 0;
    return calcMerFee(userType, tier, missionDays, merUsedThisMonth);
  },

  /**
   * Vérifie si l'utilisateur a accès aux événements
   */
  async canCreateEvents(userId) {
    const { userType, tier } = await this.getLimits(userId);
    return hasFeature(userType, tier, 'events');
  },

  /**
   * Vérifie si l'utilisateur a accès aux formations
   */
  async canCreateFormation(userId) {
    const { limits, usage } = await this.getLimits(userId);
    const max = limits.formations || 0;
    const used = usage?.formations_created || 0;
    if (max === Infinity) return { allowed: true, used, max: Infinity, remaining: Infinity };
    return {
      allowed: used < max,
      used,
      max,
      remaining: Math.max(0, max - used),
    };
  },

  /**
   * Retourne le niveau d'analytics disponible
   */
  async getAnalyticsLevel(userId) {
    const { userType, tier } = await this.getLimits(userId);
    return getAnalyticsLevel(userType, tier);
  },

  /**
   * Vérifie si le reset quotidien est nécessaire
   */
  _shouldResetSuperLikes(lastReset) {
    if (!lastReset) return true;
    const lastDate = new Date(lastReset).toDateString();
    const today = new Date().toDateString();
    return lastDate !== today;
  },

  // ==========================================
  // INCRÉMENTATION
  // ==========================================

  /**
   * Incrémente un compteur d'usage de manière atomique
   * @param {string} userId
   * @param {string} field - Nom du champ (missions_published, alerts_sent, etc.)
   * @param {number} amount - Quantité à incrémenter (défaut: 1)
   */
  async incrementUsage(userId, field, amount = 1) {
    // Essayer la fonction RPC
    const { data, error } = await supabase
      .rpc('increment_usage', {
        p_user_id: userId,
        p_field: field,
        p_amount: amount,
      });

    // Si la fonction RPC échoue, fallback direct
    if (error) {
      // Assurer que l'enregistrement existe
      await this.getUsage(userId);

      // Faire l'update directement avec un raw SQL increment
      const { error: updateError } = await supabase
        .from('subscription_usage')
        .update({ [field]: supabase.raw(`COALESCE(${field}, 0) + ${amount}`) })
        .eq('user_id', userId);

      // Si raw SQL ne marche pas, fallback manuel
      if (updateError) {
        const { data: current } = await supabase
          .from('subscription_usage')
          .select(field)
          .eq('user_id', userId)
          .single();

        await supabase
          .from('subscription_usage')
          .update({ [field]: (current?.[field] || 0) + amount })
          .eq('user_id', userId);
      }

      return;
    }

    return data;
  },

  /**
   * Incrémente le compteur de missions publiées
   */
  async incrementMissionsPublished(userId) {
    return this.incrementUsage(userId, 'missions_published');
  },

  /**
   * Incrémente le compteur de MER (missions confirmées)
   */
  async incrementMissionsConfirmed(userId) {
    return this.incrementUsage(userId, 'missions_confirmed');
  },

  /**
   * Incrémente le compteur d'alertes envoyées
   */
  async incrementAlertsSent(userId) {
    return this.incrementUsage(userId, 'alerts_sent');
  },

  /**
   * Incrémente le compteur de favoris
   */
  async incrementFavorites(userId) {
    return this.incrementUsage(userId, 'favorites_count');
  },

  /**
   * Décrémente le compteur de favoris (retrait)
   */
  async decrementFavorites(userId) {
    return this.incrementUsage(userId, 'favorites_count', -1);
  },

  /**
   * Incrémente le compteur de super likes du jour
   */
  async incrementSuperLikes(userId) {
    return this.incrementUsage(userId, 'super_likes_today');
  },

  /**
   * Incrémente le compteur de posts publiés
   */
  async incrementPostsPublished(userId) {
    return this.incrementUsage(userId, 'posts_published');
  },

  /**
   * Incrémente le compteur de vidéos publiées
   */
  async incrementVideosPublished(userId) {
    return this.incrementUsage(userId, 'videos_published');
  },

  /**
   * Incrémente le compteur de semaines sponsorisées utilisées
   */
  async incrementSponsoredWeeks(userId) {
    return this.incrementUsage(userId, 'sponsored_weeks_used');
  },

  /**
   * Incrémente le compteur de cartes sponsorisées utilisées
   */
  async incrementSponsoredCards(userId) {
    return this.incrementUsage(userId, 'sponsored_cards_used');
  },

  /**
   * Met à jour le compteur de photos (set, pas increment)
   */
  async setPhotosCount(userId, count) {
    const { error } = await supabase
      .from('subscription_usage')
      .update({ photos_count: count })
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Reset quotidien des super likes (appelé par cron ou au login)
   */
  async resetDailySuperLikes(userId) {
    const { data, error } = await supabase
      .rpc('reset_daily_super_likes', { p_user_id: userId });

    if (error) throw error;
    return data;
  },

  // ==========================================
  // ABONNEMENT - Gestion
  // ==========================================

  /**
   * Crée ou récupère l'abonnement free par défaut
   */
  async ensureSubscription(userId) {
    let sub = await this.getSubscription(userId);
    if (sub) return sub;

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        tier: 'free',
      })
      .select()
      .single();

    if (error) {
      // Race condition: un autre appel a créé l'abonnement
      if (error.code === '23505') {
        return this.getSubscription(userId);
      }
      throw error;
    }
    return data;
  },

  /**
   * Upgrade l'abonnement vers un nouveau tier
   * Met aussi à jour priority_visibility selon le tier
   */
  async upgradeTier(userId, newTier, durationMonths = 1) {
    await this.ensureSubscription(userId);

    const startDate = new Date();
    const expiresAt = new Date(startDate);
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        tier: newTier,
        started_at: startDate.toISOString(),
        expires_at: expiresAt.toISOString(),
        next_billing_date: expiresAt.toISOString(),
        auto_renew: true,
        cancelled_at: null,
        cancellation_reason: null,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Synchroniser priority_visibility selon le tier
    const userType = await this._getUserType(userId);
    const tierLimits = getSubscriptionLimits(userType, newTier);
    const hasPriority = tierLimits.priorityVisibility === true;

    await supabase
      .from('profiles')
      .update({ priority_visibility: hasPriority })
      .eq('user_id', userId);

    return data;
  },

  /**
   * Annule l'abonnement (revient à free à l'expiration)
   * @param {string} userId
   * @param {string} reason - Motif de résiliation (optionnel)
   */
  async cancelSubscription(userId, reason = null) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        auto_renew: false,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Réactive un abonnement annulé (avant expiration)
   */
  async reactivateSubscription(userId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        auto_renew: true,
        cancelled_at: null,
        cancellation_reason: null,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Retourne un résumé complet pour l'affichage UI
   * @returns {{ subscription, usage, tierInfo, limits, quotas }}
   */
  async getFullStatus(userId) {
    const [subscription, userType] = await Promise.all([
      this.ensureSubscription(userId),
      this._getUserType(userId),
    ]);

    const usage = await this.getUsage(userId);
    const tier = subscription.tier || 'free';
    const tierInfo = getSubscriptionTier(userType, tier);
    const limits = tierInfo.limits;
    const nextTier = getNextTier(userType, tier);

    // Construire les quotas avec used/max/remaining
    const buildQuota = (limitKey, usageField) => {
      const max = limits[limitKey];
      if (max === undefined) return null;
      const used = usage?.[usageField] || 0;
      return {
        used,
        max: max === Infinity ? null : max,
        remaining: max === Infinity ? null : Math.max(0, max - used),
        unlimited: max === Infinity,
        allowed: max === Infinity || used < max,
      };
    };

    return {
      subscription,
      usage,
      userType,
      tierInfo,
      nextTier,
      quotas: {
        missions: buildQuota('missions', 'missions_published') || buildQuota('offers', 'missions_published'),
        contacts: buildQuota('contacts', 'missions_confirmed'),
        alerts: buildQuota('alertsPerMonth', 'alerts_sent'),
        favorites: buildQuota('favorites', 'favorites_count'),
        superLikes: buildQuota('superLikesPerDay', 'super_likes_today'),
        posts: buildQuota('postsPerMonth', 'posts_published'),
        videos: buildQuota('videosPerMonth', 'videos_published'),
        sponsoredWeeks: buildQuota('sponsoredWeeks', 'sponsored_weeks_used'),
        sponsoredCards: buildQuota('sponsoredCards', 'sponsored_cards_used'),
        photos: buildQuota('photosMax', 'photos_count'),
      },
    };
  },

  // ==========================================
  // ADMIN - Gestion des abonnements
  // ==========================================

  /**
   * [ADMIN] Récupère tous les abonnements avec filtres
   */
  async adminGetAllSubscriptions(filters = {}) {
    let query = supabase
      .from('subscriptions')
      .select(`
        *,
        user:users(id, email, user_type, created_at),
        profile:profiles(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (filters.tier) {
      query = query.eq('tier', filters.tier);
    }
    if (filters.autoRenew !== undefined) {
      query = query.eq('auto_renew', filters.autoRenew);
    }
    if (filters.expired) {
      query = query.lt('expires_at', new Date().toISOString());
    }
    if (filters.active) {
      query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * [ADMIN] Modifie le tier d'un utilisateur
   * Met aussi à jour priority_visibility selon le tier
   */
  async adminSetTier(userId, newTier, options = {}) {
    const {
      durationMonths = 1,
      autoRenew = true,
      reason = null,
    } = options;

    await this.ensureSubscription(userId);

    const startDate = new Date();
    const expiresAt = new Date(startDate);
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        tier: newTier,
        started_at: startDate.toISOString(),
        expires_at: newTier === 'free' ? null : expiresAt.toISOString(),
        auto_renew: newTier === 'free' ? false : autoRenew,
        admin_note: reason,
        updated_by_admin: true,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Synchroniser priority_visibility selon le tier
    const userType = await this._getUserType(userId);
    const tierLimits = getSubscriptionLimits(userType, newTier);
    const hasPriority = tierLimits.priorityVisibility === true;

    await supabase
      .from('profiles')
      .update({ priority_visibility: hasPriority })
      .eq('user_id', userId);

    return data;
  },

  /**
   * [ADMIN] Prolonge un abonnement
   */
  async adminExtendSubscription(userId, additionalMonths) {
    const subscription = await this.getSubscription(userId);
    if (!subscription) throw new Error('Abonnement non trouvé');

    const currentExpiry = subscription.expires_at
      ? new Date(subscription.expires_at)
      : new Date();
    currentExpiry.setMonth(currentExpiry.getMonth() + additionalMonths);

    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        expires_at: currentExpiry.toISOString(),
        updated_by_admin: true,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * [ADMIN] Réinitialise l'usage d'un utilisateur
   */
  async adminResetUsage(userId, fields = null) {
    const resetData = fields
      ? Object.fromEntries(fields.map(f => [f, 0]))
      : {
          missions_published: 0,
          missions_confirmed: 0,
          alerts_sent: 0,
          favorites_count: 0,
          super_likes_today: 0,
          posts_published: 0,
          videos_published: 0,
          sponsored_weeks_used: 0,
          sponsored_cards_used: 0,
        };

    const { error } = await supabase
      .from('subscription_usage')
      .update(resetData)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * [ADMIN] Récupère les statistiques globales des abonnements
   */
  async adminGetStats() {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('tier');

    if (error) throw error;

    const stats = {
      total: data.length,
      byTier: {},
    };

    data.forEach(sub => {
      const tier = sub.tier || 'free';
      stats.byTier[tier] = (stats.byTier[tier] || 0) + 1;
    });

    return stats;
  },

  /**
   * [ADMIN] Active/désactive la visibilité prioritaire d'un profil
   */
  async adminSetPriorityVisibility(userId, enabled) {
    const { error } = await supabase
      .from('profiles')
      .update({ priority_visibility: enabled })
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * [ADMIN] Récupère l'usage d'un utilisateur
   */
  async adminGetUserUsageHistory(userId) {
    const { data, error } = await supabase
      .from('subscription_usage')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },
};
