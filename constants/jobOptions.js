/**
 * Options pour les annonces d'emploi et stages
 * Aligné sur les enums Supabase
 */

// ============================================
// ENUMS JOB OFFERS
// ============================================

// position_type enum
export const POSITION_TYPES = [
  { value: 'preparateur', label: 'Préparateur(trice) en pharmacie' },
  { value: 'pharmacien_adjoint', label: 'Pharmacien(ne) adjoint(e)' },
  { value: 'pharmacien_gerant', label: 'Pharmacien(ne) gérant(e)' },
  { value: 'conseiller', label: 'Conseiller(ère) en parapharmacie' },
];

// contract_type enum
export const CONTRACT_TYPES = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'remplacement', label: 'Remplacement' },
  { value: 'stage', label: 'Stage' },
  { value: 'alternance', label: 'Alternance' },
];

// contract_type pour employés uniquement (pas stage/alternance)
export const EMPLOYEE_CONTRACT_TYPES = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'remplacement', label: 'Remplacement' },
];

// content_status enum (pour job_offers et internship_offers)
export const CONTENT_STATUS = {
  active: { label: 'Active', color: 'success' },
  inactive: { label: 'Inactive', color: 'gray' },
  filled: { label: 'Pourvue', color: 'secondary' },
  closed: { label: 'Clôturée', color: 'rose' },
  sold: { label: 'Vendue', color: 'success' },    // pour pharmacy_listings
  rented: { label: 'Louée', color: 'success' },   // pour pharmacy_listings
};

// ============================================
// ENUMS INTERNSHIP OFFERS
// ============================================

// internship_type enum
export const INTERNSHIP_TYPES = [
  { value: 'stage', label: 'Stage' },
  { value: 'alternance', label: 'Alternance' },
];

// Niveaux d'études requis (required_level - varchar)
export const STUDY_LEVELS = [
  { value: '1ere_annee', label: '1ère année pharmacie' },
  { value: '2eme_annee', label: '2ème année pharmacie' },
  { value: '3eme_annee', label: '3ème année pharmacie' },
  { value: '4eme_annee', label: '4ème année pharmacie' },
  { value: '5eme_annee', label: '5ème année pharmacie' },
  { value: '6eme_annee', label: '6ème année pharmacie' },
  { value: 'bp_preparateur', label: 'BP Préparateur' },
  { value: 'deust', label: 'DEUST Préparateur' },
];

// Durées de stage (max 6 mois)
export const STAGE_DURATIONS = [
  { value: 1, label: '1 mois' },
  { value: 2, label: '2 mois' },
  { value: 3, label: '3 mois' },
  { value: 4, label: '4 mois' },
  { value: 5, label: '5 mois' },
  { value: 6, label: '6 mois' },
];

// Durées d'alternance
export const ALTERNANCE_DURATIONS = [
  { value: 6, label: '6 mois' },
  { value: 12, label: '12 mois (1 an)' },
  { value: 24, label: '24 mois (2 ans)' },
  { value: 36, label: '36 mois (3 ans)' },
];

// Pour rétrocompatibilité
export const INTERNSHIP_DURATIONS = [...STAGE_DURATIONS, ...ALTERNANCE_DURATIONS.filter(d => d.value > 6)];

// ============================================
// ENUMS MATCHING
// ============================================

// match_status enum
export const MATCH_STATUS = {
  pending: { label: 'En attente', color: 'gray' },
  liked_by_candidate: { label: 'Liké par le candidat', color: 'warning' },
  liked_by_employer: { label: 'Liké par l\'employeur', color: 'warning' },
  matched: { label: 'Match !', color: 'success' },
  rejected: { label: 'Refusé', color: 'rose' },
};

