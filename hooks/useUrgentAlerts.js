// hooks/useUrgentAlerts.js
// Hook pour gérer les alertes urgentes

import { useState, useEffect, useCallback } from 'react';
import { urgentAlertService } from '../services/urgentAlertService';

/**
 * Hook pour les alertes côté CRÉATEUR (titulaire ou labo)
 */
export const useCreatorAlerts = (creatorId, creatorType) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les alertes
  const fetchAlerts = useCallback(async (filters = {}) => {
    if (!creatorId) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await urgentAlertService.getByCreatorId(creatorId, filters);
      setAlerts(data);
    } catch (err) {
      console.error('Erreur chargement alertes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Créer une alerte
  const createAlert = async (alertData) => {
    try {
      setError(null);
      let data;
      
      if (creatorType === 'laboratory') {
        data = await urgentAlertService.createForLaboratory(creatorId, alertData);
      } else {
        data = await urgentAlertService.createForPharmacy(creatorId, alertData);
      }
      
      setAlerts(prev => [data, ...prev]);
      return { success: true, alert: data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Annuler une alerte
  const cancelAlert = async (alertId) => {
    try {
      const data = await urgentAlertService.cancel(alertId);
      setAlerts(prev =>
        prev.map(a => (a.id === alertId ? data : a))
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Marquer comme pourvue
  const markAsFilled = async (alertId) => {
    try {
      const data = await urgentAlertService.markAsFilled(alertId);
      setAlerts(prev =>
        prev.map(a => (a.id === alertId ? data : a))
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Stats rapides
  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    filled: alerts.filter(a => a.status === 'filled').length,
  };

  return {
    alerts,
    loading,
    error,
    stats,
    refresh: fetchAlerts,
    createAlert,
    cancelAlert,
    markAsFilled,
  };
};


/**
 * Hook pour les alertes côté CANDIDAT/ANIMATEUR
 */
export const useCandidateAlerts = (userId, userType) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les alertes disponibles
  const fetchAlerts = useCallback(async () => {
    if (!userId) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (userType === 'animateur') {
        data = await urgentAlertService.getActiveForAnimator(userId);
      } else {
        data = await urgentAlertService.getActiveForCandidate(userId, userType);
      }
      
      setAlerts(data);
    } catch (err) {
      console.error('Erreur chargement alertes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, userType]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Répondre à une alerte
  const respondToAlert = async (alertId, message = null) => {
    try {
      setError(null);
      await urgentAlertService.respond(alertId, userId, message);
      
      // Marquer comme "répondu" localement
      setAlerts(prev =>
        prev.map(a =>
          a.id === alertId ? { ...a, hasResponded: true } : a
        )
      );
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Vérifier si on a déjà répondu
  const hasResponded = async (alertId) => {
    return urgentAlertService.hasResponded(alertId, userId);
  };

  return {
    alerts,
    loading,
    error,
    refresh: fetchAlerts,
    respondToAlert,
    hasResponded,
    count: alerts.length,
  };
};


/**
 * Hook pour les réponses à une alerte
 */
export const useAlertResponses = (alertId) => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les réponses
  const fetchResponses = useCallback(async () => {
    if (!alertId) {
      setResponses([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await urgentAlertService.getResponses(alertId);
      setResponses(data);
    } catch (err) {
      console.error('Erreur chargement réponses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [alertId]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  // Accepter un candidat
  const acceptCandidate = async (candidateId) => {
    try {
      setError(null);
      await urgentAlertService.acceptCandidate(alertId, candidateId);
      
      setResponses(prev =>
        prev.map(r =>
          r.candidate_id === candidateId
            ? { ...r, status: 'accepted' }
            : { ...r, status: r.status === 'interested' ? 'rejected' : r.status }
        )
      );
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Rejeter un candidat
  const rejectCandidate = async (candidateId) => {
    try {
      setError(null);
      await urgentAlertService.rejectCandidate(alertId, candidateId);
      
      setResponses(prev =>
        prev.map(r =>
          r.candidate_id === candidateId ? { ...r, status: 'rejected' } : r
        )
      );
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Stats
  const stats = {
    total: responses.length,
    interested: responses.filter(r => r.status === 'interested').length,
    accepted: responses.filter(r => r.status === 'accepted').length,
    rejected: responses.filter(r => r.status === 'rejected').length,
  };

  return {
    responses,
    loading,
    error,
    stats,
    refresh: fetchResponses,
    acceptCandidate,
    rejectCandidate,
  };
};


/**
 * Hook pour une alerte unique
 */
export const useAlert = (alertId) => {
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlert = useCallback(async () => {
    if (!alertId) {
      setAlert(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await urgentAlertService.getById(alertId);
      setAlert(data);
    } catch (err) {
      console.error('Erreur chargement alerte:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [alertId]);

  useEffect(() => {
    fetchAlert();
  }, [fetchAlert]);

  return {
    alert,
    loading,
    error,
    refresh: fetchAlert,
  };
};