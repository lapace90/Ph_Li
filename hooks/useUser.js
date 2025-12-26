import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';

export const useUser = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await userService.getById(userId);
      setUser(data);
    } catch (err) {
      setError(err);
      console.error('useUser error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const updateUser = async (updates) => {
    try {
      setError(null);
      const updated = await userService.update(userId, updates);
      setUser(updated);
      return { data: updated, error: null };
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    }
  };

  const setUserType = async (userType) => {
    return updateUser({ user_type: userType });
  };

  const setProfileCompleted = async (completed = true) => {
    return updateUser({ profile_completed: completed });
  };

  return {
    user,
    loading,
    error,
    refresh: fetchUser,
    updateUser,
    setUserType,
    setProfileCompleted,
  };
};