import { useState, useEffect, useCallback } from 'react';
import { privacyService } from '../services/privacyService';

export const usePrivacy = (userId) => {
  const [privacy, setPrivacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrivacy = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await privacyService.getByUserId(userId);
      setPrivacy(data);
    } catch (err) {
      setError(err);
      console.error('usePrivacy error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPrivacy();
  }, [fetchPrivacy]);

  const updatePrivacy = async (updates) => {
    try {
      setError(null);
      const updated = await privacyService.update(userId, updates);
      setPrivacy(updated);
      return { data: updated, error: null };
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    }
  };

  const createPrivacy = async (settings = {}) => {
    try {
      setError(null);
      const created = await privacyService.create(userId, settings);
      setPrivacy(created);
      return { data: created, error: null };
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    }
  };

  const upsertPrivacy = async (settings = {}) => {
    try {
      setError(null);
      const data = await privacyService.upsert(userId, settings);
      setPrivacy(data);
      return { data, error: null };
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    }
  };

  const setSearchable = async (searchable) => {
    return updatePrivacy({ searchable_by_recruiters: searchable });
  };

  return {
    privacy,
    loading,
    error,
    refresh: fetchPrivacy,
    updatePrivacy,
    createPrivacy,
    upsertPrivacy,
    setSearchable,
  };
};