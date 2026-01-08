// helpers/displayName.js

/**
 * Retourne le nom à afficher selon le mode de confidentialité
 * 
 * Mode public : "Marie Durand"
 * Mode anonyme avec nickname : "PharmaPro75"
 * Mode anonyme sans nickname : "Marie"
 * 
 * @param {Object} profile - Le profil utilisateur (first_name, last_name, nickname)
 * @param {boolean} isAnonymous - true si mode anonyme, false si mode public
 * @returns {string} Le nom à afficher
 */
export const getDisplayName = (profile, isAnonymous = false) => {
  if (!profile) return 'Utilisateur';
  
  // Mode public → nom complet
  if (!isAnonymous) {
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return fullName || 'Utilisateur';
  }
  
  // Mode anonyme → nickname ou prénom seul
  if (profile.nickname) {
    return profile.nickname;
  }
  
  return profile.first_name || 'Utilisateur';
};

/**
 * Retourne le nom à afficher à partir des paramètres de confidentialité
 * Utile quand on a accès aux privacy settings
 * 
 * @param {Object} profile - Le profil utilisateur
 * @param {Object} privacy - Les paramètres de confidentialité (show_full_name)
 * @returns {string} Le nom à afficher
 */
export const getDisplayNameFromPrivacy = (profile, privacy) => {
  const isAnonymous = !privacy?.show_full_name;
  return getDisplayName(profile, isAnonymous);
};

/**
 * Retourne les initiales pour l'avatar
 * 
 * @param {Object} profile - Le profil utilisateur
 * @param {boolean} isAnonymous - true si mode anonyme
 * @returns {string} Les initiales (1-2 caractères)
 */
export const getInitials = (profile, isAnonymous = false) => {
  const name = getDisplayName(profile, isAnonymous);
  const parts = name.split(' ').filter(p => p.length > 0);
  
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  
  return name.substring(0, 2).toUpperCase();
};