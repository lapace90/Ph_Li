// hooks/usePharmacyDetails.js
// Hook pour gérer les pharmacies vérifiées d'un titulaire

import { useState, useEffect, useCallback } from 'react';
import { pharmacyDetailsService } from '../services/pharmacyDetailsService';

export const usePharmacyDetails = (ownerId) => {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les pharmacies du titulaire
  const fetchPharmacies = useCallback(async () => {
    if (!ownerId) {
      setPharmacies([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await pharmacyDetailsService.getByOwnerId(ownerId);
      setPharmacies(data);
    } catch (err) {
      console.error('Erreur chargement pharmacies:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    fetchPharmacies();
  }, [fetchPharmacies]);

  // Ajouter une pharmacie (avec vérification SIRET)
  const addPharmacy = async (siret) => {
    try {
      setError(null);
      const pharmacy = await pharmacyDetailsService.verifyAndCreate(ownerId, siret);
      setPharmacies((prev) => [pharmacy, ...prev]);
      return { success: true, pharmacy };
    } catch (err) {
      console.error('Erreur ajout pharmacie:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Ajouter une pharmacie manuellement (sans vérification)
  const addPharmacyManual = async (pharmacyData) => {
    try {
      setError(null);
      const pharmacy = await pharmacyDetailsService.create(ownerId, pharmacyData);
      setPharmacies((prev) => [pharmacy, ...prev]);
      return { success: true, pharmacy };
    } catch (err) {
      console.error('Erreur ajout pharmacie:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Mettre à jour une pharmacie
  const updatePharmacy = async (pharmacyId, updates) => {
    try {
      setError(null);
      const updated = await pharmacyDetailsService.update(pharmacyId, updates);
      setPharmacies((prev) =>
        prev.map((p) => (p.id === pharmacyId ? updated : p))
      );
      return { success: true, pharmacy: updated };
    } catch (err) {
      console.error('Erreur mise à jour pharmacie:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Supprimer une pharmacie
  const deletePharmacy = async (pharmacyId) => {
    try {
      setError(null);
      await pharmacyDetailsService.delete(pharmacyId);
      setPharmacies((prev) => prev.filter((p) => p.id !== pharmacyId));
      return { success: true };
    } catch (err) {
      console.error('Erreur suppression pharmacie:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Vérifier un SIRET (sans créer)
  const verifySiret = async (siret) => {
    try {
      setError(null);
      const result = await pharmacyDetailsService.verifySiret(siret);
      return { success: true, ...result };
    } catch (err) {
      console.error('Erreur vérification SIRET:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Pharmacie principale (première vérifiée ou première de la liste)
  const primaryPharmacy = pharmacies.find((p) => p.siret_verified) || pharmacies[0] || null;

  // Pharmacies vérifiées uniquement
  const verifiedPharmacies = pharmacies.filter((p) => p.siret_verified);

  return {
    pharmacies,
    primaryPharmacy,
    verifiedPharmacies,
    loading,
    error,
    refresh: fetchPharmacies,
    addPharmacy,
    addPharmacyManual,
    updatePharmacy,
    deletePharmacy,
    verifySiret,
  };
};