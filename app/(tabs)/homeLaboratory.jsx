// app/(tabs)/homeLaboratory.jsx
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useClientMissions } from '../../hooks/useMissions';
import { useAnimatorMatches } from '../../hooks/useAnimatorMatching';
import { useLaboPosts } from '../../hooks/useLaboPosts';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import HomeHeader from '../../components/home/HomeHeader';
import LaboCarousel from '../../components/home/LaboCarousel';
import { MissionListCard } from '../../components/missions/MissionCard';
import { EmptyState } from '../../components/common/DashboardComponents';

// ============================================
// SOUS-COMPOSANTS
// ============================================

const StatsCard = ({ stats }) => (
  <View style={commonStyles.homeStatsRow}>
    <View style={commonStyles.homeStatCard}>
      <View style={commonStyles.homeStatTopRow}>
        <View style={[commonStyles.homeStatIcon, { backgroundColor: theme.colors.primary + '15' }]}>
          <Icon name="briefcase" size={16} color={theme.colors.primary} />
        </View>
        <Text style={commonStyles.homeStatValue}>{stats.activeMissions}</Text>
      </View>
      <Text style={commonStyles.homeStatLabel}>Missions</Text>
    </View>
    <View style={commonStyles.homeStatCard}>
      <View style={commonStyles.homeStatTopRow}>
        <View style={[commonStyles.homeStatIcon, { backgroundColor: theme.colors.rose + '15' }]}>
          <Icon name="heart" size={16} color={theme.colors.rose} />
        </View>
        <Text style={commonStyles.homeStatValue}>{stats.totalMatches}</Text>
      </View>
      <Text style={commonStyles.homeStatLabel}>Matchs</Text>
    </View>
    <View style={commonStyles.homeStatCard}>
      <View style={commonStyles.homeStatTopRow}>
        <View style={[commonStyles.homeStatIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
          <Icon name="users" size={16} color={theme.colors.secondary} />
        </View>
        <Text style={commonStyles.homeStatValue}>{stats.pendingApplications}</Text>
      </View>
      <Text style={commonStyles.homeStatLabel}>Candidatures</Text>
    </View>
  </View>
);

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function HomeLaboratory() {
  const router = useRouter();
  const { session, profile, laboratoryProfile, refreshLaboratoryProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { missions, loading: loadingMissions, refresh: refreshMissions } = useClientMissions(session?.user?.id);
  const { matches, loading: loadingMatches, refresh: refreshMatches } = useAnimatorMatches();

  // Posts labos
  const { laboPosts, featuredPosts, fetchLaboPosts } = useLaboPosts({ mode: 'lab' });

  const activeMissions = missions?.filter(m => m.status === 'open') || [];
  const inProgressMissions = missions?.filter(m => ['assigned', 'in_progress'].includes(m.status)) || [];

  // Comptage des candidatures en attente (approximatif via matches pending)
  const pendingApplications = matches?.filter(m => m.status === 'pending')?.length || 0;

  const stats = {
    activeMissions: activeMissions.length,
    totalMatches: matches?.length || 0,
    pendingApplications,
  };

  const isVerified = laboratoryProfile?.siret_verified || !!laboratoryProfile?.siret;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshMissions?.(), refreshMatches?.(), refreshLaboratoryProfile?.(), fetchLaboPosts()]);
    setRefreshing(false);
  }, [refreshMissions, refreshMatches, refreshLaboratoryProfile, fetchLaboPosts]);

  const loading = loadingMissions || loadingMatches;

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <ScrollView 
        style={commonStyles.flex1}
        contentContainerStyle={commonStyles.homeContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      >
        <HomeHeader />

        {/* Salutation */}
        <View style={commonStyles.homeGreetingSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp(2), marginBottom: hp(0.5) }}>
            <Text style={[commonStyles.homeGreeting, { marginBottom: 0, flexShrink: 1 }]} numberOfLines={1}>
              {laboratoryProfile?.brand_name || laboratoryProfile?.company_name || `Bonjour ${profile?.first_name}`} !
            </Text>
            {isVerified && (
              <Icon name="checkCircle" size={18} color={theme.colors.success} />
            )}
          </View>
          <Pressable style={commonStyles.homeStatusRow} onPress={() => router.push('/(screens)/editLaboratoryProfile')}>
            <Icon name="settings" size={14} color={theme.colors.primary} />
            <Text style={[commonStyles.hint, { color: theme.colors.primary }]}>Gérer mon profil</Text>
            <Icon name="chevronRight" size={14} color={theme.colors.primary} />
          </Pressable>
        </View>

        {/* Stats */}
        <StatsCard stats={stats} />

        {/* A la une */}
        <LaboCarousel
          title="A la une"
          posts={featuredPosts}
          emptyMessage="Aucune publication pour le moment"
          variant="featured"
          onPostPress={(post) => router.push({ pathname: '/(screens)/postDetail', params: { postId: post.id } })}
        />

        {/* Missions en cours */}
        <View style={commonStyles.homeSection}>
          <View style={commonStyles.rowBetween}>
            <Text style={commonStyles.sectionTitle}>Missions en cours</Text>
            {inProgressMissions.length > 0 && (
              <Pressable style={commonStyles.row} onPress={() => router.push('/(screens)/laboratoryMissions')}>
                <Text style={commonStyles.homeSeeAllText}>Voir tout</Text>
                <Icon name="chevronRight" size={16} color={theme.colors.primary} />
              </Pressable>
            )}
          </View>
          
          {loading ? (
            <View style={commonStyles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : inProgressMissions.length > 0 ? (
            <View style={commonStyles.homeItemsList}>
              {inProgressMissions.slice(0, 2).map(mission => (
                <MissionListCard key={mission.id} mission={mission} showStatus onPress={() => router.push({ pathname: '/(screens)/missionDetail', params: { missionId: mission.id } })} />
              ))}
            </View>
          ) : (
            <EmptyState icon="briefcase" title="Aucune mission en cours" subtitle="Créez une mission pour recruter" />
          )}
        </View>

        {/* Missions ouvertes */}
        <View style={commonStyles.homeSection}>
          <View style={commonStyles.rowBetween}>
            <Text style={commonStyles.sectionTitle}>Missions ouvertes</Text>
            <Pressable style={commonStyles.row} onPress={() => router.push('/(screens)/createMission')}>
              <Icon name="plus" size={16} color={theme.colors.primary} />
              <Text style={commonStyles.homeSeeAllText}>Créer</Text>
            </Pressable>
          </View>
          
          {loading ? (
            <View style={commonStyles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : activeMissions.length > 0 ? (
            <View style={commonStyles.homeItemsList}>
              {activeMissions.slice(0, 3).map(mission => (
                <MissionListCard key={mission.id} mission={mission} onPress={() => router.push({ pathname: '/(screens)/missionDetail', params: { missionId: mission.id } })} />
              ))}
            </View>
          ) : (
            <EmptyState icon="clipboard" title="Aucune mission ouverte" subtitle="Publiez une mission pour trouver des animateurs" />
          )}
        </View>

        {/* Mes publications */}
        <LaboCarousel
          title="Mes publications"
          posts={laboPosts.map(p => ({ ...p, laboratory: laboratoryProfile }))}
          emptyMessage="Aucune publication - créez votre première !"
          onPostPress={(post) => router.push({ pathname: '/(screens)/postDetail', params: { postId: post.id } })}
        />

        {/* Accès rapide */}
        <View style={commonStyles.homeSection}>
          <Text style={commonStyles.sectionTitle}>Accès rapide</Text>
          
          <View style={commonStyles.homeQuickActions}>
            <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(tabs)/matching')}>
              <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.rose + '15' }]}>
                <Icon name="heart" size={20} color={theme.colors.rose} />
              </View>
              <Text style={commonStyles.homeQuickActionText}>Recruter</Text>
            </Pressable>
            <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(screens)/createMission')}>
              <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                <Icon name="plus" size={20} color={theme.colors.primary} />
              </View>
              <Text style={commonStyles.homeQuickActionText}>Créer mission</Text>
            </Pressable>
            <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(screens)/laboratoryPosts')}>
              <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
                <Icon name="fileText" size={20} color={theme.colors.secondary} />
              </View>
              <Text style={commonStyles.homeQuickActionText}>Mes Posts</Text>
            </Pressable>
            <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(screens)/animatorMatches')}>
              <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.warning + '15' }]}>
                <Icon name="users" size={20} color={theme.colors.warning} />
              </View>
              <Text style={commonStyles.homeQuickActionText}>Mes matchs</Text>
            </Pressable>
          </View>

          {/* Voir les animateurs */}
          <Pressable style={commonStyles.homePreviewCard} onPress={() => router.push('/(screens)/searchAnimators')}>
            <View style={[commonStyles.homePreviewIcon, { backgroundColor: theme.colors.warning + '15' }]}>
              <Icon name="search" size={20} color={theme.colors.warning} />
            </View>
            <View style={commonStyles.flex1}>
              <Text style={commonStyles.homePreviewTitle}>Rechercher des animateurs</Text>
              <Text style={commonStyles.homePreviewSubtitle}>Parcourir les profils disponibles</Text>
            </View>
            <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
          </Pressable>
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}