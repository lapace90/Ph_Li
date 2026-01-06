/**
 * Helpers pour le formatage des dates
 */

/**
 * Formate une date en temps relatif (il y a X minutes, etc.)
 * @param {string|Date} date - Date à formater
 * @returns {string} - Temps relatif en français
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) {
    return 'À l\'instant';
  } else if (diffMinutes < 60) {
    return `Il y a ${diffMinutes} min`;
  } else if (diffHours < 24) {
    return `Il y a ${diffHours}h`;
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  } else if (diffWeeks === 1) {
    return 'Il y a 1 semaine';
  } else if (diffWeeks < 4) {
    return `Il y a ${diffWeeks} semaines`;
  } else if (diffMonths === 1) {
    return 'Il y a 1 mois';
  } else if (diffMonths < 12) {
    return `Il y a ${diffMonths} mois`;
  } else {
    return past.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

/**
 * Formate une date en format court (12 jan.)
 * @param {string|Date} date - Date à formater
 * @returns {string} - Date formatée
 */
export function formatShortDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Formate une date complète
 * @param {string|Date} date - Date à formater
 * @returns {string} - Date formatée
 */
export function formatFullDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

/**
 * Vérifie si une date est aujourd'hui
 * @param {string|Date} date - Date à vérifier
 * @returns {boolean}
 */
export function isToday(date) {
  if (!date) return false;
  
  const today = new Date();
  const d = new Date(date);
  
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

/**
 * Vérifie si une date est cette semaine
 * @param {string|Date} date - Date à vérifier
 * @returns {boolean}
 */
export function isThisWeek(date) {
  if (!date) return false;
  
  const now = new Date();
  const d = new Date(date);
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  
  return diffDays < 7;
}