// app/(tabs)/homeAnimator.jsx
// Dashboard animateur - VERSION CORRIGÉE

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useAnimatorMissions } from '../../hooks/useMissions';
import { useFavorites } from '../../hooks/useFavorites';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import RoleAvatar from '../../components/common/RoleAvatar';
import { AnimatorStats } from '../../components/common/ProfileStats';
import { 
  StatsCard, 
  StatsGrid, 
  DashboardSection, 
  QuickActionCard,
  EmptyState,
} from '../../components/common/DashboardComponents';
import { MissionListCard } from '../../components/missions/MissionCard';
import { formatDistanceToNow } from '../../helpers/dateUtils';

export default function HomeAnimator() {
  const router = useRouter();
  const { session, profile, animatorProfile, refreshAnimatorProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Hook pour les missions - BONNE PRATIQUE
  const { 
    myMissions, 
    availableMissions, 
    loading: missionsLoading, 
    searching,
    stats: missionStats,
    refresh: refreshMissions,
    searchMissions,
  } = useAnimatorMissions(session?.user?.id);

  // Hook pour les favoris
  const {
    favorites: missionFavorites,
    loading: favoritesLoading,
  } = useFavorites(session?.user?.id, 'mission');

  // Missions actives (assignées ou en cours)
  const activeMissions = myMissions.filter(m => 
    ['assigned', 'in_progress'].includes(m.status)
  );

  // Rafraîchir les données
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refreshMissions(),
      refreshAnimatorProfile?.(),
    ]);
    setRefreshing(false);
  }, [refreshMissions, refreshAnimatorProfile]);

  // Charger les missions disponibles au montage
  useEffect(() => {
    if (session?.user?.id) {
      searchMissions({ limit: 5 });
    }
  }, [session?.user?.id, searchMissions]);

  const loading = missionsLoading || favoritesLoading;

  // Quick actions pour animateur
  const quickActions = [
    {
      icon: 'search',
      label: 'Chercher missions',
      onPress: () => router.push('/swipeMissions'),
      color: theme.colors.primary,
    },
    {
      icon: 'calendar',
      label: 'Mes dispos',
      onPress: () => router.push('/availability'),
      color: theme.colors.secondary,
    },
    {
      icon: 'star',
      label: 'Favoris',
      badge: missionFavorites?.length || 0,
      onPress: () => router.push('/favorites'),
      color: theme.colors.warning,
    },
    {
      icon: 'user',
      label: 'Mon profil',
      onPress: () => router.push('/profile'),
      color: theme.colors.dark,
    },
  ];

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header avec avatar et salutation */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              Bonjour{profile?.first_name ? `, ${profile.first_name}` : ''} 👋
            </Text>
            <Text style={styles.subtitle}>
              {animatorProfile?.available_now 
                ? '🟢 Disponible maintenant'
                : 'Prêt(e) pour de nouvelles missions ?'
              }
            </Text>
          </View>
          <Pressable onPress={() => router.push('/profile')}>
            <RoleAvatar
              photoUrl={profile?.photo_url}
              userType="animateur"
              size={50}
            />
          </Pressable>
        </View>

        {/* Stats rapides */}
        <StatsGrid>
          <StatsCard
            icon="briefcase"
            value={missionStats.upcoming}
            label="À venir"
            color={theme.colors.primary}
          />
          <StatsCard
            icon="check-circle"
            value={missionStats.completed}
            label="Terminées"
            color={theme.colors.success}
          />
          <StatsCard
            icon="star"
            value={animatorProfile?.average_rating?.toFixed(1) || '-'}
            label="Note moyenne"
            color={theme.colors.warning}
          />
          <StatsCard
            icon="trending-up"
            value={availableMissions?.length || 0}
            label="Disponibles"
            color={theme.colors.secondary}
          />
        </StatsGrid>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <QuickActionCard key={index} {...action} />
          ))}
        </View>

        {/* Missions en cours */}
        <DashboardSection
          title="Missions en cours"
          icon="briefcase"
          actionLabel={activeMissions.length > 0 ? "Voir tout" : null}
          onAction={() => router.push('/missions')}
        >
          {activeMissions.length > 0 ? (
            activeMissions.slice(0, 3).map(mission => (
              <MissionListCard
                key={mission.id}
                mission={mission}
                onPress={() => router.push(`/mission/${mission.id}`)}
              />
            ))
          ) : (
            <EmptyState
              icon="briefcase"
              title="Aucune mission en cours"
              subtitle="Explorez les missions disponibles"
              action={() => router.push('/swipeMissions')}
              actionLabel="Chercher des missions"
            />
          )}
        </DashboardSection>

        {/* Nouvelles missions disponibles */}
        <DashboardSection
          title="Nouvelles missions"
          icon="zap"
          actionLabel="Explorer"
          onAction={() => router.push('/swipeMissions')}
        >
          {searching ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Recherche...</Text>
            </View>
          ) : availableMissions.length > 0 ? (
            availableMissions.slice(0, 3).map(mission => (
              <MissionListCard
                key={mission.id}
                mission={mission}
                showDistance
                onPress={() => router.push(`/mission/${mission.id}`)}
              />
            ))
          ) : (
            <EmptyState
              icon="map-pin"
              title="Aucune mission à proximité"
              subtitle="Élargissez votre zone de recherche"
            />
          )}
        </DashboardSection>

        {/* Espace en bas */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(2),
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: hp(2.8),
    fontWeight: theme.fonts.bold,
    color: theme.colors.textDark,
  },
  subtitle: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    marginTop: hp(0.5),
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: hp(2),
    gap: wp(2),
  },
  loadingContainer: {
    padding: hp(3),
    alignItems: 'center',
  },
  loadingText: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
  },
  bottomSpacer: {
    height: hp(10),
  },
});