// Utilitaires pour le formatage des dates

/**
 * Formate une date relative (il y a X temps)
 */
export const formatDistanceToNow = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const target = new Date(date);
  const diffMs = now - target;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return "à l'instant";
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays === 1) return 'hier';
  if (diffDays < 7) return `il y a ${diffDays} jours`;
  if (diffWeeks === 1) return 'il y a 1 semaine';
  if (diffWeeks < 4) return `il y a ${diffWeeks} semaines`;
  if (diffMonths === 1) return 'il y a 1 mois';
  if (diffMonths < 12) return `il y a ${diffMonths} mois`;
  
  return target.toLocaleDateString('fr-FR');
};

/**
 * Formate une date en français
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  
  return new Date(date).toLocaleDateString('fr-FR', { ...defaultOptions, ...options });
};

/**
 * Formate une date courte (ex: 15 janv.)
 */
export const formatDateShort = (date) => {
  if (!date) return '';
  
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
};

/**
 * Formate une plage de dates
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate) return 'Dates flexibles';
  
  const start = formatDateShort(startDate);
  
  if (!endDate) return start;
  
  const end = formatDateShort(endDate);
  return `${start} → ${end}`;
};

/**
 * Formate une heure
 */
export const formatTime = (date) => {
  if (!date) return '';
  
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formate une date et heure
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  return new Date(date).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Vérifie si une date est dans le passé
 */
export const isPast = (date) => {
  if (!date) return false;
  return new Date(date) < new Date();
};

/**
 * Vérifie si une date est aujourd'hui
 */
export const isToday = (date) => {
  if (!date) return false;
  const today = new Date();
  const target = new Date(date);
  return (
    target.getDate() === today.getDate() &&
    target.getMonth() === today.getMonth() &&
    target.getFullYear() === today.getFullYear()
  );
};

/**
 * Calcule le nombre de jours entre deux dates
 */
export const daysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end - start;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Retourne "aujourd'hui", "demain" ou la date formatée
 */
export const formatRelativeDate = (date) => {
  if (!date) return '';
  
  const target = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (isToday(date)) return "Aujourd'hui";
  
  if (
    target.getDate() === tomorrow.getDate() &&
    target.getMonth() === tomorrow.getMonth() &&
    target.getFullYear() === tomorrow.getFullYear()
  ) {
    return 'Demain';
  }
  
  return formatDateShort(date);
};