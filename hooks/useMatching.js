import { useState, useEffect, useCallback } from 'react';
import { matchingService } from '../services/matchingService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook pour gérer le deck de cartes swipables
 */
export const useSwipeCards = (type = 'job_offer', filters = {}) => {
  const { user, profile } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchCards = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      let data;
      if (type === 'job_offer') {
        data = await matchingService.getSwipeableJobOffers(user.id, filters);
      } else if (type === 'internship_offer') {
        data = await matchingService.getSwipeableInternships(user.id, filters);
      } else if (type === 'candidate') {
        data = await matchingService.getSwipeableCandidates(user.id, filters.jobOfferId, filters);
      }

      // Ajouter le score de matching à chaque carte
      const cardsWithScore = (data || []).map(item => ({
        ...item,
        matchScore: profile ? matchingService.calculateMatchScore(profile, item) : null,
      }));

      setCards(cardsWithScore);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Error fetching swipe cards:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, type, JSON.stringify(filters), profile]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const currentCard = cards[currentIndex] || null;
  const remainingCards = cards.length - currentIndex;
  const hasMoreCards = currentIndex < cards.length;

  const goToNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, cards.length]);

  const removeCurrentCard = useCallback(() => {
    setCards(prev => prev.filter((_, i) => i !== currentIndex));
  }, [currentIndex]);

  return {
    cards,
    currentCard,
    currentIndex,
    remainingCards,
    hasMoreCards,
    loading,
    error,
    refresh: fetchCards,
    goToNext,
    removeCurrentCard,
  };
};

/**
 * Hook pour gérer les actions de swipe
 */
export const useSwipeActions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lastMatch, setLastMatch] = useState(null);
  const [superLikesRemaining, setSuperLikesRemaining] = useState(3);

  // Charger le nombre de super likes restants
  useEffect(() => {
    const loadSuperLikes = async () => {
      if (!user?.id) return;
      try {
        const remaining = await matchingService.getSuperLikesRemaining(user.id);
        setSuperLikesRemaining(remaining);
      } catch (err) {
        console.error('Error loading super likes:', err);
      }
    };
    loadSuperLikes();
  }, [user?.id]);

  const swipe = useCallback(async (targetType, targetId, action) => {
    if (!user?.id) return { success: false, error: 'Non connecté' };

    setLoading(true);
    try {
      const result = await matchingService.recordSwipe(user.id, targetType, targetId, action);
      
      if (result.match?.status === 'matched') {
        setLastMatch(result.match);
      }

      if (action === 'superlike') {
        setSuperLikesRemaining(prev => Math.max(0, prev - 1));
      }

      return { success: true, ...result };
    } catch (err) {
      console.error('Error recording swipe:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const swipeRight = useCallback((targetType, targetId) => {
    return swipe(targetType, targetId, 'like');
  }, [swipe]);

  const swipeLeft = useCallback((targetType, targetId) => {
    return swipe(targetType, targetId, 'dislike');
  }, [swipe]);

  const superLike = useCallback(async (targetType, targetId) => {
    if (superLikesRemaining <= 0) {
      return { success: false, error: 'Plus de super likes disponibles ce mois' };
    }
    return swipe(targetType, targetId, 'superlike');
  }, [swipe, superLikesRemaining]);

  const clearLastMatch = useCallback(() => {
    setLastMatch(null);
  }, []);

  return {
    loading,
    lastMatch,
    superLikesRemaining,
    swipeRight,
    swipeLeft,
    superLike,
    clearLastMatch,
  };
};

/**
 * Hook pour gérer les matchs existants
 */
export const useMatches = () => {
  const { user, profile } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMatches = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Déterminer si l'utilisateur est candidat ou employeur
      const userType = profile?.users?.user_type;
      let data;

      if (userType === 'titulaire') {
        data = await matchingService.getEmployerMatches(user.id);
      } else {
        data = await matchingService.getCandidateMatches(user.id);
      }

      setMatches(data || []);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Stats
  const stats = {
    total: matches.length,
    thisWeek: matches.filter(m => {
      const matchDate = new Date(m.matched_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return matchDate >= weekAgo;
    }).length,
  };

  return {
    matches,
    loading,
    error,
    stats,
    refresh: fetchMatches,
  };
};

/**
 * Hook combiné pour l'écran de swipe complet
 */
export const useSwipeScreen = (offerType = 'job_offer', filters = {}) => {
  const cards = useSwipeCards(offerType, filters);
  const actions = useSwipeActions();

  const handleSwipe = useCallback(async (direction) => {
    if (!cards.currentCard) return;

    const targetType = offerType;
    const targetId = cards.currentCard.id;

    let result;
    if (direction === 'right') {
      result = await actions.swipeRight(targetType, targetId);
    } else if (direction === 'left') {
      result = await actions.swipeLeft(targetType, targetId);
    } else if (direction === 'up') {
      result = await actions.superLike(targetType, targetId);
    }

    if (result?.success) {
      cards.removeCurrentCard();
    }

    return result;
  }, [cards.currentCard, offerType, actions]);

  return {
    // Cards
    currentCard: cards.currentCard,
    remainingCards: cards.remainingCards,
    hasMoreCards: cards.hasMoreCards,
    cardsLoading: cards.loading,
    cardsError: cards.error,
    refreshCards: cards.refresh,
    
    // Actions
    handleSwipe,
    actionLoading: actions.loading,
    lastMatch: actions.lastMatch,
    clearLastMatch: actions.clearLastMatch,
    superLikesRemaining: actions.superLikesRemaining,
  };
};