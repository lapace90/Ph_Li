// Options centralisées pour les profils candidats et recruteurs

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

export const USER_TYPES = [
  { value: 'preparateur', label: 'Préparateur(trice)', description: 'Diplômé(e) BP ou DEUST' },
  { value: 'pharmacien', label: 'Pharmacien(ne)', description: 'Diplômé(e) en pharmacie' },
  { value: 'etudiant', label: 'Étudiant(e)', description: 'En cours de formation' },
  { value: 'conseiller', label: 'Conseiller(ère)', description: 'Parapharmacie, cosmétique' },
  { value: 'titulaire', label: 'Titulaire / Recruteur', description: 'Gérant de pharmacie' },
];

export const CONTRACT_TYPES = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'remplacement', label: 'Remplacement' },
];