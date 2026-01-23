// Dashboard laboratoire

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { missionService } from '../../services/missionService';
import { favoritesService, FAVORITE_TYPES } from '../../services/favoritesService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import { 
  StatsCard, 
  StatsBigCard,
  StatsGrid, 
  DashboardSection, 
  QuickActionCard,
  LimitBanner,
  EmptyState,
} from '../../components/common/DashboardComponents';
import { MissionListCard } from '../../components/missions/MissionCard';
import { SubscriptionBadge } from '../../components/laboratories/LaboratoryCard';

export default function HomeLaboratory() {
  const router = useRouter();
  const { session, profile, laboratoryProfile, refreshLaboratoryProfile } = useAuth();
  
  const [refreshing, setRefreshing] = useState(false);
  const [missions, setMissions] = useState([]);
  const [pendingApplications, setPendingApplications] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // Charger les missions du labo
      const missionsData = await missionService.searchMissions({
        clientId: session.user.id,
        limit: 10,
      });
      setMissions(missionsData);

      // Compter les candidatures en attente
      let pendingCount = 0;
      for (const mission of missionsData.filter(m => m.status === 'open')) {
        const apps = await missionService.getMissionApplications(mission.id, 'pending');
        pendingCount += apps.length;
      }
      setPendingApplications(pendingCount);

    } catch (error) {
      console.error('Error loading lab dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshLaboratoryProfile()]);
    setRefreshing(false);
  };

  const stats = laboratoryProfile?.stats || {};
  const limits = laboratoryProfile?.limits || {};
  const tier = limits.tier || 'free';

  const activeMissions = missions.filter(m => ['open', 'assigned', 'in_progress'].includes(m.status));
  const canCreateMission = limits.missions?.canCreate !== false;

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
            {laboratoryProfile?.logo_url ? (
              <Image source={{ uri: laboratoryProfile.logo_url }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Icon name="laboratory" size={28} color={theme.colors.primary} />
              </View>
            )}
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.companyName} numberOfLines={1}>
                  {laboratoryProfile?.brand_name || laboratoryProfile?.company_name || 'Mon Laboratoire'}
                </Text>
                {laboratoryProfile?.siret_verified && (
                  <Icon name="checkCircle" size={16} color={theme.colors.success} />
                )}
              </View>
              <SubscriptionBadge tier={tier} />
            </View>
          </View>
          <Pressable 
            style={styles.settingsButton}
            onPress={() => router.push('/editLaboratoryProfile')}
          >
            <Icon name="settings" size={22} color={theme.colors.text} />
          </Pressable>
        </View>

        {/* Bannière limite si nécessaire */}
        {tier === 'free' && (
          <View style={styles.bannerContainer}>
            <LimitBanner
              title="Compte gratuit"
              subtitle="Passez à Starter pour publier des missions"
              actionLabel="Upgrader"
              onAction={() => router.push('/subscription')}
              variant="info"
            />
          </View>
        )}

        {!canCreateMission && tier !== 'free' && (
          <View style={styles.bannerContainer}>
            <LimitBanner
              title="Limite atteinte"
              subtitle={`${limits.missions?.used}/${limits.missions?.limit} missions ce mois`}
              actionLabel="Voir offres"
              onAction={() => router.push('/subscription')}
              variant="warning"
            />
          </View>
        )}

        {/* Stats principales */}
        <View style={styles.statsMainContainer}>
          <StatsBigCard
            icon="briefcase"
            value={stats.activeMissions || 0}
            label="Missions actives"
            subtitle={`${stats.completedMissions || 0} missions terminées au total`}
            color={theme.colors.primary}
            onPress={() => router.push('/myLabMissions')}
          />
        </View>

        {/* Actions rapides */}
        <DashboardSection title="Actions rapides">
          <View style={styles.quickActions}>
            <QuickActionCard
              icon="plus"
              title="Créer une mission"
              subtitle={canCreateMission ? 'Publier une nouvelle offre' : 'Limite atteinte'}
              color={theme.colors.primary}
              onPress={() => router.push('/createMission')}
              disabled={!canCreateMission}
            />
            <QuickActionCard
              icon="zap"
              title="Alerte urgente"
              subtitle="Besoin immédiat d'un animateur"
              color={theme.colors.warning}
              onPress={() => router.push('/createUrgentAlert')}
            />
          </View>
        </DashboardSection>

        {/* Candidatures en attente */}
        {pendingApplications > 0 && (
          <DashboardSection 
            title="Candidatures" 
            subtitle={`${pendingApplications} en attente`}
            actionLabel="Voir tout"
            onAction={() => router.push('/labApplications')}
          >
            <Pressable 
              style={styles.applicationsBanner}
              onPress={() => router.push('/labApplications')}
            >
              <View style={styles.applicationsBannerIcon}>
                <Icon name="users" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.applicationsBannerContent}>
                <Text style={styles.applicationsBannerTitle}>
                  {pendingApplications} candidature{pendingApplications > 1 ? 's' : ''} en attente
                </Text>
                <Text style={styles.applicationsBannerSubtitle}>
                  Des animateurs ont postulé à vos missions
                </Text>
              </View>
              <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
            </Pressable>
          </DashboardSection>
        )}

        {/* Stats détaillées */}
        <DashboardSection title="Statistiques">
          <StatsGrid>
            <StatsCard
              icon="users"
              value={stats.favoritesCount || 0}
              label="Animateurs favoris"
              color={theme.colors.primary}
              onPress={() => router.push('/labFavoriteAnimators')}
            />
            <StatsCard
              icon="star"
              value={stats.averageRating?.toFixed(1) || '-'}
              label="Note moyenne"
              color={theme.colors.warning}
            />
          </StatsGrid>
        </DashboardSection>

        {/* Missions récentes */}
        <DashboardSection 
          title="Vos missions" 
          actionLabel="Tout voir"
          onAction={() => router.push('/myLabMissions')}
        >
          {activeMissions.length > 0 ? (
            <View style={styles.missionsList}>
              {activeMissions.slice(0, 3).map((mission) => (
                <MissionListCard
                  key={mission.id}
                  mission={mission}
                  showStatus
                  onPress={() => router.push(`/labMissionDetail/${mission.id}`)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="briefcase"
              title="Aucune mission active"
              subtitle="Créez votre première mission pour trouver des animateurs"
              action={canCreateMission ? () => router.push('/createMission') : undefined}
              actionLabel={canCreateMission ? 'Créer une mission' : undefined}
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  logoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: wp(3),
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  companyName: {
    fontSize: hp(2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    flexShrink: 1,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bannerContainer: {
    paddingHorizontal: wp(5),
    marginTop: hp(2),
  },
  statsMainContainer: {
    paddingHorizontal: wp(5),
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  quickActions: {
    gap: hp(1.5),
  },
  applicationsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  applicationsBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applicationsBannerContent: {
    flex: 1,
    marginLeft: wp(3),
  },
  applicationsBannerTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary,
  },
  applicationsBannerSubtitle: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginTop: hp(0.2),
  },
  missionsList: {
    gap: hp(1.5),
  },
});