/**
 * Service de gestion des limites d'abonnement
 * Source de vérité pour tous les quotas et tarifs
 */

// =====================================================
// LIMITES PAR TYPE D'UTILISATEUR ET TIER
// =====================================================

const LIMITS = {
  // ----------------------------------------
  // LABORATOIRE
  // ----------------------------------------
  laboratory: {
    free: {
      missions_publishable: 1,
      mer_included: 0,
      mer_fee: { '1-2': 10, '3-5': 15, '6+': 20 },
      alerts: 0,
      favorites: 3,
      super_likes_daily: 3,
      photos: 5,
      posts_monthly: 2,
      videos_monthly: 0,
      formations: 0,
      events: false,
      featured_weeks: 0,
      sponsored_cards: 0,
      analytics: 'none',
      priority_visibility: false,
    },
    starter: {
      missions_publishable: 3,
      mer_included: 3,
      mer_fee_after_quota: 15,
      alerts: 1,
      favorites: 10,
      super_likes_daily: 5,
      photos: 10,
      posts_monthly: 5,
      videos_monthly: 1,
      formations: 1,
      events: false,
      featured_weeks: 0,
      sponsored_cards: 0,
      analytics: 'basic',
      priority_visibility: false,
    },
    pro: {
      missions_publishable: 15,
      mer_included: 10,
      mer_fee_after_quota: 10,
      alerts: 5,
      favorites: 50,
      super_likes_daily: 15,
      photos: 20,
      posts_monthly: 15,
      videos_monthly: 5,
      formations: 5,
      events: true,
      featured_weeks: 2,
      sponsored_cards: 2,
      analytics: 'advanced',
      priority_visibility: true,
    },
    business: {
      missions_publishable: Infinity,
      mer_included: Infinity,
      alerts: Infinity,
      favorites: Infinity,
      super_likes_daily: Infinity,
      photos: Infinity,
      posts_monthly: Infinity,
      videos_monthly: 10,
      formations: Infinity,
      events: true,
      featured_weeks: 4,
      sponsored_cards: 2,
      analytics: 'advanced_export',
      priority_visibility: true,
    },
  },

  // ----------------------------------------
  // TITULAIRE (Pharmacien)
  // ----------------------------------------
  titulaire: {
    free: {
      job_offers: 1,
      internship_offers: Infinity, // Stages gratuits
      animator_missions: 0,
      mer_included: 0,
      mer_fee: { '1-2': 5, '3-5': 8, '6+': 10 },
      alerts: 1,
      favorites: 5,
      super_likes_daily: 3,
      priority_visibility: false,
    },
    pro: {
      job_offers: 5,
      internship_offers: Infinity,
      animator_missions: 2,
      mer_included: 1,
      mer_fee_after_quota: 8,
      alerts: 5,
      favorites: 20,
      super_likes_daily: 10,
      priority_visibility: true,
    },
    business: {
      job_offers: Infinity,
      internship_offers: Infinity,
      animator_missions: 5,
      mer_included: 5,
      mer_fee_after_quota: 5,
      alerts: Infinity,
      favorites: Infinity,
      super_likes_daily: Infinity,
      priority_visibility: true,
    },
  },

  // ----------------------------------------
  // ANIMATEUR
  // Les animateurs ne paient jamais de MER
  // ----------------------------------------
  animateur: {
    free: {
      mer_included: Infinity, // Toujours gratuit
      super_likes_daily: 1,
      cv_generated: 1,
      documents_storage: 5,
      priority_visibility: false,
    },
    premium: {
      mer_included: Infinity, // Toujours gratuit
      super_likes_daily: 5,
      cv_generated: 3,
      documents_storage: 10,
      priority_visibility: true,
    },
  },

  // ----------------------------------------
  // CANDIDAT (Préparateur, Conseiller)
  // ----------------------------------------
  candidat: {
    free: {
      super_likes_daily: 1,
      cv_generated: 1,
      documents_storage: 5,
      priority_visibility: false,
    },
    premium: {
      super_likes_daily: 5,
      cv_generated: 3,
      documents_storage: 5,
      priority_visibility: true,
    },
  },

  // ----------------------------------------
  // ETUDIANT
  // ----------------------------------------
  etudiant: {
    free: {
      super_likes_daily: 1,
      cv_generated: 1,
      documents_storage: 0,
      priority_visibility: false,
    },
    premium: {
      super_likes_daily: 5,
      cv_generated: 3,
      documents_storage: 5,
      priority_visibility: true,
    },
  },
};

// =====================================================
// PRIX PAR TYPE D'UTILISATEUR ET TIER
// =====================================================

const PRICES = {
  laboratory: {
    free: 0,
    starter: 49,
    pro: 149,
    business: 299,
  },
  titulaire: {
    free: 0,
    pro: 29,
    business: 59,
  },
  animateur: {
    free: 0,
    premium: 19,
  },
  candidat: {
    free: 0,
    premium: 19,
  },
  etudiant: {
    free: 0,
    premium: 5, // Tarif étudiant réduit
  },
};

// =====================================================
// FEATURES PAR TYPE D'UTILISATEUR ET TIER
// =====================================================

