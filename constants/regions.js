// constants/regions.js
// Coordonnées des régions pour la carte interactive

// Vue initiale France métropolitaine
export const FRANCE_METRO = {
  latitude: 46.603354,
  longitude: 1.888334,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

// DOM-TOM avec leurs coordonnées
export const DOM_TOM = {
  guadeloupe: {
    name: 'Guadeloupe',
    code: '971',
    latitude: 16.265,
    longitude: -61.551,
    latitudeDelta: 0.8,
    longitudeDelta: 0.8,
  },
  martinique: {
    name: 'Martinique',
    code: '972',
    latitude: 14.641,
    longitude: -61.024,
    latitudeDelta: 0.6,
    longitudeDelta: 0.6,
  },
  guyane: {
    name: 'Guyane',
    code: '973',
    latitude: 3.933,
    longitude: -53.125,
    latitudeDelta: 5,
    longitudeDelta: 5,
  },
  reunion: {
    name: 'La Réunion',
    code: '974',
    latitude: -21.115,
    longitude: 55.536,
    latitudeDelta: 0.6,
    longitudeDelta: 0.6,
  },
  mayotte: {
    name: 'Mayotte',
    code: '976',
    latitude: -12.827,
    longitude: 45.166,
    latitudeDelta: 0.3,
    longitudeDelta: 0.3,
  },
};

// Liste pour le sélecteur
export const REGION_OPTIONS = [
  { key: 'metro', name: 'France métropolitaine', ...FRANCE_METRO },
  { key: 'guadeloupe', ...DOM_TOM.guadeloupe },
  { key: 'martinique', ...DOM_TOM.martinique },
  { key: 'guyane', ...DOM_TOM.guyane },
  { key: 'reunion', ...DOM_TOM.reunion },
  { key: 'mayotte', ...DOM_TOM.mayotte },
];

// Régions métropolitaines pour filtrage
export const METRO_REGIONS = [
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
];

// Vérifier si un département est dans les DOM-TOM
export const isDomTom = (departmentCode) => {
  const domCodes = ['971', '972', '973', '974', '976'];
  return domCodes.includes(departmentCode?.toString());
};

// Obtenir la région DOM-TOM par code département
export const getDomTomByCode = (departmentCode) => {
  const code = departmentCode?.toString();
  return Object.values(DOM_TOM).find(d => d.code === code);
};

// Zoom levels
export const ZOOM_LEVELS = {
  country: { latitudeDelta: 10, longitudeDelta: 10 },
  region: { latitudeDelta: 3, longitudeDelta: 3 },
  department: { latitudeDelta: 1, longitudeDelta: 1 },
  city: { latitudeDelta: 0.1, longitudeDelta: 0.1 },
  street: { latitudeDelta: 0.01, longitudeDelta: 0.01 },
};