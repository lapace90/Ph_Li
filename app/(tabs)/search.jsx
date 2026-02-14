// app/(tabs)/search.jsx
// Carte de France - Marketplace pharmacies (vente/location/association)
// Identique pour TOUS les utilisateurs

import { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ALL_REGIONS, getRegionByDepartment } from '../../constants/francePaths';
import { LISTING_TYPE_FILTERS, getListingTypeLabel } from '../../constants/jobOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import FranceMap from '../../components/map/FranceMap';
import ListingCard from '../../components/marketplace/ListingCard';

export default function Search() {
  const router = useRouter();
  const { user } = useAuth();
  const isTitulaire = user?.user_type === 'titulaire';

  // Vue carte ou liste
  const [viewMode, setViewMode] = useState('map');

  // Filtre type de listing (vente, location, association, ou tout)
  const [listingType, setListingType] = useState(null);

  // Région sélectionnée sur la carte
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Données
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les annonces marketplace
  const loadListings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacy_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (err) {
      console.error('Error loading pharmacy listings:', err);
      setListings([]);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadListings();
      setLoading(false);
    };
    load();
  }, [loadListings]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadListings();
    setRefreshing(false);
  };

  // Filtrer par type de listing
  const filteredByType = useMemo(() => {
    if (!listingType) return listings;
    return listings.filter(l => l.type === listingType);
  }, [listings, listingType]);

  // Filtrer par région sélectionnée
  const filteredData = useMemo(() => {
    if (!selectedRegion) return filteredByType;
    
    return filteredByType.filter(listing => {
      // Chercher par département
      if (listing.department) {
        const region = getRegionByDepartment(listing.department);
        return region?.id === selectedRegion;
      }
      // Ou par région directe
      if (listing.region) {
        const regionData = ALL_REGIONS.find(r => 
          r.name.toLowerCase() === listing.region.toLowerCase()
        );
        return regionData?.id === selectedRegion;
      }
      return false;
    });
  }, [filteredByType, selectedRegion]);

  // Compteurs par région (pour la carte)
  const countsByRegion = useMemo(() => {
    const counts = {};
    
    filteredByType.forEach(listing => {
      let regionId = null;
      
      if (listing.department) {
        const region = getRegionByDepartment(listing.department);
        if (region) regionId = region.id;
      } else if (listing.region) {
        const regionData = ALL_REGIONS.find(r => 
          r.name.toLowerCase() === listing.region.toLowerCase()
        );
        if (regionData) regionId = regionData.id;
      }
      
      if (regionId) {
        counts[regionId] = (counts[regionId] || 0) + 1;
      }
    });
    
    return counts;
  }, [filteredByType]);

  // Compteurs par type de listing
  const getTypeCount = (type) => {
    if (type === null) return listings.length;
    return listings.filter(l => l.type === type).length;
  };

  // Nom de la région sélectionnée
  const selectedRegionName = useMemo(() => {
    if (!selectedRegion) return null;
    return ALL_REGIONS.find(r => r.id === selectedRegion)?.name;
  }, [selectedRegion]);

  // Clic sur une région
  const handleRegionPress = useCallback((region) => {
    if (selectedRegion === region.id) {
      setSelectedRegion(null); // Déselectionner
    } else {
      setSelectedRegion(region.id);
    }
  }, [selectedRegion]);

  // Ouvrir le détail d'une annonce
  const handleListingPress = useCallback((listing) => {
    router.push({
      pathname: '/(screens)/listingDetail',
      params: { id: listing.id }
    });
  }, [router]);

  // Reset filtres
  const handleReset = () => {
    setListingType(null);
    setSelectedRegion(null);
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
        <View style={styles.headerActions}>
          {(listingType || selectedRegion) && (
            <Pressable style={styles.resetButton} onPress={handleReset}>
              <Icon name="x" size={16} color={theme.colors.textLight} />
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          )}
          {/* Toggle carte / liste */}
          <View style={styles.viewToggle}>
            <Pressable
              style={[styles.viewToggleBtn, viewMode === 'map' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('map')}
            >
              <Icon name="mapPin" size={16} color={viewMode === 'map' ? 'white' : theme.colors.textLight} />
            </Pressable>
            <Pressable
              style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
              onPress={() => { setViewMode('list'); setSelectedRegion(null); }}
            >
              <Icon name="menu" size={16} color={viewMode === 'list' ? 'white' : theme.colors.textLight} />
            </Pressable>
          </View>
          {isTitulaire && (
            <Pressable
              style={styles.addButton}
              onPress={() => router.push('/(screens)/listingCreate')}
            >
              <Icon name="plus" size={20} color="white" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filtres par type */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContainer}
      >
        {LISTING_TYPE_FILTERS.map((type) => {
          const isActive = listingType === type.value;
          const count = getTypeCount(type.value);

          return (
            <Pressable
              key={type.value ?? 'all'}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setListingType(type.value)}
            >
              <Icon
                name={type.icon}
                size={16}
                color={isActive ? 'white' : theme.colors.textLight}
              />
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {type.label}
              </Text>
              <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                <Text style={[styles.countText, isActive && styles.countTextActive]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Stats */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {loading ? 'Chargement...' : `${filteredData.length} annonce${filteredData.length > 1 ? 's' : ''}`}
        </Text>
        {selectedRegionName && (
          <Pressable
            style={styles.regionTag}
            onPress={() => setSelectedRegion(null)}
          >
            <Text style={styles.regionTagText}>{selectedRegionName}</Text>
            <Icon name="x" size={14} color="white" />
          </Pressable>
        )}
      </View>

      <ScrollView 
        style={commonStyles.flex1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Carte de France (mode carte uniquement) */}
        {viewMode === 'map' && (
          <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>Sélectionnez une région</Text>
            {loading ? (
              <View style={styles.mapLoading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : (
              <FranceMap
                jobCounts={countsByRegion}
                selectedRegion={selectedRegion}
                onRegionPress={handleRegionPress}
                showDomTom={true}
              />
            )}
          </View>
        )}

        {/* Liste des annonces */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>
              {selectedRegionName 
                ? `Annonces en ${selectedRegionName}` 
                : listingType 
                  ? getListingTypeLabel(listingType)
                  : 'Toutes les annonces'}
            </Text>
            <Text style={styles.listCount}>
              {filteredData.length} résultat{filteredData.length > 1 ? 's' : ''}
            </Text>
          </View>

          {filteredData.length === 0 ? (
            <View style={styles.emptyList}>
              <Icon name="home" size={40} color={theme.colors.gray} />
              <Text style={styles.emptyTitle}>Aucune annonce trouvée</Text>
              <Text style={styles.emptyText}>
                {selectedRegion 
                  ? 'Essayez une autre région ou supprimez les filtres'
                  : 'Aucune pharmacie disponible pour le moment'}
              </Text>
            </View>
          ) : (
            <View style={styles.listingsGrid}>
              {filteredData.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onPress={() => handleListingPress(listing)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Espace en bas */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
  },
  title: {
    fontSize: hp(2.8),
    fontWeight: theme.fonts.bold,
    color: theme.colors.textDark,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
  },
  resetText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    padding: 2,
  },
  viewToggleBtn: {
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.6),
    borderRadius: theme.radius.md - 2,
  },
  viewToggleBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filtersContainer: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.5),
    gap: wp(2),
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1),
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    backgroundColor: 'white',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.gray,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: hp(1.4),
    fontWeight: theme.fonts.medium,
    color: theme.colors.textLight,
  },
  filterChipTextActive: {
    color: 'white',
  },
  countBadge: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  countText: {
    fontSize: hp(1.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.textLight,
  },
  countTextActive: {
    color: 'white',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingBottom: hp(1),
  },
  statsText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  regionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.md,
  },
  regionTagText: {
    fontSize: hp(1.4),
    color: 'white',
    fontWeight: theme.fonts.medium,
  },
  scrollContent: {
    paddingBottom: hp(2),
  },
  mapSection: {
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.textDark,
    marginBottom: hp(1),
  },
  mapLoading: {
    height: hp(35),
    justifyContent: 'center',
    alignItems: 'center',
  },
  listSection: {
    paddingHorizontal: wp(4),
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  listCount: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
  },
  listingsGrid: {
    gap: hp(1.5),
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: hp(5),
    gap: hp(1),
  },
  emptyTitle: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.textDark,
  },
  emptyText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: hp(10),
  },
});