// application_status enum
export const APPLICATION_STATUS = {
  pending: { label: 'En attente', color: 'warning' },
  viewed: { label: 'Consultée', color: 'secondary' },
  shortlisted: { label: 'Présélectionnée', color: 'primary' },
  rejected: { label: 'Refusée', color: 'rose' },
  accepted: { label: 'Acceptée', color: 'success' },
};

// ============================================
// OPTIONS COMMUNES
// ============================================

// Tranches de salaire (salary_range - varchar libre)
export const SALARY_RANGES = [
  { value: 'smic', label: 'SMIC' },
  { value: '1800-2200', label: '1 800 € - 2 200 €' },
  { value: '2200-2600', label: '2 200 € - 2 600 €' },
  { value: '2600-3200', label: '2 600 € - 3 200 €' },
  { value: '3200-4000', label: '3 200 € - 4 000 €' },
  { value: '4000-5000', label: '4 000 € - 5 000 €' },
  { value: '5000+', label: '+ de 5 000 €' },
  { value: 'negociable', label: 'À négocier' },
];

// Rémunération stages (gratuit si ≤ 2 mois, obligatoire si > 2 mois)
export const STAGE_REMUNERATIONS = [
  { value: 'gratuit', label: 'Non rémunéré (≤ 2 mois)' },
  { value: 'legal_minimum', label: 'Gratification minimale légale' },
  { value: 'above_minimum', label: 'Supérieur au minimum légal' },
];

// Rémunération alternances (toujours rémunéré, fixé par l'État selon l'âge)
export const ALTERNANCE_REMUNERATIONS = [
  { value: 'legal_minimum', label: 'Minimum légal (selon âge)' },
  { value: 'above_minimum', label: 'Supérieur au minimum légal' },
  { value: 'to_define', label: 'À définir selon profil' },
];

// Pour rétrocompatibilité
export const INTERNSHIP_REMUNERATIONS = ALTERNANCE_REMUNERATIONS;

// Niveaux d'expérience requis (required_experience - integer)
export const EXPERIENCE_LEVELS = [
  { value: 0, label: 'Débutant accepté' },
  { value: 1, label: '1 an minimum' },
  { value: 2, label: '2 ans minimum' },
  { value: 3, label: '3 ans minimum' },
  { value: 5, label: '5 ans minimum' },
  { value: 10, label: '10 ans minimum' },
];

// Diplômes (required_diplomas jsonb / diplomas jsonb)
export const DIPLOMA_OPTIONS = [
  { value: 'bp_preparateur', label: 'BP Préparateur en pharmacie' },
  { value: 'deust_preparateur', label: 'DEUST Préparateur en pharmacie' },
  { value: 'docteur_pharmacie', label: 'Docteur en pharmacie' },
  { value: 'des_pharmacie', label: 'DES Pharmacie' },
  { value: 'du', label: 'Diplôme Universitaire (DU)' },
  { value: 'cap_esthetique', label: 'CAP Esthétique' },
  { value: 'bts_esthetique', label: 'BTS Esthétique-Cosmétique' },
  { value: 'bts_dietetique', label: 'BTS Diététique' },
];

// Avantages proposés (pour emplois, stages et alternances)
export const BENEFITS = [
  { value: 'tickets_restaurant', label: 'Tickets restaurant' },
  { value: 'transport', label: 'Prise en charge transport' },
  { value: 'mutuelle', label: 'Mutuelle avantageuse' },
  { value: 'prime_interessement', label: 'Prime d\'intéressement' },
  { value: 'prime_annuelle', label: 'Prime annuelle' },
  { value: '13eme_mois', label: '13ème mois' },
  { value: 'formation', label: 'Formations financées' },
  { value: 'parking', label: 'Parking gratuit' },
  { value: 'teletravail', label: 'Télétravail possible' },
  { value: 'horaires_flexibles', label: 'Horaires flexibles' },
  { value: 'ce', label: 'Comité d\'entreprise' },
];

// ============================================
// STRUCTURES VIDES
// ============================================

