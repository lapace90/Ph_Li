// Hook pour le blocage d'utilisateurs

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { blockService } from '../services/blockService';

/**
 * Hook principal pour gérer les blocages
 * @param {string} userId - ID de l'utilisateur courant
 */
export const useBlocks = (userId) => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedIds, setBlockedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les utilisateurs bloqués
  const fetchBlocked = useCallback(async () => {
    if (!userId) {
      setBlockedUsers([]);
      setBlockedIds(new Set());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [users, ids] = await Promise.all([
        blockService.getBlockedUsers(userId),
        blockService.getBlockedUserIdsSimple(userId),
      ]);

      setBlockedUsers(users);
      setBlockedIds(new Set(ids));
    } catch (err) {
      console.error('Erreur chargement blocages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  /**
   * Bloquer un utilisateur
   */
  const blockUser = useCallback(async (blockedId, showConfirm = true) => {
    if (!userId) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return { success: false };
    }

    const doBlock = async () => {
      try {
        await blockService.blockUser(userId, blockedId);

        setBlockedIds(prev => new Set([...prev, blockedId]));
        await fetchBlocked();

        return { success: true };
      } catch (err) {
        Alert.alert('Erreur', err.message);
        return { success: false, error: err.message };
      }
    };

    if (showConfirm) {
      return new Promise((resolve) => {
        Alert.alert(
          'Bloquer cet utilisateur ?',
          'Vous ne verrez plus son profil et il ne pourra plus vous contacter.',
          [
            { text: 'Annuler', style: 'cancel', onPress: () => resolve({ success: false }) },
            {
              text: 'Bloquer',
              style: 'destructive',
              onPress: async () => {
                const result = await doBlock();
                resolve(result);
              }
            },
          ]
        );
      });
    }

    return doBlock();
  }, [userId, fetchBlocked]);

  /**
   * Débloquer un utilisateur
   */
  const unblockUser = useCallback(async (blockedId) => {
    if (!userId) return { success: false };

    try {
      await blockService.unblockUser(userId, blockedId);

      setBlockedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(blockedId);
        return newSet;
      });
      setBlockedUsers(prev => prev.filter(b => b.blocked_id !== blockedId));

      return { success: true };
    } catch (err) {
      Alert.alert('Erreur', err.message);
      return { success: false, error: err.message };
    }
  }, [userId]);

  /**
   * Toggle blocage
   */
  const toggleBlock = useCallback(async (targetId) => {
    if (blockedIds.has(targetId)) {
      return unblockUser(targetId);
    }
    return blockUser(targetId);
  }, [blockedIds, blockUser, unblockUser]);

  /**
   * Vérifier si un utilisateur est bloqué (synchrone via Set)
   */
  const isBlocked = useCallback((targetId) => {
    return blockedIds.has(targetId);
  }, [blockedIds]);

  /**
   * Filtrer une liste pour exclure les bloqués
   */
  const filterBlocked = useCallback((users) => {
    if (!users || users.length === 0) return users;
    return users.filter(u => !blockedIds.has(u.id));
  }, [blockedIds]);

  /**
   * Vérifier si on peut interagir avec un utilisateur
   */
  const canInteractWith = useCallback(async (targetId) => {
    if (!userId) return true;
    return await blockService.canInteractWith(userId, targetId);
  }, [userId]);

  return {
    blockedUsers,
    blockedIds: Array.from(blockedIds),
    loading,
    error,
    count: blockedUsers.length,
    refresh: fetchBlocked,
    blockUser,
    unblockUser,
    toggleBlock,
    isBlocked,
    filterBlocked,
    canInteractWith,
  };
};

/**
 * Hook simplifié pour juste les IDs bloqués (léger)
 */
export const useBlockedIds = (userId) => {
  const [ids, setIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!userId) {
        setIds(new Set());
        setLoading(false);
        return;
      }

      try {
        const blockedIds = await blockService.getBlockedUserIdsSimple(userId);
        setIds(new Set(blockedIds));
      } catch (err) {
        console.error('Erreur chargement IDs bloqués:', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [userId]);

  const isBlocked = useCallback((targetId) => ids.has(targetId), [ids]);
  const filterBlocked = useCallback((users) => users?.filter(u => !ids.has(u.id)) || [], [ids]);

  return { ids: Array.from(ids), isBlocked, filterBlocked, loading };
};
