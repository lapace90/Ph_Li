import { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, FlatList, Alert, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { favoritesService, FAVORITE_TYPES } from '../../services/favoritesService';
import { getListingTypeLabel, getListingTypeColor, formatNumber } from '../../constants/listingOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';

const TABS = [
  { key: 'candidates', label: 'Candidats', icon: 'users' },
  { key: 'listings', label: 'Marketplace', icon: 'home' },
];

export default function MyFavorites() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [activeTab, setActiveTab] = useState('candidates');
  const [candidates, setCandidates] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCandidates = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await favoritesService.getCandidateFavorites(userId);
      setCandidates(data);
    } catch (error) {
      console.error('Erreur chargement candidats favoris:', error);
    }
  }, [userId]);

  const fetchListings = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await favoritesService.getPharmacyListingFavorites(userId);
      setListings(data);
    } catch (error) {
      console.error('Erreur chargement annonces favorites:', error);
    }
  }, [userId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCandidates(), fetchListings()]);
    setLoading(false);
  }, [fetchCandidates, fetchListings]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const handleRemoveFavorite = async (targetType, targetId, name) => {
    Alert.alert(
      'Retirer des favoris',
      `Voulez-vous retirer "${name}" de vos favoris ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await favoritesService.remove(userId, targetType, targetId);
              if (targetType === FAVORITE_TYPES.CANDIDATE) {
                setCandidates(prev => prev.filter(f => f.target_id !== targetId));
              } else {
                setListings(prev => prev.filter(f => f.target_id !== targetId));
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de retirer ce favori');
            }
          },
        },
      ]
    );
  };

  const handleCandidatePress = (item) => {
    router.push({
      pathname: '/(screens)/candidateDetail',
      params: { candidateId: item.target_id }
    });
  };

  const handleListingPress = (item) => {
    router.push({
      pathname: '/(screens)/listingDetail',
      params: { id: item.target_id }
    });
  };

  const renderCandidateCard = ({ item }) => {
    const profile = item.profile;
    if (!profile) return null;

    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    const location = [profile.current_city, profile.current_region].filter(Boolean).join(', ');

    return (
      <Pressable style={styles.candidateCard} onPress={() => handleCandidatePress(item)}>
        <View style={styles.candidateAvatar}>
          {profile.photo_url ? (
            <Image source={{ uri: profile.photo_url }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="user" size={24} color={theme.colors.gray} />
            </View>
          )}
        </View>

        <View style={styles.candidateInfo}>
          <Text style={styles.candidateName} numberOfLines={1}>{fullName || 'Candidat'}</Text>
          {location && (
            <View style={commonStyles.rowGapSmall}>
              <Icon name="mapPin" size={12} color={theme.colors.textLight} />
              <Text style={commonStyles.hint} numberOfLines={1}>{location}</Text>
            </View>
          )}
          <Text style={styles.savedDate}>
            Sauvegardé le {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </Text>
        </View>

        <Pressable
          style={styles.removeButton}
          onPress={() => handleRemoveFavorite(FAVORITE_TYPES.CANDIDATE, item.target_id, fullName)}
        >
          <Icon name="star" size={18} color={theme.colors.warning} fill={theme.colors.warning} />
        </Pressable>
      </Pressable>
    );
  };

  const renderListingCard = ({ item }) => {
    const listing = item.listing;
    if (!listing) return null;

    const photo = listing.photos?.[0];
    const typeColor = getListingTypeColor(listing.type);

    return (
      <Pressable style={styles.listingCard} onPress={() => handleListingPress(item)}>
        <View style={styles.listingPhoto}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.listingImage} contentFit="cover" />
          ) : (
            <View style={styles.listingImagePlaceholder}>
              <Icon name="home" size={24} color={theme.colors.gray} />
            </View>
          )}
        </View>

        <View style={styles.listingInfo}>
          <View style={commonStyles.rowBetween}>
            <View style={[commonStyles.badge, { backgroundColor: typeColor + '15' }]}>
              <Text style={[commonStyles.badgeText, { color: typeColor }]}>{getListingTypeLabel(listing.type)}</Text>
            </View>
            <Pressable
              style={styles.removeButtonSmall}
              onPress={() => handleRemoveFavorite(FAVORITE_TYPES.PHARMACY_LISTING, item.target_id, listing.title)}
            >
              <Icon name="star" size={14} color={theme.colors.warning} fill={theme.colors.warning} />
            </Pressable>
          </View>

          <Text style={styles.listingTitle} numberOfLines={2}>{listing.title}</Text>

          <View style={commonStyles.rowGapSmall}>
            <Icon name="mapPin" size={12} color={theme.colors.textLight} />
            <Text style={commonStyles.hint} numberOfLines={1}>
              {listing.anonymized ? listing.region : `${listing.city}, ${listing.department}`}
            </Text>
          </View>

          {listing.price && (
            <Text style={styles.listingPrice}>
              {formatNumber(listing.price)} €{listing.negotiable ? ' (nég.)' : ''}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => {
    const isCandidate = activeTab === 'candidates';
    return (
      <View style={commonStyles.emptyContainer}>
        <View style={commonStyles.emptyIcon}>
          <Icon name={isCandidate ? 'users' : 'home'} size={40} color={theme.colors.primary} />
        </View>
        <Text style={commonStyles.emptyTitle}>
          {isCandidate ? 'Aucun candidat sauvegardé' : 'Aucune annonce sauvegardée'}
        </Text>
        <Text style={commonStyles.emptyText}>
          {isCandidate
            ? 'Sauvegardez des candidats intéressants pour les retrouver ici'
            : 'Sauvegardez des annonces du marketplace pour les retrouver ici'
          }
        </Text>
        <Pressable
          style={[commonStyles.buttonPrimary, commonStyles.rowGapSmall, { marginTop: hp(3) }]}
          onPress={() => router.push(isCandidate ? '/(tabs)/matching' : '/(screens)/pharmacyListings')}
        >
          <Icon name={isCandidate ? 'heart' : 'search'} size={18} color="white" />
          <Text style={commonStyles.buttonPrimaryText}>
            {isCandidate ? 'Découvrir des candidats' : 'Parcourir le marketplace'}
          </Text>
        </Pressable>
      </View>
    );
  };

  const currentData = activeTab === 'candidates' ? candidates : listings;
  const renderItem = activeTab === 'candidates' ? renderCandidateCard : renderListingCard;

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={commonStyles.headerNoBorder}>
        <Pressable style={commonStyles.headerButton} onPress={() => router.back()}>
          <Icon name="arrowLeft" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={commonStyles.headerTitleLarge}>Mes favoris</Text>
        <View style={commonStyles.headerButton} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.warning + '15' }]}>
          <Text style={[styles.statValue, { color: theme.colors.warning }]}>{candidates.length}</Text>
          <Text style={styles.statLabel}>Candidats</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.primary + '15' }]}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{listings.length}</Text>
          <Text style={styles.statLabel}>Annonces</Text>
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
          data={currentData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={currentData.length === 0 ? commonStyles.flex1 : commonStyles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    gap: wp(3),
    marginBottom: hp(2),
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(2),
    alignItems: 'center',
  },
  statValue: {
    fontSize: hp(2.8),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: hp(1.3),
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
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.medium,
  },
  tabTextActive: {
    color: 'white',
  },
  // Candidate card
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: wp(3),
  },
  candidateAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.darkLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  candidateInfo: {
    flex: 1,
    gap: hp(0.3),
  },
  candidateName: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  savedDate: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    marginTop: hp(0.3),
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.warning + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.warning + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Listing card
  listingCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  listingPhoto: {
    width: wp(28),
    aspectRatio: 1,
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  listingImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.darkLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingInfo: {
    flex: 1,
    padding: hp(1.5),
    gap: hp(0.5),
  },
  listingTitle: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  listingPrice: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary,
    marginTop: hp(0.3),
  },
});
