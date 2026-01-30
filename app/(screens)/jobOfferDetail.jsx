import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useJobOffer } from '../../hooks/useJobOffers';
import { jobOfferService } from '../../services/jobOfferService';
import {
  getPositionTypeLabel,
  getContractTypeLabel,
  getSalaryRangeLabel,
  getExperienceLabel,
  getDiplomaLabel,
  getContractColor,
  getContentStatusInfo,
} from '../../constants/jobOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';

const TABS = [
  { key: 'details', label: 'Détails' },
  { key: 'candidates', label: 'Candidatures' },
];

export default function JobOfferDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { offer, loading, refresh } = useJobOffer(id);
  
  const [activeTab, setActiveTab] = useState('details');
  const [candidates, setCandidates] = useState([]);
  const [matchesCount, setMatchesCount] = useState(0);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  useEffect(() => {
    if (id && activeTab === 'candidates') loadCandidates();
  }, [id, activeTab]);

  const loadCandidates = async () => {
    setLoadingCandidates(true);
    try {
      // TODO: applicationService.getByJobOffer(id)
      setCandidates(MOCK_CANDIDATES);
      // TODO: matchingService.getMatchesCountByOffer(id)
      setMatchesCount(MOCK_MATCHES_COUNT);
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!offer) return;
    try {
      await jobOfferService.setStatus(id, offer.status === 'active' ? 'inactive' : 'active');
      refresh();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le statut');
    }
  };

  const handleDelete = () => {
    Alert.alert('Supprimer l\'annonce', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await jobOfferService.delete(id);
            router.back();
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer');
          }
        },
      },
    ]);
  };

  if (loading || !offer) {
    return <View style={commonStyles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  const statusInfo = getContentStatusInfo(offer.status);

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={commonStyles.header}>
        <Pressable style={commonStyles.headerButton} onPress={() => router.back()}>
          <Icon name="arrowLeft" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={commonStyles.headerTitle}>Détail annonce</Text>
        <Pressable style={commonStyles.headerButton} onPress={() => router.push({ pathname: '/(screens)/jobOfferEdit', params: { id } })}>
          <Icon name="edit" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={[commonStyles.badge, { backgroundColor: theme.colors[statusInfo.color] + '15' }]}>
          <Text style={[commonStyles.badgeText, { color: theme.colors[statusInfo.color] }]}>{statusInfo.label}</Text>
        </View>
        <View style={commonStyles.rowGapSmall}>
          <Pressable style={styles.iconButton} onPress={handleToggleStatus}>
            <Icon name={offer.status === 'active' ? 'eyeOff' : 'eye'} size={18} color={offer.status === 'active' ? theme.colors.warning : theme.colors.success} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={handleDelete}>
            <Icon name="trash" size={18} color={theme.colors.rose} />
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}{tab.key === 'candidates' && candidates.length > 0 && ` (${candidates.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'details' ? (
        <ScrollView style={commonStyles.flex1} contentContainerStyle={commonStyles.scrollContent} showsVerticalScrollIndicator={false}>
          <DetailsTab offer={offer} />
        </ScrollView>
      ) : (
        <CandidatesTab candidates={candidates} loading={loadingCandidates} router={router} offerId={id} matchesCount={matchesCount} />
      )}
    </ScreenWrapper>
  );
}

const DetailsTab = ({ offer }) => (
  <View style={{ gap: hp(2) }}>
    {/* Main Card */}
    <View style={commonStyles.card}>
      <View style={[commonStyles.badge, { backgroundColor: getContractColor(offer.contract_type) + '15', alignSelf: 'flex-start', marginBottom: hp(1) }]}>
        <Text style={[commonStyles.badgeText, { color: getContractColor(offer.contract_type) }]}>
          {getContractTypeLabel(offer.contract_type)}
        </Text>
      </View>
      
      <Text style={commonStyles.sectionTitle}>{offer.title}</Text>
      <Text style={[commonStyles.hint, { marginBottom: hp(1.5) }]}>{getPositionTypeLabel(offer.position_type)}</Text>

      <View style={{ gap: hp(0.8) }}>
        <InfoRow icon="mapPin" text={offer.address} />
        <InfoRow icon="map" text={`${offer.city}, ${offer.department}, ${offer.region}`} />
        {offer.salary_range && <InfoRow icon="briefcase" text={getSalaryRangeLabel(offer.salary_range)} />}
        <InfoRow icon="award" text={getExperienceLabel(offer.required_experience)} />
        {offer.start_date && <InfoRow icon="calendar" text={`Début : ${new Date(offer.start_date).toLocaleDateString('fr-FR')}`} />}
      </View>
    </View>

    {/* Description */}
    <View style={commonStyles.card}>
      <Text style={commonStyles.sectionTitleSmall}>Description</Text>
      <Text style={[commonStyles.hint, { lineHeight: hp(2.2) }]}>{offer.description}</Text>
    </View>

    {/* Diplômes */}
    {offer.required_diplomas?.length > 0 && (
      <View style={commonStyles.card}>
        <Text style={commonStyles.sectionTitleSmall}>Diplômes requis</Text>
        <View style={commonStyles.chipsContainerCompact}>
          {offer.required_diplomas.map((d, i) => (
            <View key={i} style={[commonStyles.badge, commonStyles.badgePrimary]}>
              <Text style={[commonStyles.badgeText, commonStyles.badgeTextPrimary]}>{getDiplomaLabel(d)}</Text>
            </View>
          ))}
        </View>
      </View>
    )}
  </View>
);

const CandidatesTab = ({ candidates, loading, router, offerId, matchesCount = 0 }) => {
  if (loading) return <View style={commonStyles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

  // Calculer les stats
  const unviewedCount = candidates.filter(c => c.status === 'pending').length;
  const viewedCount = candidates.filter(c => c.status !== 'pending').length;
  const totalCount = candidates.length;

  if (totalCount === 0 && matchesCount === 0) {
    return (
      <View style={commonStyles.emptyContainer}>
        <View style={commonStyles.emptyIcon}><Icon name="users" size={40} color={theme.colors.primary} /></View>
        <Text style={commonStyles.emptyTitle}>Aucune candidature</Text>
        <Text style={commonStyles.emptyText}>Les candidats intéressés apparaîtront ici</Text>
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.flex1} contentContainerStyle={styles.candidatesContainer} showsVerticalScrollIndicator={false}>
      {/* Compteur principal */}
      <View style={styles.counterCard}>
        <View style={styles.counterIcon}>
          <Icon name="users" size={28} color={theme.colors.primary} />
        </View>
        <View style={styles.counterInfo}>
          <Text style={styles.counterTotal}>{totalCount}</Text>
          <Text style={styles.counterLabel}>candidat{totalCount > 1 ? 's' : ''} intéressé{totalCount > 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Répartition en 2 colonnes */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <View style={[styles.statIcon, { backgroundColor: theme.colors.rose + '15' }]}>
            <Icon name="eye" size={18} color={theme.colors.rose} />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statNumber}>{unviewedCount}</Text>
            <Text style={styles.statLabel}>Non consultée{unviewedCount > 1 ? 's' : ''}</Text>
          </View>
        </View>
        <View style={styles.statBox}>
          <View style={[styles.statIcon, { backgroundColor: theme.colors.secondaryLight + '15' }]}>
            <Icon name="checkCircle" size={18} color={theme.colors.secondaryLight} />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statNumber}>{viewedCount}</Text>
            <Text style={styles.statLabel}>Consultée{viewedCount > 1 ? 's' : ''}</Text>
          </View>
        </View>
      </View>

      {/* Matchs - centré */}
      <View style={styles.statsGridCentered}>
        <View style={styles.statBox}>
          <View style={[styles.statIcon, { backgroundColor: theme.colors.primary + '15' }]}>
            <Icon name="heart" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statNumber}>{matchesCount}</Text>
            <Text style={styles.statLabel}>Match{matchesCount > 1 ? 's' : ''}</Text>
          </View>
        </View>
      </View>

      {/* Info discretion */}
      <View style={[commonStyles.card, commonStyles.rowGapSmall, { alignItems: 'flex-start' }]}>
        <Icon name="shield" size={18} color={theme.colors.textLight} />
        <Text style={[commonStyles.hint, { flex: 1, lineHeight: hp(2) }]}>
          Les profils restent anonymes jusqu'au match. Swipez sur les candidats pour découvrir des profils compatibles.
        </Text>
      </View>

      {/* Bouton swipe */}
      <Pressable
        style={[commonStyles.buttonPrimary, commonStyles.rowGapSmall, { justifyContent: 'center' }]}
        onPress={() => router.push({ pathname: '/(tabs)/matching', params: { offerId } })}
      >
        <Icon name="heart" size={20} color="white" />
        <Text style={commonStyles.buttonPrimaryText}>Swiper les candidats</Text>
      </Pressable>

      {/* Upsell Premium */}
      <Pressable
        style={styles.premiumCard}
        onPress={() => router.push('/(screens)/subscription')}
      >
        <View style={styles.premiumBadge}>
          <Icon name="star" size={14} color={theme.colors.warning} />
          <Text style={styles.premiumBadgeText}>Premium</Text>
        </View>
        <Text style={styles.premiumTitle}>Voir tous les candidats</Text>
        <Text style={styles.premiumText}>
          Accédez directement aux profils des candidats intéressés sans attendre le match.
        </Text>
        <View style={styles.premiumButton}>
          <Text style={styles.premiumButtonText}>Découvrir l'offre</Text>
          <Icon name="chevronRight" size={16} color={theme.colors.warning} />
        </View>
      </Pressable>
    </ScrollView>
  );
};

const InfoRow = ({ icon, text }) => (
  <View style={commonStyles.rowGapSmall}>
    <Icon name={icon} size={16} color={theme.colors.textLight} />
    <Text style={commonStyles.hint}>{text}</Text>
  </View>
);

// MOCK DATA
const MOCK_CANDIDATES = [
  { id: '1', first_name: 'Marie', last_name: 'Dupont', is_anonymous: false, photo_url: null, experience_years: 5, region: 'Île-de-France', match_score: 92, status: 'pending' },
  { id: '2', first_name: null, last_name: null, is_anonymous: true, photo_url: null, experience_years: 3, region: 'Rhône-Alpes', match_score: 85, status: 'viewed' },
  { id: '3', first_name: 'Pierre', last_name: 'Martin', is_anonymous: false, photo_url: null, experience_years: null, region: 'PACA', match_score: 78, status: 'shortlisted' },
];
const MOCK_MATCHES_COUNT = 2;

const styles = StyleSheet.create({
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: hp(1.5),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
  },
  // Candidates counter styles
  candidatesContainer: {
    flex: 1,
    padding: wp(5),
    gap: hp(2),
  },
  counterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2.5),
    gap: wp(4),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  counterIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterInfo: {
    flex: 1,
  },
  counterTotal: {
    fontSize: hp(3.5),
    fontWeight: '700',
    color: theme.colors.text,
  },
  counterLabel: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    marginTop: hp(0.3),
  },
  statsGrid: {
    flexDirection: 'row',
    gap: hp(1.5),
  },
  statsGridCentered: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statBox: {
    flex: 1,
    maxWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: hp(1.5),
    gap: wp(3),
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginTop: hp(0.2),
  },
  // Premium upsell card
  premiumCard: {
    backgroundColor: theme.colors.warning + '10',
    borderRadius: theme.radius.lg,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.warning + '30',
    gap: hp(1),
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.warning + '20',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.4),
    borderRadius: theme.radius.md,
  },
  premiumBadgeText: {
    fontSize: hp(1.2),
    fontWeight: '700',
    color: theme.colors.warning,
  },
  premiumTitle: {
    fontSize: hp(1.7),
    fontWeight: '600',
    color: theme.colors.text,
  },
  premiumText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    lineHeight: hp(2),
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginTop: hp(0.5),
  },
  premiumButtonText: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: theme.colors.warning,
  },
});