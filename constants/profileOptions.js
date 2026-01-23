// constants/profileOptions.js
// Options centralisées pour les profils - VERSION COMPLÈTE
// Inclut: animateurs, labos, groupements, quick wins

// =====================================================
// USER TYPES
// =====================================================

export const USER_TYPES = [
  // Candidats
  { value: 'preparateur', label: 'Préparateur(trice)', description: 'Diplômé(e) BP ou DEUST', category: 'candidate' },
  { value: 'etudiant', label: 'Étudiant(e)', description: 'En cours de formation', category: 'candidate' },
  { value: 'conseiller', label: 'Conseiller(ère)', description: 'Parapharmacie, cosmétique', category: 'candidate' },

  // Recruteurs
  { value: 'titulaire', label: 'Titulaire / Pharmacien', description: 'Gérant de pharmacie', category: 'recruiter' },

  // Nouveaux types
  { value: 'animateur', label: 'Animateur(trice)', description: 'Animation & formation en pharmacie', category: 'freelance' },
  { value: 'laboratoire', label: 'Laboratoire', description: 'Entreprise pharmaceutique B2B', category: 'business' },
];

// Helpers pour filtrer par catégorie
export const getCandidateTypes = () => USER_TYPES.filter(t => t.category === 'candidate');
export const getRecruiterTypes = () => USER_TYPES.filter(t => t.category === 'recruiter');
export const getFreelanceTypes = () => USER_TYPES.filter(t => t.category === 'freelance');
export const getBusinessTypes = () => USER_TYPES.filter(t => t.category === 'business');

// Types qui peuvent recevoir des alertes urgentes
export const ALERT_ELIGIBLE_TYPES = ['preparateur', 'etudiant', 'conseiller', 'animateur'];

// Types qui peuvent publier des offres d'emploi
export const CAN_POST_JOBS = ['titulaire', 'laboratoire'];

// Types qui peuvent créer des missions
export const CAN_CREATE_MISSIONS = ['titulaire', 'laboratoire'];

// Types qui peuvent créer des alertes urgentes
export const CAN_CREATE_URGENT_ALERTS = ['titulaire', 'laboratoire'];


// =====================================================
// OPTIONS GÉNÉRALES
// =====================================================

export const GENDERS = [
  { value: 'male', label: 'Homme' },
  { value: 'female', label: 'Femme' },
  { value: 'other', label: 'Autre' },
];

export const STUDY_LEVELS = [
  { value: '1ere_annee', label: '1ère année' },
  { value: '2eme_annee', label: '2ème année' },
  { value: '3eme_annee', label: '3ème année' },
  { value: '4eme_annee', label: '4ème année' },
  { value: '5eme_annee', label: '5ème année' },
  { value: '6eme_annee', label: '6ème année' },
];

export const CONTRACT_TYPES = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'remplacement', label: 'Remplacement' },
];

export const SPECIALIZATIONS = [
  // Domaines thérapeutiques
  'Oncologie',
  'Diabétologie',
  'Cardiologie',
  'Gériatrie',
  'Pédiatrie',
  'Psychiatrie',
  'Addictologie',
  // Médecines alternatives
  'Homéopathie',
  'Phytothérapie',
  'Aromathérapie',
  'Micronutrition',
  // Univers produits
  'Dermocosmétique',
  'Orthopédie / MAD',
  'Compression / Contention',
  'Nutrition',
  'Puériculture',
  'Hygiène bucco-dentaire',
  'Optique',
  'Vétérinaire',
  // Services
  'Vaccination',
  'TROD / Dépistage',
  'PDA',
  'Éducation thérapeutique',
  'Sevrage tabagique',
  // Secteurs
  'Pharmacie hospitalière',
  'Pharmacie clinique',
  'Industrie pharmaceutique',
  'Urgences',
  'Autre',
];


// =====================================================
// GROUPEMENTS DE PHARMACIES
// =====================================================

export const PHARMACY_GROUPS = [
  // Groupements coopératifs
  { value: 'pharmavie', label: 'PharmaVie', type: 'cooperative' },
  { value: 'giphar', label: 'Giphar', type: 'cooperative' },
  { value: 'pharmactiv', label: 'Pharmactiv', type: 'cooperative' },
  { value: 'alphega', label: 'Alphega Pharmacie', type: 'cooperative' },
  { value: 'welcoop', label: 'Welcoop (ex-Astera)', type: 'cooperative' },
  { value: 'cerp', label: 'CERP', type: 'cooperative' },
  { value: 'phoenix', label: 'Phoenix Pharma', type: 'cooperative' },

  // Enseignes
  { value: 'lafayette', label: 'Pharmacies Lafayette', type: 'enseigne' },
  { value: 'pharmabest', label: 'Pharmabest', type: 'enseigne' },
  { value: 'leadersante', label: 'Leader Santé', type: 'enseigne' },
  { value: 'pharmacie_reference', label: 'Pharmacie Référence', type: 'enseigne' },
  { value: 'citypharma', label: 'CityPharma', type: 'enseigne' },
  { value: 'monge', label: 'Pharmacie Monge', type: 'enseigne' },

  // Groupements régionaux
  { value: 'objectif_pharma', label: 'Objectif Pharma', type: 'regional' },
  { value: 'forum_sante', label: 'Forum Santé', type: 'regional' },
  { value: 'optipharm', label: 'Optipharm', type: 'regional' },

  // Autre
  { value: 'autre', label: 'Autre groupement', type: 'autre' },
  { value: 'independant', label: 'Indépendant (aucun groupement)', type: 'independant' },
];

