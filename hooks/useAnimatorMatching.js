import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { animatorMatchingService } from '../services/animatorMatchingService';
import { matchingService } from '../services/matchingService';

/**
 * Hook pour le swipe de missions (côté animateur)
 */
export const useSwipeMissions = () => {
  const { session, animatorProfile } = useAuth();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastMatch, setLastMatch] = useState(null);
  const [superLikeQuota, setSuperLikeQuota] = useState({ remaining: 1, max: 1, used: 0, allowed: true, unlimited: false });

  const fetchMissions = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const data = await animatorMatchingService.getSwipeableMissions(session.user.id);
      setMissions(data);
    } catch (error) {
      console.error('Error fetching swipeable missions:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Charger le quota de super likes
  useEffect(() => {
    const loadQuota = async () => {
      if (!session?.user?.id) return;
      try {
        const quota = await matchingService.getSuperLikeQuota(session.user.id);
        setSuperLikeQuota(quota);
      } catch (err) {
        console.error('Error loading super like quota:', err);
      }
    };
    loadQuota();
  }, [session?.user?.id]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const swipe = useCallback(async (missionId, action) => {
    if (!session?.user?.id) return { success: false };

    try {
      const result = await animatorMatchingService.animatorSwipeMission(
        session.user.id,
        missionId,
        action
      );

      // Retirer la mission de la liste
      setMissions(prev => prev.filter(m => m.id !== missionId));

      // Si match, l'afficher
      if (result.match?.status === 'matched') {
        setLastMatch(result.match);
      }

      if (action === 'superlike') {
        setSuperLikeQuota(prev => ({
          ...prev,
          used: prev.used + 1,
          remaining: prev.unlimited ? prev.remaining : Math.max(0, prev.remaining - 1),
          allowed: prev.unlimited || prev.used + 1 < prev.max,
        }));
      }

      return { success: true, match: result.match };
    } catch (error) {
      console.error('Error swiping mission:', error);
      return { success: false, error: error.message };
    }
  }, [session?.user?.id]);

  const swipeRight = useCallback((missionId) => swipe(missionId, 'like'), [swipe]);
  const swipeLeft = useCallback((missionId) => swipe(missionId, 'dislike'), [swipe]);
  const superLike = useCallback(async (missionId) => {
    if (!superLikeQuota.allowed && !superLikeQuota.unlimited) {
      return { success: false, error: 'quota_exceeded', quotaExceeded: true };
    }
    return swipe(missionId, 'superlike');
  }, [swipe, superLikeQuota]);
  const clearLastMatch = useCallback(() => setLastMatch(null), []);

  return {
    missions,
    loading,
    lastMatch,
    swipeRight,
    swipeLeft,
    superLike,
    clearLastMatch,
    refresh: fetchMissions,
    superLikesRemaining: superLikeQuota.unlimited ? null : superLikeQuota.remaining,
    superLikeQuota,
  };
};

/**
 * Hook pour le swipe d'animateurs (côté labo)
 */
export const useSwipeAnimators = (missionId) => {
  const { session } = useAuth();
  const [animators, setAnimators] = useState([]);
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastMatch, setLastMatch] = useState(null);
  const [superLikeQuota, setSuperLikeQuota] = useState({ remaining: 3, max: 3, used: 0, allowed: true, unlimited: false });

  const fetchAnimators = useCallback(async () => {
    if (!session?.user?.id || !missionId) return;

    setLoading(true);
    try {
      const data = await animatorMatchingService.getSwipeableAnimators(
        session.user.id,
        missionId,
        { availableOnly: false }
      );
      setAnimators(data);
    } catch (error) {
      console.error('Error fetching swipeable animators:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, missionId]);

  // Charger le quota de super likes
  useEffect(() => {
    const loadQuota = async () => {
      if (!session?.user?.id) return;
      try {
        const quota = await matchingService.getSuperLikeQuota(session.user.id);
        setSuperLikeQuota(quota);
      } catch (err) {
        console.error('Error loading super like quota:', err);
      }
    };
    loadQuota();
  }, [session?.user?.id]);

  useEffect(() => {
    fetchAnimators();
  }, [fetchAnimators]);

  const swipe = useCallback(async (animatorId, action) => {
    if (!session?.user?.id || !missionId) return { success: false };

    try {
      const result = await animatorMatchingService.laboratorySwipeAnimator(
        session.user.id,
        animatorId,
        missionId,
        action
      );

      // Retirer l'animateur de la liste
      setAnimators(prev => prev.filter(a => a.id !== animatorId));

      // Si match, l'afficher
      if (result.match?.status === 'matched') {
        setLastMatch(result.match);
      }

      if (action === 'superlike') {
        setSuperLikeQuota(prev => ({
          ...prev,
          used: prev.used + 1,
          remaining: prev.unlimited ? prev.remaining : Math.max(0, prev.remaining - 1),
          allowed: prev.unlimited || prev.used + 1 < prev.max,
        }));
      }

      return { success: true, match: result.match };
    } catch (error) {
      console.error('Error swiping animator:', error);
      return { success: false, error: error.message };
    }
  }, [session?.user?.id, missionId]);

  const swipeRight = useCallback((animatorId) => swipe(animatorId, 'like'), [swipe]);
  const swipeLeft = useCallback((animatorId) => swipe(animatorId, 'dislike'), [swipe]);
  const superLike = useCallback(async (animatorId) => {
    if (!superLikeQuota.allowed && !superLikeQuota.unlimited) {
      return { success: false, error: 'quota_exceeded', quotaExceeded: true };
    }
    return swipe(animatorId, 'superlike');
  }, [swipe, superLikeQuota]);
  const clearLastMatch = useCallback(() => setLastMatch(null), []);

  return {
    animators,
    mission,
    loading,
    lastMatch,
    swipeRight,
    swipeLeft,
    superLike,
    clearLastMatch,
    refresh: fetchAnimators,
    superLikesRemaining: superLikeQuota.unlimited ? null : superLikeQuota.remaining,
    superLikeQuota,
  };
};

/**
 * Hook pour les matches animateur/labo
 */
export const useAnimatorMatches = () => {
  const { session, profile } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0 });

  const isAnimator = profile?.role === 'animator';
  const isLaboratory = profile?.role === 'laboratory';

  const fetchMatches = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      let data;
      if (isAnimator) {
        data = await animatorMatchingService.getAnimatorMatches(session.user.id);
      } else if (isLaboratory) {
        data = await animatorMatchingService.getLaboratoryMatches(session.user.id);
      }

      setMatches(data || []);

      // Calculer stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisWeek = (data || []).filter(m => new Date(m.matched_at) >= weekAgo).length;

      setStats({ total: data?.length || 0, thisWeek });
    } catch (error) {
      console.error('Error fetching animator matches:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, isAnimator, isLaboratory]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return {
    matches,
    loading,
    stats,
    refresh: fetchMatches,
  };
};

/**
 * Hook pour une conversation de match animateur
 */
export const useAnimatorMatchConversation = (matchId) => {
  const { session } = useAuth();
  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMatch = useCallback(async () => {
    if (!matchId) return;

    try {
      const data = await animatorMatchingService.getMatchById(matchId);
      setMatch(data);
    } catch (error) {
      console.error('Error fetching match:', error);
    }
  }, [matchId]);

  const fetchMessages = useCallback(async () => {
    if (!matchId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('animator_match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
    fetchMessages();
  }, [fetchMatch, fetchMessages]);

  const sendMessage = useCallback(async (content) => {
    if (!session?.user?.id || !matchId || !content.trim()) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          animator_match_id: matchId,
          sender_id: session.user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      setMessages(prev => [...prev, data]);
      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    } finally {
      setSending(false);
    }
  }, [session?.user?.id, matchId]);

  // Déterminer l'autre partie
  const otherParty = match 
    ? (session?.user?.id === match.animator_id ? match.laboratory : match.animator)
    : null;

  return {
    match,
    messages,
    loading,
    sending,
    otherParty,
    sendMessage,
    refresh: fetchMessages,
  };
};