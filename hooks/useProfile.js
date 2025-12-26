import { useState, useEffect, useCallback } from 'react';
import { profileService } from '../services/profileService';

export const useProfile = (userId) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await profileService.getById(userId);
      setProfile(data);
    } catch (err) {
      setError(err);
      console.error('useProfile error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates) => {
    try {
      setError(null);
      const updated = await profileService.update(userId, updates);
      setProfile(updated);
      return { data: updated, error: null };
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    }
  };

  const createProfile = async (profileData) => {
    try {
      setError(null);
      const created = await profileService.create(userId, profileData);
      setProfile(created);
      return { data: created, error: null };
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    }
  };

  const upsertProfile = async (profileData) => {
    try {
      setError(null);
      const data = await profileService.upsert(userId, profileData);
      setProfile(data);
      return { data, error: null };
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    }
  };

  return {
    profile,
    loading,
    error,
    refresh: fetchProfile,
    updateProfile,
    createProfile,
    upsertProfile,
  };
};