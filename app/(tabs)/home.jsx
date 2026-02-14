import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator, FlatList, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { usePrivacy } from '../../hooks/usePrivacy';
import { useDashboard } from '../../hooks/useDashboard';
import { useLaboPosts } from '../../hooks/useLaboPosts';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import HomeHeader from '../../components/home/HomeHeader';
import LaboCarousel from '../../components/home/LaboCarousel';
import { EmptyState } from '../../components/common/DashboardComponents';

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

const StatsCard = ({ stats, isTitulaire }) => (
  <View style={commonStyles.homeStatsRow}>
    <View style={commonStyles.homeStatCard}>
      <View style={commonStyles.homeStatTopRow}>
        <View style={[commonStyles.homeStatIcon, { backgroundColor: theme.colors.primary + '15' }]}>
          <Icon name="briefcase" size={16} color={theme.colors.primary} />
        </View>
        <Text style={commonStyles.homeStatValue}>{isTitulaire ? stats?.publishedOffers || 0 : stats?.applications || 0}</Text>
      </View>
      <Text style={commonStyles.homeStatLabel}>{isTitulaire ? 'Annonces' : 'Candidatures'}</Text>
    </View>
    <View style={commonStyles.homeStatCard}>
      <View style={commonStyles.homeStatTopRow}>
        <View style={[commonStyles.homeStatIcon, { backgroundColor: theme.colors.rose + '15' }]}>
          <Icon name="heart" size={16} color={theme.colors.rose} />
        </View>
        <Text style={commonStyles.homeStatValue}>{stats?.matches || 0}</Text>
      </View>
      <Text style={commonStyles.homeStatLabel}>Matchs</Text>
    </View>
    <View style={commonStyles.homeStatCard}>
      <View style={commonStyles.homeStatTopRow}>
        <View style={[commonStyles.homeStatIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
          <Icon name="eye" size={16} color={theme.colors.secondary} />
        </View>
        <Text style={commonStyles.homeStatValue}>{stats?.views || 0}</Text>
      </View>
      <Text style={commonStyles.homeStatLabel}>Vues</Text>
    </View>
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
      {/* Badge à contacter */}
      <View style={styles.pendingBadge}>
        <Icon name="messageCircle" size={10} color={theme.colors.primary} />
        <Text style={styles.pendingBadgeText}>À contacter</Text>
      </View>

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

const ActivityItem = ({ activity, onPress }) => {
  const iconColors = {
    heart: theme.colors.rose,
    star: theme.colors.warning,
    bell: theme.colors.primary,
  };
  const iconName = activity.icon || 'bell';
  const iconColor = iconColors[iconName] || theme.colors.primary;

  // Formater le temps relatif
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <Pressable style={styles.activityItem} onPress={onPress}>
      <View style={[styles.activityIcon, { backgroundColor: iconColor + '15' }]}>
        <Icon name={iconName} size={18} color={iconColor} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityTime}>{formatTime(activity.created_at)}</Text>
      </View>
    </Pressable>
  );
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function Home() {
  const router = useRouter();
  const { session, user, profile } = useAuth();
  const { privacy } = usePrivacy(session?.user?.id);
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
  const canCreateAlerts = isTitulaire || isLaboratory;

  // Posts labos
  const { forYouPosts, featuredPosts } = useLaboPosts();

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
        <HomeHeader />

        {/* Salutation */}
        <View style={commonStyles.homeGreetingSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp(2) }}>
            <Text style={[commonStyles.homeGreeting, { marginBottom: 0 }]}>Bonjour {profile?.first_name} !</Text>
            <View style={[commonStyles.homeStatusDot, isSearchActive && commonStyles.homeStatusDotActive]} />
            <Text style={[commonStyles.homeStatLabel, { marginTop: 0 }]}>{isSearchActive ? 'Visible' : 'Masqué'}</Text>
          </View>
          {isTitulaire && (
            <Pressable style={[commonStyles.homeStatusRow, { marginTop: hp(0.5) }]} onPress={() => router.push('/(screens)/recruiterDashboard')}>
              <Icon name="briefcase" size={14} color={theme.colors.primary} />
              <Text style={[commonStyles.hint, { color: theme.colors.primary }]}>Gérer mes annonces</Text>
              <Icon name="chevronRight" size={14} color={theme.colors.primary} />
            </Pressable>
          )}
        </View>

        {/* Stats */}
        <StatsCard stats={stats} isTitulaire={isTitulaire} />

        {/* A la une */}
        <LaboCarousel
          title="A la une"
          posts={featuredPosts}
          emptyMessage="Aucune publication pour le moment"
          variant="featured"
          onPostPress={(post) => router.push({ pathname: '/(screens)/postDetail', params: { postId: post.id } })}
        />

        {/* Matchs en attente (titulaire uniquement) */}
        {isTitulaire && (
          <View style={commonStyles.homeSection}>
            <View style={commonStyles.rowBetween}>
              <Text style={commonStyles.sectionTitle}>Matchs en attente</Text>
              <Pressable style={commonStyles.row} onPress={() => router.push(recommendedOffers?.length > 0 ? '/(screens)/matches' : '/(tabs)/messages')}>
                <Text style={commonStyles.homeSeeAllText}>
                  {recommendedOffers?.length > 0 ? 'Voir tout' : 'Conversations'}
                </Text>
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
                  <CandidateCard data={item} onPress={() => handleCandidatePress(item)} />
                )}
              />
            ) : (
              <Text style={[commonStyles.hint, { marginTop: hp(1) }]}>
                Tous vos matchs ont été contactés ✓
              </Text>
            )}
          </View>
        )}

        {/* Activité récente - masquée si vide */}
        {activities?.length > 0 && (
          <View style={commonStyles.homeSection}>
            <Text style={commonStyles.sectionTitle}>Activité récente</Text>
            <View style={styles.activitiesList}>
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} onPress={() => handleActivityPress(activity)} />
              ))}
            </View>
          </View>
        )}

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
            {isTitulaire ? (
              <>
                <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(screens)/recruiterDashboard')}>
                  <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Icon name="briefcase" size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={commonStyles.homeQuickActionText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>Mes annonces</Text>
                </Pressable>
                <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(tabs)/matching')}>
                  <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.rose + '15' }]}>
                    <Icon name="heart" size={20} color={theme.colors.rose} />
                  </View>
                  <Text style={commonStyles.homeQuickActionText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>Swipe candidats</Text>
                </Pressable>
                <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(screens)/matches')}>
                  <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
                    <Icon name="users" size={20} color={theme.colors.secondary} />
                  </View>
                  <Text style={commonStyles.homeQuickActionText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>Mes matchs</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(tabs)/matching')}>
                  <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.rose + '15' }]}>
                    <Icon name="heart" size={20} color={theme.colors.rose} />
                  </View>
                  <Text style={commonStyles.homeQuickActionText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>Swiper</Text>
                </Pressable>
                <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(tabs)/search')}>
                  <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Icon name="search" size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={commonStyles.homeQuickActionText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>Rechercher</Text>
                </Pressable>
                <Pressable style={commonStyles.homeQuickAction} onPress={() => router.push('/(screens)/matches')}>
                  <View style={[commonStyles.homeQuickActionIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
                    <Icon name="messageCircle" size={20} color={theme.colors.secondary} />
                  </View>
                  <Text style={commonStyles.homeQuickActionText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>Mes matchs</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Alertes urgentes (titulaire & labo uniquement) */}
          {canCreateAlerts && (
            <Pressable
              style={commonStyles.homePreviewCard}
              onPress={() => router.push('/(screens)/myAlerts')}
            >
              <View style={[commonStyles.homePreviewIcon, { backgroundColor: theme.colors.warning + '15' }]}>
                <Icon name="zap" size={20} color={theme.colors.warning} />
              </View>
              <View style={commonStyles.flex1}>
                <Text style={commonStyles.homePreviewTitle}>Alertes urgentes</Text>
                <Text style={commonStyles.homePreviewSubtitle}>Trouvez un remplacement en urgence</Text>
              </View>
              <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
            </Pressable>
          )}

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
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
    marginBottom: hp(0.8),
    gap: wp(1),
  },
  pendingBadgeText: {
    fontSize: hp(1),
    fontWeight: '600',
    color: theme.colors.primary,
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