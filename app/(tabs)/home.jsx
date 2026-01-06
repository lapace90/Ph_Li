/**
 * Dashboard / Accueil
 * Affiche les stats, offres recommandées et activité récente
 */

import { StyleSheet, Text, View, ScrollView, Pressable, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { usePrivacy } from '../../hooks/usePrivacy';
import { useDashboard } from '../../hooks/useDashboard';
import { getContractTypeLabel, getContractColor } from '../../constants/jobOptions';
import { formatRelativeTime } from '../../helpers/dateHelpers';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import Logo from '../../assets/icons/Logo';

// ============================================
// COMPOSANTS INTERNES
// ============================================

const StatsCard = ({ stats, isTitulaire, isSearchActive }) => {
  const router = useRouter();
  
  return (
    <View style={styles.statsCard}>
      {/* Statut recherche (candidats uniquement) */}
      {!isTitulaire && (
        <Pressable 
          style={styles.searchStatus}
          onPress={() => router.push('/(screens)/privacySettings')}
        >
          <View style={[
            styles.statusIndicator,
            { backgroundColor: isSearchActive ? theme.colors.success : theme.colors.gray }
          ]} />
          <View style={commonStyles.flex1}>
            <Text style={styles.statusTitle}>
              {isSearchActive ? 'Recherche active' : 'Recherche inactive'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {isSearchActive ? 'Visible par les recruteurs' : 'Profil masqué'}
            </Text>
          </View>
          <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
        </Pressable>
      )}

      {/* Stats en ligne */}
      <View style={styles.statsRow}>
        <Pressable style={styles.statItem} onPress={() => router.push('/(screens)/matches')}>
          <View style={[styles.statIcon, { backgroundColor: theme.colors.rose + '15' }]}>
            <Icon name="heart" size={20} color={theme.colors.rose} />
          </View>
          <View>
            <Text style={styles.statValue}>{stats.matches}</Text>
            <Text style={styles.statLabel}>Matchs</Text>
          </View>
        </Pressable>

        <Pressable style={styles.statItem} onPress={() => router.push('/(tabs)/matching')}>
          <View style={[styles.statIcon, { backgroundColor: theme.colors.primary + '15' }]}>
            <Icon name={isTitulaire ? 'clock' : 'send'} size={20} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.statValue}>{stats.applications}</Text>
            <Text style={styles.statLabel}>{isTitulaire ? 'En attente' : 'Candidatures'}</Text>
          </View>
        </Pressable>

        <Pressable 
          style={styles.statItem} 
          onPress={() => router.push(isTitulaire ? '/(screens)/recruiterDashboard' : '/(tabs)/profile')}
        >
          <View style={[styles.statIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
            <Icon name={isTitulaire ? 'briefcase' : 'eye'} size={20} color={theme.colors.secondary} />
          </View>
          <View>
            <Text style={styles.statValue}>{stats.profileViews}</Text>
            <Text style={styles.statLabel}>{isTitulaire ? 'Annonces' : 'Vues profil'}</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

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

      {job.salary_range && (
        <Text style={styles.salary} numberOfLines={1}>{job.salary_range}</Text>
      )}
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
      
      {candidate?.experience_years > 0 && (
        <Text style={styles.pharmacyName}>
          {candidate.experience_years} an{candidate.experience_years > 1 ? 's' : ''} d'exp.
        </Text>
      )}

      <View style={styles.jobMeta}>
        <Icon name="mapPin" size={12} color={theme.colors.textLight} />
        <Text style={styles.jobMetaText}>{candidate?.current_city || 'N/C'}</Text>
      </View>

      {offer && (
        <Text style={styles.offerTag} numberOfLines={1}>{offer.title}</Text>
      )}
    </Pressable>
  );
};

const ActivityItem = ({ activity, onPress }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'match': return { name: 'heart', color: theme.colors.rose };
      case 'application': return { name: 'send', color: theme.colors.secondary };
      case 'application_viewed': return { name: 'eye', color: theme.colors.warning };
      default: return { name: 'bell', color: theme.colors.gray };
    }
  };

  const iconConfig = getActivityIcon(activity.type);

  return (
    <Pressable style={styles.activityItem} onPress={onPress}>
      <View style={[styles.activityIcon, { backgroundColor: iconConfig.color + '15' }]}>
        <Icon name={iconConfig.name} size={16} color={iconConfig.color} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle} numberOfLines={2}>{activity.title}</Text>
        <Text style={styles.activityTime}>{formatRelativeTime(activity.created_at)}</Text>
      </View>
      <Icon name="chevronRight" size={16} color={theme.colors.textLight} />
    </Pressable>
  );
};

