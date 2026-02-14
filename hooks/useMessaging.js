import { useState, useEffect, useCallback } from 'react';
import { messagingService } from '../services/messagingService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook pour la liste des conversations (matchs avec messages)
 */
export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await messagingService.getConversations(user.id);
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime subscription pour les nouveaux messages
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = messagingService.subscribeToConversations(
      user.id,
      () => {
        // Rafraîchir la liste des conversations quand un nouveau message arrive
        fetchConversations();
      }
    );

    return unsubscribe;
  }, [user?.id, fetchConversations]);

  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return {
    conversations,
    loading,
    error,
    unreadTotal,
    refresh: fetchConversations,
  };
};

/**
 * Hook pour les messages d'un match
 */
export const useMessages = (matchId) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchMessages = useCallback(async (before = null) => {
    if (!matchId) return;

    if (!before) setLoading(true);
    setError(null);

    try {
      const data = await messagingService.getMessages(matchId, 50, before);
      
      if (before) {
        setMessages(prev => [...data, ...prev]);
      } else {
        setMessages(data);
      }
      
      setHasMore(data.length === 50);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Marquer comme lu
  useEffect(() => {
    if (!matchId || !user?.id) return;
    messagingService.markAsRead(matchId, user.id);
  }, [matchId, user?.id, messages]);

  // Realtime subscription pour nouveaux messages
  useEffect(() => {
    if (!matchId) return;

    const unsubscribe = messagingService.subscribeToMessages(
      matchId,
      (newMessage) => {
        setMessages(prev => {
          // Éviter les doublons
          if (prev.find(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
        
        // Marquer comme lu si c'est pas notre message
        if (newMessage.sender_id !== user?.id) {
          messagingService.markAsRead(matchId, user.id);
        }
      }
    );

    return unsubscribe;
  }, [matchId, user?.id]);

  const sendMessage = useCallback(async (content, attachments = null) => {
    if (!matchId || !user?.id || !content.trim()) return;

    setSending(true);
    try {
      const message = await messagingService.sendMessage(
        matchId,
        user.id,
        content.trim(),
        attachments
      );
      
      // Ajouter le message localement
      setMessages(prev => {
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      
      return message;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    } finally {
      setSending(false);
    }
  }, [matchId, user?.id]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || messages.length === 0) return;
    const oldestMessage = messages[0];
    fetchMessages(oldestMessage.created_at);
  }, [hasMore, loading, messages, fetchMessages]);

  return {
    messages,
    loading,
    sending,
    error,
    hasMore,
    sendMessage,
    loadMore,
    refresh: () => fetchMessages(),
  };
};

/**
 * Hook pour le compteur de messages non lus
 */
export const useUnreadCount = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const unread = await messagingService.getUnreadCount(user.id);
      setCount(unread);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Real-time subscription pour mettre à jour le compteur
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = messagingService.subscribeToConversations(
      user.id,
      () => {
        // Rafraîchir le compteur quand un nouveau message arrive
        fetchCount();
      }
    );

    return unsubscribe;
  }, [user?.id, fetchCount]);

  return count;
};