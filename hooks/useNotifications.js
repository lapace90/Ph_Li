import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook pour la liste des notifications
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = notificationService.subscribeToNotifications(
      user.id,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
      }
    );

    return unsubscribe;
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, read: true }
            : n
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [user?.id]);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
};

/**
 * Hook pour le compteur de notifications non lues
 */
export const useUnreadNotificationCount = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const unread = await notificationService.getUnreadCount(user.id);
      setCount(unread);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Actualiser périodiquement
  useEffect(() => {
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Realtime
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = notificationService.subscribeToNotifications(
      user.id,
      () => {
        setCount(prev => prev + 1);
      }
    );

    return unsubscribe;
  }, [user?.id]);

  return count;
};

/**
 * Hook pour les push notifications
 * NOTE: Nécessite un development build (pas Expo Go)
 * Décommentez quand vous utilisez un dev build
 */
export const usePushNotifications = () => {
  // Push notifications désactivées pour Expo Go
  // Activez avec un development build
  return {
    expoPushToken: null,
    permissionStatus: null,
    registerForPushNotifications: async () => null,
  };
};