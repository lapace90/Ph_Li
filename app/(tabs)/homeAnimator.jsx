import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useAnimatorMissions } from '../../hooks/useMissions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import Logo from '../../assets/icons/Logo';
import { MissionListCard } from '../../components/missions/MissionCard';

// ============================================
// SOUS-COMPOSANTS
// ============================================

const StatsCard = ({ stats, isAvailable }) => (
  <View style={commonStyles.homeStatsCard}>
    <View style={commonStyles.homeStatItem}>
      <Text style={commonStyles.homeStatValue}>{stats.missionsCompleted}</Text>
      <Text style={commonStyles.homeStatLabel}>Missions</Text>
    </View>
    <View style={commonStyles.homeStatDivider} />
    <View style={commonStyles.homeStatItem}>
      <Text style={commonStyles.homeStatValue}>{stats.averageRating || '-'}</Text>
      <Text style={commonStyles.homeStatLabel}>Note</Text>
    </View>
    <View style={commonStyles.homeStatDivider} />
    <View style={commonStyles.homeStatItem}>
      <Text style={commonStyles.homeStatValue}>{stats.pendingApplications}</Text>
      <Text style={commonStyles.homeStatLabel}>En attente</Text>
    </View>
    <View style={commonStyles.homeStatDivider} />
    <View style={commonStyles.homeStatItemRow}>
      <View style={[commonStyles.homeStatusDot, isAvailable && commonStyles.homeStatusDotActive]} />
      <Text style={commonStyles.homeStatLabel}>{isAvailable ? 'Visible' : 'Masqué'}</Text>
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

export default function HomeAnimator() {
  const router = useRouter();
  const { session, profile, animatorProfile, refreshAnimatorProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { myMissions, availableMissions, loading, refresh: refreshMissions } = useAnimatorMissions(session?.user?.id);

  const activeMissions = myMissions?.filter(m => ['assigned', 'in_progress'].includes(m.status)) || [];
  const pendingApplications = myMissions?.filter(m => m.application_status === 'pending') || [];

  const stats = {
    missionsCompleted: animatorProfile?.missions_completed || 0,
    averageRating: animatorProfile?.average_rating?.toFixed(1),
    pendingApplications: pendingApplications.length,
  };

  const isAvailable = animatorProfile?.available_now;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshMissions?.(), refreshAnimatorProfile?.()]);
    setRefreshing(false);
  }, [refreshMissions, refreshAnimatorProfile]);

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
          <Text style={commonStyles.homeGreeting}>Bonjour {profile?.first_name} !</Text>
          <Pressable style={commonStyles.homeStatusRow} onPress={() => router.push('/(screens)/editAnimatorProfile')}>
            <View style={[commonStyles.homeStatusDot, isAvailable && commonStyles.homeStatusDotActive]} />
            <Text style={[commonStyles.hint, { color: isAvailable ? theme.colors.success : theme.colors.textLight }]}>
              {isAvailable ? 'Disponible' : 'Non disponible'}
            </Text>
            <Icon name="chevronRight" size={14} color={theme.colors.textLight} />
          </Pressable>
        </View>

        {/* Stats */}
        <StatsCard stats={stats} isAvailable={isAvailable} />

        {/* Missions en cours */}
        <View style={commonStyles.homeSection}>
          <View style={commonStyles.rowBetween}>
            <Text style={commonStyles.sectionTitle}>Missions en cours</Text>
            {activeMissions.length > 0 && (
              <Pressable style={commonStyles.row} onPress={() => router.push('/(screens)/myMissions')}>
                <Text style={commonStyles.homeSeeAllText}>Voir tout</Text>
                <Icon name="chevronRight" size={16} color={theme.colors.primary} />
              </Pressable>
            )}
          </View>
          
          {loading ? (
            <View style={commonStyles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : activeMissions.length > 0 ? (
            <View style={commonStyles.homeItemsList}>
              {activeMissions.slice(0, 2).map(mission => (
                <MissionListCard key={mission.id} mission={mission} showStatus onPress={() => router.push(`/(screens)/missionDetail/${mission.id}`)} />
              ))}
            </View>
          ) : (
            <EmptyState icon="briefcase" title="Aucune mission en cours" subtitle="Vos missions assignées apparaîtront ici" />
          )}
        </View>

        {/* Missions disponibles */}
        <View style={commonStyles.homeSection}>
          <View style={commonStyles.rowBetween}>
            <Text style={commonStyles.sectionTitle}>Missions à proximité</Text>
            <Pressable style={commonStyles.row} onPress={() => router.push('/(tabs)/matching')}>
              <Text style={commonStyles.homeSeeAllText}>Explorer</Text>
              <Icon name="chevronRight" size={16} color={theme.colors.primary} />
            </Pressable>
          </View>
          
          {loading ? (
            <View style={commonStyles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : availableMissions?.length > 0 ? (
            <View style={commonStyles.homeItemsList}>
              {availableMissions.slice(0, 3).map(mission => (
                <MissionListCard key={mission.id} mission={mission} onPress={() => router.push(`/(screens)/mission/${mission.id}`)} />
              ))}
            </View>
          ) : (
            <EmptyState icon="mapPin" title="Aucune mission à proximité" subtitle="Élargissez votre zone de recherche" />
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
              <Text style={commonStyles.homeQuickActionText}>Swiper</Text>
            </Pressable>
            <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(screens)/myMissions')}>
              <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                <Icon name="briefcase" size={20} color={theme.colors.primary} />
              </View>
              <Text style={commonStyles.homeQuickActionText}>Mes missions</Text>
            </Pressable>
            <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(screens)/animatorMatches')}>
              <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
                <Icon name="users" size={20} color={theme.colors.secondary} />
              </View>
              <Text style={commonStyles.homeQuickActionText}>Mes matchs</Text>
            </Pressable>
          </View>

          {/* Prévisualiser ma carte */}
          <Pressable style={commonStyles.homePreviewCard} onPress={() => router.push('/(screens)/previewMyCard')}>
            <View style={[commonStyles.homePreviewIcon, { backgroundColor: theme.colors.warning + '15' }]}>
              <Icon name="eye" size={20} color={theme.colors.warning} />
            </View>
            <View style={commonStyles.flex1}>
              <Text style={commonStyles.homePreviewTitle}>Prévisualiser ma carte</Text>
              <Text style={commonStyles.homePreviewSubtitle}>Voir comment les labos vous voient</Text>
            </View>
            <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
          </Pressable>
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}