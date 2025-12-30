import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, Alert, ActivityIndicator, StyleSheet } from 'react-native';
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
  getApplicationStatusInfo,
} from '../../constants/jobOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import Avatar from '../../components/common/Avatar';

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
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  useEffect(() => {
    if (id && activeTab === 'candidates') loadCandidates();
  }, [id, activeTab]);

  const loadCandidates = async () => {
    setLoadingCandidates(true);
    try {
      // TODO: applicationService.getByJobOffer(id)
      setCandidates(MOCK_CANDIDATES);
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
        <CandidatesTab candidates={candidates} loading={loadingCandidates} onPress={(c) => router.push({ pathname: '/(screens)/candidateDetail', params: { id: c.id, offerId: id } })} />
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

const CandidatesTab = ({ candidates, loading, onPress }) => {
  if (loading) return <View style={commonStyles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

  if (candidates.length === 0) {
    return (
      <View style={commonStyles.emptyContainer}>
        <View style={commonStyles.emptyIcon}><Icon name="users" size={40} color={theme.colors.primary} /></View>
        <Text style={commonStyles.emptyTitle}>Aucune candidature</Text>
        <Text style={commonStyles.emptyText}>Les candidatures apparaîtront ici</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={candidates}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <CandidateCard candidate={item} onPress={() => onPress(item)} />}
      contentContainerStyle={commonStyles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const CandidateCard = ({ candidate, onPress }) => {
  const statusInfo = getApplicationStatusInfo(candidate.status);
  return (
    <Pressable style={commonStyles.listItem} onPress={onPress}>
      <Avatar uri={candidate.is_anonymous ? null : candidate.photo_url} size={hp(6)} />
      <View style={commonStyles.listItemContent}>
        <Text style={commonStyles.listItemTitle}>
          {candidate.is_anonymous ? 'Candidat anonyme' : `${candidate.first_name} ${candidate.last_name?.[0]}.`}
        </Text>
        <Text style={commonStyles.listItemSubtitle}>
          {candidate.experience_years ? `${candidate.experience_years} ans d'exp.` : 'Débutant'}
          {candidate.region && ` • ${candidate.region}`}
        </Text>
        {candidate.match_score && (
          <View style={[commonStyles.rowGapSmall, { marginTop: hp(0.5) }]}>
            <Icon name="zap" size={12} color={theme.colors.primary} />
            <Text style={[commonStyles.hint, { color: theme.colors.primary }]}>{candidate.match_score}% match</Text>
          </View>
        )}
      </View>
      <View style={{ alignItems: 'flex-end', gap: hp(0.5) }}>
        <View style={[commonStyles.badge, { backgroundColor: theme.colors[statusInfo.color] + '15' }]}>
          <Text style={[commonStyles.badgeText, { color: theme.colors[statusInfo.color] }]}>{statusInfo.label}</Text>
        </View>
        <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
      </View>
    </Pressable>
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
});