const FEATURES = {
  laboratory: {
    free: [
      '1 mission d\'animation',
      '3 favoris',
      '3 super likes / jour',
      '2 posts / mois',
      '5 photos',
      'Consulter les profils animateurs',
    ],
    starter: [
      '3 missions d\'animation',
      '3 mises en relation incluses / mois',
      '10 favoris',
      '5 super likes / jour',
      '5 posts / mois',
      '1 vidéo / mois',
      '10 photos',
      '1 formation',
      'Analytics basiques',
      'Ciblage par région',
    ],
    pro: [
      '15 missions d\'animation',
      '10 mises en relation incluses / mois',
      '50 favoris',
      '15 super likes / jour',
      '15 posts / mois',
      '5 vidéos / mois',
      '20 photos',
      '5 formations',
      'Événements',
      '2 semaines en vedette / mois',
      '2 cartes sponsorisées',
      'Analytics avancés',
      'Visibilité prioritaire',
      'Ciblage avancé',
    ],
    business: [
      'Missions illimitées',
      'Mises en relation illimitées',
      'Favoris illimités',
      'Super likes illimités',
      'Posts illimités',
      '10 vidéos / mois',
      'Photos illimitées',
      'Formations illimitées',
      'Événements',
      '4 semaines en vedette / mois',
      '2 cartes sponsorisées',
      'Analytics avec export',
      'Visibilité prioritaire',
      'Badge "Labo Business"',
      'Support prioritaire',
    ],
  },
  titulaire: {
    free: [
      '1 offre d\'emploi',
      'Stages illimités',
      '1 alerte urgente / mois',
      '5 favoris',
      '3 super likes / jour',
    ],
    pro: [
      '5 offres d\'emploi',
      'Stages illimités',
      '2 missions animateur',
      '1 mise en relation incluse / mois',
      '5 alertes urgentes / mois',
      '20 favoris',
      '10 super likes / jour',
      'Visibilité prioritaire',
    ],
    business: [
      'Offres d\'emploi illimitées',
      'Stages illimités',
      '5 missions animateur',
      '5 mises en relation incluses / mois',
      'Alertes urgentes illimitées',
      'Favoris illimités',
      'Super likes illimités',
      'Visibilité prioritaire',
      'Support prioritaire',
    ],
  },
  animateur: {
    free: [
      '1 super like / jour',
      '1 CV',
      '5 documents',
      'Recevoir des propositions',
    ],
    premium: [
      '5 super likes / jour',
      '3 CV',
      '10 documents',
      'Visibilité prioritaire',
      'Badge "Premium"',
    ],
  },
  candidat: {
    free: [
      '1 super like / jour',
      '1 CV',
      '5 documents',
      'Recevoir des offres',
    ],
    premium: [
      '5 super likes / jour',
      '3 CV',
      '5 documents',
      'Visibilité prioritaire',
      'Badge "Premium"',
    ],
  },
  etudiant: {
    free: [
      '1 super like / jour',
      '1 CV',
      'Recevoir des offres de stage',
    ],
    premium: [
      '5 super likes / jour',
      '3 CV',
      '5 documents',
      'Visibilité prioritaire',
      'Badge "Étudiant Premium"',
    ],
  },
};

// =====================================================
// MAPPING USER_TYPE → LIMITS KEY
// =====================================================

const USER_TYPE_TO_LIMITS_KEY = {
  laboratoire: 'laboratory',
  titulaire: 'titulaire',
  animateur: 'animateur',
  preparateur: 'candidat',
  conseiller: 'candidat',
  etudiant: 'etudiant',
};

// =====================================================
// FONCTIONS EXPORTÉES
// =====================================================

/**
 * Normalise le user_type vers la clé de limites
 */
const normalizeUserType = (userType) => {
  return USER_TYPE_TO_LIMITS_KEY[userType] || 'candidat';
};

/**
 * Retourne toutes les limites pour un type d'utilisateur et tier
 */
export const getLimits = (userType, tier) => {
  const normalizedType = normalizeUserType(userType);
  const tierLimits = LIMITS[normalizedType];
  if (!tierLimits) return LIMITS.candidat.free;
  return tierLimits[tier] || tierLimits.free || {};
};

/**
 * Retourne une limite spécifique
 */
export const getLimit = (userType, tier, limitKey) => {
  const limits = getLimits(userType, tier);
  return limits[limitKey];
};

/**
 * Vérifie si une limite est atteinte
 * @returns {{ allowed: boolean, remaining: number, limit: number, unlimited: boolean }}
 */
export const checkLimit = (userType, tier, limitKey, currentUsage) => {
  const limit = getLimit(userType, tier, limitKey);

  if (limit === undefined || limit === Infinity) {
    return {
      allowed: true,
      remaining: Infinity,
      limit: Infinity,
      unlimited: true,
    };
  }

  if (typeof limit === 'boolean') {
    return {
      allowed: limit,
      remaining: limit ? 1 : 0,
      limit: limit ? 1 : 0,
      unlimited: false,
    };
  }

  const remaining = Math.max(0, limit - currentUsage);
  return {
    allowed: currentUsage < limit,
    remaining,
    limit,
    unlimited: false,
  };
};

