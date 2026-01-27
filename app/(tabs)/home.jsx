// app/(tabs)/home.jsx
import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator, FlatList, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { usePrivacy } from '../../hooks/usePrivacy';
import { useDashboard } from '../../hooks/useDashboard';
import { laboratoryPostService } from '../../services/laboratoryPostService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import Logo from '../../assets/icons/Logo';
import LaboCarousel from '../../components/home/LaboCarousel';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';

// ============================================
// HELPERS
// ============================================

const getContractColor = (type) => {
  const colors = {
    CDI: theme.colors.success,
    CDD: theme.colors.secondary,
    vacation: theme.colors.warning,
    remplacement: theme.colors.primary,
  };
  return colors[type] || theme.colors.textLight;
};

const getContractTypeLabel = (type) => {
  const labels = { CDI: 'CDI', CDD: 'CDD', vacation: 'Vacation', remplacement: 'Remplacement' };
  return labels[type] || type;
};

// ============================================
// SOUS-COMPOSANTS
// ============================================

const StatsCard = ({ stats, isTitulaire, isSearchActive }) => (
  <View style={commonStyles.homeStatsCard}>
    <View style={commonStyles.homeStatItem}>
      <Text style={commonStyles.homeStatValue}>{isTitulaire ? stats?.publishedOffers || 0 : stats?.applications || 0}</Text>
      <Text style={commonStyles.homeStatLabel}>{isTitulaire ? 'Annonces' : 'Candidatures'}</Text>
    </View>
    <View style={commonStyles.homeStatDivider} />
    <View style={commonStyles.homeStatItem}>
      <Text style={commonStyles.homeStatValue}>{stats?.matches || 0}</Text>
      <Text style={commonStyles.homeStatLabel}>Matchs</Text>
    </View>
    <View style={commonStyles.homeStatDivider} />
    <View style={commonStyles.homeStatItem}>
      <Text style={commonStyles.homeStatValue}>{stats?.views || 0}</Text>
      <Text style={commonStyles.homeStatLabel}>Vues</Text>
    </View>
    <View style={commonStyles.homeStatDivider} />
    <View style={commonStyles.homeStatItemRow}>
      <View style={[commonStyles.homeStatusDot, isSearchActive && commonStyles.homeStatusDotActive]} />
      <Text style={commonStyles.homeStatLabel}>{isSearchActive ? 'Visible' : 'Masqué'}</Text>
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

const JobCard = ({ job, onPress, isInternship }) => {
  const pharmacyName = job.owner_profile?.first_name 
    ? `Pharmacie ${job.owner_profile.first_name}`
    : 'Pharmacie';

  return (
    <Pressable style={styles.jobCard} onPress={onPress}>
      <View style={[
        styles.contractBadge,
        { backgroundColor: isInternship 
          ? theme.colors.secondary + '20' 
          : getContractColor(job.contract_type) + '20' 
        }
      ]}>
        <Text style={[
          styles.contractText,
          { color: isInternship 
            ? theme.colors.secondary 
            : getContractColor(job.contract_type) 
          }
        ]}>
          {isInternship 
            ? (job.type === 'stage' ? 'Stage' : 'Alternance')
            : getContractTypeLabel(job.contract_type)
          }
        </Text>
      </View>

      <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
      <Text style={styles.pharmacyName} numberOfLines={1}>{pharmacyName}</Text>
      
      <View style={styles.jobMeta}>
        <Icon name="mapPin" size={12} color={theme.colors.textLight} />
        <Text style={styles.jobMetaText}>{job.city}</Text>
      </View>
    </Pressable>
  );
};

const CandidateCard = ({ data, onPress }) => {
  const { candidate, offer } = data;
  
  return (
    <Pressable style={styles.jobCard} onPress={onPress}>
      <View style={styles.candidateAvatar}>
        {candidate?.photo_url ? (
          <Image source={{ uri: candidate.photo_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Icon name="user" size={20} color={theme.colors.textLight} />
          </View>
        )}
      </View>

      <Text style={styles.jobTitle} numberOfLines={1}>
        {candidate?.first_name} {candidate?.last_name?.charAt(0)}.
      </Text>
      <Text style={styles.pharmacyName} numberOfLines={1}>
        {candidate?.current_city || 'Non renseigné'}
      </Text>
      {offer && (
        <Text style={styles.offerTag} numberOfLines={1}>
          {offer.title}
        </Text>
      )}
    </Pressable>
  );
};

const ActivityItem = ({ activity, onPress }) => (
  <Pressable style={styles.activityItem} onPress={onPress}>
    <View style={[styles.activityIcon, { backgroundColor: theme.colors.primary + '15' }]}>
      <Icon name={activity.icon || 'bell'} size={18} color={theme.colors.primary} />
    </View>
    <View style={styles.activityContent}>
      <Text style={styles.activityTitle}>{activity.title}</Text>
      <Text style={styles.activityTime}>{activity.time}</Text>
    </View>
  </Pressable>
);

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function Home() {
  const router = useRouter();
  const { session, user, profile } = useAuth();
  const { privacy } = usePrivacy(session?.user?.id);
  const unreadCount = useUnreadNotificationCount();
  const { 
    loading, 
    stats, 
    recommendedOffers, 
    activities, 
    refresh,
    isTitulaire,
    isEtudiant,
  } = useDashboard();

  const isSearchActive = privacy?.searchable_by_recruiters;
  const isLaboratory = user?.user_type === 'laboratoire';
  const isAnimator = user?.user_type === 'animateur';
  const canCreateAlerts = isTitulaire || isLaboratory;
  const canReceiveAlerts = !canCreateAlerts;

  // Posts labos
  const [laboPosts, setLaboPosts] = useState([]);
  const fetchLaboPosts = useCallback(async () => {
    try {
      const data = await laboratoryPostService.getRecentPosts(6);
      setLaboPosts(data);
    } catch (err) {
      console.error('Erreur posts labos:', err);
    }
  }, []);
  useEffect(() => { fetchLaboPosts(); }, [fetchLaboPosts]);

  const handleOfferPress = (offer) => {
    if (isEtudiant) {
      router.push({ pathname: '/(screens)/internshipOfferDetailCandidate', params: { id: offer.id } });
    } else {
      router.push({ pathname: '/(screens)/jobOfferDetailCandidate', params: { id: offer.id } });
    }
  };

  const handleCandidatePress = (data) => {
    router.push({ pathname: '/(screens)/conversation', params: { matchId: data.id } });
  };

  const handleActivityPress = (activity) => {
    router.push('/(screens)/matches');
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <ScrollView 
        style={commonStyles.flex1}
        contentContainerStyle={commonStyles.homeContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} colors={[theme.colors.primary]} />}
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
              {unreadCount > 0 && (
                <View style={commonStyles.notificationBadge}>
                  <Text style={commonStyles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Salutation */}
        <View style={commonStyles.homeGreetingSection}>
          <Text style={commonStyles.homeGreeting}>Bonjour {profile?.first_name} !</Text>
          {isTitulaire && (
            <Pressable style={commonStyles.homeStatusRow} onPress={() => router.push('/(screens)/recruiterDashboard')}>
              <Icon name="briefcase" size={14} color={theme.colors.primary} />
              <Text style={[commonStyles.hint, { color: theme.colors.primary }]}>Gérer mes annonces</Text>
              <Icon name="chevronRight" size={14} color={theme.colors.primary} />
            </Pressable>
          )}
        </View>

        {/* Stats */}
        <StatsCard stats={stats} isTitulaire={isTitulaire} isSearchActive={isSearchActive} />

        {/* Offres recommandées / Candidats récents */}
        <View style={commonStyles.homeSection}>
          <View style={commonStyles.rowBetween}>
            <Text style={commonStyles.sectionTitle}>{isTitulaire ? 'Candidats récents' : 'Offres pour vous'}</Text>
            <Pressable style={commonStyles.row} onPress={() => router.push(isTitulaire ? '/(screens)/matches' : '/(tabs)/search')}>
              <Text style={commonStyles.homeSeeAllText}>Voir tout</Text>
              <Icon name="chevronRight" size={16} color={theme.colors.primary} />
            </Pressable>
          </View>
          
          {loading ? (
            <View style={commonStyles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : recommendedOffers?.length > 0 ? (
            <FlatList
              data={recommendedOffers}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: hp(1.5), gap: wp(3) }}
              renderItem={({ item }) => (
                isTitulaire ? (
                  <CandidateCard data={item} onPress={() => handleCandidatePress(item)} />
                ) : (
                  <JobCard job={item} isInternship={isEtudiant} onPress={() => handleOfferPress(item)} />
                )
              )}
            />
          ) : (
            <EmptyState 
              icon={isTitulaire ? 'users' : 'briefcase'}
              title={isTitulaire ? 'Aucun candidat récent' : 'Aucune offre trouvée'}
              subtitle={isTitulaire ? 'Les candidats qui matchent avec vos offres apparaîtront ici' : 'Swipez sur des offres pour commencer !'}
            />
          )}
        </View>

        {/* Activité récente */}
        <View style={commonStyles.homeSection}>
          <Text style={commonStyles.sectionTitle}>Activité récente</Text>
          
          {loading ? (
            <View style={commonStyles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : activities?.length > 0 ? (
            <View style={styles.activitiesList}>
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} onPress={() => handleActivityPress(activity)} />
              ))}
            </View>
          ) : (
            <EmptyState 
              icon="clock"
              title="Aucune activité récente"
              subtitle={isTitulaire ? 'Les interactions avec vos annonces apparaîtront ici' : 'Vos matchs apparaîtront ici'}
            />
          )}
        </View>

        {/* Actualités labos */}
        <LaboCarousel
          title="Actualités labos"
          posts={laboPosts}
          emptyMessage="Aucune publication pour le moment"
          onPostPress={(post) => router.push({ pathname: '/(screens)/postDetail', params: { postId: post.id } })}
        />

        {/* Accès rapide */}
        <View style={commonStyles.homeSection}>
          <Text style={commonStyles.sectionTitle}>Accès rapide</Text>
          
          <View style={commonStyles.homeQuickActions}>
            {isTitulaire ? (
              <>
                <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(screens)/recruiterDashboard')}>
                  <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Icon name="briefcase" size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={commonStyles.homeQuickActionText}>Mes annonces</Text>
                </Pressable>
                <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(tabs)/matching')}>
                  <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.rose + '15' }]}>
                    <Icon name="heart" size={20} color={theme.colors.rose} />
                  </View>
                  <Text style={commonStyles.homeQuickActionText}>Swipe candidats</Text>
                </Pressable>
                <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(screens)/matches')}>
                  <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
                    <Icon name="users" size={20} color={theme.colors.secondary} />
                  </View>
                  <Text style={commonStyles.homeQuickActionText}>Mes matchs</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(tabs)/matching')}>
                  <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.rose + '15' }]}>
                    <Icon name="heart" size={20} color={theme.colors.rose} />
                  </View>
                  <Text style={commonStyles.homeQuickActionText}>Swiper</Text>
                </Pressable>
                <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(tabs)/search')}>
                  <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Icon name="search" size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={commonStyles.homeQuickActionText}>Rechercher</Text>
                </Pressable>
                <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(screens)/matches')}>
                  <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
                    <Icon name="messageCircle" size={20} color={theme.colors.secondary} />
                  </View>
                  <Text style={commonStyles.homeQuickActionText}>Mes matchs</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Alertes urgentes */}
          <Pressable
            style={commonStyles.homePreviewCard}
            onPress={() => router.push(canCreateAlerts ? '/(screens)/myAlerts' : '/(screens)/availableAlerts')}
          >
            <View style={[commonStyles.homePreviewIcon, { backgroundColor: theme.colors.warning + '15' }]}>
              <Icon name="zap" size={20} color={theme.colors.warning} />
            </View>
            <View style={commonStyles.flex1}>
              <Text style={commonStyles.homePreviewTitle}>
                {canCreateAlerts ? 'Alertes urgentes' : 'Alertes urgentes'}
              </Text>
              <Text style={commonStyles.homePreviewSubtitle}>
                {canCreateAlerts
                  ? 'Trouvez un remplacement en urgence'
                  : 'Remplacements urgents près de vous'}
              </Text>
            </View>
            <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
          </Pressable>

          {/* Prévisualiser ma carte (candidats seulement) */}
          {!isTitulaire && !isLaboratory && (
            <Pressable style={commonStyles.homePreviewCard} onPress={() => router.push('/(screens)/previewMyCard')}>
              <View style={[commonStyles.homePreviewIcon, { backgroundColor: theme.colors.warning + '15' }]}>
                <Icon name="eye" size={20} color={theme.colors.warning} />
              </View>
              <View style={commonStyles.flex1}>
                <Text style={commonStyles.homePreviewTitle}>Prévisualiser ma carte</Text>
                <Text style={commonStyles.homePreviewSubtitle}>Voir comment les recruteurs vous voient</Text>
              </View>
              <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
            </Pressable>
          )}
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Job Card
  jobCard: {
    width: wp(42),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: wp(4),
  },
  contractBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
    marginBottom: hp(1),
  },
  contractText: {
    fontSize: hp(1.2),
    fontWeight: '600',
  },
  jobTitle: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  pharmacyName: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginBottom: hp(1),
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  jobMetaText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  offerTag: {
    fontSize: hp(1.2),
    color: theme.colors.primary,
    marginTop: hp(0.5),
  },

  // Candidate Card
  candidateAvatar: {
    alignSelf: 'center',
    marginBottom: hp(1),
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Activity
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    marginBottom: hp(0.3),
  },
  activityTime: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },

  // Activities container
  activitiesList: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginTop: hp(1.5),
  },
});