// Hook générique pour tous les favoris

import { useState, useEffect, useCallback } from 'react';
import { favoritesService, FAVORITE_TYPES } from '../services/favoritesService';

/**
 * Hook générique pour gérer les favoris
 * @param {string} userId - ID de l'utilisateur
 * @param {string} targetType - Type de cible (FAVORITE_TYPES)
 */
export const useFavorites = (userId, targetType) => {
  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les favoris
  const fetchFavorites = useCallback(async () => {
    if (!userId || !targetType) {
      setFavorites([]);
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let data;
      // Utiliser les méthodes enrichies selon le type
      switch (targetType) {
        case FAVORITE_TYPES.CANDIDATE:
          data = await favoritesService.getCandidateFavorites(userId);
          break;
        case FAVORITE_TYPES.ANIMATOR:
          data = await favoritesService.getAnimatorFavorites(userId);
          break;
        case FAVORITE_TYPES.LABORATORY:
          data = await favoritesService.getLaboratoryFavorites(userId);
          break;
        case FAVORITE_TYPES.JOB_OFFER:
          data = await favoritesService.getJobOfferFavorites(userId);
          break;
        case FAVORITE_TYPES.MISSION:
          data = await favoritesService.getMissionFavorites(userId);
          break;
        case FAVORITE_TYPES.PHARMACY_LISTING:
          data = await favoritesService.getPharmacyListingFavorites(userId);
          break;
        default:
          data = await favoritesService.getByType(userId, targetType);
      }
      
      setFavorites(data);
      setFavoriteIds(new Set(data.map(f => f.target_id)));
    } catch (err) {
      console.error('Erreur chargement favoris:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, targetType]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Ajouter un favori
  const addFavorite = async (targetId, notes = null) => {
    try {
      setError(null);
      const data = await favoritesService.add(userId, targetType, targetId, notes);
      
      setFavorites(prev => [data, ...prev]);
      setFavoriteIds(prev => new Set([...prev, targetId]));
      
      // Vérifier si c'est le premier favori (pour notification)
      const isFirst = await favoritesService.isFirstFavorite(targetType, targetId);
      
      return { success: true, favorite: data, isFirst };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Supprimer un favori
  const removeFavorite = async (targetId) => {
    try {
      setError(null);
      await favoritesService.remove(userId, targetType, targetId);
      
      setFavorites(prev => prev.filter(f => f.target_id !== targetId));
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetId);
        return newSet;
      });
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Toggle un favori
  const toggleFavorite = async (targetId, notes = null) => {
    if (favoriteIds.has(targetId)) {
      return removeFavorite(targetId);
    }
    return addFavorite(targetId, notes);
  };

  // Vérifier si un élément est en favori (synchrone grâce au Set)
  const isFavorite = useCallback((targetId) => {
    return favoriteIds.has(targetId);
  }, [favoriteIds]);

  // Mettre à jour les notes
  const updateNotes = async (targetId, notes) => {
    try {
      setError(null);
      const data = await favoritesService.updateNotes(userId, targetType, targetId, notes);
      
      setFavorites(prev =>
        prev.map(f => f.target_id === targetId ? { ...f, notes } : f)
      );
      
      return { success: true, favorite: data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  return {
    favorites,
    favoriteIds: Array.from(favoriteIds),
    loading,
    error,
    count: favorites.length,
    refresh: fetchFavorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    updateNotes,
  };
};


/**
 * Hook pour récupérer le compteur de favoris d'une cible
 * (pour afficher "X recruteurs vous ont remarqué")
 */
export const useFavoriteCount = (targetType, targetId) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (!targetType || !targetId) {
      setCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await favoritesService.countForTarget(targetType, targetId);
      setCount(result);
    } catch (err) {
      console.error('Erreur compteur favoris:', err);
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, loading, refresh: fetchCount };
};


/**
 * Hook simplifié pour vérifier rapidement les favoris
 * (utile pour les badges sur les cartes)
 */
export const useFavoriteIds = (userId, targetType) => {
  const [ids, setIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!userId || !targetType) {
        setIds(new Set());
        setLoading(false);
        return;
      }

      try {
        const result = await favoritesService.getFavoriteIds(userId, targetType);
        setIds(new Set(result));
      } catch (err) {
        console.error('Erreur chargement IDs favoris:', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [userId, targetType]);

  const isFavorite = useCallback((targetId) => ids.has(targetId), [ids]);

  return { ids: Array.from(ids), isFavorite, loading };
};


// Ré-exporter les types
export { FAVORITE_TYPES };