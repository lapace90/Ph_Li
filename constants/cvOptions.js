/**
 * Options pour le formulaire de CV structuré
 * Secteur pharmaceutique français
 */

// Types de structures pharmaceutiques
export const COMPANY_TYPES = [
  { value: 'pharmacie_independante', label: 'Pharmacie indépendante' },
  { value: 'pharmacie_groupe', label: 'Pharmacie de groupement' },
  { value: 'pharmacie_centre_commercial', label: 'Pharmacie centre commercial' },
  { value: 'pharmacie_rurale', label: 'Pharmacie rurale' },
  { value: 'pharmacie_quartier', label: 'Pharmacie de quartier' },
  { value: 'parapharmacie', label: 'Parapharmacie' },
  { value: 'pharmacie_hopital', label: 'Pharmacie hospitalière' },
  { value: 'pharmacie_clinique', label: 'Pharmacie de clinique' },
  { value: 'groupement', label: 'Groupement / Enseigne' },
  { value: 'centrale_achat', label: 'Centrale d\'achat' },
  { value: 'repartiteur', label: 'Répartiteur pharmaceutique' },
  { value: 'laboratoire', label: 'Laboratoire pharmaceutique' },
  { value: 'industrie', label: 'Industrie pharmaceutique' },
  { value: 'autre', label: 'Autre structure' },
];

// Labels anonymisés pour l'affichage
export const COMPANY_TYPE_ANONYMOUS_LABELS = {
  pharmacie_independante: 'Pharmacie indépendante',
  pharmacie_groupe: 'Pharmacie de groupement',
  pharmacie_centre_commercial: 'Grande pharmacie urbaine',
  pharmacie_rurale: 'Pharmacie rurale',
  pharmacie_quartier: 'Pharmacie de quartier',
  parapharmacie: 'Parapharmacie',
  pharmacie_hopital: 'Établissement hospitalier',
  pharmacie_clinique: 'Établissement de santé privé',
  groupement: 'Groupement pharmaceutique',
  centrale_achat: 'Centrale d\'achat',
  repartiteur: 'Répartiteur pharmaceutique',
  laboratoire: 'Laboratoire pharmaceutique',
  industrie: 'Industrie pharmaceutique',
  autre: 'Structure du secteur pharmaceutique',
};

// Tailles de structure
export const COMPANY_SIZES = [
  { value: 'small', label: 'Petite (< 5 employés)' },
  { value: 'medium', label: 'Moyenne (5-15 employés)' },
  { value: 'large', label: 'Grande (> 15 employés)' },
];

// Types de diplômes
export const DIPLOMA_TYPES = [
  // Préparateur
  { value: 'bp_preparateur', label: 'BP Préparateur en pharmacie', category: 'preparateur' },
  { value: 'deust_preparateur', label: 'DEUST Préparateur en pharmacie', category: 'preparateur' },

  // Pharmacien
  { value: 'docteur_pharmacie', label: 'Docteur en pharmacie', category: 'pharmacien' },
  { value: 'des_pharmacie', label: 'DES Pharmacie', category: 'pharmacien' },

  // Formations complémentaires
  { value: 'du', label: 'Diplôme Universitaire (DU)', category: 'formation' },
  { value: 'diu', label: 'Diplôme Inter-Universitaire (DIU)', category: 'formation' },
  { value: 'master', label: 'Master', category: 'formation' },

  // Conseiller
  { value: 'cap_esthetique', label: 'CAP Esthétique', category: 'conseiller' },
  { value: 'bts_esthetique', label: 'BTS Esthétique-Cosmétique', category: 'conseiller' },
  { value: 'bts_dietetique', label: 'BTS Diététique', category: 'conseiller' },

  // Autre
  { value: 'bac', label: 'Baccalauréat', category: 'general' },
  { value: 'autre', label: 'Autre diplôme', category: 'autre' },
];

// Mentions
export const DIPLOMA_MENTIONS = [
  { value: 'tres_bien', label: 'Très bien' },
  { value: 'bien', label: 'Bien' },
  { value: 'assez_bien', label: 'Assez bien' },
  { value: 'passable', label: 'Passable' },
  { value: 'sans_mention', label: 'Sans mention' },
];

// Compétences par catégorie
export const SKILLS_BY_CATEGORY = {
  comptoir: [
    'Délivrance ordonnances',
    'Conseil pharmaceutique',
    'Conseil associé',
    'Vente additionnelle',
    'Gestion des stupéfiants',
    'Substitution génériques',
  ],
  specialites: [
    'Dermocosmétique',
    'Orthopédie',
    'Maintien à domicile (MAD)',
    'Nutrition / Diététique',
    'Phytothérapie',
    'Aromathérapie',
    'Homéopathie',
    'Puériculture',
    'Hygiène bucco-dentaire',
    'Vétérinaire',
    'Optique',
  ],
  services: [
    'Vaccination',
    'TROD (Tests Rapides)',
    'Entretiens pharmaceutiques',
    'Préparation doses administrer (PDA)',
    'Bilan de médication',
    'Téléconsultation',
    'Dépistage',
  ],
  gestion: [
    'Gestion des stocks',
    'Commandes / Approvisionnement',
    'Réception marchandises',
    'Inventaire',
    'Merchandising / Facing',
    'Gestion caisse',
    'Facturation / Tiers-payant',
  ],
  management: [
    'Management d\'équipe',
    'Formation collaborateurs',
    'Recrutement',
    'Planning / Organisation',
    'Animation d\'équipe',
  ],
  achats: [
    'Négociation fournisseurs',
    'Analyse des marges',
    'Sourcing',
    'Gestion des génériques',
    'Achats groupements',
  ],
};

