import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@notification_settings';

/**
 * Service de notifications
 */
export const notificationService = {
  /**
   * Récupère les notifications d'un utilisateur
   */
  async getNotifications(userId, limit = 50) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Marque une notification comme lue
   */
  async markAsRead(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  /**
   * Marque toutes les notifications comme lues
   */
  async markAllAsRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  },

  /**
   * Supprime une notification
   */
  async deleteNotification(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  /**
   * Compte les notifications non lues
   */
  async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Crée une notification
   */
  async createNotification(userId, type, title, content, data = {}) {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        content,
        data,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return notification;
  },

  /**
   * S'abonne aux nouvelles notifications
   */
  subscribeToNotifications(userId, callback) {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  },

  // ==========================================
  // PUSH NOTIFICATIONS (Expo)
  // ==========================================

  /**
   * Enregistre le token push
   */
  async registerPushToken(userId, token, platform) {
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token,
        platform,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,token'
      });

    if (error) throw error;
  },

  /**
   * Supprime un token push
   */
  async removePushToken(userId, token) {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);

    if (error) throw error;
  },
};

// Types de notifications
export const NOTIFICATION_TYPES = {
  MATCH: 'match',
  MESSAGE: 'message',
  APPLICATION_RECEIVED: 'application_received',
  APPLICATION_VIEWED: 'application_viewed',
  APPLICATION_ACCEPTED: 'application_accepted',
  APPLICATION_REJECTED: 'application_rejected',
  SUPER_LIKE: 'super_like',
  PROFILE_VIEWED: 'profile_viewed',
  OFFER_EXPIRED: 'offer_expired',
  SYSTEM: 'system',
  // Missions
  MISSION_PROPOSAL: 'mission_proposal',
  PROPOSAL_ACCEPTED: 'proposal_accepted',
  PROPOSAL_DECLINED: 'proposal_declined',
  MISSION_CONFIRMED: 'mission_confirmed',
  MISSION_REVIEW_REMINDER: 'mission_review_reminder',
  NEW_REVIEW: 'new_review',
};

// Icônes par type
export const getNotificationIcon = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.MATCH:
      return 'heart';
    case NOTIFICATION_TYPES.MESSAGE:
      return 'messageCircle';
    case NOTIFICATION_TYPES.APPLICATION_RECEIVED:
      return 'fileText';
    case NOTIFICATION_TYPES.APPLICATION_VIEWED:
      return 'eye';
    case NOTIFICATION_TYPES.APPLICATION_ACCEPTED:
      return 'checkCircle';
    case NOTIFICATION_TYPES.APPLICATION_REJECTED:
      return 'x';
    case NOTIFICATION_TYPES.SUPER_LIKE:
      return 'star';
    case NOTIFICATION_TYPES.PROFILE_VIEWED:
      return 'user';
    case NOTIFICATION_TYPES.OFFER_EXPIRED:
      return 'clock';
    case NOTIFICATION_TYPES.MISSION_PROPOSAL:
    case NOTIFICATION_TYPES.MISSION_CONFIRMED:
      return 'briefcase';
    case NOTIFICATION_TYPES.PROPOSAL_ACCEPTED:
      return 'checkCircle';
    case NOTIFICATION_TYPES.PROPOSAL_DECLINED:
      return 'x';
    case NOTIFICATION_TYPES.MISSION_REVIEW_REMINDER:
    case NOTIFICATION_TYPES.NEW_REVIEW:
      return 'star';
    default:
      return 'bell';
  }
};

// Mapping type → clé de paramétrage
const NOTIFICATION_SETTINGS_MAP = {
  [NOTIFICATION_TYPES.MATCH]: 'newMatch',
  [NOTIFICATION_TYPES.SUPER_LIKE]: 'newMatch',
  [NOTIFICATION_TYPES.MESSAGE]: 'newMessage',
  [NOTIFICATION_TYPES.APPLICATION_RECEIVED]: 'applicationStatus',
  [NOTIFICATION_TYPES.APPLICATION_VIEWED]: 'applicationStatus',
  [NOTIFICATION_TYPES.APPLICATION_ACCEPTED]: 'applicationStatus',
  [NOTIFICATION_TYPES.APPLICATION_REJECTED]: 'applicationStatus',
  [NOTIFICATION_TYPES.OFFER_EXPIRED]: 'newJobInArea',
  [NOTIFICATION_TYPES.MISSION_PROPOSAL]: 'missionUpdates',
  [NOTIFICATION_TYPES.PROPOSAL_ACCEPTED]: 'missionUpdates',
  [NOTIFICATION_TYPES.PROPOSAL_DECLINED]: 'missionUpdates',
  [NOTIFICATION_TYPES.MISSION_CONFIRMED]: 'missionUpdates',
  [NOTIFICATION_TYPES.MISSION_REVIEW_REMINDER]: 'missionUpdates',
  [NOTIFICATION_TYPES.NEW_REVIEW]: 'missionUpdates',
};

/**
 * Vérifie si une notification de ce type doit déclencher une alerte
 * (toast/push) selon les préférences utilisateur.
 * Les notifications sont toujours créées en base, mais l'alerte
 * visuelle peut être supprimée selon les préférences.
 */
export const shouldAlertForType = async (type) => {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!stored) return true; // Pas de prefs = tout activé par défaut

    const settings = JSON.parse(stored);

    // Master toggle
    if (settings.pushEnabled === false) return false;

    // Vérifier le paramétrage spécifique
    const settingKey = NOTIFICATION_SETTINGS_MAP[type];
    if (settingKey && settings[settingKey] === false) return false;

    return true;
  } catch {
    return true;
  }
};

// Couleurs par type
export const getNotificationColor = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.MATCH:
      return '#FF6B6B';
    case NOTIFICATION_TYPES.MESSAGE:
      return '#4ECDC4';
    case NOTIFICATION_TYPES.APPLICATION_ACCEPTED:
      return '#2ECC71';
    case NOTIFICATION_TYPES.APPLICATION_REJECTED:
      return '#E74C3C';
    case NOTIFICATION_TYPES.SUPER_LIKE:
      return '#FFB800';
    default:
      return '#9B59B6';
  }
};