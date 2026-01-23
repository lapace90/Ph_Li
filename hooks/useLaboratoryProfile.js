// Hook pour gérer le profil laboratoire

import { useState, useEffect, useCallback } from 'react';
import { laboratoryService } from '../services/laboratoryService';

export const useLaboratoryProfile = (userId) => {
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [limits, setLimits] = useState(null);
  const [stats, setStats] = useState(null);
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
      const data = await laboratoryService.getProfile(userId);
      setProfile(data);
    } catch (err) {
      console.error('Erreur chargement profil labo:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Charger les infos d'abonnement et limites
  const fetchSubscription = useCallback(async () => {
    if (!userId) return;
    try {
      const [sub, lim] = await Promise.all([
        laboratoryService.getSubscription(userId),
        laboratoryService.checkLimits(userId),
      ]);
      setSubscription(sub);
      setLimits(lim);
    } catch (err) {
      console.error('Erreur chargement abonnement:', err);
    }
  }, [userId]);

  // Charger les stats
  const fetchStats = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await laboratoryService.getStats(userId);
      setStats(data);
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
    fetchSubscription();
    fetchStats();
  }, [fetchProfile, fetchSubscription, fetchStats]);

  // Mettre à jour le profil
  const updateProfile = async (updates) => {
    try {
      setError(null);
      const updated = await laboratoryService.updateProfile(userId, updates);
      setProfile(prev => ({ ...prev, ...updated }));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Vérifier SIRET
  const verifySiret = async (siret) => {
    try {
      setError(null);
      const result = await laboratoryService.verifySiret(siret);
      if (result.valid) {
        await laboratoryService.markSiretVerified(userId);
        setProfile(prev => ({ ...prev, siret_verified: true }));
      }
      return { success: true, ...result };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Vérifier si on peut contacter un animateur
  const canContact = () => {
    return limits?.contacts?.canContact || false;
  };

  // Vérifier si on peut créer une mission
  const canCreateMission = () => {
    return limits?.missions?.canCreate || false;
  };

  // Incrémenter le compteur de contacts
  const useContact = async () => {
    try {
      await laboratoryService.incrementContactsUsed(userId);
      await fetchSubscription();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    profile,
    subscription,
    limits,
    stats,
    loading,
    error,
    refresh: fetchProfile,
    refreshSubscription: fetchSubscription,
    refreshStats: fetchStats,
    updateProfile,
    verifySiret,
    canContact,
    canCreateMission,
    useContact,
    isVerified: profile?.siret_verified || false,
    tier: subscription?.subscription_tier || 'free',
  };
};