/**
 * Calcule les frais de mise en relation (MER)
 * @param {string} userType - Type d'utilisateur
 * @param {string} tier - Tier d'abonnement
 * @param {number} missionDays - Nombre de jours de la mission
 * @param {number} merUsedThisMonth - Nombre de MER déjà utilisées ce mois
 * @returns {{ fee: number, included: boolean, message: string }}
 */
export const calculateMerFee = (userType, tier, missionDays, merUsedThisMonth = 0) => {
  const limits = getLimits(userType, tier);
  const merIncluded = limits.mer_included || 0;

  // Vérifier si la MER est incluse dans le quota
  if (merIncluded === Infinity || merUsedThisMonth < merIncluded) {
    return {
      fee: 0,
      included: true,
      message: merIncluded === Infinity
        ? 'Inclus dans votre abonnement (illimité)'
        : `Inclus dans votre abonnement (${merUsedThisMonth + 1}/${merIncluded})`,
    };
  }

  // Sinon, calculer les frais selon la durée
  let fee = 0;
  let feeStructure = null;

  // Frais fixe après quota (pour starter, pro, business)
  if (limits.mer_fee_after_quota !== undefined) {
    fee = limits.mer_fee_after_quota;
    feeStructure = 'fixed';
  }
  // Frais par palier (pour free)
  else if (limits.mer_fee) {
    if (missionDays <= 2) {
      fee = limits.mer_fee['1-2'] || 0;
    } else if (missionDays <= 5) {
      fee = limits.mer_fee['3-5'] || 0;
    } else {
      fee = limits.mer_fee['6+'] || 0;
    }
    feeStructure = 'tiered';
  }

  return {
    fee,
    included: false,
    feeStructure,
    message: fee > 0
      ? `Frais de mise en relation: ${fee}€`
      : 'Mise en relation gratuite',
  };
};

/**
 * Retourne le prix mensuel d'un tier
 */
export const getTierPrice = (userType, tier) => {
  const normalizedType = normalizeUserType(userType);
  const prices = PRICES[normalizedType];
  if (!prices) return 0;
  return prices[tier] || 0;
};

/**
 * Retourne la liste des features pour affichage
 */
export const getTierFeatures = (userType, tier) => {
  const normalizedType = normalizeUserType(userType);
  const features = FEATURES[normalizedType];
  if (!features) return [];
  return features[tier] || features.free || [];
};

/**
 * Retourne tous les tiers disponibles pour un type d'utilisateur
 */
export const getAvailableTiers = (userType) => {
  const normalizedType = normalizeUserType(userType);
  const tierLimits = LIMITS[normalizedType];
  if (!tierLimits) return ['free'];
  return Object.keys(tierLimits);
};

/**
 * Retourne les infos complètes d'un tier
 */
export const getTierInfo = (userType, tier) => {
  const normalizedType = normalizeUserType(userType);
  return {
    value: tier,
    label: getTierLabel(tier),
    price: getTierPrice(userType, tier),
    features: getTierFeatures(userType, tier),
    limits: getLimits(userType, tier),
    popular: isPopularTier(normalizedType, tier),
  };
};

/**
 * Label lisible pour un tier
 */
const getTierLabel = (tier) => {
  const labels = {
    free: 'Gratuit',
    starter: 'Starter',
    pro: 'Pro',
    business: 'Business',
    premium: 'Premium',
  };
  return labels[tier] || tier;
};

/**
 * Détermine si un tier est "populaire" (recommandé)
 */
const isPopularTier = (normalizedType, tier) => {
  const popularTiers = {
    laboratory: 'pro',
    titulaire: 'pro',
    animateur: 'premium',
    candidat: 'premium',
    etudiant: 'premium',
  };
  return popularTiers[normalizedType] === tier;
};

/**
 * Retourne le prochain tier disponible (pour upgrade)
 */
export const getNextTier = (userType, currentTier) => {
  const tiers = getAvailableTiers(userType);
  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex === -1 || currentIndex >= tiers.length - 1) {
    return null;
  }
  return tiers[currentIndex + 1];
};

/**
 * Retourne tous les tiers avec leurs infos complètes
 */
export const getAllTiersInfo = (userType) => {
  const tiers = getAvailableTiers(userType);
  return tiers.map(tier => getTierInfo(userType, tier));
};

/**
 * Vérifie si l'utilisateur a accès à une fonctionnalité boolean
 */
export const hasFeature = (userType, tier, featureKey) => {
  const limit = getLimit(userType, tier, featureKey);
  return limit === true || limit === Infinity || (typeof limit === 'number' && limit > 0);
};

/**
 * Retourne le niveau d'analytics disponible
 */
export const getAnalyticsLevel = (userType, tier) => {
  return getLimit(userType, tier, 'analytics') || 'none';
};

// Export des constantes pour usage externe si nécessaire
export const SUBSCRIPTION_LIMITS = LIMITS;
export const SUBSCRIPTION_PRICES = PRICES;
export const SUBSCRIPTION_FEATURES = FEATURES;
