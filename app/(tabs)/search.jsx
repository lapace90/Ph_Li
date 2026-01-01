import { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { supabase } from '../../lib/supabase';
import { ALL_REGIONS, getRegionByDepartment } from '../../constants/francePaths';
import { useAuth } from '../../contexts/AuthContext';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import FranceMap from '../../components/map/FranceMap';
import FilterModal from '../../components/map/FilterModal';
import JobListItem from '../../components/map/JobListItem';
import ListingCard from '../../components/marketplace/ListingCard';

// Types d'annonces disponibles selon le profil
const OFFER_TYPES = {
  jobs: { key: 'jobs', label: 'Emploi', icon: 'briefcase' },
  internships: { key: 'internships', label: 'Stages', icon: 'book' },
};

// Types de pharmacies pour les titulaires
const PHARMACY_TYPES = [
  { key: null, label: 'Tout', icon: 'home' },
  { key: 'vente', label: 'Ventes', icon: 'tag' },
  { key: 'location-gerance', label: 'Locations', icon: 'key' },
  { key: 'association', label: 'Associations', icon: 'users' },
];

export default function Search() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Type d'annonce sélectionné (pour candidats)
  const [offerType, setOfferType] = useState('jobs');
  
  // Type de pharmacie sélectionné (pour titulaires)
  const [pharmacyType, setPharmacyType] = useState(null);
  
  // État des données
  const [jobs, setJobs] = useState([]);
  const [internships, setInternships] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    contract_type: null,
    position_type: null,
    experience_required: null,
    radius: 50,
    sortBy: 'date',
  });

  // Vérifier si l'utilisateur est titulaire
  const isTitulaire = user?.user_type === 'titulaire';

  // Déterminer les types disponibles selon le profil (pour candidats)
  const availableTypes = useMemo(() => {
    if (isTitulaire) return []; // Titulaires utilisent pharmacyType
    return ['jobs', 'internships'];
  }, [isTitulaire]);

  // Définir le type par défaut selon le profil
  useEffect(() => {
    if (isTitulaire) {
      // Titulaires : pas besoin de changer offerType
      return;
    }
    if (user?.user_type === 'etudiant') {
      setOfferType('internships');
    } else {
      setOfferType('jobs');
    }
  }, [user?.user_type, isTitulaire]);

  // Charger les offres d'emploi
  const loadJobs = useCallback(async () => {
    if (isTitulaire) return;
    try {
      const { data, error } = await supabase
        .from('job_offers')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setJobs([]);
    }
  }, [isTitulaire]);

  // Charger les stages/alternances
  const loadInternships = useCallback(async () => {
    if (isTitulaire) return;
    try {
      const { data, error } = await supabase
        .from('internship_offers')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInternships(data || []);
    } catch (err) {
      console.error('Error loading internships:', err);
      setInternships([]);
    }
  }, [isTitulaire]);

  // Charger les pharmacies à vendre/louer (titulaires uniquement)
  const loadPharmacies = useCallback(async () => {
    if (!isTitulaire) return;
    try {
      const { data, error } = await supabase
        .from('pharmacy_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPharmacies(data || []);
    } catch (err) {
      console.error('Error loading pharmacies:', err);
      setPharmacies([]);
    }
  }, [isTitulaire]);

  // Charger tout selon le profil
  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadJobs(), loadInternships(), loadPharmacies()]);
    setLoading(false);
  }, [loadJobs, loadInternships, loadPharmacies]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Données actuelles selon le type sélectionné
  const currentData = useMemo(() => {
    if (isTitulaire) {
      // Filtrer par type de pharmacie si sélectionné
      if (pharmacyType) {
        return pharmacies.filter(p => p.type === pharmacyType);
      }
      return pharmacies;
    }
    switch (offerType) {
      case 'jobs': return jobs;
      case 'internships': return internships;
      default: return [];
    }
  }, [isTitulaire, offerType, pharmacyType, jobs, internships, pharmacies]);

  // Calculer le nombre d'offres par région
  const countsByRegion = useMemo(() => {
    const counts = {};
    
    currentData.forEach(item => {
      let regionId = null;
      
      // Chercher par code département
      if (item.department) {
        const region = getRegionByDepartment(item.department);
        if (region) regionId = region.id;
      }
      
      // Sinon chercher par nom de région
      if (!regionId && item.region) {
        const region = ALL_REGIONS.find(r => 
          r.name.toLowerCase() === item.region.toLowerCase()
        );
        if (region) regionId = region.id;
      }
      
      if (regionId) {
        counts[regionId] = (counts[regionId] || 0) + 1;
      }
    });
    
    return counts;
  }, [currentData]);

  // Filtrer les données par région et filtres
  const filteredData = useMemo(() => {
    let result = currentData;

    // Filtre par région
    if (selectedRegion) {
      const region = ALL_REGIONS.find(r => r.id === selectedRegion);
      if (region) {
        if (region.departments) {
          // Métropole : comparer par code OU par nom de région
          result = result.filter(item => 
            region.departments.includes(item.department) || 
            item.region?.toLowerCase() === region.name.toLowerCase()
          );
        } else if (region.code) {
          // DOM-TOM
          result = result.filter(item => 
            item.department === region.code ||
            item.region?.toLowerCase() === region.name.toLowerCase()
          );
        }
      }
    }

    // Filtres spécifiques aux emplois (candidats)
    if (!isTitulaire && offerType === 'jobs') {
      if (filters.contract_type) {
        result = result.filter(item => item.contract_type === filters.contract_type);
      }
      if (filters.position_type) {
        result = result.filter(item => item.position_type === filters.position_type);
      }
      if (filters.experience_required !== null) {
        result = result.filter(item => 
          item.required_experience === null || 
          item.required_experience <= filters.experience_required
        );
      }
    }

    // Tri par date
    if (filters.sortBy === 'date') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return result;
  }, [currentData, selectedRegion, filters, offerType, isTitulaire]);

  // Gérer le clic sur une région
  const handleRegionPress = useCallback((region) => {
    if (selectedRegion === region.id) {
      setSelectedRegion(null);
    } else {
      setSelectedRegion(region.id);
    }
  }, [selectedRegion]);

  // Ouvrir le détail d'une offre
  const handleOfferPress = useCallback((item) => {
    if (isTitulaire) {
      router.push({
        pathname: '/(screens)/listingDetail',
        params: { id: item.id }
      });
      return;
    }
    if (offerType === 'jobs') {
      router.push({
        pathname: '/(screens)/jobOfferDetailCandidate',
        params: { id: item.id }
      });
    } else if (offerType === 'internships') {
      router.push({
        pathname: '/(screens)/internshipOfferDetailCandidate',
        params: { id: item.id }
      });
    }
  }, [router, offerType, isTitulaire]);

  // Appliquer les filtres
  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Réinitialiser les filtres
  const handleResetFilters = useCallback(() => {
    setFilters({
      contract_type: null,
      position_type: null,
      experience_required: null,
      radius: 50,
      sortBy: 'date',
    });
    setSelectedRegion(null);
    if (isTitulaire) {
      setPharmacyType(null);
    }
  }, [isTitulaire]);

  // Nombre de filtres actifs
  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(
      ([key, value]) => value !== null && key !== 'radius' && key !== 'sortBy'
    ).length + (selectedRegion ? 1 : 0);
  }, [filters, selectedRegion]);

  // Nom de la région sélectionnée
  const selectedRegionName = useMemo(() => {
    if (!selectedRegion) return null;
    return ALL_REGIONS.find(r => r.id === selectedRegion)?.name;
  }, [selectedRegion]);

  // Total des offres du type actuel
  const totalOffers = currentData.length;

  // Obtenir le compteur pour chaque type (candidats)
  const getTypeCount = (type) => {
    switch (type) {
      case 'jobs': return jobs.length;
      case 'internships': return internships.length;
      default: return 0;
    }
  };

  // Obtenir le compteur pour chaque type de pharmacie (titulaires)
  const getPharmacyTypeCount = (type) => {
    if (type === null) return pharmacies.length;
    return pharmacies.filter(p => p.type === type).length;
  };

  // Label du type actuel pour l'affichage
  const currentTypeLabel = useMemo(() => {
    if (isTitulaire) {
      const found = PHARMACY_TYPES.find(t => t.key === pharmacyType);
      return found?.label || 'Pharmacies';
    }
    return OFFER_TYPES[offerType]?.label || '';
  }, [isTitulaire, pharmacyType, offerType]);

  // Rendu d'un item selon le type
  const renderItem = (item) => {
    if (isTitulaire) {
      return (
        <ListingCard
          key={item.id}
          listing={item}
          onPress={() => handleOfferPress(item)}
        />
      );
    }
    return (
      <JobListItem
        key={item.id}
        job={item}
        onPress={() => handleOfferPress(item)}
        showDistance={false}
        isInternship={offerType === 'internships'}
      />
    );
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recherche</Text>
        <View style={styles.headerActions}>
          <Pressable 
            style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]} 
            onPress={() => setShowFilters(true)}
          >
            <Icon name="filter" size={18} color={activeFiltersCount > 0 ? 'white' : theme.colors.text} />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable style={styles.refreshButton} onPress={loadAll}>
            <Icon name="refresh" size={18} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Tabs type d'annonce */}
      <View style={styles.tabsContainer}>
        {isTitulaire ? (
          // Titulaires : tabs par type de pharmacie
          PHARMACY_TYPES.map((type) => {
            const isActive = pharmacyType === type.key;
            
            return (
              <Pressable
                key={type.key || 'all'}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setPharmacyType(type.key)}
              >
                <Icon 
                  name={type.icon} 
                  size={14} 
                  color={isActive ? 'white' : theme.colors.textLight} 
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {type.label}
                </Text>
              </Pressable>
            );
          })
        ) : (
          // Candidats : tabs emploi/stages
          availableTypes.map((type) => {
            const config = OFFER_TYPES[type];
            const isActive = offerType === type;
            
            return (
              <Pressable
                key={type}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setOfferType(type)}
              >
                <Icon 
                  name={config.icon} 
                  size={14} 
                  color={isActive ? 'white' : theme.colors.textLight} 
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {config.label}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {loading ? 'Chargement...' : `${totalOffers} annonce${totalOffers > 1 ? 's' : ''}`}
        </Text>
        {selectedRegionName && (
          <Pressable 
            style={styles.regionTag}
            onPress={() => setSelectedRegion(null)}
          >
            <Text style={styles.regionTagText}>{selectedRegionName}</Text>
            <Icon name="x" size={14} color={theme.colors.primary} />
          </Pressable>
        )}
      </View>

      <ScrollView 
        style={commonStyles.flex1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Carte de France */}
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

        {/* Liste des offres */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>
              {selectedRegionName 
                ? `${currentTypeLabel} en ${selectedRegionName}` 
                : `Toutes les annonces`}
            </Text>
            <Text style={styles.listCount}>
              {filteredData.length} résultat{filteredData.length > 1 ? 's' : ''}
            </Text>
          </View>

          {filteredData.length === 0 ? (
            <View style={styles.emptyList}>
              <Icon name={isTitulaire ? 'home' : OFFER_TYPES[offerType]?.icon || 'briefcase'} size={40} color={theme.colors.gray} />
              <Text style={styles.emptyTitle}>Aucune annonce trouvée</Text>
              <Text style={styles.emptyText}>
                {selectedRegion 
                  ? 'Aucune annonce dans cette région pour le moment'
                  : 'Modifiez vos filtres ou revenez plus tard'}
              </Text>
              {(selectedRegion || activeFiltersCount > 0) && (
                <Pressable 
                  style={styles.resetButton}
                  onPress={handleResetFilters}
                >
                  <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.itemsList}>
              {filteredData.slice(0, 10).map((item) => renderItem(item))}
              {filteredData.length > 10 && (
                <Pressable style={styles.showMoreButton}>
                  <Text style={styles.showMoreText}>
                    Voir les {filteredData.length - 10} autres annonces
                  </Text>
                  <Icon name="chevronRight" size={16} color={theme.colors.primary} />
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal Filtres */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        offerType={isTitulaire ? 'pharmacies' : offerType}
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
    paddingBottom: hp(1),
  },
  title: {
    fontSize: hp(2.8),
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: wp(2),
  },
  filterButton: {
    backgroundColor: theme.colors.card,
    padding: wp(2.5),
    borderRadius: theme.radius.md,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.rose,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: theme.colors.card,
    padding: wp(2.5),
    borderRadius: theme.radius.md,
  },
  
  // Tabs - même style que recruiterDashboard
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: wp(5),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 4,
    marginBottom: hp(1),
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
  },
  tabTextActive: {
    color: 'white',
  },
  
  // Stats
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(0.5),
  },
  statsText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  regionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(2.5),
    borderRadius: theme.radius.full,
  },
  regionTagText: {
    fontSize: hp(1.3),
    color: theme.colors.primary,
    fontWeight: '500',
  },
  
  scrollContent: {
    paddingBottom: hp(10),
  },
  
  // Map
  mapSection: {
    paddingHorizontal: wp(5),
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(1),
  },
  mapLoading: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // List
  listSection: {
    paddingHorizontal: wp(5),
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  listCount: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  itemsList: {
    gap: hp(1.5),
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: hp(5),
    paddingHorizontal: wp(5),
  },
  emptyTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: hp(2),
  },
  emptyText: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: hp(1),
  },
  resetButton: {
    marginTop: hp(2),
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.md,
  },
  resetButtonText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    marginTop: hp(1),
  },
  showMoreText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
});