export const getPharmacyGroupLabel = (value) => {
  const group = PHARMACY_GROUPS.find(g => g.value === value);
  return group?.label || value;
};

export const getPharmacyGroupsByType = (type) => {
  return PHARMACY_GROUPS.filter(g => g.type === type);
};

export const PHARMACY_ENVIRONMENTS = [
  { value: 'urbaine', label: 'Pharmacie urbaine' },
  { value: 'centre_commercial', label: 'Pharmacie centre commercial' },
  { value: 'rurale', label: 'Pharmacie rurale' },
  { value: 'quartier', label: 'Pharmacie de quartier' },
  { value: 'hopital', label: 'Pharmacie hospitalière' },
];

// Helper pour récupérer le label
export const getPharmacyEnvironmentLabel = (value) => {
  const env = PHARMACY_ENVIRONMENTS.find(e => e.value === value);
  return env?.label || value;
};


// =====================================================
// ANIMATEURS - Options spécifiques
// =====================================================

// Spécialités d'animation (validées par Déborah)
export const ANIMATION_SPECIALTIES = [
  { value: 'dermocosmetique', label: 'Dermocosmétique' },
  { value: 'aromatherapie', label: 'Aromathérapie' },
  { value: 'micronutrition', label: 'Micronutrition' },
  { value: 'complements_alimentaires', label: 'Compléments alimentaires' },
  { value: 'hygiene_bucco_dentaire', label: 'Hygiène bucco-dentaire' },
  { value: 'puericulture', label: 'Puériculture' },
  { value: 'orthopedie_mad', label: 'Orthopédie / MAD' },
];

// Marques/Labos courants pour l'expérience
export const KNOWN_BRANDS = [
  'Avène',
  'Bioderma',
  'Caudalie',
  'Eucerin',
  'Filorga',
  'Galenic',
  'La Roche-Posay',
  'Lierac',
  'Nuxe',
  'Pierre Fabre',
  'SVR',
  'Uriage',
  'Vichy',
  // Compléments / Micronutrition
  'Arkopharma',
  'Biocyte',
  'Forté Pharma',
  'Granions',
  'Innéov',
  'Nutergia',
  'Oenobiol',
  'Pileje',
  'Solgar',
  // Aromathérapie
  'Puressentiel',
  'Pranarom',
  'Naturactive',
  'Phytosun Arôms',
  // Autre
  'Autre',
];

// Fourchettes de tarifs journaliers
export const DAILY_RATE_RANGES = [
  { min: 150, max: 200, label: '150-200€/jour' },
  { min: 200, max: 250, label: '200-250€/jour' },
  { min: 250, max: 300, label: '250-300€/jour' },
  { min: 300, max: 350, label: '300-350€/jour' },
  { min: 350, max: 400, label: '350€+/jour' },
];

// Badges animateur selon nombre de missions
export const ANIMATOR_BADGES = [
  { min: 0, max: 0, badge: '🆕', label: 'Nouveau', color: '#9E9E9E' },
  { min: 1, max: 10, badge: '⭐', label: 'Animateur', color: '#FFC107' },
  { min: 11, max: 50, badge: '⭐⭐', label: 'Confirmé', color: '#FF9800' },
  { min: 51, max: 100, badge: '⭐⭐⭐', label: 'Expert', color: '#FF5722' },
  { min: 101, max: Infinity, badge: '🏆', label: 'Top Animateur', color: '#E91E63' },
];

export const getAnimatorBadge = (missionsCompleted) => {
  return ANIMATOR_BADGES.find(b => missionsCompleted >= b.min && missionsCompleted <= b.max) || ANIMATOR_BADGES[0];
};


// =====================================================
// LABORATOIRES - Options spécifiques
// =====================================================

// Catégories de produits labo
export const PRODUCT_CATEGORIES = [
  { value: 'cosmetique', label: 'Cosmétique' },
  { value: 'dermocosmetique', label: 'Dermocosmétique' },
  { value: 'otc', label: 'OTC (médicaments sans ordonnance)' },
  { value: 'complements', label: 'Compléments alimentaires' },
  { value: 'phytotherapie', label: 'Phytothérapie' },
  { value: 'aromatherapie', label: 'Aromathérapie' },
  { value: 'homeopathie', label: 'Homéopathie' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'puericulture', label: 'Puériculture' },
  { value: 'hygiene', label: 'Hygiène' },
  { value: 'materiel_medical', label: 'Matériel médical' },
  { value: 'veterinaire', label: 'Vétérinaire' },
];

