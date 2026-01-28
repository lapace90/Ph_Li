// Hook pour les signalements

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { reportService, REPORT_REASONS, REPORT_CONTENT_TYPES } from '../services/reportService';

/**
 * Hook pour gérer les signalements
 * @param {string} userId - ID de l'utilisateur courant
 */
export const useReports = (userId) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Signaler un utilisateur
   */
  const reportUser = useCallback(async (reportedUserId, reason, description = null) => {
    if (!userId) {
      Alert.alert('Erreur', 'Vous devez être connecté pour signaler');
      return { success: false };
    }

    try {
      setLoading(true);
      setError(null);

      await reportService.reportUser(userId, reportedUserId, reason, description);

      Alert.alert(
        'Signalement envoyé',
        'Merci pour votre signalement. Notre équipe va l\'examiner.'
      );

      return { success: true };
    } catch (err) {
      setError(err.message);
      Alert.alert('Erreur', err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Signaler un contenu
   */
  const reportContent = useCallback(async (contentType, contentId, contentOwnerId, reason, description = null) => {
    if (!userId) {
      Alert.alert('Erreur', 'Vous devez être connecté pour signaler');
      return { success: false };
    }

    try {
      setLoading(true);
      setError(null);

      await reportService.reportContent(userId, contentType, contentId, contentOwnerId, reason, description);

      Alert.alert(
        'Signalement envoyé',
        'Merci pour votre signalement. Notre équipe va l\'examiner.'
      );

      return { success: true };
    } catch (err) {
      setError(err.message);
      Alert.alert('Erreur', err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Vérifier si déjà signalé
   */
  const hasReported = useCallback(async (reportedUserId) => {
    if (!userId) return false;
    try {
      return await reportService.hasReportedUser(userId, reportedUserId);
    } catch {
      return false;
    }
  }, [userId]);

  /**
   * Vérifier si un contenu a déjà été signalé
   */
  const hasReportedContent = useCallback(async (contentType, contentId) => {
    if (!userId) return false;
    try {
      return await reportService.hasReportedContent(userId, contentType, contentId);
    } catch {
      return false;
    }
  }, [userId]);

  return {
    loading,
    error,
    reportUser,
    reportContent,
    hasReported,
    hasReportedContent,
  };
};

// Ré-exporter les constantes
export { REPORT_REASONS, REPORT_CONTENT_TYPES };
