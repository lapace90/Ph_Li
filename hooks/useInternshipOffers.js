import { useState, useEffect, useCallback } from 'react';
import { internshipOfferService } from '../services/internshipOfferService';

/**
 * Hook pour gérer les annonces stage/alternance d'un employeur
 */
export const useInternshipOffers = (ownerId) => {
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
      const data = await internshipOfferService.getByOwnerId(ownerId);
      setOffers(data);
    } catch (err) {
      console.error('Error fetching internship offers:', err);
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
      const newOffer = await internshipOfferService.create(ownerId, offerData);
      setOffers(prev => [newOffer, ...prev]);
      return { data: newOffer, error: null };
    } catch (err) {
      console.error('Error creating internship offer:', err);
      return { data: null, error: err };
    }
  };

  const updateOffer = async (offerId, updates) => {
    try {
      const updated = await internshipOfferService.update(offerId, updates);
      setOffers(prev => prev.map(o => o.id === offerId ? updated : o));
      return { data: updated, error: null };
    } catch (err) {
      console.error('Error updating internship offer:', err);
      return { data: null, error: err };
    }
  };

  const deleteOffer = async (offerId) => {
    try {
      await internshipOfferService.delete(offerId);
      setOffers(prev => prev.filter(o => o.id !== offerId));
      return { error: null };
    } catch (err) {
      console.error('Error deleting internship offer:', err);
      return { error: err };
    }
  };

  const setStatus = async (offerId, status) => {
    return updateOffer(offerId, { status });
  };

  // Stats par type
  const stats = {
    total: offers.length,
    stages: offers.filter(o => o.type === 'stage').length,
    alternances: offers.filter(o => o.type === 'alternance').length,
    active: offers.filter(o => o.status === 'active').length,
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
  };
};

/**
 * Hook pour une annonce spécifique
 */
export const useInternshipOffer = (offerId) => {
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
      const data = await internshipOfferService.getById(offerId);
      setOffer(data);
    } catch (err) {
      console.error('Error fetching internship offer:', err);
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
 * Hook pour rechercher des stages/alternances (côté étudiant)
 */
export const useInternshipSearch = (initialFilters = {}) => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const search = useCallback(async (searchFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const mergedFilters = { ...filters, ...searchFilters };
      const data = await internshipOfferService.search(mergedFilters);
      setInternships(data);
    } catch (err) {
      console.error('Error searching internships:', err);
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
      const data = await internshipOfferService.searchNearby(
        latitude,
        longitude,
        radiusKm,
        mergedFilters
      );
      setInternships(data);
    } catch (err) {
      console.error('Error searching nearby internships:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    internships,
    loading,
    error,
    filters,
    search,
    searchNearby,
    updateFilters,
  };
};