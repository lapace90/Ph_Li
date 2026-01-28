// Service pour le blocage d'utilisateurs

import { supabase } from '../lib/supabase';

export const blockService = {
  // ==========================================
  // BLOCAGE / DÉBLOCAGE
  // ==========================================

  /**
   * Bloquer un utilisateur
   * @param {string} blockerId - ID de celui qui bloque
   * @param {string} blockedId - ID de celui qui est bloqué
   */
  async blockUser(blockerId, blockedId) {
    if (blockerId === blockedId) {
      throw new Error('Vous ne pouvez pas vous bloquer vous-même');
    }

    const { data, error } = await supabase
      .from('user_blocks')
      .insert({
        blocker_id: blockerId,
        blocked_id: blockedId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Cet utilisateur est déjà bloqué');
      }
      throw error;
    }

    return data;
  },

  /**
   * Débloquer un utilisateur
   */
  async unblockUser(blockerId, blockedId) {
    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);

    if (error) throw error;
    return true;
  },

  /**
   * Toggle blocage
   */
  async toggleBlock(blockerId, blockedId) {
    const isBlocked = await this.isBlocked(blockerId, blockedId);

    if (isBlocked) {
      await this.unblockUser(blockerId, blockedId);
      return { blocked: false };
    } else {
      await this.blockUser(blockerId, blockedId);
      return { blocked: true };
    }
  },

  // ==========================================
  // VÉRIFICATIONS
  // ==========================================

  /**
   * Vérifier si un utilisateur a bloqué un autre
   * @param {string} blockerId - Celui qui a potentiellement bloqué
   * @param {string} blockedId - Celui qui est potentiellement bloqué
   */
  async isBlocked(blockerId, blockedId) {
    const { data, error } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  /**
   * Vérifier si deux utilisateurs sont bloqués (dans un sens ou l'autre)
   * Utilise la fonction SQL pour performance
   */
  async areUsersBlocked(userA, userB) {
    const { data, error } = await supabase
      .rpc('are_users_blocked', { user_a: userA, user_b: userB });

    if (error) throw error;
    return data === true;
  },

  // ==========================================
  // LISTES
  // ==========================================

  /**
   * Récupérer la liste des utilisateurs bloqués par un utilisateur
   */
  async getBlockedUsers(blockerId) {
    const { data, error } = await supabase
      .from('user_blocks')
      .select(`
        id,
        blocked_id,
        created_at,
        blocked_user:profiles!blocked_id(
          id,
          first_name,
          last_name,
          photo_url,
          user_type
        )
      `)
      .eq('blocker_id', blockerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupérer uniquement les IDs des utilisateurs bloqués
   * (pour filtrage rapide dans le matching/messagerie)
   */
  async getBlockedUserIds(userId) {
    const { data, error } = await supabase
      .rpc('get_blocked_user_ids', { user_id: userId });

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupérer les IDs des utilisateurs bloqués (version simple sans RPC)
   * Inclut ceux que j'ai bloqués ET ceux qui m'ont bloqué
   */
  async getBlockedUserIdsSimple(userId) {
    // Ceux que j'ai bloqués
    const { data: blocked, error: err1 } = await supabase
      .from('user_blocks')
      .select('blocked_id')
      .eq('blocker_id', userId);

    if (err1) throw err1;

    // Ceux qui m'ont bloqué
    const { data: blockers, error: err2 } = await supabase
      .from('user_blocks')
      .select('blocker_id')
      .eq('blocked_id', userId);

    if (err2) throw err2;

    const ids = new Set([
      ...(blocked || []).map(b => b.blocked_id),
      ...(blockers || []).map(b => b.blocker_id),
    ]);

    return Array.from(ids);
  },

  /**
   * Compter le nombre d'utilisateurs bloqués
   */
  async getBlockedCount(blockerId) {
    const { count, error } = await supabase
      .from('user_blocks')
      .select('*', { count: 'exact', head: true })
      .eq('blocker_id', blockerId);

    if (error) throw error;
    return count || 0;
  },

  // ==========================================
  // HELPERS POUR FILTRAGE
  // ==========================================

  /**
   * Filtrer une liste d'utilisateurs en excluant les bloqués
   * @param {string} userId - L'utilisateur courant
   * @param {Array} users - Liste d'utilisateurs avec un champ 'id'
   */
  async filterBlockedUsers(userId, users) {
    if (!users || users.length === 0) return users;

    const blockedIds = await this.getBlockedUserIdsSimple(userId);
    const blockedSet = new Set(blockedIds);

    return users.filter(user => !blockedSet.has(user.id));
  },

  /**
   * Vérifier si on peut interagir avec un utilisateur
   * (pas bloqué dans aucun sens)
   */
  async canInteractWith(userId, targetId) {
    const blocked = await this.areUsersBlocked(userId, targetId);
    return !blocked;
  },
};
