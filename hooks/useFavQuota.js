import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { favoritesService } from '../services/favoritesService';

/**
 * Hook pour charger le quota de favoris animateurs (labos uniquement).
 * Retourne { favQuota, loadFavQuota } — favQuota est null si non-labo ou pas encore chargé.
 */
export function useFavQuota() {
  const { session, isLaboratory } = useAuth();
  const [favQuota, setFavQuota] = useState(null);

  const loadFavQuota = useCallback(async () => {
    if (!isLaboratory || !session?.user?.id) return;
    try {
      const quota = await favoritesService.canAddFavorite(session.user.id);
      setFavQuota(quota);
    } catch (err) {
      console.error('Error loading fav quota:', err);
    }
  }, [isLaboratory, session?.user?.id]);

  useEffect(() => {
    loadFavQuota();
  }, [loadFavQuota]);

  return { favQuota, loadFavQuota };
}
