import { COMPANY_TYPE_ANONYMOUS_LABELS } from '../constants/cvOptions';

/**
 * Anonymise un CV structuré pour affichage public
 * Masque : noms d'entreprises, villes exactes, noms d'écoles
 * Garde : régions, durées, compétences, types de structures
 */

/**
 * Anonymise complètement un CV
 * @param {Object} structuredData - Données structurées du CV
 * @param {Object} profile - Profil utilisateur (prénom, etc.)
 * @returns {Object} CV anonymisé
 */
export const anonymizeCV = (structuredData, profile = {}) => {
  if (!structuredData) return null;

  return {
    // Identité anonymisée
    display_name: profile.first_name || 'Candidat',
    location: profile.current_region || 'France',

    // Résumé nettoyé
    summary: cleanPersonalInfo(structuredData.summary),

    // Expériences anonymisées
    experiences: (structuredData.experiences || []).map(anonymizeExperience),

    // Formations anonymisées
    formations: (structuredData.formations || []).map(anonymizeFormation),

    // Ces données restent intactes
    skills: structuredData.skills || [],
    software: structuredData.software || [],
    certifications: structuredData.certifications || [],
    languages: structuredData.languages || [],

    // Données calculées (pour matching)
    computed: structuredData.computed || {},
  };
};

/**
 * Anonymise une expérience
 */
const anonymizeExperience = (exp) => {
  const startDate = exp.start_date ? new Date(exp.start_date + '-01') : null;
  const endDate = exp.end_date ? new Date(exp.end_date + '-01') : new Date();

  return {
    job_title: exp.job_title,
    company_display: getAnonymousCompanyLabel(exp.company_type),
    company_size: exp.company_size,
    location_display: exp.region || 'France',
    period: formatPeriod(exp.start_date, exp.end_date, exp.is_current),
    duration: calculateDuration(startDate, endDate),
    description: cleanPersonalInfo(exp.description),
    skills: exp.skills || [],
    is_current: exp.is_current,
    // Champs MASQUÉS : company_name, city
  };
};

/**
 * Anonymise une formation
 */
const anonymizeFormation = (form) => {
  return {
    diploma_type: form.diploma_type,
    diploma_name: form.diploma_name,
    year: form.year,
    mention: form.mention,
    region: form.school_region || 'France',
    // Champs MASQUÉS : school_name, school_city
  };
};

/**
 * Retourne le label anonymisé d'un type de structure
 */
const getAnonymousCompanyLabel = (companyType) => {
  return COMPANY_TYPE_ANONYMOUS_LABELS[companyType] || 'Structure pharmaceutique';
};

/**
 * Nettoie les informations personnelles dans un texte libre
 * Masque : noms de pharmacies, codes postaux, téléphones, emails
 */
const cleanPersonalInfo = (text) => {
  if (!text) return '';

  let cleaned = text;

  // Patterns à masquer
  const patterns = [
    // Noms de pharmacies courants
    { regex: /\bPharmacie\s+[A-Z][a-zéèêëàâäîïôöùûü]+(?:\s+[A-Z][a-zéèêëàâäîïôöùûü]+)*/g, replacement: 'Pharmacie [confidentiel]' },
    { regex: /\b[A-Z][a-zéèêëàâäîïôöùûü]+\s+Pharma(?:cie)?\b/g, replacement: '[confidentiel]' },
    
    // Codes postaux
    { regex: /\b\d{5}\b/g, replacement: '' },
    
    // Numéros de téléphone
    { regex: /\b0[1-9](?:[\s.-]?\d{2}){4}\b/g, replacement: '[téléphone masqué]' },
    { regex: /\+33\s?\d(?:[\s.-]?\d{2}){4}/g, replacement: '[téléphone masqué]' },
    
    // Emails
    { regex: /\b[\w.-]+@[\w.-]+\.\w{2,}\b/gi, replacement: '[email masqué]' },
    
    // Adresses avec numéro
    { regex: /\b\d{1,4}(?:bis|ter)?\s+(?:rue|avenue|boulevard|place|allée|impasse|chemin)\s+[A-Za-zéèêëàâäîïôöùûü\s-]+/gi, replacement: '' },
  ];

  patterns.forEach(({ regex, replacement }) => {
    cleaned = cleaned.replace(regex, replacement);
  });

  // Nettoyer les espaces multiples
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
};

