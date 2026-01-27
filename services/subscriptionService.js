// Gestion centralisée des abonnements et quotas

import { supabase } from '../lib/supabase';
import { getSubscriptionTier, getSubscriptionLimits, getNextTier } from '../constants/profileOptions';

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
    const { data, error } = await supabase
      .rpc('get_or_create_current_usage', { p_user_id: userId });

    if (error) throw error;
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
    const { data, error } = await supabase
      .rpc('increment_usage', {
        p_user_id: userId,
        p_field: field,
        p_amount: amount,
      });

    if (error) throw error;
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
        auto_renew: true,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Annule l'abonnement (revient à free à l'expiration)
   */
  async cancelSubscription(userId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        auto_renew: false,
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
      },
    };
  },
};
