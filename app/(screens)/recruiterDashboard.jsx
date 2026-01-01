import { useState } from 'react';
import { View, Text, Pressable, FlatList, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { useJobOffers } from '../../hooks/useJobOffers';
import { useInternshipOffers } from '../../hooks/useInternshipOffers';
import { useMyListings } from '../../hooks/usePharmacyListings';
import {
  getPositionTypeLabel,
  getContractTypeLabel,
  getInternshipTypeLabel,
  getContractColor,
  getInternshipColor,
  getContentStatusInfo,
} from '../../constants/jobOptions';
import {
  getListingTypeLabel,
  getListingTypeColor,
  getListingStatusInfo,
  formatNumber,
} from '../../constants/listingOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import RppsBadge from '../../components/common/RppsBadge';

// TODO: Passer à false en production
const DEV_BYPASS_RPPS_CHECK = true;

const TABS = [
  { key: 'jobs', label: 'Emplois', icon: 'briefcase' },
  { key: 'internships', label: 'Stages', icon: 'book' },
  { key: 'pharmacies', label: 'Pharmacies', icon: 'home' },
];

export default function RecruiterDashboard() {
  const router = useRouter();
  const { session, user } = useAuth();
  
  // Vérification : seuls les titulaires avec RPPS vérifié peuvent publier
  const canPublish = DEV_BYPASS_RPPS_CHECK || (user?.user_type === 'titulaire' && user?.rpps_verified);
  
  const { 
    offers: jobOffers, 
    loading: loadingJobs, 
    stats: jobStats, 
    refresh: refreshJobs, 
    deleteOffer: deleteJob, 
    setStatus: setJobStatus 
  } = useJobOffers(session?.user?.id);
  
  const { 
    offers: internshipOffers, 
    loading: loadingInternships, 
    stats: internshipStats, 
    refresh: refreshInternships, 
    deleteOffer: deleteInternship, 
    setStatus: setInternshipStatus 
  } = useInternshipOffers(session?.user?.id);

  const {
    listings,
    loading: loadingListings,
    refresh: refreshListings,
    deleteListing,
    setStatus: setListingStatus,
  } = useMyListings(session?.user?.id);
  
  const [activeTab, setActiveTab] = useState('jobs');

  // Données selon le tab actif
  const getTabData = () => {
    switch (activeTab) {
      case 'jobs':
        return { loading: loadingJobs, data: jobOffers, refresh: refreshJobs };
      case 'internships':
        return { loading: loadingInternships, data: internshipOffers, refresh: refreshInternships };
      case 'pharmacies':
        return { loading: loadingListings, data: listings, refresh: refreshListings };
      default:
        return { loading: false, data: [], refresh: () => {} };
    }
  };

  const { loading, data, refresh } = getTabData();

  // Stats listings
  const listingStats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'active').length,
  };

  const handleCreateOffer = () => {
    if (!canPublish) {
      Alert.alert(
        'Vérification requise',
        'Seuls les titulaires avec un badge RPPS vérifié peuvent publier des annonces.\n\nRendez-vous dans votre profil pour soumettre votre vérification RPPS.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Vérifier mon profil', onPress: () => router.push('/(screens)/rppsVerification') }
        ]
      );
      return;
    }
    
    const routes = {
      jobs: '/(screens)/jobOfferCreate',
      internships: '/(screens)/internshipOfferCreate',
      pharmacies: '/(screens)/listingCreate',
    };
    router.push(routes[activeTab]);
  };

  const handleOfferPress = (item) => {
    const routes = {
      jobs: '/(screens)/jobOfferDetail',
      internships: '/(screens)/internshipOfferDetail',
      pharmacies: '/(screens)/listingDetail',
    };
    router.push({ pathname: routes[activeTab], params: { id: item.id } });
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Supprimer l\'annonce',
      `Voulez-vous vraiment supprimer "${item.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            let error;
            if (activeTab === 'jobs') {
              ({ error } = await deleteJob(item.id));
            } else if (activeTab === 'internships') {
              ({ error } = await deleteInternship(item.id));
            } else {
              ({ error } = await deleteListing(item.id));
            }
            if (error) Alert.alert('Erreur', 'Impossible de supprimer');
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    let error;
    
    if (activeTab === 'jobs') {
      ({ error } = await setJobStatus(item.id, newStatus));
    } else if (activeTab === 'internships') {
      ({ error } = await setInternshipStatus(item.id, newStatus));
    } else {
      ({ error } = await setListingStatus(item.id, newStatus));
    }
    
    if (error) Alert.alert('Erreur', 'Impossible de modifier le statut');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // Render card emploi/stage
  const renderOfferCard = ({ item }) => {
    const statusInfo = getContentStatusInfo(item.status);
    const isJobTab = activeTab === 'jobs';
    const typeColor = isJobTab ? getContractColor(item.contract_type) : getInternshipColor(item.type);
    const typeLabel = isJobTab ? getContractTypeLabel(item.contract_type) : getInternshipTypeLabel(item.type);

    return (
      <Pressable style={commonStyles.card} onPress={() => handleOfferPress(item)}>
        <View style={commonStyles.rowBetween}>
          <View style={[commonStyles.badge, { backgroundColor: theme.colors[statusInfo.color] + '15' }]}>
            <Text style={[commonStyles.badgeText, { color: theme.colors[statusInfo.color] }]}>
              {statusInfo.label}
            </Text>
          </View>
          <View style={[commonStyles.badge, { backgroundColor: typeColor + '15' }]}>
            <Text style={[commonStyles.badgeText, { color: typeColor }]}>{typeLabel}</Text>
          </View>
        </View>

        <Text style={[commonStyles.listItemTitle, { marginTop: hp(1.2) }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={commonStyles.listItemSubtitle}>
          {isJobTab ? getPositionTypeLabel(item.position_type) : `${item.duration_months} mois`}
        </Text>

        <View style={[commonStyles.rowGapSmall, { marginVertical: hp(1) }]}>
          <Icon name="mapPin" size={14} color={theme.colors.textLight} />
          <Text style={commonStyles.hint}>{item.city}, {item.department}</Text>
        </View>

        <View style={[commonStyles.rowBetween, styles.cardFooter]}>
          <Text style={commonStyles.hint}>Créée le {formatDate(item.created_at)}</Text>
          <View style={commonStyles.rowGapSmall}>
            <Pressable style={styles.iconButton} onPress={() => handleToggleStatus(item)}>
              <Icon 
                name={item.status === 'active' ? 'eyeOff' : 'eye'} 
                size={16} 
                color={item.status === 'active' ? theme.colors.warning : theme.colors.success} 
              />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => handleDelete(item)}>
              <Icon name="trash" size={16} color={theme.colors.rose} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  // Render card pharmacie
  const renderListingCard = ({ item }) => {
    const statusInfo = getListingStatusInfo(item.status);
    const typeColor = getListingTypeColor(item.type);
    const photo = item.photos?.[0];

    return (
      <Pressable style={styles.listingCard} onPress={() => handleOfferPress(item)}>
        {/* Photo */}
        <View style={styles.listingPhoto}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.listingImage} contentFit="cover" />
          ) : (
            <View style={styles.listingImagePlaceholder}>
              <Icon name="home" size={24} color={theme.colors.gray} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.listingInfo}>
          <View style={commonStyles.rowBetween}>
            <View style={[commonStyles.badge, { backgroundColor: theme.colors[statusInfo.color] + '15' }]}>
              <Text style={[commonStyles.badgeText, { color: theme.colors[statusInfo.color] }]}>
                {statusInfo.label}
              </Text>
            </View>
            <View style={[commonStyles.badge, { backgroundColor: typeColor + '15' }]}>
              <Text style={[commonStyles.badgeText, { color: typeColor }]}>{getListingTypeLabel(item.type)}</Text>
            </View>
          </View>

          <Text style={styles.listingTitle} numberOfLines={2}>{item.title}</Text>

          <View style={commonStyles.rowGapSmall}>
            <Icon name="mapPin" size={14} color={theme.colors.textLight} />
            <Text style={commonStyles.hint}>
              {item.anonymized ? item.region : `${item.city}, ${item.department}`}
            </Text>
          </View>

          {item.price && (
            <Text style={styles.listingPrice}>
              {formatNumber(item.price)} €{item.negotiable ? ' (nég.)' : ''}
            </Text>
          )}

          <View style={styles.listingFooter}>
            <Text style={commonStyles.hint}>{formatDate(item.created_at)}</Text>
            <View style={commonStyles.rowGapSmall}>
              <Pressable style={styles.iconButtonSmall} onPress={() => handleToggleStatus(item)}>
                <Icon 
                  name={item.status === 'active' ? 'eyeOff' : 'eye'} 
                  size={14} 
                  color={item.status === 'active' ? theme.colors.warning : theme.colors.success} 
                />
              </Pressable>
              <Pressable style={styles.iconButtonSmall} onPress={() => handleDelete(item)}>
                <Icon name="trash" size={14} color={theme.colors.rose} />
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderItem = (props) => {
    return activeTab === 'pharmacies' ? renderListingCard(props) : renderOfferCard(props);
  };

  const renderEmpty = () => {
    const emptyConfig = {
      jobs: { icon: 'briefcase', title: 'Aucune annonce emploi', text: 'Publiez votre première annonce pour trouver le candidat idéal' },
      internships: { icon: 'book', title: 'Aucune annonce stage/alternance', text: 'Proposez des stages pour former vos futurs collaborateurs' },
      pharmacies: { icon: 'home', title: 'Aucune annonce pharmacie', text: 'Publiez une annonce pour vendre ou louer votre pharmacie' },
    };
    const config = emptyConfig[activeTab];

    return (
      <View style={commonStyles.emptyContainer}>
        <View style={commonStyles.emptyIcon}>
          <Icon name={config.icon} size={40} color={theme.colors.primary} />
        </View>
        <Text style={commonStyles.emptyTitle}>{config.title}</Text>
        <Text style={commonStyles.emptyText}>{config.text}</Text>
        <Pressable style={[commonStyles.buttonPrimary, commonStyles.rowGapSmall, { marginTop: hp(3) }]} onPress={handleCreateOffer}>
          <Icon name="plus" size={18} color="white" />
          <Text style={commonStyles.buttonPrimaryText}>Créer une annonce</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={commonStyles.headerNoBorder}>
        <Pressable style={commonStyles.headerButton} onPress={() => router.back()}>
          <Icon name="arrowLeft" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={commonStyles.headerTitleLarge}>Mes annonces</Text>
        <Pressable style={[commonStyles.headerButton, styles.addButton, !canPublish && styles.addButtonDisabled]} onPress={handleCreateOffer}>
          <Icon name="plus" size={22} color="white" />
        </Pressable>
      </View>

      {/* Banner vérification requise */}
      {!canPublish && (
        <Pressable 
          style={styles.verificationBanner}
          onPress={() => router.push('/(screens)/rppsVerification')}
        >
          <Icon name="alertCircle" size={20} color={theme.colors.warning} />
          <View style={commonStyles.flex1}>
            <Text style={styles.bannerTitle}>Vérification RPPS requise</Text>
            <Text style={styles.bannerText}>Pour publier des annonces, faites vérifier votre profil</Text>
          </View>
          <Icon name="chevronRight" size={18} color={theme.colors.warning} />
        </Pressable>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard value={jobStats.total + internshipStats.total + listingStats.total} label="Total" />
        <StatCard value={jobStats.active + internshipStats.active + listingStats.active} label="Actives" color={theme.colors.success} />
        <StatCard value={jobStats.total} label="Emplois" color={theme.colors.primary} />
        <StatCard value={internshipStats.total} label="Stages" color={theme.colors.secondary} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Icon 
              name={tab.icon} 
              size={16} 
              color={activeTab === tab.key ? 'white' : theme.colors.textLight} 
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={data.length === 0 ? commonStyles.flex1 : commonStyles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={refresh}
        />
      )}
    </ScreenWrapper>
  );
}

const StatCard = ({ value, label, color }) => (
  <View style={[styles.statCard, color && { backgroundColor: color + '10' }]}>
    <Text style={[styles.statValue, color && { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: theme.colors.primary,
  },
  addButtonDisabled: {
    backgroundColor: theme.colors.gray,
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '15',
    marginHorizontal: wp(5),
    marginBottom: hp(2),
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    gap: wp(3),
  },
  bannerTitle: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.warning,
  },
  bannerText: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    gap: wp(2),
    marginBottom: hp(2),
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: hp(1.1),
    color: theme.colors.textLight,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: wp(5),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 4,
    marginBottom: hp(2),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.5),
    paddingVertical: hp(1.2),
    borderRadius: theme.radius.md,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.medium,
  },
  tabTextActive: {
    color: 'white',
  },
  cardFooter: {
    paddingTop: hp(1.2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Styles spécifiques aux listings
  listingCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  listingPhoto: {
    width: wp(28),
    height: '100%',
    minHeight: hp(16),
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  listingImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingInfo: {
    flex: 1,
    padding: hp(1.5),
    gap: hp(0.8),
  },
  listingTitle: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  listingPrice: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary,
  },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: hp(0.8),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});