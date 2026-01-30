/**
 * Hook pour la dashboard - données réelles
 * Adapté au type d'utilisateur (candidat vs titulaire)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cvService } from '../services/cvService';

export function useDashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    matches: 0,
    applications: 0,
    publishedOffers: 0,
    views: 0,
  });
  const [recommendedOffers, setRecommendedOffers] = useState([]);
  const [activities, setActivities] = useState([]);

  const userId = user?.id;
  const userType = user?.user_type;
  const isTitulaire = userType === 'titulaire';
  const isEtudiant = userType === 'etudiant';

  // ==========================================
  // STATS CANDIDAT
  // ==========================================

  const loadCandidatStats = async () => {
    const [
      { count: matchCount },
      { count: applicationCount },
      cvViews,
    ] = await Promise.all([
      supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('candidate_id', userId)
        .eq('status', 'matched'),
      supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('candidate_id', userId)
        .in('status', ['pending', 'matched']),
      cvService.getCvViewsCount(userId),
    ]);

    setStats({
      matches: matchCount || 0,
      applications: applicationCount || 0,
      views: cvViews,
    });
  };

  // ==========================================
  // STATS TITULAIRE
  // ==========================================

  const loadTitulaireStats = async () => {
    const { data: jobOffers } = await supabase
      .from('job_offers')
      .select('id')
      .eq('pharmacy_owner_id', userId);

    const { data: internshipOffers } = await supabase
      .from('internship_offers')
      .select('id')
      .eq('pharmacy_owner_id', userId);

    const jobIds = jobOffers?.map(j => j.id) || [];
    const internshipIds = internshipOffers?.map(i => i.id) || [];

    let matchCount = 0;
    let pendingCount = 0;

    if (jobIds.length > 0) {
      const { count: jm } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .in('job_offer_id', jobIds)
        .eq('status', 'matched');
      matchCount += jm || 0;

      const { count: jp } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .in('job_offer_id', jobIds)
        .eq('status', 'pending');
      pendingCount += jp || 0;
    }

    if (internshipIds.length > 0) {
      const { count: im } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .in('internship_offer_id', internshipIds)
        .eq('status', 'matched');
      matchCount += im || 0;

      const { count: ip } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .in('internship_offer_id', internshipIds)
        .eq('status', 'pending');
      pendingCount += ip || 0;
    }

    const { count: activeJobsCount } = await supabase
      .from('job_offers')
      .select('*', { count: 'exact', head: true })
      .eq('pharmacy_owner_id', userId)
      .eq('status', 'active');

    const { count: activeInternshipsCount } = await supabase
      .from('internship_offers')
      .select('*', { count: 'exact', head: true })
      .eq('pharmacy_owner_id', userId)
      .eq('status', 'active');

    setStats({
      matches: matchCount,
      publishedOffers: (activeJobsCount || 0) + (activeInternshipsCount || 0),
      views: 0,
    });
  };

  // ==========================================
  // OFFRES RECOMMANDÉES (candidats)
  // ==========================================

  const loadRecommendedOffers = useCallback(async () => {
    if (!userId || isTitulaire) return;

    try {
      const table = isEtudiant ? 'internship_offers' : 'job_offers';
      
      // Récupérer les offres actives (SANS jointure)
      let query = supabase
        .from(table)
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (profile?.current_region) {
        query = query.eq('region', profile.current_region);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Exclure les offres déjà swipées
      const { data: swipedOffers } = await supabase
        .from('matches')
        .select(isEtudiant ? 'internship_offer_id' : 'job_offer_id')
        .eq('candidate_id', userId);

      const swipedIds = (swipedOffers || [])
        .map(s => isEtudiant ? s.internship_offer_id : s.job_offer_id)
        .filter(Boolean);
      
      const filteredOffers = (data || [])
        .filter(offer => !swipedIds.includes(offer.id))
        .slice(0, 5);

      // Récupérer les profils des propriétaires séparément
      const ownerIds = [...new Set(filteredOffers.map(o => o.pharmacy_owner_id).filter(Boolean))];
      
      let profilesMap = {};
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, photo_url')
          .in('id', ownerIds);
        
        (profiles || []).forEach(p => { profilesMap[p.id] = p; });
      }

      const offersWithProfiles = filteredOffers.map(offer => ({
        ...offer,
        owner_profile: profilesMap[offer.pharmacy_owner_id] || null,
      }));

      setRecommendedOffers(offersWithProfiles);
    } catch (error) {
      console.error('Erreur chargement offres recommandées:', error);
      setRecommendedOffers([]);
    }
  }, [userId, isTitulaire, isEtudiant, profile?.current_region]);

  // ==========================================
  // MATCHS EN ATTENTE (titulaires) - matchs sans conversation
  // ==========================================

  const loadPendingMatches = useCallback(async () => {
    if (!userId || !isTitulaire) return;

    try {
      const { data: jobOffers } = await supabase
        .from('job_offers')
        .select('id, title')
        .eq('pharmacy_owner_id', userId);

      const { data: internshipOffers } = await supabase
        .from('internship_offers')
        .select('id, title')
        .eq('pharmacy_owner_id', userId);

      const jobIds = jobOffers?.map(j => j.id) || [];
      const internshipIds = internshipOffers?.map(i => i.id) || [];

      if (jobIds.length === 0 && internshipIds.length === 0) {
        setRecommendedOffers([]);
        return;
      }

      let matches = [];

      if (jobIds.length > 0) {
        const { data: jm } = await supabase
          .from('matches')
          .select('id, candidate_id, job_offer_id, matched_at, created_at')
          .in('job_offer_id', jobIds)
          .eq('status', 'matched')
          .order('matched_at', { ascending: false })
          .limit(20);
        matches = [...matches, ...(jm || [])];
      }

      if (internshipIds.length > 0) {
        const { data: im } = await supabase
          .from('matches')
          .select('id, candidate_id, internship_offer_id, matched_at, created_at')
          .in('internship_offer_id', internshipIds)
          .eq('status', 'matched')
          .order('matched_at', { ascending: false })
          .limit(20);
        matches = [...matches, ...(im || [])];
      }

      if (matches.length === 0) {
        setRecommendedOffers([]);
        return;
      }

      // Vérifier quels matchs ont déjà des messages
      const matchIds = matches.map(m => m.id);
      const { data: messagesData } = await supabase
        .from('messages')
        .select('match_id')
        .in('match_id', matchIds);

      const matchIdsWithMessages = new Set((messagesData || []).map(m => m.match_id));

      // Filtrer les matchs sans conversation
      let pendingMatches = matches.filter(m => !matchIdsWithMessages.has(m.id));
      pendingMatches.sort((a, b) => new Date(b.matched_at || b.created_at) - new Date(a.matched_at || a.created_at));
      pendingMatches = pendingMatches.slice(0, 5);

      if (pendingMatches.length === 0) {
        setRecommendedOffers([]);
        return;
      }

      const candidateIds = [...new Set(pendingMatches.map(m => m.candidate_id).filter(Boolean))];

      let candidatesMap = {};
      if (candidateIds.length > 0) {
        const { data: candidates } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, photo_url, current_city, experience_years')
          .in('id', candidateIds);

        (candidates || []).forEach(c => { candidatesMap[c.id] = c; });
      }

      const allOffers = [...(jobOffers || []), ...(internshipOffers || [])];
      const offersMap = {};
      allOffers.forEach(o => { offersMap[o.id] = o; });

      const result = pendingMatches.map(match => ({
        id: match.id,
        candidate: candidatesMap[match.candidate_id] || null,
        offer: offersMap[match.job_offer_id] || offersMap[match.internship_offer_id] || null,
        matched_at: match.matched_at || match.created_at,
      })).filter(r => r.candidate);

      setRecommendedOffers(result);
    } catch (error) {
      console.error('Erreur chargement matchs en attente:', error);
      setRecommendedOffers([]);
    }
  }, [userId, isTitulaire]);

  // ==========================================
  // ACTIVITÉ RÉCENTE
  // ==========================================

  const loadActivities = useCallback(async () => {
    if (!userId) return;

    try {
      const activities = [];

      if (isTitulaire) {
        const { data: jobOffers } = await supabase
          .from('job_offers')
          .select('id, title')
          .eq('pharmacy_owner_id', userId);

        const { data: internshipOffers } = await supabase
          .from('internship_offers')
          .select('id, title')
          .eq('pharmacy_owner_id', userId);

        const jobIds = jobOffers?.map(j => j.id) || [];
        const internshipIds = internshipOffers?.map(i => i.id) || [];
        const allOffers = [...(jobOffers || []), ...(internshipOffers || [])];
        const offersMap = {};
        allOffers.forEach(o => { offersMap[o.id] = o; });

        let allMatches = [];
        
        if (jobIds.length > 0) {
          const { data: jm } = await supabase
            .from('matches')
            .select('id, candidate_id, job_offer_id, status, matched_at, created_at')
            .in('job_offer_id', jobIds)
            .order('created_at', { ascending: false })
            .limit(10);
          allMatches = [...allMatches, ...(jm || [])];
        }

        if (internshipIds.length > 0) {
          const { data: im } = await supabase
            .from('matches')
            .select('id, candidate_id, internship_offer_id, status, matched_at, created_at')
            .in('internship_offer_id', internshipIds)
            .order('created_at', { ascending: false })
            .limit(10);
          allMatches = [...allMatches, ...(im || [])];
        }

        allMatches.forEach(match => {
          const offer = offersMap[match.job_offer_id] || offersMap[match.internship_offer_id];
          const offerTitle = offer?.title || 'une offre';

          if (match.status === 'matched') {
            activities.push({
              id: `match-${match.id}`,
              type: 'match',
              title: `Nouveau match sur "${offerTitle}"`,
              icon: 'heart',
              created_at: match.matched_at || match.created_at,
            });
          } else if (match.status === 'pending') {
            activities.push({
              id: `pending-${match.id}`,
              type: 'application',
              title: `Un candidat a liké "${offerTitle}"`,
              icon: 'star',
              created_at: match.created_at,
            });
          }
        });
      } else {
        const { data: matchActivities } = await supabase
          .from('matches')
          .select('id, status, matched_at, created_at, job_offer_id, internship_offer_id')
          .eq('candidate_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        const jobIds = (matchActivities || []).map(m => m.job_offer_id).filter(Boolean);
        const internIds = (matchActivities || []).map(m => m.internship_offer_id).filter(Boolean);

        let offersMap = {};
        
        if (jobIds.length > 0) {
          const { data: jobs } = await supabase
            .from('job_offers')
            .select('id, title')
            .in('id', jobIds);
          (jobs || []).forEach(j => { offersMap[j.id] = j; });
        }

        if (internIds.length > 0) {
          const { data: interns } = await supabase
            .from('internship_offers')
            .select('id, title')
            .in('id', internIds);
          (interns || []).forEach(i => { offersMap[i.id] = i; });
        }

        (matchActivities || []).forEach(match => {
          const offer = offersMap[match.job_offer_id] || offersMap[match.internship_offer_id];
          const offerTitle = offer?.title || 'une offre';

          if (match.status === 'matched') {
            activities.push({
              id: `match-${match.id}`,
              type: 'match',
              title: `Nouveau match sur "${offerTitle}"`,
              icon: 'heart',
              created_at: match.matched_at || match.created_at,
            });
          }
        });
      }

      activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setActivities(activities.slice(0, 5));
    } catch (error) {
      console.error('Erreur chargement activités:', error);
      setActivities([]);
    }
  }, [userId, isTitulaire]);

  // ==========================================
  // CHARGEMENT
  // ==========================================

  const loadAll = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      if (isTitulaire) {
        await Promise.all([loadTitulaireStats(), loadPendingMatches(), loadActivities()]);
      } else {
        await Promise.all([loadCandidatStats(), loadRecommendedOffers(), loadActivities()]);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, isTitulaire, loadRecommendedOffers, loadPendingMatches, loadActivities]);

  useEffect(() => {
    if (userId) {
      loadAll();
    }
  }, [userId, loadAll]);

  return {
    loading,
    stats,
    recommendedOffers,
    activities,
    refresh: loadAll,
    isTitulaire,
    isEtudiant,
  };
}