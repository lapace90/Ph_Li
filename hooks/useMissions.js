// Hook pour gérer les missions d'animation

import { useState, useEffect, useCallback } from 'react';
import { missionService } from '../services/missionService';

/**
 * Hook pour les missions côté CLIENT (labo ou titulaire)
 */
export const useClientMissions = (clientId, clientType) => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les missions
  const fetchMissions = useCallback(async (filters = {}) => {
    if (!clientId) {
      setMissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await missionService.getByClientId(clientId, filters);
      setMissions(data);
    } catch (err) {
      console.error('Erreur chargement missions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  // Créer une mission
  const createMission = async (missionData) => {
    try {
      setError(null);
      const data = await missionService.create(clientId, clientType, missionData);
      setMissions(prev => [data, ...prev]);
      return { success: true, mission: data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Publier une mission
  const publishMission = async (missionId) => {
    try {
      const data = await missionService.publish(missionId);
      setMissions(prev =>
        prev.map(m => (m.id === missionId ? data : m))
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Assigner un animateur
  const assignAnimator = async (missionId, animatorId) => {
    try {
      const data = await missionService.assignAnimator(missionId, animatorId);
      setMissions(prev =>
        prev.map(m => (m.id === missionId ? data : m))
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Terminer une mission
  const completeMission = async (missionId) => {
    try {
      const data = await missionService.complete(missionId);
      setMissions(prev =>
        prev.map(m => (m.id === missionId ? data : m))
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Annuler une mission
  const cancelMission = async (missionId) => {
    try {
      const data = await missionService.cancel(missionId);
      setMissions(prev =>
        prev.map(m => (m.id === missionId ? data : m))
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Supprimer un brouillon
  const deleteMission = async (missionId) => {
    try {
      await missionService.delete(missionId);
      setMissions(prev => prev.filter(m => m.id !== missionId));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Stats rapides
  const stats = {
    total: missions.length,
    drafts: missions.filter(m => m.status === 'draft').length,
    open: missions.filter(m => m.status === 'open').length,
    active: missions.filter(m => ['assigned', 'in_progress'].includes(m.status)).length,
    completed: missions.filter(m => m.status === 'completed').length,
  };

  return {
    missions,
    loading,
    error,
    stats,
    refresh: fetchMissions,
    createMission,
    publishMission,
    assignAnimator,
    completeMission,
    cancelMission,
    deleteMission,
  };
};


/**
 * Hook pour les missions côté ANIMATEUR
 */
export const useAnimatorMissions = (animatorId) => {
  const [myMissions, setMyMissions] = useState([]);
  const [availableMissions, setAvailableMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  // Charger mes missions (assignées)
  const fetchMyMissions = useCallback(async () => {
    if (!animatorId) {
      setMyMissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await missionService.getByAnimatorId(animatorId);
      setMyMissions(data);
    } catch (err) {
      console.error('Erreur chargement mes missions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [animatorId]);

  // Rechercher des missions disponibles
  const searchMissions = useCallback(async (filters = {}) => {
    if (!animatorId) return;

    try {
      setSearching(true);
      const data = await missionService.searchOpen(animatorId, filters);
      setAvailableMissions(data);
    } catch (err) {
      console.error('Erreur recherche missions:', err);
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }, [animatorId]);

  // Rechercher par géolocalisation
  const searchNearby = async (latitude, longitude, radiusKm) => {
    try {
      setSearching(true);
      const data = await missionService.searchNearby(latitude, longitude, radiusKm);
      setAvailableMissions(data);
      return { success: true, missions: data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchMyMissions();
  }, [fetchMyMissions]);

  // Candidater à une mission
  const applyToMission = async (missionId, message) => {
    try {
      await missionService.apply(missionId, animatorId, message);
      // Retirer de la liste des disponibles
      setAvailableMissions(prev => prev.filter(m => m.id !== missionId));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Stats rapides
  const stats = {
    upcoming: myMissions.filter(m => 
      ['assigned', 'in_progress'].includes(m.status) && 
      new Date(m.start_date) >= new Date()
    ).length,
    completed: myMissions.filter(m => m.status === 'completed').length,
    total: myMissions.length,
  };

  return {
    myMissions,
    availableMissions,
    loading,
    searching,
    error,
    stats,
    refresh: fetchMyMissions,
    searchMissions,
    searchNearby,
    applyToMission,
  };
};


/**
 * Hook pour une mission unique
 */
export const useMission = (missionId) => {
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMission = useCallback(async () => {
    if (!missionId) {
      setMission(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await missionService.getById(missionId);
      setMission(data);
    } catch (err) {
      console.error('Erreur chargement mission:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [missionId]);

  useEffect(() => {
    fetchMission();
  }, [fetchMission]);

  return {
    mission,
    loading,
    error,
    refresh: fetchMission,
  };
};