/**
 * Formate une période (ex: "Mars 2020 - Présent")
 */
const formatPeriod = (startDate, endDate, isCurrent) => {
  if (!startDate) return '';

  const formatMonth = (dateStr) => {
    const [year, month] = dateStr.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  };

  const start = formatMonth(startDate);

  if (isCurrent || !endDate) {
    return `${start} - Présent`;
  }

  return `${start} - ${formatMonth(endDate)}`;
};

/**
 * Calcule la durée entre deux dates
 */
const calculateDuration = (startDate, endDate) => {
  if (!startDate) return '';

  const end = endDate || new Date();
  const months = (end.getFullYear() - startDate.getFullYear()) * 12 
                 + (end.getMonth() - startDate.getMonth());

  if (months < 1) return 'Moins d\'1 mois';
  if (months < 12) return `${months} mois`;
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) {
    return `${years} an${years > 1 ? 's' : ''}`;
  }
  
  return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
};

/**
 * Calcule l'expérience totale à partir des expériences
 */
export const calculateTotalExperience = (experiences = []) => {
  let totalMonths = 0;

  experiences.forEach(exp => {
    if (!exp.start_date) return;

    const startDate = new Date(exp.start_date + '-01');
    const endDate = exp.end_date 
      ? new Date(exp.end_date + '-01') 
      : new Date();

    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 
                   + (endDate.getMonth() - startDate.getMonth());
    
    totalMonths += Math.max(0, months);
  });

  return {
    months: totalMonths,
    years: Math.floor(totalMonths / 12),
    formatted: formatDurationFromMonths(totalMonths),
  };
};

const formatDurationFromMonths = (months) => {
  if (months < 1) return 'Débutant';
  if (months < 12) return `${months} mois`;
  
  const years = Math.floor(months / 12);
  if (years < 2) return '1 an';
  if (years < 5) return `${years} ans`;
  if (years < 10) return '5+ ans';
  return '10+ ans';
};

/**
 * Extrait les compétences principales (les plus fréquentes)
 */
export const extractMainSkills = (structuredData, maxSkills = 5) => {
  const skillCounts = {};

  // Compter les skills des expériences
  (structuredData.experiences || []).forEach(exp => {
    (exp.skills || []).forEach(skill => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
  });

  // Ajouter les skills globales
  (structuredData.skills || []).forEach(skill => {
    skillCounts[skill] = (skillCounts[skill] || 0) + 1;
  });

  // Trier par fréquence et retourner les top
  return Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxSkills)
    .map(([skill]) => skill);
};

/**
 * Vérifie si le CV est complet (pour badge/indicateur)
 */
export const getCVCompleteness = (structuredData) => {
  if (!structuredData) return { percent: 0, missing: ['Tout'] };

  const checks = [
    { key: 'summary', label: 'Résumé', weight: 10 },
    { key: 'experiences', label: 'Expériences', weight: 30, isArray: true },
    { key: 'formations', label: 'Formations', weight: 20, isArray: true },
    { key: 'skills', label: 'Compétences', weight: 20, isArray: true, minItems: 3 },
    { key: 'software', label: 'Logiciels', weight: 10, isArray: true },
    { key: 'certifications', label: 'Certifications', weight: 5, isArray: true },
    { key: 'languages', label: 'Langues', weight: 5, isArray: true },
  ];

  let totalWeight = 0;
  let earnedWeight = 0;
  const missing = [];

  checks.forEach(({ key, label, weight, isArray, minItems = 1 }) => {
    totalWeight += weight;
    const value = structuredData[key];

    if (isArray) {
      if (Array.isArray(value) && value.length >= minItems) {
        earnedWeight += weight;
      } else {
        missing.push(label);
      }
    } else {
      if (value && value.trim && value.trim().length > 0) {
        earnedWeight += weight;
      } else {
        missing.push(label);
      }
    }
  });

  return {
    percent: Math.round((earnedWeight / totalWeight) * 100),
    missing,
  };
};