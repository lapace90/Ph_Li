// app/(tabs)/homeAnimator.jsx
// Dashboard animateur

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { missionService } from '../../services/missionService';
import { favoritesService, FAVORITE_TYPES } from '../../services/favoritesService';
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
  const [activeMissions, setActiveMissions] = useState([]);
  const [recentMissions, setRecentMissions] = useState([]);
  const [favoritesCount, setFavoritesCount] = useState({ missions: 0, labs: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // Charger les missions en cours (assignées à cet animateur)
      const active = await missionService.getAnimatorMissions(session.user.id, ['assigned', 'in_progress']);
      setActiveMissions(active);

      // Charger les missions récentes (ouvertes, dans le rayon)
      const recent = await missionService.searchMissions({
        status: 'open',
        limit: 5,
        // TODO: Filtrer par géolocation
      });
      setRecentMissions(recent);

      // Compter les favoris
      const [favMissions, favLabs] = await Promise.all([
        favoritesService.getByType(session.user.id, FAVORITE_TYPES.MISSION),
        favoritesService.getByType(session.user.id, FAVORITE_TYPES.LABORATORY),
      ]);
      setFavoritesCount({
        missions: favMissions.length,
        labs: favLabs.length,
      });

    } catch (error) {
      console.error('Error loading animator dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshAnimatorProfile()]);
    setRefreshing(false);
  };

  const stats = animatorProfile?.stats || {};

  return (
    <ScreenWrapper>
      <ScrollView
        style={commonStyles.flex1}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              Bonjour {profile?.first_name || 'Animateur'} 👋
            </Text>
            <Text style={styles.subGreeting}>
              {activeMissions.length > 0 
                ? `${activeMissions.length} mission${activeMissions.length > 1 ? 's' : ''} en cours`
                : 'Prêt pour de nouvelles missions ?'
              }
            </Text>
          </View>
          <Pressable onPress={() => router.push('/profile')}>
            <RoleAvatar 
              role="animateur" 
              gender={profile?.gender} 
              size={48} 
            />
          </Pressable>
        </View>

        {/* Stats profil */}
        <View style={styles.statsContainer}>
          <AnimatorStats 
            userId={session?.user?.id}
            missionsCount={stats.missionsCompleted || 0}
            averageRating={stats.averageRating}
          />
        </View>

        {/* Actions rapides */}
        <DashboardSection title="Actions rapides">
          <View style={styles.quickActions}>
            <QuickActionCard
              icon="search"
              title="Chercher des missions"
              subtitle="Swipe sur les offres"
              color={theme.colors.primary}
              onPress={() => router.push('/swipeMissions')}
            />
            <QuickActionCard
              icon="calendar"
              title="Mes disponibilités"
              subtitle={animatorProfile?.available_now ? 'Disponible maintenant' : 'Mettre à jour'}
              color={theme.colors.secondary}
              onPress={() => router.push('/editAnimatorProfile')}
            />
          </View>
        </DashboardSection>

        {/* Missions en cours */}
        {activeMissions.length > 0 && (
          <DashboardSection 
            title="Missions en cours" 
            actionLabel="Voir tout"
            onAction={() => router.push('/myMissions')}
          >
            <View style={styles.missionsList}>
              {activeMissions.slice(0, 2).map((mission) => (
                <MissionListCard
                  key={mission.id}
                  mission={mission}
                  laboratory={mission.client_profile}
                  showStatus
                  onPress={() => router.push(`/missionDetail/${mission.id}`)}
                />
              ))}
            </View>
          </DashboardSection>
        )}

        {/* Stats détaillées */}
        <DashboardSection title="Vos statistiques">
          <StatsGrid>
            <StatsCard
              icon="briefcase"
              value={stats.missionsCompleted || 0}
              label="Missions"
              color={theme.colors.primary}
              onPress={() => router.push('/myMissions')}
            />
            <StatsCard
              icon="star"
              value={stats.averageRating?.toFixed(1) || '-'}
              label="Note moyenne"
              color={theme.colors.warning}
            />
          </StatsGrid>
          <View style={{ height: hp(1.5) }} />
          <StatsGrid>
            <StatsCard
              icon="bookmark"
              value={favoritesCount.missions}
              label="Missions sauvegardées"
              color={theme.colors.secondary}
              onPress={() => router.push('/favoritesMissions')}
            />
            <StatsCard
              icon="heart"
              value={favoritesCount.labs}
              label="Labos suivis"
              color={theme.colors.rose}
              onPress={() => router.push('/favoritesLabs')}
            />
          </StatsGrid>
        </DashboardSection>

        {/* Missions récentes */}
        <DashboardSection 
          title="Nouvelles missions" 
          subtitle="Près de vous"
          actionLabel="Explorer"
          onAction={() => router.push('/swipeMissions')}
        >
          {recentMissions.length > 0 ? (
            <View style={styles.missionsList}>
              {recentMissions.slice(0, 3).map((mission) => (
                <MissionListCard
                  key={mission.id}
                  mission={mission}
                  laboratory={mission.client_profile}
                  onPress={() => router.push(`/missionDetail/${mission.id}`)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="briefcase"
              title="Aucune mission disponible"
              subtitle="Revenez bientôt ou élargissez votre zone de recherche"
            />
          )}
        </DashboardSection>

        <View style={{ height: hp(4) }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1),
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: hp(2.4),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  subGreeting: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    marginTop: hp(0.3),
  },
  statsContainer: {
    paddingHorizontal: wp(5),
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  quickActions: {
    gap: hp(1.5),
  },
  missionsList: {
    gap: hp(1.5),
  },
});