const EmptyState = ({ icon, title, subtitle }) => (
  <View style={styles.emptyState}>
    <Icon name={icon} size={40} color={theme.colors.gray} />
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
  </View>
);

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function Home() {
  const router = useRouter();
  const { session, profile } = useAuth();
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        {/* Header avec logo */}
        <View style={styles.header}>
          <Logo size={hp(5)} />
          
          <View style={styles.headerButtons}>
            <Pressable 
              style={styles.headerButton}
              onPress={() => router.push('/(tabs)/messages')}
            >
              <Icon name="messageCircle" size={22} color={theme.colors.text} />
            </Pressable>
            <Pressable 
              style={styles.headerButton}
              onPress={() => router.push('/(screens)/notifications')}
            >
              <Icon name="bell" size={22} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Salutation */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Bonjour {profile?.first_name} !</Text>
          {isTitulaire && (
            <Pressable 
              style={[commonStyles.row, styles.statusRow]}
              onPress={() => router.push('/(screens)/recruiterDashboard')}
            >
              <Icon name="briefcase" size={14} color={theme.colors.primary} />
              <Text style={[commonStyles.hint, { color: theme.colors.primary }]}>
                Gérer mes annonces
              </Text>
              <Icon name="chevronRight" size={14} color={theme.colors.primary} />
            </Pressable>
          )}
        </View>

        {/* Stats */}
        <StatsCard stats={stats} isTitulaire={isTitulaire} isSearchActive={isSearchActive} />

        {/* Offres recommandées / Candidats récents */}
        <View style={styles.section}>
          <View style={commonStyles.rowBetween}>
            <Text style={commonStyles.sectionTitle}>
              {isTitulaire ? 'Candidats récents' : 'Offres pour vous'}
            </Text>
            <Pressable 
              style={[commonStyles.row, { gap: wp(1) }]}
              onPress={() => router.push(isTitulaire ? '/(screens)/matches' : '/(tabs)/search')}
            >
              <Text style={styles.seeAllText}>Voir tout</Text>
              <Icon name="chevronRight" size={16} color={theme.colors.primary} />
            </Pressable>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : recommendedOffers.length > 0 ? (
            <FlatList
              data={recommendedOffers}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.jobsList}
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
              subtitle={isTitulaire 
                ? 'Les candidats qui matchent avec vos offres apparaîtront ici'
                : 'Swipez sur des offres pour commencer !'
              }
            />
          )}
        </View>

        {/* Activité récente */}
        <View style={styles.section}>
          <Text style={commonStyles.sectionTitle}>Activité récente</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : activities.length > 0 ? (
            <View style={styles.activitiesList}>
              {activities.map((activity) => (
                <ActivityItem 
                  key={activity.id}
                  activity={activity}
                  onPress={() => handleActivityPress(activity)}
                />
              ))}
            </View>
          ) : (
            <EmptyState 
              icon="clock"
              title="Aucune activité récente"
              subtitle={isTitulaire 
                ? 'Les interactions avec vos annonces apparaîtront ici'
                : 'Vos matchs apparaîtront ici'
              }
            />
          )}
        </View>

        {/* Accès rapide */}
        <View style={styles.section}>
          <Text style={commonStyles.sectionTitle}>Accès rapide</Text>
          
          <View style={styles.quickActions}>
            {isTitulaire ? (
              <>
                <Pressable style={styles.quickAction} onPress={() => router.push('/(screens)/recruiterDashboard')}>
                  <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Icon name="briefcase" size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.quickActionText}>Mes annonces</Text>
                </Pressable>
                <Pressable style={styles.quickAction} onPress={() => router.push('/(tabs)/matching')}>
                  <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.rose + '15' }]}>
                    <Icon name="heart" size={20} color={theme.colors.rose} />
                  </View>
                  <Text style={styles.quickActionText}>Swipe candidats</Text>
                </Pressable>
                <Pressable style={styles.quickAction} onPress={() => router.push('/(screens)/matches')}>
                  <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
                    <Icon name="users" size={20} color={theme.colors.secondary} />
                  </View>
                  <Text style={styles.quickActionText}>Mes matchs</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable style={styles.quickAction} onPress={() => router.push('/(tabs)/matching')}>
                  <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.rose + '15' }]}>
                    <Icon name="heart" size={20} color={theme.colors.rose} />
                  </View>
                  <Text style={styles.quickActionText}>Swiper</Text>
                </Pressable>
                <Pressable style={styles.quickAction} onPress={() => router.push('/(tabs)/search')}>
                  <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Icon name="search" size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.quickActionText}>Rechercher</Text>
                </Pressable>
                <Pressable style={styles.quickAction} onPress={() => router.push('/(screens)/matches')}>
                  <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
                    <Icon name="messageCircle" size={20} color={theme.colors.secondary} />
                  </View>
                  <Text style={styles.quickActionText}>Mes matchs</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Prévisualiser ma carte */}
          {!isTitulaire && (
            <Pressable 
              style={styles.previewCard}
              onPress={() => router.push('/(screens)/previewMyCard')}
            >
              <View style={[styles.previewIcon, { backgroundColor: theme.colors.warning + '15' }]}>
                <Icon name="eye" size={20} color={theme.colors.warning} />
              </View>
              <View style={commonStyles.flex1}>
                <Text style={styles.previewTitle}>Prévisualiser ma carte</Text>
                <Text style={styles.previewSubtitle}>Voir comment les recruteurs vous voient</Text>
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
  content: {
    padding: wp(5),
    paddingBottom: hp(12),
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  logo: {
    width: wp(35),
    height: hp(4),
  },
  headerButtons: {
    flexDirection: 'row',
    gap: wp(2),
  },
  headerButton: {
    backgroundColor: theme.colors.card,
    padding: wp(2.5),
    borderRadius: theme.radius.md,
  },
  
  // Greeting
  greetingSection: {
    marginBottom: hp(1),
  },
  greeting: {
    fontSize: hp(2.8),
    fontWeight: '700',
    color: theme.colors.text,
  },
  statusRow: {
    gap: wp(1.5),
    marginTop: hp(0.5),
  },

  // Stats Card
  statsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  searchStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    paddingBottom: hp(1.5),
    marginBottom: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusTitle: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.text,
  },
  statusSubtitle: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: hp(2),
    fontWeight: '700',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },

  // Section
  section: {
    marginBottom: hp(3),
  },
  seeAllText: {
    fontSize: hp(1.5),
    color: theme.colors.primary,
    fontWeight: '500',
  },

  // Job cards
  jobsList: {
    paddingTop: hp(1),
    gap: wp(3),
  },
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
  salary: {
    fontSize: hp(1.3),
    color: theme.colors.primary,
    fontWeight: '500',
    marginTop: hp(0.5),
  },

  // Candidate card
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
  offerTag: {
    fontSize: hp(1.2),
    color: theme.colors.primary,
    marginTop: hp(0.5),
  },

  // Activities
  activitiesList: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
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

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: hp(1),
  },
  quickAction: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    alignItems: 'center',
    gap: hp(1),
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: hp(1.3),
    color: theme.colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Empty & Loading
  emptyState: {
    alignItems: 'center',
    paddingVertical: hp(4),
    gap: hp(1),
  },
  emptyTitle: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.text,
  },
  emptySubtitle: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: hp(4),
    alignItems: 'center',
  },

  // Preview Card
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginTop: hp(1.5),
    gap: wp(3),
  },
  previewIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: theme.colors.text,
  },
  previewSubtitle: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
});