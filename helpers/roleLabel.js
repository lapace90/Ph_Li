// Helper pour obtenir les labels des rôles utilisateur

const ROLE_LABELS = {
  preparateur: 'Préparateur(trice)',
  titulaire: 'Titulaire / Pharmacien',
  conseiller: 'Conseiller(ère)',
  etudiant: 'Étudiant(e)',
  animateur: 'Animateur(trice)',
  laboratoire: 'Laboratoire',
};

const ROLE_LABELS_SHORT = {
  preparateur: 'Préparateur',
  titulaire: 'Titulaire',
  conseiller: 'Conseiller',
  etudiant: 'Étudiant',
  animateur: 'Animateur',
  laboratoire: 'Laboratoire',
};

const ROLE_DESCRIPTIONS = {
  preparateur: 'Diplômé(e) BP ou DEUST',
  titulaire: 'Gérant de pharmacie',
  conseiller: 'Parapharmacie, cosmétique',
  etudiant: 'En cours de formation',
  animateur: 'Animation & formation en pharmacie',
  laboratoire: 'Entreprise pharmaceutique B2B',
};

const ROLE_ICONS = {
  preparateur: 'briefcase',
  titulaire: 'user',
  conseiller: 'users',
  etudiant: 'book',
  animateur: 'star',
  laboratoire: 'building',
};

/**
 * Retourne le label complet d'un rôle
 * @param {string} role - Le code du rôle (ex: 'preparateur')
 * @returns {string} Le label (ex: 'Préparateur(trice)')
 */
export const getRoleLabel = (role) => {
  return ROLE_LABELS[role] || role;
};

/**
 * Retourne le label court d'un rôle
 * @param {string} role - Le code du rôle
 * @returns {string} Le label court (ex: 'Préparateur')
 */
export const getRoleLabelShort = (role) => {
  return ROLE_LABELS_SHORT[role] || role;
};

/**
 * Retourne la description d'un rôle
 * @param {string} role - Le code du rôle
 * @returns {string} La description
 */
export const getRoleDescription = (role) => {
  return ROLE_DESCRIPTIONS[role] || '';
};

/**
 * Retourne l'icône associée à un rôle
 * @param {string} role - Le code du rôle
 * @returns {string} Le nom de l'icône
 */
export const getRoleIcon = (role) => {
  return ROLE_ICONS[role] || 'user';
};

/**
 * Vérifie si un rôle est un candidat (peut chercher un emploi)
 * @param {string} role - Le code du rôle
 * @returns {boolean}
 */
export const isCandidate = (role) => {
  return ['preparateur', 'etudiant', 'conseiller'].includes(role);
};

/**
 * Vérifie si un rôle est un recruteur (peut publier des offres)
 * @param {string} role - Le code du rôle
 * @returns {boolean}
 */
export const isRecruiter = (role) => {
  return ['titulaire', 'laboratoire'].includes(role);
};

/**
 * Vérifie si un rôle est un freelance (animateur)
 * @param {string} role - Le code du rôle
 * @returns {boolean}
 */
export const isFreelance = (role) => {
  return role === 'animateur';
};

/**
 * Vérifie si un rôle est une entreprise (laboratoire)
 * @param {string} role - Le code du rôle
 * @returns {boolean}
 */
export const isBusiness = (role) => {
  return role === 'laboratoire';
};

/**
 * Alias de isBusiness pour clarté sémantique
 */
export const isLaboratory = (role) => {
  return role === 'laboratoire';
};

/**
 * Vérifie si un rôle peut recevoir des alertes urgentes
 * @param {string} role - Le code du rôle
 * @returns {boolean}
 */
export const canReceiveUrgentAlerts = (role) => {
  return ['preparateur', 'etudiant', 'conseiller', 'animateur'].includes(role);
};

/**
 * Vérifie si un rôle peut créer des missions d'animation
 * @param {string} role - Le code du rôle
 * @returns {boolean}
 */
export const canCreateMissions = (role) => {
  return ['titulaire', 'laboratoire'].includes(role);
};

/**
 * Vérifie si un rôle peut accepter des missions d'animation
 * @param {string} role - Le code du rôle
 * @returns {boolean}
 */
export const canAcceptMissions = (role) => {
  return role === 'animateur';
};

/**
 * Vérifie si un rôle nécessite une vérification RPPS
 * @param {string} role - Le code du rôle
 * @returns {boolean}
 */
export const requiresRPPS = (role) => {
  return ['preparateur', 'titulaire'].includes(role);
};

/**
 * Vérifie si un rôle nécessite une vérification SIRET
 * @param {string} role - Le code du rôle
 * @returns {boolean}
 */
export const requiresSIRET = (role) => {
  return ['animateur', 'laboratoire'].includes(role);
};