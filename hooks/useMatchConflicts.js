import { useState } from 'react';
import { missionService } from '../services/missionService';

/**
 * Hook pour gérer la vérification et l'affichage des conflits de matches
 */
export function useMatchConflicts() {
  const [conflicts, setConflicts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  /**
   * Vérifie les conflits et affiche le modal si nécessaire
   * @param {string} animatorId - ID de l'animateur
   * @param {string} startDate - Date de début de la mission
   * @param {string} endDate - Date de fin de la mission
   * @param {function} onProceed - Callback à exécuter si l'utilisateur confirme
   * @returns {Promise<boolean>} - true si on peut procéder, false si annulé
   */
  const checkAndProceed = async (animatorId, startDate, endDate, onProceed) => {
    try {
      // Vérifier les conflits
      const foundConflicts = await missionService.checkMatchConflicts(
        animatorId,
        startDate,
        endDate
      );

      if (foundConflicts.length > 0) {
        // Il y a des conflits - afficher le modal
        setConflicts(foundConflicts);
        setShowModal(true);
        setPendingAction(() => onProceed);
        return false; // On attend la décision de l'utilisateur
      } else {
        // Pas de conflit - procéder directement
        await onProceed();
        return true;
      }
    } catch (error) {
      console.error('Erreur vérification conflits:', error);
      // En cas d'erreur, on laisse l'utilisateur continuer
      await onProceed();
      return true;
    }
  };

  /**
   * L'utilisateur décide de continuer malgré le conflit
   */
  const handleContinue = async () => {
    setShowModal(false);
    if (pendingAction) {
      await pendingAction();
      setPendingAction(null);
    }
    setConflicts([]);
  };

  /**
   * L'utilisateur annule l'action
   */
  const handleCancel = () => {
    setShowModal(false);
    setPendingAction(null);
    setConflicts([]);
  };

  return {
    conflicts,
    showModal,
    checkAndProceed,
    handleContinue,
    handleCancel,
  };
}