// Structure vide d'une annonce emploi
export const EMPTY_JOB_OFFER = {
  title: '',
  description: '',
  contract_type: null,
  position_type: null,
  salary_range: null,
  benefits: [],
  latitude: null,
  longitude: null,
  address: '',
  city: '',
  postal_code: '',
  region: '',
  department: '',
  required_experience: null,
  required_diplomas: [],
  start_date: null,
  status: 'active',
};

// Structure vide d'une annonce stage/alternance
export const EMPTY_INTERNSHIP_OFFER = {
  title: '',
  description: '',
  type: null, // 'stage' ou 'alternance'
  duration_months: null,
  remuneration: null, // Dépend du type et de la durée
  benefits: [],
  required_level: null,
  start_date: null,
  latitude: null,
  longitude: null,
  city: '',
  postal_code: '',
  region: '',
  department: '',
  status: 'active',
};

// ============================================
// HELPERS
// ============================================

export const getPositionTypeLabel = (value) => {
  return POSITION_TYPES.find(t => t.value === value)?.label || value;
};

export const getContractTypeLabel = (value) => {
  return CONTRACT_TYPES.find(t => t.value === value)?.label || value;
};

export const getSalaryRangeLabel = (value) => {
  return SALARY_RANGES.find(s => s.value === value)?.label || value;
};

export const getExperienceLabel = (value) => {
  if (value === null || value === undefined) return 'Non spécifié';
  const level = EXPERIENCE_LEVELS.find(e => e.value === value);
  return level?.label || `${value} ans minimum`;
};

export const getDiplomaLabel = (value) => {
  return DIPLOMA_OPTIONS.find(d => d.value === value)?.label || value;
};

export const getInternshipTypeLabel = (value) => {
  return INTERNSHIP_TYPES.find(t => t.value === value)?.label || value;
};

export const getStudyLevelLabel = (value) => {
  return STUDY_LEVELS.find(l => l.value === value)?.label || value;
};

export const getContentStatusInfo = (status) => {
  return CONTENT_STATUS[status] || { label: status, color: 'gray' };
};

export const getMatchStatusInfo = (status) => {
  return MATCH_STATUS[status] || { label: status, color: 'gray' };
};

export const getApplicationStatusInfo = (status) => {
  return APPLICATION_STATUS[status] || { label: status, color: 'gray' };
};

export const getContractColor = (type) => {
  const colors = {
    CDI: '#38A169',
    CDD: '#2E7D8F',
    vacation: '#DD6B20',
    remplacement: '#009B72',
    stage: '#2E7D8F',
    alternance: '#009B72',
  };
  return colors[type] || '#718096';
};

export const getInternshipColor = (type) => {
  return type === 'alternance' ? '#009B72' : '#2E7D8F';
};

export const getBenefitLabel = (value) => {
  return BENEFITS.find(b => b.value === value)?.label || value;
};

export const getRemunerationLabel = (value, type = 'alternance') => {
  const options = type === 'stage' ? STAGE_REMUNERATIONS : ALTERNANCE_REMUNERATIONS;
  return options.find(r => r.value === value)?.label || value;
};

// Vérifie si la rémunération est obligatoire pour un stage
export const isRemunerationRequired = (type, durationMonths) => {
  if (type === 'alternance') return true;
  return durationMonths > 2;
};

// Obtient le label de durée
export const getDurationLabel = (months, type = null) => {
  const durations = type === 'stage' ? STAGE_DURATIONS : type === 'alternance' ? ALTERNANCE_DURATIONS : [...STAGE_DURATIONS, ...ALTERNANCE_DURATIONS];
  return durations.find(d => d.value === months)?.label || `${months} mois`;
};

// Formate la date de début pour l'affichage
// null ou 'asap' = "Dès que possible"
export const formatStartDate = (value) => {
  if (!value || value === 'asap') return 'Dès que possible';
  
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }
  } catch (e) {}
  
  return value;
};