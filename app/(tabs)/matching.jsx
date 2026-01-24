// app/(tabs)/matching.jsx
import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useSwipeScreen } from '../../hooks/useMatching';
import { useClientMissions } from '../../hooks/useMissions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import SwipeStack from '../../components/matching/SwipeStack';
import MatchModal from '../../components/matching/MatchModal';
import { EmptyState } from '../../components/common/DashboardComponents';

export default function Matching() {
  const router = useRouter();
  const { session, isAnimator, isLaboratory, isCandidate } = useAuth();

  // Animateur → Rediriger vers swipeMissions
  if (isAnimator) {
    return <AnimatorMatchingRedirect router={router} />;
  }
  
  // Laboratoire → Sélection mission puis swipeAnimators
  if (isLaboratory) {
    return <LaboratoryMatchingRedirect router={router} userId={session?.user?.id} />;
  }

  // Candidat / Titulaire → Comportement existant
  return <ClassicMatching isCandidate={isCandidate} router={router} />;
}

// ============================================
// CANDIDAT / TITULAIRE - Comportement existant
// ============================================
function ClassicMatching({ isCandidate, router }) {
  const [offerType, setOfferType] = useState('job_offer');

  const {
    currentCard,
    remainingCards,
    hasMoreCards,
    cardsLoading,
    refreshCards,
    handleSwipe,
    lastMatch,
    clearLastMatch,
    superLikesRemaining,
  } = useSwipeScreen(offerType);

  // Adaptation pour compatibilité avec l'ancienne API
  const cards = currentCard ? [currentCard] : [];
  const loading = cardsLoading;
  const refresh = refreshCards;

  const handleSwipeLeft = () => handleSwipe('left');
  const handleSwipeRight = () => handleSwipe('right');
  const handleSwipeUp = () => handleSwipe('up');

  const handleMatchMessage = (matchId) => {
    clearLastMatch();
    router.push({ pathname: '/(screens)/conversation', params: { matchId } });
  };

  return (
    <ScreenWrapper>
      <MatchModal visible={!!lastMatch} match={lastMatch} onClose={clearLastMatch} onMessage={handleMatchMessage} onContinue={clearLastMatch} />

      <View style={[commonStyles.headerNoBorder, commonStyles.rowBetween]}>
        <Text style={commonStyles.headerTitleLarge}>Matching</Text>
        <View style={commonStyles.rowGapSmall}>
          <Pressable style={commonStyles.headerButton} onPress={() => router.push('/(tabs)/messages')}>
            <Icon name="messageCircle" size={22} color={theme.colors.text} />
          </Pressable>
          <Pressable style={commonStyles.headerButton} onPress={() => router.push('/(screens)/matches')}>
            <Icon name="heart" size={22} color={theme.colors.primary} />
          </Pressable>
        </View>
      </View>

      {isCandidate && (
        <View style={commonStyles.tabsContainer}>
          <Pressable style={[commonStyles.tab, offerType === 'job_offer' && commonStyles.tabActive]} onPress={() => setOfferType('job_offer')}>
            <Text style={[commonStyles.tabText, offerType === 'job_offer' && commonStyles.tabTextActive]}>Emplois</Text>
          </Pressable>
          <Pressable style={[commonStyles.tab, offerType === 'internship_offer' && commonStyles.tabActive]} onPress={() => setOfferType('internship_offer')}>
            <Text style={[commonStyles.tabText, offerType === 'internship_offer' && commonStyles.tabTextActive]}>Stages</Text>
          </Pressable>
        </View>
      )}

      <SwipeStack
        cards={cards || []}
        type={offerType}
        loading={loading}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onSwipeUp={handleSwipeUp}
        onRefresh={refresh}
        superLikesRemaining={superLikesRemaining}
      />
    </ScreenWrapper>
  );
}

// ============================================
// ANIMATEUR → Redirige vers swipeMissions
// ============================================
function AnimatorMatchingRedirect({ router }) {
  useEffect(() => {
    router.replace('/(screens)/swipeMissions');
  }, []);

  return (
    <ScreenWrapper>
      <View style={commonStyles.loadingContainer}>
        <Text style={commonStyles.loadingText}>Chargement...</Text>
      </View>
    </ScreenWrapper>
  );
}

// ============================================
// LABORATOIRE → Sélection mission puis swipeAnimators
// ============================================
function LaboratoryMatchingRedirect({ router, userId }) {
  const { missions, loading } = useClientMissions(userId);
  const openMissions = missions?.filter(m => m.status === 'open') || [];

  return (
    <ScreenWrapper>
      <View style={[commonStyles.headerNoBorder, commonStyles.rowBetween]}>
        <Text style={commonStyles.headerTitleLarge}>Recruter</Text>
        <View style={commonStyles.rowGapSmall}>
          <Pressable style={commonStyles.headerButton} onPress={() => router.push('/(tabs)/messages')}>
            <Icon name="messageCircle" size={22} color={theme.colors.text} />
          </Pressable>
          <Pressable style={commonStyles.headerButton} onPress={() => router.push('/(screens)/animatorMatches')}>
            <Icon name="heart" size={22} color={theme.colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={commonStyles.contentPadded}>
        <Text style={commonStyles.sectionTitle}>Sélectionnez une mission</Text>
        <Text style={commonStyles.hint}>Pour trouver des animateurs correspondants</Text>

        {loading ? (
          <View style={commonStyles.loadingContainer}>
            <Text style={commonStyles.loadingText}>Chargement...</Text>
          </View>
        ) : openMissions.length > 0 ? (
          <View style={commonStyles.listContainer}>
            {openMissions.map(mission => (
              <Pressable
                key={mission.id}
                style={commonStyles.listCard}
                onPress={() => router.push({ pathname: '/(screens)/swipeAnimators', params: { missionId: mission.id } })}
              >
                <View style={commonStyles.flex1}>
                  <Text style={commonStyles.listCardTitle}>{mission.title}</Text>
                  <Text style={commonStyles.listCardSubtitle}>{mission.city} • {mission.daily_rate}€/jour</Text>
                </View>
                <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
              </Pressable>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="briefcase"
            title="Aucune mission ouverte"
            subtitle="Créez une mission pour trouver des animateurs"
            action={() => router.push('/(screens)/createMission')}
            actionLabel="Créer une mission"
          />
        )}
      </View>
    </ScreenWrapper>
  );
}