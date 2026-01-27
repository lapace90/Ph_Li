import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { useConversations } from '../../hooks/useMessaging';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';

export default function Messages() {
  const router = useRouter();
  const { user } = useAuth();
  const { conversations, loading, unreadTotal, refresh } = useConversations();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleConversationPress = useCallback((conversation) => {
    router.push({
      pathname: '/(screens)/conversation',
      params: { matchId: conversation.id }
    });
  }, [router]);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  const renderConversation = ({ item }) => {
    const hasUnread = item.unreadCount > 0;
    const lastMessage = item.lastMessage;
    const offer = item.match?.job_offers || item.match?.internship_offers;

    return (
      <Pressable
        style={[styles.conversationItem, hasUnread && styles.conversationUnread]}
        onPress={() => handleConversationPress(item)}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.otherUser?.photo_url ? (
            <Image source={{ uri: item.otherUser.photo_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Icon name="user" size={24} color={theme.colors.gray} />
            </View>
          )}
          {hasUnread && <View style={styles.unreadDot} />}
        </View>

        {/* Contenu */}
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.userName, hasUnread && styles.textBold]} numberOfLines={1}>
              {item.otherUser 
                ? `${item.otherUser.first_name} ${item.otherUser.last_name?.[0] || ''}.`
                : 'Utilisateur'
              }
            </Text>
            <Text style={styles.time}>
              {formatTime(lastMessage?.created_at || item.updated_at)}
            </Text>
          </View>
          
          {offer && (
            <Text style={styles.offerTitle} numberOfLines={1}>
              {offer.title}
            </Text>
          )}
          
          <Text 
            style={[styles.lastMessage, hasUnread && styles.textBold]} 
            numberOfLines={1}
          >
            {lastMessage?.sender_id === user?.id && 'Vous : '}
            {lastMessage?.content || 'Nouvelle conversation'}
          </Text>
        </View>

        {/* Badge non lu */}
        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {item.unreadCount > 9 ? '9+' : item.unreadCount}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  const getEmptyConfig = () => {
    const userType = user?.user_type;
    if (userType === 'laboratoire') {
      return {
        subtitle: 'Vos échanges avec les animateurs apparaîtront ici après un match',
        buttonLabel: 'Recruter des animateurs',
        buttonIcon: 'search',
        route: '/(tabs)/matching',
      };
    }
    if (userType === 'titulaire') {
      return {
        subtitle: 'Vos échanges avec les candidats apparaîtront ici après un match',
        buttonLabel: 'Trouver des candidats',
        buttonIcon: 'heart',
        route: '/(tabs)/matching',
      };
    }
    if (userType === 'animateur') {
      return {
        subtitle: 'Vos échanges avec les recruteurs apparaîtront ici après un match',
        buttonLabel: 'Découvrir des missions',
        buttonIcon: 'briefcase',
        route: '/(tabs)/matching',
      };
    }
    return {
      subtitle: 'Vos échanges apparaîtront ici après un match',
      buttonLabel: 'Découvrir des offres',
      buttonIcon: 'heart',
      route: '/(tabs)/matching',
    };
  };

  const renderEmpty = () => {
    const config = getEmptyConfig();
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Icon name="messageCircle" size={50} color={theme.colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Aucune conversation</Text>
        <Text style={styles.emptyText}>{config.subtitle}</Text>
        <Pressable
          style={styles.discoverButton}
          onPress={() => router.push(config.route)}
        >
          <Icon name={config.buttonIcon} size={18} color="white" />
          <Text style={styles.discoverButtonText}>{config.buttonLabel}</Text>
        </Pressable>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
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
        <Text style={styles.title}>Messages</Text>
        {unreadTotal > 0 && (
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>{unreadTotal}</Text>
          </View>
        )}
      </View>

      {/* Liste des conversations */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          conversations.length === 0 && styles.emptyListContent
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
    paddingHorizontal: wp(5),
    paddingTop: hp(6),
    paddingBottom: hp(2),
    gap: wp(2),
  },
  title: {
    fontSize: hp(3),
    fontWeight: '700',
    color: theme.colors.text,
  },
  totalBadge: {
    backgroundColor: theme.colors.rose,
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.3),
    borderRadius: 12,
  },
  totalBadgeText: {
    color: 'white',
    fontSize: hp(1.4),
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: wp(5),
  },
  emptyListContent: {
    flex: 1,
  },
  // Conversation item
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: wp(3),
  },
  conversationUnread: {
    backgroundColor: theme.colors.primary + '08',
    marginHorizontal: -wp(5),
    paddingHorizontal: wp(5),
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.darkLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  conversationContent: {
    flex: 1,
    gap: hp(0.2),
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    flex: 1,
    fontSize: hp(1.8),
    color: theme.colors.text,
  },
  textBold: {
    fontWeight: '600',
  },
  time: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginLeft: wp(2),
  },
  offerTitle: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(1.5),
  },
  unreadCount: {
    color: 'white',
    fontSize: hp(1.2),
    fontWeight: '700',
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
    lineHeight: hp(2.4),
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    marginTop: hp(2),
  },
  discoverButtonText: {
    color: 'white',
    fontSize: hp(1.7),
    fontWeight: '600',
  },
});