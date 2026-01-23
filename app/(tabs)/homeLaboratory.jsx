import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useLaboratoryMissions } from '../../hooks/useMissions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import { StatsGrid, DashboardSection, QuickActionCard, LimitBanner, EmptyState } from '../../components/common/DashboardComponents';
import { MissionListCard } from '../../components/missions/MissionCard';
import { SubscriptionBadge } from '../../components/laboratories/LaboratoryCard';

export default function HomeLaboratory() {
  const router = useRouter();
  const { session, profile, laboratoryProfile, refreshLaboratoryProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { missions, pendingApplicationsCount, loading, refresh: refreshMissions } = useLaboratoryMissions(session?.user?.id);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshMissions(), refreshLaboratoryProfile?.()]);
    setRefreshing(false);
  }, [refreshMissions, refreshLaboratoryProfile]);

  const limits = laboratoryProfile?.limits || {};
  const activeMissions = missions.filter(m => ['open', 'assigned', 'in_progress'].includes(m.status));
  const canCreateMission = limits.missions?.canCreate !== false;

  const stats = [
    { label: 'Missions actives', value: activeMissions.length, icon: 'briefcase' },
    { label: 'Candidatures', value: pendingApplicationsCount, icon: 'users', color: pendingApplicationsCount > 0 ? theme.colors.primary : undefined },
    { label: 'Animateurs favoris', value: laboratoryProfile?.favorites_count || 0, icon: 'star' },
  ];

  const quickActions = [
    { icon: 'plus', label: 'Nouvelle mission', onPress: () => router.push('/createMission'), color: theme.colors.primary, disabled: !canCreateMission },
    { icon: 'search', label: 'Animateurs', onPress: () => router.push('/searchAnimators'), color: theme.colors.secondary },
    { icon: 'star', label: 'Favoris', onPress: () => router.push('/laboratoryFavorites'), color: theme.colors.warning },
    { icon: 'settings', label: 'Paramètres', onPress: () => router.push('/settings'), color: theme.colors.dark },
  ];

  return (
    <ScreenWrapper>
      <ScrollView
        style={commonStyles.flex1}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      >
        <View style={commonStyles.headerNoBorder}>
          <View style={commonStyles.flex1}>
            <Text style={commonStyles.headerTitleLarge}>
              {laboratoryProfile?.brand_name || laboratoryProfile?.company_name || 'Mon labo'}
            </Text>
            <SubscriptionBadge tier={limits.tier} />
          </View>
          {laboratoryProfile?.logo_url ? (
            <Image source={{ uri: laboratoryProfile.logo_url }} style={styles.logo} />
          ) : (
            <View style={[styles.logo, commonStyles.centered, { backgroundColor: theme.colors.primary + '15' }]}>
              <Icon name="building" size={24} color={theme.colors.primary} />
            </View>
          )}
        </View>

        {!canCreateMission && (
          <LimitBanner
            icon="alertCircle"
            title="Limite atteinte"
            message={`Vous avez atteint votre limite de ${limits.missions?.limit} missions`}
            action={() => router.push('/subscription')}
            actionLabel="Upgrader"
          />
        )}

        <StatsGrid stats={stats} style={{ marginHorizontal: wp(5), marginBottom: hp(2) }} />

        <View style={styles.quickActions}>
          {quickActions.map((action, i) => (
            <QuickActionCard key={i} {...action} />
          ))}
        </View>

        <DashboardSection title="Missions actives" action={() => router.push('/myMissions')} actionLabel="Tout voir">
          {activeMissions.length > 0 ? (
            activeMissions.slice(0, 3).map(mission => (
              <MissionListCard key={mission.id} mission={mission} showStatus onPress={() => router.push(`/missionDetail/${mission.id}`)} />
            ))
          ) : (
            <EmptyState icon="briefcase" title="Aucune mission active" subtitle="Créez votre première mission" action={() => router.push('/createMission')} actionLabel="Créer" />
          )}
        </DashboardSection>

        <View style={commonStyles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = {
  logo: { width: 50, height: 50, borderRadius: 12 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: wp(5), marginBottom: hp(2), gap: wp(2) },
};