import { useState, useEffect, useCallback } from 'react';
import { pharmacyListingService } from '../services/pharmacyListingService';

export const usePharmacyListings = (filters = {}) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pharmacyListingService.getAll(filters);
      setListings(data);
    } catch (err) {
      setError(err);
      console.error('usePharmacyListings error:', err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return {
    listings,
    loading,
    error,
    refresh: fetchListings,
  };
};

export const usePharmacyListing = (id) => {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchListing = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await pharmacyListingService.getById(id);
      setListing(data);
    } catch (err) {
      setError(err);
      console.error('usePharmacyListing error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  return {
    listing,
    loading,
    error,
    refresh: fetchListing,
  };
};

export const useMyListings = (userId) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchListings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await pharmacyListingService.getByUserId(userId);
      setListings(data);
    } catch (err) {
      setError(err);
      console.error('useMyListings error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const createListing = async (listingData) => {
    try {
      const created = await pharmacyListingService.create(userId, listingData);
      setListings(prev => [created, ...prev]);
      return { data: created, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const updateListing = async (id, updates) => {
    try {
      const updated = await pharmacyListingService.update(id, updates);
      setListings(prev => prev.map(l => l.id === id ? updated : l));
      return { data: updated, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const deleteListing = async (id) => {
    try {
      await pharmacyListingService.delete(id);
      setListings(prev => prev.filter(l => l.id !== id));
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  const setStatus = async (id, status) => {
    try {
      const updated = await pharmacyListingService.update(id, { status });
      setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  return {
    listings,
    loading,
    error,
    refresh: fetchListings,
    createListing,
    updateListing,
    deleteListing,
    setStatus,
  };
};