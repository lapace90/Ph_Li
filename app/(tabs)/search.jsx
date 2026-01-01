import { useState, useRef, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, FlatList, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { FRANCE_METRO, REGION_OPTIONS } from '../../constants/regions';
import { getContractColor, getContractTypeLabel } from '../../constants/jobOptions';
import { useJobSearch } from '../../hooks/useJobSearch';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import RegionSelector, { RegionButton } from '../../components/map/RegionSelector';
import FilterModal, { FilterButton } from '../../components/map/FilterModal';
import JobListItem from '../../components/map/JobListItem';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const LIST_MIN_HEIGHT = hp(30);
const LIST_MAX_HEIGHT = SCREEN_HEIGHT - hp(20);

export default function Search() {
  const router = useRouter();
  const mapRef = useRef(null);
  
  // État
  const [viewMode, setViewMode] = useState('map'); // 'map' ou 'list'
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [listExpanded, setListExpanded] = useState(false);
  
  // Hook de recherche
  const {
    jobs,
    jobsInRadius,
    loading,
    error,
    userLocation,
    locationPermission,
    filters,
    selectedRegion,
    stats,
    updateFilters,
    resetFilters,
    changeRegion,
    refresh,
    requestLocationPermission,
  } = useJobSearch();

  // Animation pour la liste
  const listHeight = useRef(new Animated.Value(LIST_MIN_HEIGHT)).current;

  // Changer de région sur la carte
  const handleRegionSelect = useCallback((region) => {
    changeRegion(region);
    mapRef.current?.animateToRegion({
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    }, 500);
  }, [changeRegion]);

  // Centrer sur la position utilisateur
  const handleCenterOnUser = useCallback(() => {
    if (userLocation) {
      mapRef.current?.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      }, 500);
    } else {
      requestLocationPermission();
    }
  }, [userLocation, requestLocationPermission]);

  // Sélectionner une annonce
  const handleJobPress = useCallback((job) => {
    setSelectedJob(job);
    if (job.latitude && job.longitude) {
      mapRef.current?.animateToRegion({
        latitude: job.latitude,
        longitude: job.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }, 300);
    }
  }, []);

  // Ouvrir le détail d'une annonce
  const handleJobDetail = useCallback((job) => {
    router.push({
      pathname: '/(screens)/jobOfferDetailCandidate',
      params: { id: job.id }
    });
  }, [router]);

  // Toggle liste étendue
  const toggleListExpanded = useCallback(() => {
    const toValue = listExpanded ? LIST_MIN_HEIGHT : LIST_MAX_HEIGHT;
    Animated.spring(listHeight, {
      toValue,
      useNativeDriver: false,
      friction: 10,
    }).start();
    setListExpanded(!listExpanded);
  }, [listExpanded, listHeight]);

  // Nombre de filtres actifs
  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(
      ([key, value]) => value !== null && key !== 'radius' && key !== 'sortBy'
    ).length;
  }, [filters]);

  // Rendu des markers
  const renderMarkers = useCallback(() => {
    return jobsInRadius.map((job) => {
      if (!job.latitude || !job.longitude) return null;
      
      const isSelected = selectedJob?.id === job.id;
      const contractColor = getContractColor(job.contract_type);
      
      return (
        <Marker
          key={job.id}
          coordinate={{
            latitude: job.latitude,
            longitude: job.longitude,
          }}
          onPress={() => handleJobPress(job)}
          tracksViewChanges={false}
        >
          <View style={[styles.marker, isSelected && styles.markerSelected]}>
            <View style={[styles.markerInner, { backgroundColor: contractColor }]}>
              <Icon name="briefcase" size={14} color="white" />
            </View>
            <View style={[styles.markerTail, { borderTopColor: contractColor }]} />
          </View>
        </Marker>
      );
    });
  }, [jobsInRadius, selectedJob, handleJobPress]);

  // Rendu du header
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Recherche</Text>
      <View style={styles.viewToggle}>
        <Pressable
          style={[styles.viewButton, viewMode === 'map' && styles.viewButtonActive]}
          onPress={() => setViewMode('map')}
        >
          <Icon name="map" size={18} color={viewMode === 'map' ? 'white' : theme.colors.textLight} />
        </Pressable>
        <Pressable
          style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Icon name="list" size={18} color={viewMode === 'list' ? 'white' : theme.colors.textLight} />
        </Pressable>
      </View>
    </View>
  );

  // Rendu du panneau de contrôles sur la carte
  const renderMapControls = () => (
    <>
      {/* Sélecteur de région en haut */}
      <View style={styles.topControls}>
        <RegionButton
          selectedRegion={selectedRegion}
          onPress={() => setShowRegionSelector(true)}
          jobCount={stats.inRadius}
        />
      </View>

      {/* Contrôles à droite */}
      <View style={styles.rightControls}>
        <FilterButton onPress={() => setShowFilters(true)} activeCount={activeFiltersCount} />
        
        <Pressable style={styles.controlButton} onPress={handleCenterOnUser}>
          <Icon 
            name="navigation" 
            size={20} 
            color={userLocation ? theme.colors.primary : theme.colors.textLight} 
          />
        </Pressable>

        <Pressable style={styles.controlButton} onPress={refresh}>
          <Icon name="refresh" size={20} color={theme.colors.text} />
        </Pressable>
      </View>
    </>
  );

  // Rendu de la card de l'annonce sélectionnée
  const renderSelectedJobCard = () => {
    if (!selectedJob) return null;

    const contractColor = getContractColor(selectedJob.contract_type);

    return (
      <Pressable 
        style={styles.selectedJobCard}
        onPress={() => handleJobDetail(selectedJob)}
      >
        <View style={styles.selectedJobHeader}>
          <View style={[styles.contractBadge, { backgroundColor: contractColor + '15' }]}>
            <Text style={[styles.contractText, { color: contractColor }]}>
              {getContractTypeLabel(selectedJob.contract_type)}
            </Text>
          </View>
          {selectedJob.match_score && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>{selectedJob.match_score}%</Text>
            </View>
          )}
          <Pressable style={styles.closeCard} onPress={() => setSelectedJob(null)}>
            <Icon name="x" size={18} color={theme.colors.textLight} />
          </Pressable>
        </View>
        
        <Text style={styles.selectedJobTitle} numberOfLines={2}>
          {selectedJob.title}
        </Text>
        
        <View style={styles.selectedJobLocation}>
          <Icon name="mapPin" size={14} color={theme.colors.textLight} />
          <Text style={styles.selectedJobCity}>{selectedJob.city}</Text>
          {selectedJob.distance !== null && (
            <Text style={styles.selectedJobDistance}>• {selectedJob.distance} km</Text>
          )}
        </View>

        <View style={styles.selectedJobAction}>
          <Text style={styles.selectedJobActionText}>Voir l'annonce</Text>
          <Icon name="chevronRight" size={16} color={theme.colors.primary} />
        </View>
      </Pressable>
    );
  };

  // Vue carte
  const renderMapView = () => (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={FRANCE_METRO}
        showsUserLocation={locationPermission}
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
        onPress={() => setSelectedJob(null)}
      >
        {renderMarkers()}
      </MapView>

      {renderMapControls()}
      {renderSelectedJobCard()}

      {/* Indicateur de chargement */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}
    </View>
  );

  // Vue liste
  const renderListView = () => (
    <View style={styles.listContainer}>
      {/* Filtres en haut */}
      <View style={styles.listHeader}>
        <RegionButton
          selectedRegion={selectedRegion}
          onPress={() => setShowRegionSelector(true)}
          jobCount={stats.inRadius}
        />
        <View style={styles.listHeaderRight}>
          <FilterButton onPress={() => setShowFilters(true)} activeCount={activeFiltersCount} />
          <Pressable style={styles.controlButton} onPress={refresh}>
            <Icon name="refresh" size={20} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {stats.inRadius} offre{stats.inRadius > 1 ? 's' : ''} dans un rayon de {filters.radius} km
        </Text>
      </View>

      {/* Liste */}
      {loading ? (
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : jobsInRadius.length === 0 ? (
        <View style={commonStyles.emptyContainer}>
          <View style={commonStyles.emptyIcon}>
            <Icon name="search" size={40} color={theme.colors.primary} />
          </View>
          <Text style={commonStyles.emptyTitle}>Aucune offre trouvée</Text>
          <Text style={commonStyles.emptyText}>
            Essayez d'élargir votre rayon de recherche ou de modifier vos filtres
          </Text>
          <Pressable 
            style={[commonStyles.buttonPrimary, { marginTop: hp(2) }]}
            onPress={() => setShowFilters(true)}
          >
            <Text style={commonStyles.buttonPrimaryText}>Modifier les filtres</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={jobsInRadius}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <JobListItem 
              job={item} 
              onPress={handleJobDetail}
              showDistance={userLocation !== null}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  // Bannière de permission de localisation
  const renderLocationBanner = () => {
    if (locationPermission !== false) return null;

    return (
      <Pressable style={styles.locationBanner} onPress={requestLocationPermission}>
        <Icon name="mapPin" size={18} color={theme.colors.warning} />
        <Text style={styles.locationBannerText}>
          Activez la localisation pour voir les offres près de vous
        </Text>
        <Icon name="chevronRight" size={16} color={theme.colors.warning} />
      </Pressable>
    );
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {renderHeader()}
      {renderLocationBanner()}
      
      {viewMode === 'map' ? renderMapView() : renderListView()}

      {/* Modals */}
      <RegionSelector
        visible={showRegionSelector}
        onClose={() => setShowRegionSelector(false)}
        selectedRegion={selectedRegion}
        onSelect={handleRegionSelect}
      />

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={updateFilters}
        onReset={resetFilters}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.5),
  },
  title: {
    fontSize: hp(2.8),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  viewButton: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.md,
  },
  viewButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  // Map styles
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: hp(1.5),
    left: wp(4),
    right: wp(4),
  },
  rightControls: {
    position: 'absolute',
    top: hp(8),
    right: wp(4),
    gap: hp(1),
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: hp(8),
    left: wp(4),
    backgroundColor: 'white',
    padding: hp(1),
    borderRadius: theme.radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Marker styles
  marker: {
    alignItems: 'center',
  },
  markerSelected: {
    transform: [{ scale: 1.2 }],
  },
  markerInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  // Selected job card
  selectedJobCard: {
    position: 'absolute',
    bottom: hp(2),
    left: wp(4),
    right: wp(4),
    backgroundColor: 'white',
    borderRadius: theme.radius.xl,
    padding: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  selectedJobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  contractBadge: {
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.4),
    borderRadius: theme.radius.md,
  },
  contractText: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.semiBold,
  },
  matchBadge: {
    marginLeft: wp(2),
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  matchText: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.bold,
    color: theme.colors.success,
  },
  closeCard: {
    marginLeft: 'auto',
    padding: hp(0.5),
  },
  selectedJobTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  selectedJobLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginBottom: hp(1),
  },
  selectedJobCity: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  selectedJobDistance: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  selectedJobAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: wp(1),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  selectedJobActionText: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary,
  },
  // List styles
  listContainer: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
  },
  listHeaderRight: {
    flexDirection: 'row',
    gap: wp(2),
  },
  statsBar: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  statsText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  listContent: {
    padding: wp(4),
  },
  // Location banner
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginHorizontal: wp(4),
    marginBottom: hp(1),
    padding: hp(1.2),
    backgroundColor: theme.colors.warning + '15',
    borderRadius: theme.radius.lg,
  },
  locationBannerText: {
    flex: 1,
    fontSize: hp(1.4),
    color: theme.colors.warning,
    fontFamily: theme.fonts.medium,
  },
});