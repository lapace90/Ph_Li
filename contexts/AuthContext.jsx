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
      const [userData, profileData, privacyData] = await Promise.all([
        userService.getById(userId).catch(() => null),
        profileService.getById(userId).catch(() => null),
        privacyService.getByUserId(userId).catch(() => null),
      ]);

      console.log('Loaded data:', { userData, profileData, privacyData });
      setUser(userData);
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

    // Créer l'utilisateur dans public.users
    if (data?.user) {
      try {
        await userService.create(data.user.id, email);
      } catch (err) {
        console.error('Error creating user record:', err);
      }
    }

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