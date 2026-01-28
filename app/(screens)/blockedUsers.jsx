// Écran de gestion des utilisateurs bloqués

import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useBlocks } from '../../hooks/useBlocks';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import Avatar from '../../components/common/Avatar';

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { blockedUsers, loading, unblockUser, refresh } = useBlocks(user?.id);

  const [unblockingId, setUnblockingId] = useState(null);

  const handleUnblock = async (blockedId) => {
    setUnblockingId(blockedId);
    await unblockUser(blockedId);
    setUnblockingId(null);
  };

  const renderBlockedUser = ({ item }) => {
    const profile = item.blocked_user;
    const isUnblocking = unblockingId === item.blocked_id;

    return (
      <View style={styles.userItem}>
        <Avatar
          uri={profile?.photo_url}
          size={hp(6)}
          style={styles.avatar}
        />

        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {profile?.first_name || 'Utilisateur'} {profile?.last_name || ''}
          </Text>
          <Text style={styles.blockDate}>
            Bloqué le {new Date(item.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>

        <Pressable
          style={[styles.unblockButton, isUnblocking && styles.unblockButtonLoading]}
          onPress={() => handleUnblock(item.blocked_id)}
          disabled={isUnblocking}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={styles.unblockText}>Débloquer</Text>
          )}
        </Pressable>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Icon name="users" size={48} color={theme.colors.textLight} />
      </View>
      <Text style={styles.emptyTitle}>Aucun utilisateur bloqué</Text>
      <Text style={styles.emptyText}>
        Les utilisateurs que vous bloquez apparaîtront ici.
        Vous pouvez les débloquer à tout moment.
      </Text>
    </View>
  );

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <BackButton router={router} />
        <Text style={styles.headerTitle}>Utilisateurs bloqués</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Icon name="info" size={18} color={theme.colors.secondary} />
        <Text style={styles.infoText}>
          Les utilisateurs bloqués ne peuvent plus vous contacter ni voir votre profil.
          Vous ne verrez plus leur contenu dans l'application.
        </Text>
      </View>

      {/* Liste */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderBlockedUser}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={blockedUsers.length === 0 ? styles.emptyList : styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refresh}
          refreshing={loading}
        />
      )}
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
  },
  headerTitle: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.secondary + '10',
    marginHorizontal: wp(4),
    padding: wp(3),
    borderRadius: theme.radius.md,
    marginBottom: hp(2),
  },
  infoText: {
    flex: 1,
    marginLeft: wp(2),
    fontSize: hp(1.5),
    fontFamily: theme.fonts.regular,
    color: theme.colors.secondary,
    lineHeight: hp(2.2),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: wp(4),
  },
  emptyList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: wp(3),
    borderRadius: theme.radius.md,
    marginBottom: hp(1.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    marginRight: wp(3),
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  blockDate: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.regular,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  unblockButton: {
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    minWidth: wp(22),
    alignItems: 'center',
  },
  unblockButtonLoading: {
    opacity: 0.7,
  },
  unblockText: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  emptyTitle: {
    fontSize: hp(2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(1),
  },
  emptyText: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.regular,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: hp(2.4),
  },
});
