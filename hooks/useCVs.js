import { useState, useEffect, useCallback } from 'react';
import { cvService } from '../services/cvService';

export const useCVs = (userId) => {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCVs = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await cvService.getByUserId(userId);
      setCvs(data);
    } catch (err) {
      setError(err);
      console.error('useCVs error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCVs();
  }, [fetchCVs]);

  const createCV = async (cvData) => {
    try {
      setError(null);
      const created = await cvService.create(userId, cvData);
      setCvs((prev) => [created, ...prev]);
      return { data: created, error: null };
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    }
  };

  const updateCV = async (cvId, updates) => {
    try {
      setError(null);
      const updated = await cvService.update(cvId, updates);
      setCvs((prev) => prev.map((cv) => (cv.id === cvId ? updated : cv)));
      return { data: updated, error: null };
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    }
  };

  const deleteCV = async (cvId) => {
    try {
      setError(null);
      await cvService.delete(cvId);
      setCvs((prev) => prev.filter((cv) => cv.id !== cvId));
      return { error: null };
    } catch (err) {
      setError(err);
      return { error: err };
    }
  };

  const setDefaultCV = async (cvId) => {
    try {
      setError(null);
      await cvService.setDefault(userId, cvId);
      setCvs((prev) =>
        prev.map((cv) => ({
          ...cv,
          is_default: cv.id === cvId,
        }))
      );
      return { error: null };
    } catch (err) {
      setError(err);
      return { error: err };
    }
  };

  const defaultCV = cvs.find((cv) => cv.is_default) || cvs[0] || null;

  return {
    cvs,
    defaultCV,
    loading,
    error,
    refresh: fetchCVs,
    createCV,
    updateCV,
    deleteCV,
    setDefaultCV,
  };
};