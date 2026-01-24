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
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import Logo from '../../assets/icons/Logo';
import { MissionListCard } from '../../components/missions/MissionCard';

// ============================================
// SOUS-COMPOSANTS
// ============================================

const StatsCard = ({ stats }) => (
  <View style={commonStyles.homeStatsCard}>
    <View style={commonStyles.homeStatItem}>
      <Text style={commonStyles.homeStatValue}>{stats.activeMissions}</Text>
      <Text style={commonStyles.homeStatLabel}>Missions</Text>
    </View>
    <View style={commonStyles.homeStatDivider} />
    <View style={commonStyles.homeStatItem}>
      <Text style={commonStyles.homeStatValue}>{stats.totalMatches}</Text>
      <Text style={commonStyles.homeStatLabel}>Matchs</Text>
    </View>
    <View style={commonStyles.homeStatDivider} />
    <View style={commonStyles.homeStatItem}>
      <Text style={commonStyles.homeStatValue}>{stats.pendingApplications}</Text>
      <Text style={commonStyles.homeStatLabel}>Candidatures</Text>
    </View>
    <View style={commonStyles.homeStatDivider} />
    <View style={commonStyles.homeStatItemRow}>
      <View style={[commonStyles.homeStatusDot, stats.isVerified && commonStyles.homeStatusDotActive]} />
      <Text style={commonStyles.homeStatLabel}>{stats.isVerified ? 'Vérifié' : 'Non vérifié'}</Text>
    </View>
  </View>
);

const EmptyState = ({ icon, title, subtitle }) => (
  <View style={commonStyles.homeEmptyState}>
    <Icon name={icon} size={32} color={theme.colors.gray} />
    <Text style={commonStyles.homeEmptyTitle}>{title}</Text>
    {subtitle && <Text style={commonStyles.homeEmptySubtitle}>{subtitle}</Text>}
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

  const activeMissions = missions?.filter(m => m.status === 'open') || [];
  const inProgressMissions = missions?.filter(m => ['assigned', 'in_progress'].includes(m.status)) || [];

  // Comptage des candidatures en attente (approximatif via matches pending)
  const pendingApplications = matches?.filter(m => m.status === 'pending')?.length || 0;

  const stats = {
    activeMissions: activeMissions.length,
    totalMatches: matches?.length || 0,
    pendingApplications,
    isVerified: laboratoryProfile?.verified,
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshMissions?.(), refreshMatches?.(), refreshLaboratoryProfile?.()]);
    setRefreshing(false);
  }, [refreshMissions, refreshMatches, refreshLaboratoryProfile]);

  const loading = loadingMissions || loadingMatches;

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <ScrollView 
        style={commonStyles.flex1}
        contentContainerStyle={commonStyles.homeContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      >
        {/* Header */}
        <View style={commonStyles.homeHeader}>
          <Logo size={hp(5)} />
          <View style={commonStyles.homeHeaderButtons}>
            <Pressable style={commonStyles.headerButton} onPress={() => router.push('/(tabs)/messages')}>
              <Icon name="messageCircle" size={22} color={theme.colors.text} />
            </Pressable>
            <Pressable style={commonStyles.headerButton} onPress={() => router.push('/(screens)/notifications')}>
              <Icon name="bell" size={22} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Salutation */}
        <View style={commonStyles.homeGreetingSection}>
          <Text style={commonStyles.homeGreeting}>
            {laboratoryProfile?.brand_name || laboratoryProfile?.company_name || `Bonjour ${profile?.first_name}`} !
          </Text>
          <Pressable style={commonStyles.homeStatusRow} onPress={() => router.push('/(screens)/editLaboratoryProfile')}>
            <Icon name="settings" size={14} color={theme.colors.primary} />
            <Text style={[commonStyles.hint, { color: theme.colors.primary }]}>Gérer mon profil</Text>
            <Icon name="chevronRight" size={14} color={theme.colors.primary} />
          </Pressable>
        </View>

        {/* Stats */}
        <StatsCard stats={stats} />

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
                <MissionListCard key={mission.id} mission={mission} showStatus onPress={() => router.push(`/(screens)/missionDetail/${mission.id}`)} />
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
                <MissionListCard key={mission.id} mission={mission} onPress={() => router.push(`/(screens)/missionDetail/${mission.id}`)} />
              ))}
            </View>
          ) : (
            <EmptyState icon="clipboard" title="Aucune mission ouverte" subtitle="Publiez une mission pour trouver des animateurs" />
          )}
        </View>

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
            <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(screens)/animatorMatches')}>
              <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
                <Icon name="users" size={20} color={theme.colors.secondary} />
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