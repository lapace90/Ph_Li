import { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { supabase } from '../../lib/supabase';
import { ALL_REGIONS, getRegionByDepartment } from '../../constants/francePaths';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import FranceMap from '../../components/map/FranceMap';
import FilterModal from '../../components/map/FilterModal';
import JobListItem from '../../components/map/JobListItem';

export default function Search() {
  const router = useRouter();
  
  // État
  const [jobs, setJobs] = useState([]);
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

  // Charger les offres
  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('job_offers')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      
      setJobs(data || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Calculer le nombre d'offres par région
  const jobCountsByRegion = useMemo(() => {
    const counts = {};
    
    jobs.forEach(job => {
      let regionId = null;
      
      if (job.department) {
        const region = getRegionByDepartment(job.department);
        if (region) regionId = region.id;
      }
      
      if (!regionId && job.region) {
        const region = ALL_REGIONS.find(r => 
          r.name.toLowerCase() === job.region.toLowerCase()
        );
        if (region) regionId = region.id;
      }
      
      if (regionId) {
        counts[regionId] = (counts[regionId] || 0) + 1;
      }
    });
    
    return counts;
  }, [jobs]);

  // Filtrer les jobs par région sélectionnée et filtres
  const filteredJobs = useMemo(() => {
    let result = jobs;

    // Filtre par région
    if (selectedRegion) {
      const region = ALL_REGIONS.find(r => r.id === selectedRegion);
      if (region) {
        if (region.departments) {
          result = result.filter(job => region.departments.includes(job.department));
        } else if (region.code) {
          result = result.filter(job => job.department === region.code);
        }
      }
    }

    // Filtre par type de contrat
    if (filters.contract_type) {
      result = result.filter(job => job.contract_type === filters.contract_type);
    }

    // Filtre par type de poste
    if (filters.position_type) {
      result = result.filter(job => job.position_type === filters.position_type);
    }

    // Filtre par expérience
    if (filters.experience_required !== null) {
      result = result.filter(job => 
        job.required_experience === null || 
        job.required_experience <= filters.experience_required
      );
    }

    // Tri
    if (filters.sortBy === 'date') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return result;
  }, [jobs, selectedRegion, filters]);

  // Gérer le clic sur une région
  const handleRegionPress = useCallback((region) => {
    if (selectedRegion === region.id) {
      setSelectedRegion(null);
    } else {
      setSelectedRegion(region.id);
    }
  }, [selectedRegion]);

  // Ouvrir le détail d'une offre
  const handleJobPress = useCallback((job) => {
    router.push({
      pathname: '/(screens)/jobOfferDetailCandidate',
      params: { id: job.id }
    });
  }, [router]);

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
  }, []);

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

  // Total des offres
  const totalJobs = Object.values(jobCountsByRegion).reduce((a, b) => a + b, 0);

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
          <Pressable style={styles.refreshButton} onPress={loadJobs}>
            <Icon name="refresh" size={18} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {loading ? 'Chargement...' : `${totalJobs} offre${totalJobs > 1 ? 's' : ''} disponible${totalJobs > 1 ? 's' : ''}`}
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
              jobCounts={jobCountsByRegion}
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
                ? `Offres en ${selectedRegionName}` 
                : 'Toutes les offres'}
            </Text>
            <Text style={styles.listCount}>
              {filteredJobs.length} résultat{filteredJobs.length > 1 ? 's' : ''}
            </Text>
          </View>

          {filteredJobs.length === 0 ? (
            <View style={styles.emptyList}>
              <Icon name="search" size={40} color={theme.colors.gray} />
              <Text style={styles.emptyTitle}>Aucune offre trouvée</Text>
              <Text style={styles.emptyText}>
                {selectedRegion 
                  ? 'Aucune offre dans cette région pour le moment'
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
            <View style={styles.jobsList}>
              {filteredJobs.slice(0, 10).map((job) => (
                <JobListItem
                  key={job.id}
                  job={job}
                  onPress={handleJobPress}
                  showDistance={false}
                />
              ))}
              {filteredJobs.length > 10 && (
                <Pressable style={styles.showMoreButton}>
                  <Text style={styles.showMoreText}>
                    Voir les {filteredJobs.length - 10} autres offres
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
  headerActions: {
    flexDirection: 'row',
    gap: wp(2),
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.rose,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  filterBadgeText: {
    fontSize: hp(1),
    fontFamily: theme.fonts.bold,
    color: 'white',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
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
  regionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.4),
    borderRadius: theme.radius.lg,
  },
  regionTagText: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary,
  },
  scrollContent: {
    paddingBottom: hp(4),
  },
  mapSection: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
  },
  sectionTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(1.5),
  },
  mapLoading: {
    height: hp(45),
    justifyContent: 'center',
    alignItems: 'center',
  },
  listSection: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
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
  emptyList: {
    alignItems: 'center',
    paddingVertical: hp(4),
    gap: hp(1),
  },
  emptyTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  resetButton: {
    marginTop: hp(2),
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.2),
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
  },
  resetButtonText: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: 'white',
  },
  jobsList: {
    gap: hp(1.5),
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1),
    paddingVertical: hp(1.5),
    marginTop: hp(1),
  },
  showMoreText: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary,
  },
});