// Tiers d'abonnement laboratoire
export const SUBSCRIPTION_TIERS = [
  {
    value: 'free',
    label: 'Gratuit',
    price: 0,
    features: [
      'Consulter les profils animateurs (sans contact)',
      'Voir les pharmacies partenaires',
      'Badge "Labo Vérifié" si SIRET validé',
    ],
    limits: { contacts: 0, missions: 0 },
  },
  {
    value: 'starter',
    label: 'Starter',
    price: 49,
    features: [
      'Contacter 5 animateurs/mois',
      'Publier 1 mission',
      'Ciblage par région',
    ],
    limits: { contacts: 5, missions: 1 },
  },
  {
    value: 'pro',
    label: 'Pro',
    price: 149,
    features: [
      'Contacts et missions illimités',
      'Ciblage avancé (taille pharmacie, spécialités)',
      'Analytics de campagne',
      'Visibilité prioritaire',
      'Badge "Labo Pro"',
    ],
    limits: { contacts: Infinity, missions: Infinity },
  },
  {
    value: 'enterprise',
    label: 'Enterprise',
    price: null, // Sur devis
    features: [
      'Tout Pro +',
      'API intégration CRM/ERP',
      'Multi-utilisateurs',
      'Account manager dédié',
      'Reporting custom',
    ],
    limits: { contacts: Infinity, missions: Infinity },
  },
];

export const getSubscriptionTier = (tierValue) => {
  return SUBSCRIPTION_TIERS.find(t => t.value === tierValue) || SUBSCRIPTION_TIERS[0];
};


// =====================================================
// MISSIONS - Options
// =====================================================

export const MISSION_TYPES = [
  { value: 'animation', label: 'Animation commerciale', icon: 'star', description: 'Animation en point de vente, conseil clients' },
  { value: 'formation', label: 'Formation équipe', icon: 'book', description: 'Former les équipes sur une gamme de produits' },
  { value: 'merchandising', label: 'Merchandising', icon: 'grid', description: 'Mise en rayon, PLV, réimplantation' },
  { value: 'audit', label: 'Audit', icon: 'clipboard', description: 'Audit point de vente, mystery shopping' },
];

export const MISSION_STATUS = [
  { value: 'draft', label: 'Brouillon', color: '#9E9E9E' },
  { value: 'open', label: 'Ouverte', color: '#4CAF50' },
  { value: 'assigned', label: 'Assignée', color: '#2196F3' },
  { value: 'in_progress', label: 'En cours', color: '#FF9800' },
  { value: 'completed', label: 'Terminée', color: '#8BC34A' },
  { value: 'cancelled', label: 'Annulée', color: '#F44336' },
];

export const getMissionStatus = (statusValue) => {
  return MISSION_STATUS.find(s => s.value === statusValue) || MISSION_STATUS[0];
};


// =====================================================
// ALERTES URGENTES - Options
// =====================================================

export const URGENT_ALERT_RADIUS_OPTIONS = [
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: 30, label: '30 km (recommandé)' },
  { value: 50, label: '50 km' },
  { value: 100, label: 'Toute la région' },
];

export const URGENT_ALERT_STATUS = [
  { value: 'active', label: 'Active', color: '#4CAF50' },
  { value: 'filled', label: 'Pourvue', color: '#2196F3' },
  { value: 'expired', label: 'Expirée', color: '#9E9E9E' },
  { value: 'cancelled', label: 'Annulée', color: '#F44336' },
];

// Type de créateur d'alerte
export const ALERT_CREATOR_TYPES = [
  { value: 'pharmacy', label: 'Titulaire', targetTypes: ['preparateur', 'conseiller', 'etudiant'] },
  { value: 'laboratory', label: 'Laboratoire', targetTypes: ['animateur'] },
];


// =====================================================
// REVIEWS - Critères de notation
// =====================================================

export const REVIEW_CRITERIA_ANIMATOR = [
  { key: 'rating_punctuality', label: 'Ponctualité', icon: 'clock' },
  { key: 'rating_professionalism', label: 'Professionnalisme', icon: 'briefcase' },
  { key: 'rating_quality', label: 'Qualité de l\'animation', icon: 'star' },
  { key: 'rating_results', label: 'Atteinte des objectifs', icon: 'target' },
];

export const REVIEW_CRITERIA_CLIENT = [
  { key: 'rating_brief_clarity', label: 'Clarté du brief', icon: 'file-text' },
  { key: 'rating_conditions', label: 'Conditions d\'accueil', icon: 'home' },
  { key: 'rating_payment_respect', label: 'Respect des délais de paiement', icon: 'credit-card' },
];


// =====================================================
// DISPONIBILITÉ ANIMATEUR (Quick win)
// =====================================================

export const AVAILABILITY_DURATIONS = [
  { value: 1, label: '1 jour' },
  { value: 2, label: '2 jours' },
  { value: 3, label: '3 jours' },
  { value: 7, label: '1 semaine' },
  { value: 14, label: '2 semaines' },
  { value: 30, label: '1 mois' },
];