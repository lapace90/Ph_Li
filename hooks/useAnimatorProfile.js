// Hook pour gérer le profil animateur

import { useState, useEffect, useCallback } from 'react';
import { animatorService } from '../services/animatorService';

export const useAnimatorProfile = (userId) => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger le profil
  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await animatorService.getProfile(userId);
      setProfile(data);
    } catch (err) {
      console.error('Erreur chargement profil animateur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Charger les stats
  const fetchStats = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await animatorService.getStats(userId);
      setStats(data);
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    }
  }, [userId]);

  // Charger les disponibilités (mois courant par défaut)
  const fetchAvailability = useCallback(async (startDate, endDate) => {
    if (!userId) return;

    const start = startDate || new Date().toISOString().slice(0, 7) + '-01';
    const end = endDate || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10);

    try {
      const data = await animatorService.getAvailability(userId, start, end);
      setAvailability(data);
    } catch (err) {
      console.error('Erreur chargement disponibilités:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
    fetchStats();
    fetchAvailability();
  }, [fetchProfile, fetchStats, fetchAvailability]);

  // Mettre à jour le profil
  const updateProfile = async (updates) => {
    try {
      setError(null);
      const updated = await animatorService.updateProfile(userId, updates);
      setProfile(prev => ({ ...prev, ...updated }));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Toggle "Dispo maintenant"
  const setAvailableNow = async (available, durationDays = 7) => {
    try {
      setError(null);
      const updated = await animatorService.setAvailableNow(userId, available, durationDays);
      setProfile(prev => ({
        ...prev,
        available_now: updated.available_now,
        available_now_until: updated.available_now_until,
      }));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Définir une disponibilité
  const setDayAvailability = async (date, status) => {
    try {
      const data = await animatorService.setAvailability(userId, date, status);
      setAvailability(prev => {
        const existing = prev.findIndex(a => a.date === date);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [...prev, data];
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Définir plusieurs disponibilités
  const setDaysAvailability = async (dates, status) => {
    try {
      const data = await animatorService.setAvailabilityBulk(userId, dates, status);
      await fetchAvailability();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    profile,
    stats,
    availability,
    loading,
    error,
    refresh: fetchProfile,
    refreshStats: fetchStats,
    refreshAvailability: fetchAvailability,
    updateProfile,
    setAvailableNow,
    setDayAvailability,
    setDaysAvailability,
    isAvailableNow: profile?.available_now || false,
  };
};