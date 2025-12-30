// contexts/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { userService } from '../services/userService';
import { profileService } from '../services/profileService';
import { privacyService } from '../services/privacyService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [privacy, setPrivacy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserData(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadUserData(session.user.id, session.user.email);
      } else {
        clearUserData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId, email) => {
    console.log('Loading user data for:', userId);
    try {
      // Charger toutes les données en parallèle
      const [userData, profileData, privacyData, rppsData] = await Promise.all([
        userService.getById(userId).catch(() => null),
        profileService.getById(userId).catch(() => null),
        privacyService.getByUserId(userId).catch(() => null),
        // Vérifier si l'utilisateur a un document RPPS approuvé
        supabase
          .from('verification_documents')
          .select('id, status')
          .eq('user_id', userId)
          .eq('verification_type', 'rpps')
          .eq('status', 'approved')
          .maybeSingle()
          .then(({ data }) => data)
          .catch(() => null),
      ]);

      console.log('Loaded data:', { userData, profileData, privacyData, rppsData });

      // Ajouter rpps_verified au userData
      const userWithRpps = userData ? {
        ...userData,
        rpps_verified: !!rppsData, // true si un document approuvé existe
      } : null;

      setUser(userWithRpps);
      setProfile(profileData);
      setPrivacy(privacyData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearUserData = () => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setPrivacy(null);
    setLoading(false);
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return { data: null, error };

    return { data, error: null };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearUserData();
  };

  const refreshUserData = () => {
    if (session?.user?.id) {
      return loadUserData(session.user.id, session.user.email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        privacy,
        loading,
        isAuthenticated: !!session,
        isProfileComplete: !!profile?.first_name,
        signUp,
        signIn,
        signOut,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};