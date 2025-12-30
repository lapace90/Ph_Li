import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useInternshipOffer } from '../../hooks/useInternshipOffers';
import { internshipOfferService } from '../../services/internshipOfferService';
import {
  INTERNSHIP_DURATIONS,
  INTERNSHIP_REMUNERATIONS,
  getInternshipTypeLabel,
  getStudyLevelLabel,
  getInternshipColor,
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

export default function InternshipOfferDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { offer, loading, refresh } = useInternshipOffer(id);
  
  const [activeTab, setActiveTab] = useState('details');
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  useEffect(() => {
    if (id && activeTab === 'candidates') loadCandidates();
  }, [id, activeTab]);

  const loadCandidates = async () => {
    setLoadingCandidates(true);
    try {
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
      await internshipOfferService.setStatus(id, offer.status === 'active' ? 'inactive' : 'active');
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
            await internshipOfferService.delete(id);
            router.back();
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer');
          }
        },
      },
    ]);
  };

  const getDurationLabel = (months) => INTERNSHIP_DURATIONS.find(d => d.value === months)?.label || `${months} mois`;
  const getRemunerationLabel = (value) => INTERNSHIP_REMUNERATIONS.find(r => r.value === value)?.label || value;

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
        <Text style={commonStyles.headerTitle}>Détail {offer.type}</Text>
        <Pressable style={commonStyles.headerButton} onPress={() => router.push({ pathname: '/(screens)/internshipOfferEdit', params: { id } })}>
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
          {/* Main Card */}
          <View style={commonStyles.card}>
            <View style={[commonStyles.badge, { backgroundColor: getInternshipColor(offer.type) + '15', alignSelf: 'flex-start', marginBottom: hp(1) }]}>
              <Text style={[commonStyles.badgeText, { color: getInternshipColor(offer.type) }]}>
                {getInternshipTypeLabel(offer.type)}
              </Text>
            </View>
            
            <Text style={commonStyles.sectionTitle}>{offer.title}</Text>

            <View style={[commonStyles.section, { marginTop: hp(1.5), marginBottom: 0 }]}>
              <InfoRow icon="clock" text={getDurationLabel(offer.duration_months)} />
              <InfoRow icon="mapPin" text={`${offer.city}, ${offer.department}`} />
              <InfoRow icon="map" text={offer.region} />
              {offer.required_level && <InfoRow icon="book" text={getStudyLevelLabel(offer.required_level)} />}
              {offer.remuneration && <InfoRow icon="briefcase" text={getRemunerationLabel(offer.remuneration)} />}
              {offer.start_date && <InfoRow icon="calendar" text={`Début : ${new Date(offer.start_date).toLocaleDateString('fr-FR')}`} />}
            </View>
          </View>

          {/* Description */}
          <View style={[commonStyles.card, { marginTop: hp(2) }]}>
            <Text style={commonStyles.sectionTitleSmall}>Description</Text>
            <Text style={[commonStyles.hint, { lineHeight: hp(2.2) }]}>{offer.description}</Text>
          </View>

          {/* Infos */}
          <View style={[commonStyles.card, { marginTop: hp(2) }]}>
            <Text style={commonStyles.sectionTitleSmall}>Informations</Text>
            <View style={styles.infoGrid}>
              <InfoGridItem label="Type" value={getInternshipTypeLabel(offer.type)} />
              <InfoGridItem label="Durée" value={getDurationLabel(offer.duration_months)} />
              <InfoGridItem label="Créée le" value={new Date(offer.created_at).toLocaleDateString('fr-FR')} />
            </View>
          </View>
        </ScrollView>
      ) : (
        <CandidatesTab candidates={candidates} loading={loadingCandidates} onPress={(c) => router.push({ pathname: '/(screens)/candidateDetail', params: { id: c.id, offerId: id, type: 'internship' } })} />
      )}
    </ScreenWrapper>
  );
}

const CandidatesTab = ({ candidates, loading, onPress }) => {
  if (loading) return <View style={commonStyles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

  if (candidates.length === 0) {
    return (
      <View style={commonStyles.emptyContainer}>
        <View style={commonStyles.emptyIcon}><Icon name="users" size={40} color={theme.colors.primary} /></View>
        <Text style={commonStyles.emptyTitle}>Aucune candidature</Text>
        <Text style={commonStyles.emptyText}>Les candidatures d'étudiants apparaîtront ici</Text>
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
          {candidate.study_level || 'Étudiant'}{candidate.region && ` • ${candidate.region}`}
        </Text>
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

const InfoGridItem = ({ label, value }) => (
  <View style={styles.infoGridItem}>
    <Text style={commonStyles.hint}>{label}</Text>
    <Text style={[commonStyles.chipText, { fontFamily: theme.fonts.medium }]}>{value}</Text>
  </View>
);

// MOCK DATA
const MOCK_CANDIDATES = [
  { id: '1', first_name: 'Léa', last_name: 'Bernard', is_anonymous: false, photo_url: null, study_level: '4ème année pharmacie', region: 'Île-de-France', status: 'pending' },
  { id: '2', first_name: null, last_name: null, is_anonymous: true, photo_url: null, study_level: 'BP Préparateur', region: 'Rhône-Alpes', status: 'viewed' },
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
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hp(1.5),
    marginTop: hp(1),
  },
  infoGridItem: {
    width: '45%',
    gap: 2,
  },
});