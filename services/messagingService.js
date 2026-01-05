import { supabase } from '../lib/supabase';

/**
 * Service de messagerie (basé sur les matchs)
 */
export const messagingService = {
  // ==========================================
  // CONVERSATIONS (= MATCHS AVEC MESSAGES)
  // ==========================================

  /**
   * Récupère les conversations d'un utilisateur (matchs avec messages)
   */
  async getConversations(userId) {
    // Récupérer les matchs de l'utilisateur (candidat ou employeur via offres)
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        job_offers (id, title, city, pharmacy_owner_id),
        internship_offers (id, title, city, pharmacy_owner_id)
      `)
      .eq('status', 'matched')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    if (!matches?.length) return [];

    // Filtrer les matchs où l'utilisateur est impliqué
    const userMatches = matches.filter(m => {
      const employerId = m.job_offers?.pharmacy_owner_id || m.internship_offers?.pharmacy_owner_id;
      return m.candidate_id === userId || employerId === userId;
    });

    if (!userMatches.length) return [];

    // Récupérer les derniers messages de chaque match
    const matchIds = userMatches.map(m => m.id);
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .in('match_id', matchIds)
      .order('created_at', { ascending: false });

    // Récupérer les profils des autres utilisateurs
    const otherUserIds = new Set();
    userMatches.forEach(m => {
      const employerId = m.job_offers?.pharmacy_owner_id || m.internship_offers?.pharmacy_owner_id;
      const otherId = m.candidate_id === userId ? employerId : m.candidate_id;
      if (otherId) otherUserIds.add(otherId);
    });

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, photo_url')
      .in('id', Array.from(otherUserIds));

    const profileMap = {};
    profiles?.forEach(p => profileMap[p.id] = p);

    // Construire les conversations
    return userMatches.map(match => {
      const matchMessages = messages?.filter(m => m.match_id === match.id) || [];
      const lastMessage = matchMessages[0];
      const unreadCount = matchMessages.filter(m => 
        m.sender_id !== userId && !m.read
      ).length;

      const employerId = match.job_offers?.pharmacy_owner_id || match.internship_offers?.pharmacy_owner_id;
      const otherId = match.candidate_id === userId ? employerId : match.candidate_id;
      const otherUser = profileMap[otherId];

      return {
        id: match.id,
        match,
        otherUser,
        lastMessage,
        unreadCount,
        updated_at: lastMessage?.created_at || match.updated_at,
      };
    }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  },

  /**
   * Récupère une conversation par match ID
   */
  async getConversationByMatchId(matchId, userId) {
    const { data: match, error } = await supabase
      .from('matches')
      .select(`
        *,
        job_offers (id, title, city, pharmacy_owner_id),
        internship_offers (id, title, city, pharmacy_owner_id)
      `)
      .eq('id', matchId)
      .single();

    if (error) throw error;

    // Récupérer l'autre utilisateur
    const employerId = match.job_offers?.pharmacy_owner_id || match.internship_offers?.pharmacy_owner_id;
    const otherId = match.candidate_id === userId ? employerId : match.candidate_id;
    
    const { data: otherUser } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, photo_url')
      .eq('id', otherId)
      .single();

    return { match, otherUser };
  },

  // ==========================================
  // MESSAGES
  // ==========================================

  /**
   * Récupère les messages d'un match
   */
  async getMessages(matchId, limit = 50, before = null) {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Retourner dans l'ordre chronologique
    return (data || []).reverse();
  },

  /**
   * Envoie un message
   */
  async sendMessage(matchId, senderId, content, attachments = null) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        content,
        attachments,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour updated_at du match
    await supabase
      .from('matches')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', matchId);

    return data;
  },

  /**
   * Marque les messages comme lus
   */
  async markAsRead(matchId, userId) {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('match_id', matchId)
      .neq('sender_id', userId)
      .eq('read', false);

    if (error) throw error;
  },

  /**
   * Supprime un message
   */
  async deleteMessage(messageId, userId) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', userId);

    if (error) throw error;
  },

  // ==========================================
  // REALTIME
  // ==========================================

  /**
   * S'abonne aux nouveaux messages d'un match
   */
  subscribeToMessages(matchId, callback) {
    const subscription = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  },

  /**
   * S'abonne aux mises à jour de lecture
   */
  subscribeToReadReceipts(matchId, callback) {
    const subscription = supabase
      .channel(`read:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          if (payload.new.read && !payload.old.read) {
            callback(payload.new);
          }
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  },

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Compte le nombre total de messages non lus
   */
  async getUnreadCount(userId) {
    // Récupérer les matchs de l'utilisateur
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        id,
        candidate_id,
        job_offers (pharmacy_owner_id),
        internship_offers (pharmacy_owner_id)
      `)
      .eq('status', 'matched');

    if (!matches?.length) return 0;

    // Filtrer les matchs où l'utilisateur est impliqué
    const userMatchIds = matches
      .filter(m => {
        const employerId = m.job_offers?.pharmacy_owner_id || m.internship_offers?.pharmacy_owner_id;
        return m.candidate_id === userId || employerId === userId;
      })
      .map(m => m.id);

    if (!userMatchIds.length) return 0;

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('match_id', userMatchIds)
      .neq('sender_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  },
};