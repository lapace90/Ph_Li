import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useAnimatorMissions } from '../../hooks/useMissions';
import { useLaboPosts } from '../../hooks/useLaboPosts';
import { useFavoriteCount, FAVORITE_TYPES } from '../../hooks/useFavorites';
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
        <View style={[commonStyles.homeStatIcon, { backgroundColor: theme.colors.rose + '15' }]}>
          <Icon name="heart" size={16} color={theme.colors.rose} />
        </View>
        <Text style={commonStyles.homeStatValue}>{stats.followers}</Text>
      </View>
      <Text style={commonStyles.homeStatLabel}>Followers</Text>
    </View>
    <View style={commonStyles.homeStatCard}>
      <View style={commonStyles.homeStatTopRow}>
        <View style={[commonStyles.homeStatIcon, { backgroundColor: theme.colors.primary + '15' }]}>
          <Icon name="briefcase" size={16} color={theme.colors.primary} />
        </View>
        <Text style={commonStyles.homeStatValue}>{stats.missionsCompleted}</Text>
      </View>
      <Text style={commonStyles.homeStatLabel}>Missions</Text>
    </View>
    <View style={commonStyles.homeStatCard}>
      <View style={commonStyles.homeStatTopRow}>
        <View style={[commonStyles.homeStatIcon, { backgroundColor: theme.colors.warning + '15' }]}>
          <Icon name="star" size={16} color={theme.colors.warning} />
        </View>
        <Text style={commonStyles.homeStatValue}>{stats.averageRating || '-'}</Text>
      </View>
      <Text style={commonStyles.homeStatLabel}>Note</Text>
    </View>
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

  // Compteur de labos qui suivent cet animateur
  const { count: followersCount, refresh: refreshFollowers } = useFavoriteCount(
    FAVORITE_TYPES.ANIMATOR,
    animatorProfile?.id
  );

  const activeMissions = myMissions?.filter(m => ['assigned', 'in_progress'].includes(m.status)) || [];
  const pendingApplications = myMissions?.filter(m => m.application_status === 'pending') || [];

  const stats = {
    followers: followersCount,
    missionsCompleted: animatorProfile?.missions_completed || 0,
    averageRating: animatorProfile?.average_rating?.toFixed(1),
  };

  const isAvailable = animatorProfile?.available_now;

  // Posts labos
  const { forYouPosts, featuredPosts, fetchLaboPosts } = useLaboPosts();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshMissions?.(), refreshAnimatorProfile?.(), fetchLaboPosts(), refreshFollowers?.()]);
    setRefreshing(false);
  }, [refreshMissions, refreshAnimatorProfile, fetchLaboPosts, refreshFollowers]);

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
                <MissionListCard key={mission.id} mission={mission} showStatus onPress={() => router.push({ pathname: '/(screens)/missionDetail', params: { missionId: mission.id } })} />
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
                <MissionListCard key={mission.id} mission={mission} onPress={() => router.push({ pathname: '/(screens)/missionDetail', params: { missionId: mission.id } })} />
              ))}
            </View>
          ) : (
            <EmptyState icon="mapPin" title="Aucune mission à proximité" subtitle="Élargissez votre zone de recherche" />
          )}
        </View>

        {/* Pour toi (labos suivis) */}
        <LaboCarousel
          title="Pour toi"
          posts={forYouPosts}
          emptyMessage="Suivez des labos pour voir leurs publications ici"
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