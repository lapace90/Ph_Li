// Liste des matches animateurs/labos
import { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useAnimatorMatches } from '../../hooks/useAnimatorMatching';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import { EmptyState } from '../../components/common/DashboardComponents';
import { formatDistanceToNow } from '../../helpers/dateUtils';

export default function AnimatorMatches() {
  const router = useRouter();
  const { profile } = useAuth();
  const { matches, loading, stats, refresh } = useAnimatorMatches();
  const [refreshing, setRefreshing] = useState(false);

  const isAnimator = profile?.role === 'animator';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const renderMatch = ({ item }) => {
    const otherParty = isAnimator 
      ? item.laboratory 
      : { ...item.animator, ...item.animator?.profile };
    
    const otherName = isAnimator 
      ? (item.laboratory?.brand_name || item.laboratory?.company_name)
      : `${otherParty?.first_name || ''} ${otherParty?.last_name?.[0] || ''}.`;

    const otherImage = isAnimator 
      ? item.laboratory?.logo_url 
      : otherParty?.photo_url;

    const isNew = item.matched_at && (new Date() - new Date(item.matched_at)) / (1000 * 60 * 60) < 24;

    return (
      <Pressable 
        style={commonStyles.card} 
        onPress={() => router.push({ pathname: '/animatorConversation', params: { matchId: item.id } })}
      >
        <View style={commonStyles.rowGap}>
          {otherImage ? (
            <Image source={{ uri: otherImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, commonStyles.centered, { backgroundColor: theme.colors.gray + '30' }]}>
              <Icon name={isAnimator ? 'building' : 'user'} size={24} color={theme.colors.gray} />
            </View>
          )}
          
          <View style={commonStyles.flex1}>
            <View style={commonStyles.rowBetween}>
              <Text style={commonStyles.listItemTitle}>{otherName}</Text>
              {isNew && (
                <View style={[commonStyles.badge, commonStyles.badgePrimary]}>
                  <Text style={[commonStyles.badgeText, commonStyles.badgeTextPrimary]}>Nouveau</Text>
                </View>
              )}
            </View>
            
            {item.mission && (
              <Text style={commonStyles.hint} numberOfLines={1}>
                <Icon name="briefcase" size={12} color={theme.colors.textLight} /> {item.mission.title}
              </Text>
            )}
            
            <Text style={styles.matchDate}>
              Match {formatDistanceToNow(item.matched_at)}
            </Text>
          </View>

          <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
        </View>
      </Pressable>
    );
  };

  const renderHeader = () => (
    <View style={[commonStyles.card, commonStyles.rowBetween, { marginBottom: hp(2) }]}>
      <View style={{ alignItems: 'center', flex: 1 }}>
        <Text style={styles.statValue}>{stats.total}</Text>
        <Text style={commonStyles.hint}>Total matchs</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={{ alignItems: 'center', flex: 1 }}>
        <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stats.thisWeek}</Text>
        <Text style={commonStyles.hint}>Cette semaine</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <EmptyState
      icon="heart"
      title="Pas encore de matchs"
      subtitle={isAnimator 
        ? "Explorez les missions pour trouver vos prochaines opportunités"
        : "Parcourez les profils d'animateurs pour vos missions"
      }
      action={() => router.push(isAnimator ? '/swipeMissions' : '/myMissions')}
      actionLabel={isAnimator ? "Explorer les missions" : "Voir mes missions"}
    />
  );

  if (loading && !refreshing) {
    return (
      <ScreenWrapper>
        <View style={commonStyles.header}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Mes Matchs</Text>
          <View style={commonStyles.headerSpacer} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Mes Matchs</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatch}
        ListHeaderComponent={matches.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={matches.length === 0 ? commonStyles.flex1 : commonStyles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      />
    </ScreenWrapper>
  );
}

const styles = {
  avatar: { width: 50, height: 50, borderRadius: 25 },
  statValue: { fontSize: hp(2.2), fontFamily: theme.fonts.bold, color: theme.colors.text },
  statDivider: { width: 1, height: hp(4), backgroundColor: theme.colors.border },
  matchDate: { fontSize: hp(1.2), color: theme.colors.textLight, marginTop: 4 },
};