// Liste plate de toutes les compétences
export const ALL_SKILLS = Object.values(SKILLS_BY_CATEGORY).flat();

// Logiciels pharmaceutiques
export const SOFTWARE_OPTIONS = [
  // LGO (Logiciels de Gestion d'Officine)
  { value: 'lgpi', label: 'LGPI (Pharmagest)', category: 'lgo' },
  { value: 'winpharma', label: 'Winpharma', category: 'lgo' },
  { value: 'leo', label: 'LEO (Isipharm)', category: 'lgo' },
  { value: 'alliance_plus', label: 'Alliance Plus', category: 'lgo' },
  { value: 'smart_rx', label: 'Smart Rx', category: 'lgo' },
  { value: 'pharmaland', label: 'Pharmaland', category: 'lgo' },
  { value: 'pharmavitale', label: 'Pharmavitale', category: 'lgo' },
  { value: 'caduciel', label: 'Caduciel', category: 'lgo' },

  // Robots
  { value: 'robot_rowa', label: 'Robot ROWA', category: 'automate' },
  { value: 'robot_mekapharm', label: 'Robot Mekapharm', category: 'automate' },
  { value: 'robot_pharmathek', label: 'Robot Pharmathek', category: 'automate' },
  { value: 'robot_apostore', label: 'Robot Apostore', category: 'automate' },

  // Autres
  { value: 'excel', label: 'Excel', category: 'bureautique' },
  { value: 'word', label: 'Word', category: 'bureautique' },
  { value: 'teams', label: 'Microsoft Teams', category: 'bureautique' },
];

// Certifications / Habilitations
export const CERTIFICATIONS = [
  { value: 'vaccination_grippe', label: 'Vaccination anti-grippale' },
  { value: 'vaccination_covid', label: 'Vaccination COVID-19' },
  { value: 'vaccination_elargie', label: 'Vaccination élargie (15 valences)' },
  { value: 'trod_angine', label: 'TROD Angine' },
  { value: 'trod_cystite', label: 'TROD Infection urinaire' },
  { value: 'trod_grippe', label: 'TROD Grippe' },
  { value: 'trod_covid', label: 'TROD COVID-19' },
  { value: 'entretien_asthme', label: 'Entretien asthme' },
  { value: 'entretien_diabete', label: 'Entretien diabète' },
  { value: 'entretien_aoc', label: 'Entretien AOC' },
  { value: 'bilan_medication', label: 'Bilan partagé de médication' },
  { value: 'pda', label: 'PDA - Préparation des doses' },
  { value: 'premiers_secours', label: 'Formation premiers secours (PSC1/SST)' },
  { value: 'gestes_urgence', label: 'Gestes d\'urgence' },
  { value: 'orthese', label: 'Orthèses / Contention' },
  { value: 'mad', label: 'Maintien à domicile' },
];

// Langues
export const LANGUAGES = [
  { value: 'francais', label: 'Français' },
  { value: 'anglais', label: 'Anglais' },
  { value: 'espagnol', label: 'Espagnol' },
  { value: 'allemand', label: 'Allemand' },
  { value: 'italien', label: 'Italien' },
  { value: 'portugais', label: 'Portugais' },
  { value: 'arabe', label: 'Arabe' },
  { value: 'chinois', label: 'Chinois' },
  { value: 'russe', label: 'Russe' },
  { value: 'japonais', label: 'Japonais' },
  { value: 'autre', label: 'Autre' },
];

// Niveaux de langue
export const LANGUAGE_LEVELS = [
  { value: 'native', label: 'Langue maternelle' },
  { value: 'fluent', label: 'Courant / Bilingue' },
  { value: 'advanced', label: 'Avancé (C1)' },
  { value: 'intermediate', label: 'Intermédiaire (B1-B2)' },
  { value: 'beginner', label: 'Débutant (A1-A2)' },
];

// Régions françaises
export const REGIONS = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  'Provence-Alpes-Côte d\'Azur',
  'Guadeloupe',
  'Martinique',
  'Guyane',
  'La Réunion',
  'Mayotte',
];

// Structure vide d'un CV
export const EMPTY_CV_STRUCTURE = {
  summary: '',
  profession_title: '', // Titre de profession recherchée (affiché en en-tête)
  current_city: '',     // Ville actuelle du candidat
  current_region: '',   // Région actuelle du candidat
  contact_email: '',    // Email de contact pour ce CV (optionnel)
  contact_phone: '',    // Téléphone de contact pour ce CV (optionnel)
  experiences: [],
  formations: [],
  skills: [],
  software: [],
  certifications: [],
  languages: [
    { language: 'francais', level: 'native' },
  ],
};

// Structure vide d'une expérience
export const EMPTY_EXPERIENCE = {
  id: null,
  job_title: '',
  company_name: '',
  company_type: null,
  company_size: null,
  city: '',
  region: '',
  start_date: '',
  end_date: null,
  is_current: false,
  description: '',
  skills: [],
};

// Structure vide d'une formation
export const EMPTY_FORMATION = {
  id: null,
  diploma_type: null,
  diploma_name: '',
  school_name: '',
  school_city: '',
  school_region: '',
  year: null,
  mention: null,
};

// Générer un ID unique
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};