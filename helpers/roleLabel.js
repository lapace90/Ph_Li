// helpers/roleLabel.js

/**
 * Retourne le label du rôle adapté au genre de l'utilisateur
 * 
 * @param {string} userType - Type d'utilisateur (preparateur, titulaire, conseiller, etudiant)
 * @param {string} gender - Genre (male, female, other)
 * @returns {string} Le label genré du rôle
 */
export const getRoleLabel = (userType, gender) => {
  const labels = {
    preparateur: {
      male: 'Préparateur',
      female: 'Préparatrice',
      other: 'Préparateur(trice)',
    },
    titulaire: {
      male: 'Pharmacien titulaire',
      female: 'Pharmacienne titulaire',
      other: 'Pharmacien(ne) titulaire',
    },
    conseiller: {
      male: 'Conseiller',
      female: 'Conseillère',
      other: 'Conseiller(ère)',
    },
    etudiant: {
      male: 'Étudiant en pharmacie',
      female: 'Étudiante en pharmacie',
      other: 'Étudiant(e) en pharmacie',
    },
  };

  const roleLabels = labels[userType];
  if (!roleLabels) return 'Utilisateur';

  // Si pas de genre spécifié, utiliser 'other' (neutre)
  return roleLabels[gender] || roleLabels.other;
};

/**
 * Version courte du label (sans "en pharmacie", "titulaire")
 * Pour les badges et espaces réduits
 * 
 * @param {string} userType - Type d'utilisateur
 * @param {string} gender - Genre
 * @returns {string} Le label court genré
 */
export const getRoleLabelShort = (userType, gender) => {
  const labels = {
    preparateur: {
      male: 'Préparateur',
      female: 'Préparatrice',
      other: 'Préparateur(trice)',
    },
    titulaire: {
      male: 'Titulaire',
      female: 'Titulaire',
      other: 'Titulaire',
    },
    conseiller: {
      male: 'Conseiller',
      female: 'Conseillère',
      other: 'Conseiller(ère)',
    },
    etudiant: {
      male: 'Étudiant',
      female: 'Étudiante',
      other: 'Étudiant(e)',
    },
  };

  const roleLabels = labels[userType];
  if (!roleLabels) return 'Utilisateur';

  return roleLabels[gender] || roleLabels.other;
};