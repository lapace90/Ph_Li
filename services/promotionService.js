/**
 * Service de gestion des codes promotionnels
 * Validation, application et suivi des promotions
 */

import { supabase } from '../lib/supabase';

export const promotionService = {
  // ==========================================
  // VALIDATION
  // ==========================================

  /**
   * Valide un code promo pour un utilisateur
   * @param {string} code - Code promo à valider
   * @param {string} userId - ID de l'utilisateur
   * @param {string} userType - Type d'utilisateur (laboratoire, titulaire, etc.)
   * @param {string} targetTier - Tier cible de l'abonnement
   * @returns {{ valid: boolean, promotion: object|null, error: string|null }}
   */
  async validatePromoCode(code, userId, userType, targetTier) {
    if (!code || !code.trim()) {
      return { valid: false, promotion: null, error: 'Code promo requis' };
    }

    const normalizedCode = code.trim().toUpperCase();

    // Récupérer la promotion
    const { data: promotion, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (error || !promotion) {
      return { valid: false, promotion: null, error: 'Code promo invalide' };
    }

    // Vérifier si la promotion est active
    if (!promotion.is_active) {
      return { valid: false, promotion: null, error: 'Ce code promo n\'est plus actif' };
    }

    // Vérifier les dates de validité
    const now = new Date();
    if (promotion.valid_from && new Date(promotion.valid_from) > now) {
      return { valid: false, promotion: null, error: 'Ce code promo n\'est pas encore valide' };
    }
    if (promotion.valid_until && new Date(promotion.valid_until) < now) {
      return { valid: false, promotion: null, error: 'Ce code promo a expiré' };
    }

    // Vérifier le nombre d'utilisations max
    if (promotion.max_uses !== null && promotion.current_uses >= promotion.max_uses) {
      return { valid: false, promotion: null, error: 'Ce code promo a atteint sa limite d\'utilisation' };
    }

    // Vérifier si applicable au type d'utilisateur
    if (promotion.applicable_user_types && promotion.applicable_user_types.length > 0) {
      if (!promotion.applicable_user_types.includes(userType)) {
        return {
          valid: false,
          promotion: null,
          error: 'Ce code promo n\'est pas applicable à votre type de compte'
        };
      }
    }

    // Vérifier si applicable au tier cible
    if (promotion.applicable_tiers && promotion.applicable_tiers.length > 0) {
      if (!promotion.applicable_tiers.includes(targetTier)) {
        return {
          valid: false,
          promotion: null,
          error: 'Ce code promo n\'est pas applicable à cet abonnement'
        };
      }
    }

    // Vérifier si l'utilisateur a déjà utilisé ce code
    const { data: existingUse } = await supabase
      .from('promotion_uses')
      .select('id')
      .eq('promotion_id', promotion.id)
      .eq('user_id', userId)
      .single();

    if (existingUse) {
      return { valid: false, promotion: null, error: 'Vous avez déjà utilisé ce code promo' };
    }

    // Vérifier first_purchase_only
    if (promotion.first_purchase_only) {
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id, tier')
        .eq('user_id', userId)
        .neq('tier', 'free')
        .single();

      if (existingSubscription) {
        return {
          valid: false,
          promotion: null,
          error: 'Ce code promo est réservé aux nouveaux abonnés'
        };
      }
    }

    return {
      valid: true,
      promotion: {
        id: promotion.id,
        code: promotion.code,
        name: promotion.name,
        description: promotion.description,
        discount_type: promotion.discount_type,
        discount_value: promotion.discount_value,
        trial_days: promotion.trial_days,
      },
      error: null
    };
  },

  // ==========================================
  // APPLICATION
  // ==========================================

  /**
   * Applique une promotion (incrémente le compteur d'usage)
   * @param {string} code - Code promo
   * @param {string} userId - ID utilisateur
   * @param {string} subscriptionId - ID de l'abonnement créé (optionnel)
   * @returns {{ success: boolean, discount: object|null, error: string|null }}
   */
  async applyPromotion(code, userId, subscriptionId = null) {
    const normalizedCode = code.trim().toUpperCase();

    // Récupérer la promotion
    const { data: promotion, error: fetchError } = await supabase
      .from('promotions')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (fetchError || !promotion) {
      return { success: false, discount: null, error: 'Code promo invalide' };
    }

    // Enregistrer l'utilisation
    const { error: useError } = await supabase
      .from('promotion_uses')
      .insert({
        promotion_id: promotion.id,
        user_id: userId,
        subscription_id: subscriptionId,
      });

    if (useError) {
      // Si erreur de contrainte unique, l'utilisateur a déjà utilisé ce code
      if (useError.code === '23505') {
        return { success: false, discount: null, error: 'Vous avez déjà utilisé ce code promo' };
      }
      throw useError;
    }

    // Incrémenter le compteur d'utilisations
    const { error: updateError } = await supabase
      .from('promotions')
      .update({
        current_uses: (promotion.current_uses || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', promotion.id);

    if (updateError) {
      console.error('Erreur lors de la mise à jour du compteur de promotion:', updateError);
    }

    return {
      success: true,
      discount: {
        type: promotion.discount_type,
        value: promotion.discount_value,
        trial_days: promotion.trial_days,
      },
      error: null,
    };
  },

  // ==========================================
  // CALCUL
  // ==========================================

  /**
   * Calcule le prix après application de la réduction
   * @param {number} basePrice - Prix de base
   * @param {object} promotion - Objet promotion avec discount_type et discount_value
   * @returns {{ finalPrice: number, discount: number, trialDays: number|null }}
   */
  calculateDiscountedPrice(basePrice, promotion) {
    if (!promotion) {
      return { finalPrice: basePrice, discount: 0, trialDays: null };
    }

    let finalPrice = basePrice;
    let discount = 0;
    let trialDays = null;

    switch (promotion.discount_type) {
      case 'percent':
        discount = Math.round(basePrice * (promotion.discount_value / 100) * 100) / 100;
        finalPrice = Math.max(0, basePrice - discount);
        break;

      case 'fixed':
        discount = Math.min(promotion.discount_value, basePrice);
        finalPrice = Math.max(0, basePrice - discount);
        break;

      case 'trial_days':
        // Pour les jours d'essai, le prix reste le même mais on offre des jours gratuits
        finalPrice = basePrice;
        trialDays = promotion.trial_days || promotion.discount_value;
        break;

      default:
        // Type inconnu, pas de réduction
        break;
    }

    return {
      finalPrice: Math.round(finalPrice * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      trialDays,
    };
  },

  // ==========================================
  // HISTORIQUE
  // ==========================================

  /**
   * Récupère l'historique des promotions utilisées par un utilisateur
   * @param {string} userId - ID utilisateur
   * @returns {Array} Liste des promotions utilisées
   */
  async getUserPromotionHistory(userId) {
    const { data, error } = await supabase
      .from('promotion_uses')
      .select(`
        id,
        used_at,
        subscription_id,
        promotion:promotions(
          id,
          code,
          name,
          description,
          discount_type,
          discount_value,
          trial_days
        )
      `)
      .eq('user_id', userId)
      .order('used_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // ==========================================
  // RÉCUPÉRATION
  // ==========================================

  /**
   * Récupère les promotions actives applicables à un utilisateur
   * @param {string} userType - Type d'utilisateur
   * @param {string} tier - Tier cible (optionnel)
   * @returns {Array} Liste des promotions actives
   */
  async getActivePromotions(userType, tier = null) {
    const now = new Date().toISOString();

    let query = supabase
      .from('promotions')
      .select('id, code, name, description, discount_type, discount_value, trial_days, valid_until')
      .eq('is_active', true)
      .eq('is_public', true) // Seulement les promos publiques
      .or(`valid_from.is.null,valid_from.lte.${now}`)
      .or(`valid_until.is.null,valid_until.gte.${now}`)
      .or(`max_uses.is.null,current_uses.lt.max_uses`);

    const { data, error } = await query;

    if (error) throw error;

    // Filtrer côté client pour les champs tableau
    let promotions = data || [];

    promotions = promotions.filter(promo => {
      // Vérifier le type d'utilisateur
      if (promo.applicable_user_types && promo.applicable_user_types.length > 0) {
        if (!promo.applicable_user_types.includes(userType)) {
          return false;
        }
      }

      // Vérifier le tier si spécifié
      if (tier && promo.applicable_tiers && promo.applicable_tiers.length > 0) {
        if (!promo.applicable_tiers.includes(tier)) {
          return false;
        }
      }

      return true;
    });

    return promotions;
  },

  /**
   * Récupère une promotion par son code (sans validation)
   * @param {string} code - Code promo
   * @returns {object|null} Promotion ou null
   */
  async getPromotionByCode(code) {
    const normalizedCode = code.trim().toUpperCase();

    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (error) return null;
    return data;
  },

  // ==========================================
  // ADMIN
  // ==========================================

  /**
   * [ADMIN] Crée une nouvelle promotion
   */
  async adminCreatePromotion(promotionData) {
    const { data, error } = await supabase
      .from('promotions')
      .insert({
        code: promotionData.code.toUpperCase(),
        name: promotionData.name,
        description: promotionData.description,
        discount_type: promotionData.discount_type,
        discount_value: promotionData.discount_value,
        trial_days: promotionData.trial_days,
        valid_from: promotionData.valid_from,
        valid_until: promotionData.valid_until,
        max_uses: promotionData.max_uses,
        applicable_user_types: promotionData.applicable_user_types,
        applicable_tiers: promotionData.applicable_tiers,
        first_purchase_only: promotionData.first_purchase_only || false,
        is_active: promotionData.is_active !== false,
        is_public: promotionData.is_public || false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * [ADMIN] Met à jour une promotion
   */
  async adminUpdatePromotion(promotionId, updates) {
    const { data, error } = await supabase
      .from('promotions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', promotionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * [ADMIN] Désactive une promotion
   */
  async adminDeactivatePromotion(promotionId) {
    return this.adminUpdatePromotion(promotionId, { is_active: false });
  },

  /**
   * [ADMIN] Liste toutes les promotions
   */
  async adminGetAllPromotions(includeInactive = false) {
    let query = supabase
      .from('promotions')
      .select('*, uses:promotion_uses(count)')
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * [ADMIN] Récupère les statistiques d'une promotion
   */
  async adminGetPromotionStats(promotionId) {
    const { data: promotion, error: promoError } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', promotionId)
      .single();

    if (promoError) throw promoError;

    const { data: uses, error: usesError } = await supabase
      .from('promotion_uses')
      .select(`
        id,
        used_at,
        user:auth.users(id, email),
        subscription:subscriptions(tier)
      `)
      .eq('promotion_id', promotionId)
      .order('used_at', { ascending: false });

    if (usesError) throw usesError;

    return {
      promotion,
      totalUses: uses?.length || 0,
      uses: uses || [],
      remainingUses: promotion.max_uses
        ? promotion.max_uses - (promotion.current_uses || 0)
        : null,
    };
  },
};
