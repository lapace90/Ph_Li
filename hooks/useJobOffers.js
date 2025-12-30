import { useState, useEffect, useCallback } from 'react';
import { jobOfferService } from '../services/jobOfferService';

/**
 * Hook pour gérer les annonces d'un employeur (titulaire)
 */
export const useJobOffers = (ownerId) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOffers = useCallback(async () => {
    if (!ownerId) {
      setOffers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await jobOfferService.getByOwnerId(ownerId);
      setOffers(data);
    } catch (err) {
      console.error('Error fetching job offers:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const createOffer = async (offerData) => {
    try {
      const newOffer = await jobOfferService.create(ownerId, offerData);
      setOffers(prev => [newOffer, ...prev]);
      return { data: newOffer, error: null };
    } catch (err) {
      console.error('Error creating job offer:', err);
      return { data: null, error: err };
    }
  };

  const updateOffer = async (offerId, updates) => {
    try {
      const updated = await jobOfferService.update(offerId, updates);
      setOffers(prev => prev.map(o => o.id === offerId ? updated : o));
      return { data: updated, error: null };
    } catch (err) {
      console.error('Error updating job offer:', err);
      return { data: null, error: err };
    }
  };

  const deleteOffer = async (offerId) => {
    try {
      await jobOfferService.delete(offerId);
      setOffers(prev => prev.filter(o => o.id !== offerId));
      return { error: null };
    } catch (err) {
      console.error('Error deleting job offer:', err);
      return { error: err };
    }
  };

  const setStatus = async (offerId, status) => {
    return updateOffer(offerId, { status });
  };

  const reactivateOffer = async (offerId) => {
    try {
      const reactivated = await jobOfferService.reactivate(offerId);
      setOffers(prev => prev.map(o => o.id === offerId ? reactivated : o));
      return { data: reactivated, error: null };
    } catch (err) {
      console.error('Error reactivating job offer:', err);
      return { data: null, error: err };
    }
  };

  // Stats par statut
  const stats = {
    total: offers.length,
    active: offers.filter(o => o.status === 'active').length,
    paused: offers.filter(o => o.status === 'paused').length,
    closed: offers.filter(o => o.status === 'closed').length,
    draft: offers.filter(o => o.status === 'draft').length,
  };

  return {
    offers,
    loading,
    error,
    stats,
    refresh: fetchOffers,
    createOffer,
    updateOffer,
    deleteOffer,
    setStatus,
    reactivateOffer,
  };
};

/**
 * Hook pour une annonce spécifique
 */
export const useJobOffer = (offerId) => {
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOffer = useCallback(async () => {
    if (!offerId) {
      setOffer(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await jobOfferService.getById(offerId);
      setOffer(data);
    } catch (err) {
      console.error('Error fetching job offer:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  useEffect(() => {
    fetchOffer();
  }, [fetchOffer]);

  return {
    offer,
    loading,
    error,
    refresh: fetchOffer,
  };
};

/**
 * Hook pour rechercher des annonces (côté candidat)
 */
export const useJobSearch = (initialFilters = {}) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const search = useCallback(async (searchFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const mergedFilters = { ...filters, ...searchFilters };
      const data = await jobOfferService.search(mergedFilters);
      setJobs(data);
    } catch (err) {
      console.error('Error searching jobs:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const searchNearby = useCallback(async (latitude, longitude, radiusKm, searchFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const mergedFilters = { ...filters, ...searchFilters };
      const data = await jobOfferService.searchNearby(
        latitude,
        longitude,
        radiusKm,
        mergedFilters
      );
      setJobs(data);
    } catch (err) {
      console.error('Error searching nearby jobs:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  return {
    jobs,
    loading,
    error,
    filters,
    search,
    searchNearby,
    updateFilters,
    resetFilters,
  };
};