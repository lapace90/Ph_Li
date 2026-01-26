/**
 * Options pour le formulaire de CV structuré - ANIMATEURS
 * Adapté à la logique métier d'animation pharmaceutique
 */

import { generateId } from './cvOptions';

// Types de mission pour le CV animateur
export const ANIMATOR_MISSION_TYPES = [
  { value: 'animation', label: 'Animation commerciale', icon: 'star' },
  { value: 'formation', label: 'Formation équipe', icon: 'book' },
  { value: 'merchandising', label: 'Merchandising', icon: 'grid' },
  { value: 'audit', label: 'Audit / Mystery shopping', icon: 'clipboard' },
];

// Types de pharmacie (contexte mission)
export const PHARMACY_TYPES_FOR_MISSIONS = [
  { value: 'independante', label: 'Pharmacie indépendante' },
  { value: 'groupe', label: 'Pharmacie de groupement' },
  { value: 'centre_commercial', label: 'Pharmacie centre commercial' },
  { value: 'rurale', label: 'Pharmacie rurale' },
  { value: 'quartier', label: 'Pharmacie de quartier' },
  { value: 'parapharmacie', label: 'Parapharmacie' },
  { value: 'hopital', label: 'Pharmacie hospitalière' },
];

// Nombre approximatif de missions
export const MISSION_COUNT_RANGES = [
  { value: '1-5', label: '1 à 5 missions' },
  { value: '6-15', label: '6 à 15 missions' },
  { value: '16-30', label: '16 à 30 missions' },
  { value: '31-50', label: '31 à 50 missions' },
  { value: '50+', label: 'Plus de 50 missions' },
];

// Durée de mission en jours
export const MISSION_DURATIONS = [
  { value: 1, label: '1 jour' },
  { value: 2, label: '2 jours' },
  { value: 3, label: '3 jours' },
  { value: 5, label: '1 semaine' },
  { value: 10, label: '2 semaines' },
  { value: 20, label: '1 mois' },
];

// Structure vide d'un CV animateur
export const EMPTY_ANIMATOR_CV_STRUCTURE = {
  cv_type: 'animator',
  summary: '',
  specialty_title: '',
  current_city: '',
  current_region: '',
  contact_email: '',
  contact_phone: '',
  // Expertise
  brands_experience: [],
  key_missions: [],
  // Formations
  formations: [],
  brand_certifications: [],
  // Compétences
  animation_specialties: [],
  software: [],
  languages: [
    { language: 'francais', level: 'native' },
  ],
  // Tarifs & Mobilité
  daily_rate_min: null,
  daily_rate_max: null,
  mobility_zones: [],
  has_vehicle: false,
  // Visibilité (toggles individuels, pas de mode anonyme global)
  show_photo: false,
  show_rating: true,
  show_contact: false,
};

// Structure vide d'une expérience marque
export const EMPTY_BRAND_EXPERIENCE = {
  id: null,
  brand: '',
  years: null,
  mission_count: null,
  specialties: [],
  description: '',
};

// Structure vide d'une mission marquante
export const EMPTY_KEY_MISSION = {
  id: null,
  source_mission_id: null,
  brand: '',
  mission_type: null,
  pharmacy_type: null,
  city: '',
  region: '',
  date: '',
  duration_days: null,
  description: '',
  results: '',
};

// Structure vide d'une certification marque
export const EMPTY_BRAND_CERTIFICATION = {
  id: null,
  brand: '',
  certification_name: '',
  year: null,
};

// Helpers
export const getMissionTypeLabel = (value) => {
  const type = ANIMATOR_MISSION_TYPES.find(t => t.value === value);
  return type?.label || value;
};

export const getMissionTypeIcon = (value) => {
  const type = ANIMATOR_MISSION_TYPES.find(t => t.value === value);
  return type?.icon || 'briefcase';
};

export const getPharmacyTypeLabel = (value) => {
  const type = PHARMACY_TYPES_FOR_MISSIONS.find(t => t.value === value);
  return type?.label || value;
};

export const getMissionCountLabel = (value) => {
  const range = MISSION_COUNT_RANGES.find(r => r.value === value);
  return range?.label || value;
};

// Helpers pour l'import de missions
export const formatMonthYear = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  const diffMs = end - start;
  const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  return days;
};

export const mapMissionToKeyMission = (mission) => ({
  id: generateId(),
  source_mission_id: mission.id,
  brand: mission.client_profile?.brand_name
    || mission.client_profile?.company_name
    || [mission.client_profile?.first_name, mission.client_profile?.last_name].filter(Boolean).join(' ')
    || '',
  mission_type: mission.mission_type || null,
  pharmacy_type: null,
  city: mission.city || '',
  region: mission.region || '',
  date: formatMonthYear(mission.start_date),
  duration_days: calculateDuration(mission.start_date, mission.end_date),
  description: mission.title + (mission.description ? '\n' + mission.description : ''),
  results: '',
});

export { generateId };
