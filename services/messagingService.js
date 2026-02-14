import { supabase } from '../lib/supabase';
import { notificationService, NOTIFICATION_TYPES } from './notificationService';
import { blockService } from './blockService';

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

    // Récupérer les utilisateurs bloqués pour les filtrer
    let blockedUserIds = new Set();
    try {
      const blocked = await blockService.getBlockedUserIdsSimple(userId);
      blockedUserIds = new Set(blocked);
    } catch (e) {
      console.warn('Could not fetch blocked users:', e);
    }

    // Construire les conversations (en filtrant les bloqués)
    return userMatches
      .map(match => {
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
          otherId,
          lastMessage,
          unreadCount,
          updated_at: lastMessage?.created_at || match.updated_at,
        };
      })
      .filter(conv => !blockedUserIds.has(conv.otherId)) // Exclure les bloqués
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  },

  /**
   * Récupère une conversation par match ID
   */
  async getConversationByMatchId(matchId, userId) {
    const { data: match, error } = await supabase
      .from('matches')
      .select(`
        *,
        cv_shared,
        cv_shared_at,
        shared_cv_id,
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
    // Vérifier que l'autre utilisateur n'est pas bloqué
    const conversation = await this.getConversationByMatchId(matchId, senderId);
    if (conversation?.otherId) {
      const blocked = await blockService.areUsersBlocked(senderId, conversation.otherId);
      if (blocked) {
        throw new Error('Vous ne pouvez pas envoyer de message à cet utilisateur');
      }
    }

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

    // Notifier le destinataire (avec groupement des messages)
    try {
      const { data: match } = await supabase
        .from('matches')
        .select(`
          candidate_id,
          job_offers(pharmacy_owner_id),
          internship_offers(pharmacy_owner_id)
        `)
        .eq('id', matchId)
        .single();

      if (match) {
        const employerId = match.job_offers?.pharmacy_owner_id || match.internship_offers?.pharmacy_owner_id;
        const recipientId = match.candidate_id === senderId ? employerId : match.candidate_id;

        if (recipientId) {
          // Récupérer le nom de l'expéditeur
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', senderId)
            .single();

          const senderName = senderProfile
            ? `${senderProfile.first_name} ${senderProfile.last_name?.[0] || ''}.`
            : 'Quelqu\'un';

          const preview = content.length > 80 ? content.slice(0, 80) + '...' : content;

          // Utiliser la fonction qui groupe les messages
          await notificationService.createOrUpdateMessageNotification(
            recipientId,
            senderId,
            senderName,
            matchId,
            preview
          );
        }
      }
    } catch (err) {
      console.error('Error creating message notification:', err);
    }

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
   * S'abonne aux nouveaux messages pour toutes les conversations de l'utilisateur
   * Utile pour mettre à jour la liste des conversations en temps réel
   */
  subscribeToConversations(userId, callback) {
    const subscription = supabase
      .channel(`user_messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Vérifier que ce message concerne cet utilisateur
          const { data: match } = await supabase
            .from('matches')
            .select('candidate_id, job_offers(pharmacy_owner_id), internship_offers(pharmacy_owner_id)')
            .eq('id', payload.new.match_id)
            .single();

          if (match) {
            const employerId = match.job_offers?.pharmacy_owner_id || match.internship_offers?.pharmacy_owner_id;
            const isUserInvolved = match.candidate_id === userId || employerId === userId;

            if (isUserInvolved) {
              callback(payload.new);
            }
          }
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

  // ==========================================
  // MARKETPLACE MESSAGING
  // ==========================================

  /**
   * Initie ou récupère une conversation pour une annonce marketplace
   * @returns {{ conversationId: string, isNew: boolean }}
   */
  async getOrCreateListingConversation(listingId, userId) {
    // Vérifier que l'annonce existe et récupérer le propriétaire
    const { data: listing, error: listingError } = await supabase
      .from('pharmacy_listings')
      .select('id, user_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      throw new Error('Annonce introuvable');
    }

    if (listing.user_id === userId) {
      throw new Error('Vous ne pouvez pas contacter votre propre annonce');
    }

    // Vérifier les blocages
    const blocked = await blockService.areUsersBlocked(userId, listing.user_id);
    if (blocked) {
      throw new Error('Vous ne pouvez pas contacter cet utilisateur');
    }

    // Chercher une conversation existante
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('listing_id', listingId)
      .or(`sender_id.eq.${userId},sender_id.eq.${listing.user_id}`)
      .limit(1);

    return {
      conversationId: listingId,
      isNew: !existingMessages || existingMessages.length === 0,
      ownerId: listing.user_id,
    };
  },

  /**
   * Récupère les conversations marketplace d'un utilisateur
   */
  async getListingConversations(userId) {
    // Récupérer tous les messages où l'utilisateur est impliqué
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        pharmacy_listings!inner (
          id,
          title,
          user_id,
          type,
          city,
          region,
          price,
          status,
          photos
        )
      `)
      .not('listing_id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!messages?.length) return [];

    // Filtrer pour ne garder que les messages où l'utilisateur est impliqué
    const userMessages = messages.filter(
      m => m.sender_id === userId || m.pharmacy_listings.user_id === userId
    );

    // Grouper par listing_id et construire les conversations
    const conversationsMap = new Map();

    userMessages.forEach(message => {
      const listingId = message.listing_id;
      if (!conversationsMap.has(listingId)) {
        const listing = message.pharmacy_listings;
        const isOwner = listing.user_id === userId;
        const otherId = isOwner ? null : listing.user_id; // On récupérera les profils après

        conversationsMap.set(listingId, {
          id: `listing_${listingId}`,
          type: 'listing',
          listingId,
          listing,
          isOwner,
          otherId,
          lastMessage: message,
          messages: [message],
          updated_at: message.created_at,
        });
      } else {
        const conv = conversationsMap.get(listingId);
        conv.messages.push(message);
        // Garder le message le plus récent
        if (new Date(message.created_at) > new Date(conv.lastMessage.created_at)) {
          conv.lastMessage = message;
          conv.updated_at = message.created_at;
        }
      }
    });

    const conversations = Array.from(conversationsMap.values());

    // Récupérer les profils des autres utilisateurs
    const otherUserIds = new Set();
    conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.sender_id !== userId) {
          otherUserIds.add(msg.sender_id);
        }
      });
    });

    let profileMap = {};
    if (otherUserIds.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, photo_url')
        .in('id', Array.from(otherUserIds));

      profiles?.forEach(p => profileMap[p.id] = p);
    }

    // Récupérer les utilisateurs bloqués
    let blockedUserIds = new Set();
    try {
      const blocked = await blockService.getBlockedUserIdsSimple(userId);
      blockedUserIds = new Set(blocked);
    } catch (e) {
      console.warn('Could not fetch blocked users:', e);
    }

    // Finaliser les conversations
    return conversations
      .map(conv => {
        // Trouver l'autre utilisateur
        const otherSenderId = conv.messages.find(m => m.sender_id !== userId)?.sender_id;
        const otherUser = otherSenderId ? profileMap[otherSenderId] : null;

        // Compter les messages non lus
        const unreadCount = conv.messages.filter(
          m => m.sender_id !== userId && !m.read
        ).length;

        return {
          ...conv,
          otherUser,
          otherId: otherSenderId,
          unreadCount,
        };
      })
      .filter(conv => !blockedUserIds.has(conv.otherId))
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  },

  /**
   * Récupère les messages d'une conversation marketplace
   */
  async getListingMessages(listingId, limit = 50, before = null) {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).reverse();
  },

  /**
   * Envoie un message pour une annonce marketplace
   */
  async sendListingMessage(listingId, senderId, content, attachments = null) {
    // Vérifier l'annonce et le propriétaire
    const { data: listing, error: listingError } = await supabase
      .from('pharmacy_listings')
      .select('user_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      throw new Error('Annonce introuvable');
    }

    const recipientId = listing.user_id === senderId
      ? null // Le propriétaire envoie un message, on trouvera le destinataire via l'historique
      : listing.user_id;

    // Vérifier les blocages si on connaît le destinataire
    if (recipientId) {
      const blocked = await blockService.areUsersBlocked(senderId, recipientId);
      if (blocked) {
        throw new Error('Vous ne pouvez pas envoyer de message à cet utilisateur');
      }
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        listing_id: listingId,
        sender_id: senderId,
        content,
        attachments,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour messages_updated_at sur l'annonce
    await supabase
      .from('pharmacy_listings')
      .update({ messages_updated_at: new Date().toISOString() })
      .eq('id', listingId);

    // Notifier le destinataire
    try {
      const actualRecipientId = recipientId || await this._findListingRecipient(listingId, senderId);

      if (actualRecipientId) {
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', senderId)
          .single();

        const senderName = senderProfile
          ? `${senderProfile.first_name} ${senderProfile.last_name?.[0] || ''}.`
          : 'Quelqu\'un';

        const preview = content.length > 80 ? content.slice(0, 80) + '...' : content;

        await notificationService.createNotification(
          actualRecipientId,
          NOTIFICATION_TYPES.NEW_MESSAGE,
          `Message de ${senderName}`,
          preview,
          { listing_id: listingId, sender_id: senderId }
        );
      }
    } catch (err) {
      console.error('Error creating listing message notification:', err);
    }

    return data;
  },

  /**
   * Marque les messages d'une conversation marketplace comme lus
   */
  async markListingMessagesAsRead(listingId, userId) {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('listing_id', listingId)
      .neq('sender_id', userId)
      .eq('read', false);

    if (error) throw error;
  },

  /**
   * Helper: Trouve le destinataire dans une conversation marketplace
   * (utilisé quand le propriétaire répond)
   */
  async _findListingRecipient(listingId, senderId) {
    const { data: messages } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('listing_id', listingId)
      .neq('sender_id', senderId)
      .limit(1);

    return messages?.[0]?.sender_id || null;
  },

  /**
   * S'abonne aux nouveaux messages d'une conversation marketplace
   */
  subscribeToListingMessages(listingId, callback) {
    const subscription = supabase
      .channel(`listing_messages:${listingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `listing_id=eq.${listingId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  },
};