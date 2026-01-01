import { useState, useEffect, useCallback, useMemo } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { FRANCE_METRO, DOM_TOM, isDomTom } from '../constants/regions';

/**
 * Hook pour la recherche d'emplois avec géolocalisation
 */
export const useJobSearch = (initialFilters = {}) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [filters, setFilters] = useState({
    contract_type: null,
    position_type: null,
    experience_required: null,
    salary_range: null,
    radius: 50, // km
    sortBy: 'distance',
    ...initialFilters,
  });
  const [selectedRegion, setSelectedRegion] = useState('metro');

  // Demander la permission de géolocalisation
  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Location permission error:', err);
      setLocationPermission(false);
      return false;
    }
  }, []);

  // Charger les offres d'emploi
  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data;
      
      // Recherche simple sans jointure profiles (évite l'erreur de colonne)
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_offers')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;
      data = jobsData || [];

      // Filtrer par type de contrat si spécifié
      if (filters.contract_type) {
        data = data.filter(job => job.contract_type === filters.contract_type);
      }

      // Filtrer par type de poste si spécifié
      if (filters.position_type) {
        data = data.filter(job => job.position_type === filters.position_type);
      }

      // Filtrer par région si DOM-TOM sélectionné
      if (selectedRegion !== 'metro') {
        const domTomRegion = DOM_TOM[selectedRegion];
        if (domTomRegion) {
          data = data.filter(job => job.department === domTomRegion.code);
        }
      }

      // Calculer la distance si on a la position utilisateur
      if (userLocation) {
        data = data.map(job => ({
          ...job,
          distance: job.latitude && job.longitude
            ? calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                job.latitude,
                job.longitude
              )
            : null,
        }));

        // Trier par distance si demandé
        if (filters.sortBy === 'distance') {
          data.sort((a, b) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });
        }
      }

      // Trier par date si demandé
      if (filters.sortBy === 'date') {
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }

      // Trier par score de matching si disponible
      if (filters.sortBy === 'match' && data[0]?.match_score !== undefined) {
        data.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
      }

      setJobs(data);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(err.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [userLocation, selectedRegion, filters]);

  // Effet initial : demander la permission
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Recharger quand les filtres ou la région changent
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Mettre à jour les filtres
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Réinitialiser les filtres
  const resetFilters = useCallback(() => {
    setFilters({
      contract_type: null,
      position_type: null,
      experience_required: null,
      salary_range: null,
      radius: 50,
      sortBy: 'distance',
    });
  }, []);

  // Changer de région
  const changeRegion = useCallback((region) => {
    setSelectedRegion(region.key);
  }, []);

  // Jobs filtrés par rayon (pour la carte)
  const jobsInRadius = useMemo(() => {
    if (!userLocation || !filters.radius) return jobs;
    return jobs.filter(job => job.distance === null || job.distance <= filters.radius);
  }, [jobs, userLocation, filters.radius]);

  // Stats
  const stats = useMemo(() => ({
    total: jobs.length,
    inRadius: jobsInRadius.length,
    byContractType: jobs.reduce((acc, job) => {
      acc[job.contract_type] = (acc[job.contract_type] || 0) + 1;
      return acc;
    }, {}),
  }), [jobs, jobsInRadius]);

  return {
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
    refresh: loadJobs,
    requestLocationPermission,
  };
};

/**
 * Calcule la distance entre deux points (Haversine formula)
 * @returns Distance en kilomètres
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const toRad = (deg) => deg * (Math.PI / 180);

export default useJobSearch;