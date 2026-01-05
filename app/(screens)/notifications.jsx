import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useNotifications } from '../../hooks/useNotifications';
import { getNotificationIcon, getNotificationColor, NOTIFICATION_TYPES } from '../../services/notificationService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';

export default function Notifications() {
  const router = useRouter();
  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    refresh 
  } = useNotifications();
  
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleNotificationPress = useCallback(async (notification) => {
    // Marquer comme lu
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigation selon le type
    const data = notification.data || {};
    
    switch (notification.type) {
      case NOTIFICATION_TYPES.MATCH:
        if (data.match_id) {
          router.push({ pathname: '/(screens)/matches' });
        }
        break;
      case NOTIFICATION_TYPES.MESSAGE:
        if (data.conversation_id) {
          router.push({ 
            pathname: '/(screens)/conversation', 
            params: { id: data.conversation_id } 
          });
        } else {
          router.push('/(tabs)/messages');
        }
        break;
      case NOTIFICATION_TYPES.APPLICATION_RECEIVED:
      case NOTIFICATION_TYPES.APPLICATION_VIEWED:
      case NOTIFICATION_TYPES.APPLICATION_ACCEPTED:
      case NOTIFICATION_TYPES.APPLICATION_REJECTED:
        if (data.application_id) {
          router.push({ 
            pathname: '/(screens)/applicationDetail', 
            params: { id: data.application_id } 
          });
        }
        break;
      case NOTIFICATION_TYPES.PROFILE_VIEWED:
        router.push('/(tabs)/profile');
        break;
      default:
        break;
    }
  }, [markAsRead, router]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const renderNotification = ({ item }) => {
    const isUnread = !item.read;
    const iconName = getNotificationIcon(item.type);
    const iconColor = getNotificationColor(item.type);

    return (
      <Pressable
        style={[styles.notificationItem, isUnread && styles.notificationUnread]}
        onPress={() => handleNotificationPress(item)}
      >
        {/* Icône */}
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Icon name={iconName} size={20} color={iconColor} />
        </View>

        {/* Contenu */}
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, isUnread && styles.textBold]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {item.content}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTime(item.created_at)}
          </Text>
        </View>

        {/* Indicateur non lu */}
        {isUnread && <View style={styles.unreadDot} />}
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Icon name="bell" size={50} color={theme.colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Aucune notification</Text>
      <Text style={styles.emptyText}>
        Vos notifications apparaîtront ici
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Icon name="arrowLeft" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrowLeft" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable style={styles.markAllButton} onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Tout lire</Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* Stats */}
      {unreadCount > 0 && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Liste */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: wp(1),
  },
  title: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 60,
  },
  markAllButton: {
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(3),
  },
  markAllText: {
    fontSize: hp(1.5),
    color: theme.colors.primary,
    fontWeight: '500',
  },
  statsBar: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
    backgroundColor: theme.colors.primary + '10',
  },
  statsText: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: hp(1),
  },
  emptyListContent: {
    flex: 1,
  },
  // Notification item
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: wp(3),
  },
  notificationUnread: {
    backgroundColor: theme.colors.primary + '08',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: hp(0.3),
  },
  notificationTitle: {
    fontSize: hp(1.7),
    color: theme.colors.text,
  },
  textBold: {
    fontWeight: '600',
  },
  notificationBody: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    lineHeight: hp(2.1),
  },
  notificationTime: {
    fontSize: hp(1.3),
    color: theme.colors.gray,
    marginTop: hp(0.3),
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    marginTop: hp(0.5),
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
    gap: hp(2),
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: hp(2.2),
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});