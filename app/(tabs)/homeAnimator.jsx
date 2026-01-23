// app/(tabs)/homeAnimator.jsx
import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useAnimatorMissions } from '../../hooks/useMissions';
import { useFavorites } from '../../hooks/useFavorites';
import { FAVORITE_TYPES } from '../../services/favoritesService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import RoleAvatar from '../../components/common/RoleAvatar';
import { AnimatorStats } from '../../components/common/ProfileStats';
import { StatsGrid, DashboardSection, QuickActionCard, EmptyState } from '../../components/common/DashboardComponents';
import { MissionListCard } from '../../components/missions/MissionCard';

export default function HomeAnimator() {
  const router = useRouter();
  const { session, profile, animatorProfile, refreshAnimatorProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { myMissions, availableMissions, loading, searchMissions, refresh: refreshMissions } = useAnimatorMissions(session?.user?.id);
  const { favorites: missionFavorites } = useFavorites(session?.user?.id, FAVORITE_TYPES.MISSION);

  const activeMissions = myMissions.filter(m => ['assigned', 'in_progress'].includes(m.status));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshMissions(), refreshAnimatorProfile?.()]);
    setRefreshing(false);
  }, [refreshMissions, refreshAnimatorProfile]);

  useEffect(() => {
    if (session?.user?.id) searchMissions({ limit: 5 });
  }, [session?.user?.id, searchMissions]);

  const quickActions = [
    { icon: 'search', label: 'Chercher missions', onPress: () => router.push('/swipeMissions'), color: theme.colors.primary },
    { icon: 'calendar', label: 'Mes dispos', onPress: () => router.push('/availability'), color: theme.colors.secondary },
    { icon: 'star', label: 'Favoris', badge: missionFavorites?.length || 0, onPress: () => router.push('/animatorFavorites'), color: theme.colors.warning },
    { icon: 'user', label: 'Mon profil', onPress: () => router.push('/profile'), color: theme.colors.dark },
  ];

  return (
    <ScreenWrapper>
      <ScrollView
        style={commonStyles.flex1}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      >
        <View style={[commonStyles.headerNoBorder, commonStyles.rowBetween]}>
          <View style={commonStyles.flex1}>
            <Text style={commonStyles.headerTitleLarge}>
              Bonjour{profile?.first_name ? `, ${profile.first_name}` : ''} 👋
            </Text>
            <Text style={commonStyles.hint}>
              {animatorProfile?.available_now ? '🟢 Disponible maintenant' : 'Prêt(e) pour de nouvelles missions ?'}
            </Text>
          </View>
          <RoleAvatar profile={profile} size={50} />
        </View>

        <AnimatorStats profile={animatorProfile} style={{ marginHorizontal: wp(5), marginBottom: hp(2) }} />

        <View style={styles.quickActions}>
          {quickActions.map((action, i) => (
            <QuickActionCard key={i} {...action} />
          ))}
        </View>

        {activeMissions.length > 0 && (
          <DashboardSection title="Missions en cours" action={() => router.push('/myMissions')} actionLabel="Tout voir">
            {activeMissions.slice(0, 2).map(mission => (
              <MissionListCard key={mission.id} mission={mission} showStatus onPress={() => router.push(`/missionDetail/${mission.id}`)} />
            ))}
          </DashboardSection>
        )}

        <DashboardSection title="Missions à proximité" action={() => router.push('/swipeMissions')} actionLabel="Explorer">
          {loading ? (
            <Text style={commonStyles.hint}>Recherche...</Text>
          ) : availableMissions.length > 0 ? (
            availableMissions.slice(0, 3).map(mission => (
              <MissionListCard key={mission.id} mission={mission} showDistance onPress={() => router.push(`/mission/${mission.id}`)} />
            ))
          ) : (
            <EmptyState icon="mapPin" title="Aucune mission à proximité" subtitle="Élargissez votre zone de recherche" />
          )}
        </DashboardSection>

        <View style={commonStyles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = {
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: wp(5), marginBottom: hp(2), gap: wp(2) },
};