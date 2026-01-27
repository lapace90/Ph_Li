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
  
  // Nouveaux états pour animateur/laboratoire
  const [animatorProfile, setAnimatorProfile] = useState(null);
  const [laboratoryProfile, setLaboratoryProfile] = useState(null);

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
    try {
      // Charger les données de base en parallèle
      const [userData, profileData, privacyData, rppsData, siretData] = await Promise.all([
        userService.getById(userId).catch(() => null),
        profileService.getById(userId).catch(() => null),
        privacyService.getByUserId(userId).catch(() => null),
        supabase
          .from('verification_documents')
          .select('id, status')
          .eq('user_id', userId)
          .eq('verification_type', 'rpps')
          .eq('status', 'approved')
          .maybeSingle()
          .then(({ data }) => data)
          .catch(() => null),
        supabase
          .from('verification_documents')
          .select('id, status')
          .eq('user_id', userId)
          .eq('verification_type', 'siret')
          .eq('status', 'approved')
          .maybeSingle()
          .then(({ data }) => data)
          .catch(() => null),
      ]);

      // Ajouter rpps_verified et siret_verified au userData
      const userWithVerifications = userData ? {
        ...userData,
        rpps_verified: !!rppsData,
        siret_verified: !!siretData,
      } : null;

      setUser(userWithVerifications);
      setProfile(profileData);
      setPrivacy(privacyData);

      // Charger le profil spécifique selon le type d'utilisateur
      if (userData?.user_type === 'animateur') {
        await loadAnimatorProfile(userId);
        setLaboratoryProfile(null);
      } else if (userData?.user_type === 'laboratoire') {
        await loadLaboratoryProfile(userId);
        setAnimatorProfile(null);
      } else {
        // Reset si autre type
        setAnimatorProfile(null);
        setLaboratoryProfile(null);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charge le profil animateur avec les stats
   */
  const loadAnimatorProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('animator_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Charger les stats en parallèle
        const [missionsCount, reviewsData, favoritesCount] = await Promise.all([
          supabase
            .from('animation_missions')
            .select('*', { count: 'exact', head: true })
            .eq('animator_id', userId)
            .eq('status', 'completed')
            .then(({ count }) => count || 0),
          supabase
            .from('mission_reviews')
            .select('rating_overall')
            .eq('reviewee_id', userId)
            .eq('visible', true)
            .then(({ data }) => data || []),
          supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('target_type', 'animator')
            .eq('target_id', userId)
            .then(({ count }) => count || 0),
        ]);

        const avgRating = reviewsData.length > 0
          ? reviewsData.reduce((sum, r) => sum + r.rating_overall, 0) / reviewsData.length
          : null;

        setAnimatorProfile({
          ...data,
          stats: {
            missionsCompleted: missionsCount,
            averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
            reviewsCount: reviewsData.length,
            favoritesCount,
          },
        });
      } else {
        setAnimatorProfile(null);
      }
    } catch (error) {
      console.error('Error loading animator profile:', error);
      setAnimatorProfile(null);
    }
  };

  /**
   * Charge le profil laboratoire avec les stats et limites
   */
  const loadLaboratoryProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('laboratory_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Charger les stats
        const [missionsData, favoritesCount, reviewsData] = await Promise.all([
          supabase
            .from('animation_missions')
            .select('status')
            .eq('client_id', userId)
            .then(({ data }) => data || []),
          supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('target_type', 'animator')
            .then(({ count }) => count || 0),
          supabase
            .from('mission_reviews')
            .select('rating_overall')
            .eq('reviewee_id', userId)
            .eq('visible', true)
            .then(({ data }) => data || []),
        ]);

        const avgRating = reviewsData.length > 0
          ? reviewsData.reduce((sum, r) => sum + r.rating_overall, 0) / reviewsData.length
          : null;

        // Calculer les limites d'abonnement
        const limits = calculateSubscriptionLimits(data);

        setLaboratoryProfile({
          ...data,
          stats: {
            totalMissions: missionsData.length,
            activeMissions: missionsData.filter(m => ['open', 'assigned', 'in_progress'].includes(m.status)).length,
            completedMissions: missionsData.filter(m => m.status === 'completed').length,
            favoritesCount,
            averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
            reviewsCount: reviewsData.length,
          },
          limits,
        });
      } else {
        setLaboratoryProfile(null);
      }
    } catch (error) {
      console.error('Error loading laboratory profile:', error);
      setLaboratoryProfile(null);
    }
  };

  /**
   * Calcule les limites d'abonnement pour un labo
   */
  const calculateSubscriptionLimits = (labProfile) => {
    const tierLimits = {
      free: { contacts: 0, missions: 0 },
      starter: { contacts: 5, missions: 1 },
      pro: { contacts: Infinity, missions: Infinity },
      business: { contacts: Infinity, missions: Infinity },
    };

    const tier = labProfile.subscription_tier || 'free';
    const limits = tierLimits[tier] || tierLimits.free;

    return {
      tier,
      contacts: {
        used: labProfile.contacts_used_this_month || 0,
        limit: limits.contacts,
        remaining: Math.max(0, limits.contacts - (labProfile.contacts_used_this_month || 0)),
        canContact: (labProfile.contacts_used_this_month || 0) < limits.contacts,
      },
      missions: {
        used: labProfile.missions_used_this_month || 0,
        limit: limits.missions,
        remaining: Math.max(0, limits.missions - (labProfile.missions_used_this_month || 0)),
        canCreate: (labProfile.missions_used_this_month || 0) < limits.missions,
      },
    };
  };

  const clearUserData = () => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setPrivacy(null);
    setAnimatorProfile(null);
    setLaboratoryProfile(null);
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

  /**
   * Rafraîchit uniquement le profil animateur (après modification)
   */
  const refreshAnimatorProfile = () => {
    if (session?.user?.id && user?.user_type === 'animateur') {
      return loadAnimatorProfile(session.user.id);
    }
  };

  /**
   * Rafraîchit uniquement le profil laboratoire (après modification)
   */
  const refreshLaboratoryProfile = () => {
    if (session?.user?.id && user?.user_type === 'laboratoire') {
      return loadLaboratoryProfile(session.user.id);
    }
  };

  // Helpers pour vérifier le type d'utilisateur
  const isCandidate = ['preparateur', 'etudiant', 'conseiller'].includes(user?.user_type);
  const isRecruiter = user?.user_type === 'titulaire';
  const isAnimator = user?.user_type === 'animateur';
  const isLaboratory = user?.user_type === 'laboratoire';

  return (
    <AuthContext.Provider
      value={{
        // Auth
        session,
        signUp,
        signIn,
        signOut,
        
        // User data
        user,
        profile,
        privacy,
        loading,
        
        // Profils spécifiques
        animatorProfile,
        laboratoryProfile,
        
        // Helpers
        isAuthenticated: !!session,
        isProfileComplete: !!user?.profile_completed,
        isCandidate,
        isRecruiter,
        isAnimator,
        isLaboratory,
        
        // Refresh functions
        refreshUserData,
        refreshAnimatorProfile,
        refreshLaboratoryProfile,
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