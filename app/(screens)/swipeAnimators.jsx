// Labo swipe sur des animateurs pour une mission - MATCHING BIDIRECTIONNEL
import { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useSwipeAnimators } from '../../hooks/useAnimatorMatching';
import { useFavorites, useFavoriteIds } from '../../hooks/useFavorites';
import { FAVORITE_TYPES } from '../../services/favoritesService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import SwipeStack from '../../components/matching/SwipeStack';
import { AnimatorDetailModal } from '../../components/animators/AnimatorCard';
import { EmptyState } from '../../components/common/DashboardComponents';
import MatchModal from '../../components/matching/MatchModal';

export default function SwipeAnimators() {
  const router = useRouter();
  const { missionId } = useLocalSearchParams();
  const { session } = useAuth();

  // Hook de matching
  const { animators, mission, loading, lastMatch, swipeRight, swipeLeft, superLike, clearLastMatch, refresh } = useSwipeAnimators(missionId);

  // Favoris
  const { isFavorite: isAnimatorFav } = useFavoriteIds(session?.user?.id, FAVORITE_TYPES.ANIMATOR);
  const { toggleFavorite: toggleAnimatorFav } = useFavorites(session?.user?.id, FAVORITE_TYPES.ANIMATOR);

  const [selectedAnimator, setSelectedAnimator] = useState(null);

  const handleSwipeLeft = async (card) => await swipeLeft(card.id);
  const handleSwipeRight = async (card) => await swipeRight(card.id);
  const handleSwipeUp = async (card) => await superLike(card.id);

  const handleMatchMessage = () => {
    if (lastMatch) {
      clearLastMatch();
      router.push({ pathname: '/(screens)/animatorConversation', params: { matchId: lastMatch.id } });
    }
  };

  const handleMatchContinue = () => {
    clearLastMatch();
  };

  // Header
  const renderHeader = () => (
    <View style={commonStyles.headerNoBorder}>
      <BackButton router={router} />
      <View style={{ alignItems: 'center', flex: 1 }}>
        <Text style={commonStyles.headerTitle}>Animateurs</Text>
        {mission && <Text style={commonStyles.hint} numberOfLines={1}>{mission.title}</Text>}
      </View>
      <View style={commonStyles.headerSpacer} />
    </View>
  );

  // Pas de mission sélectionnée
  if (!missionId) {
    return (
      <ScreenWrapper>
        {renderHeader()}
        <EmptyState
          icon="briefcase"
          title="Sélectionnez une mission"
          subtitle="Choisissez une mission pour voir les animateurs disponibles"
          action={() => router.push('/(screens)/laboratoryMissions')}
          actionLabel="Mes missions"
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {/* Modal de match */}
      <MatchModal
        visible={!!lastMatch}
        match={lastMatch}
        onMessage={handleMatchMessage}
        onContinue={handleMatchContinue}
        userType="laboratory"
      />

      {renderHeader()}

      <SwipeStack
        cards={animators}
        type="animator"
        loading={loading}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onSwipeUp={handleSwipeUp}
        onRefresh={refresh}
        onCardPress={(card) => setSelectedAnimator(card)}
      />

      {/* Modal détail animateur */}
      <AnimatorDetailModal
        visible={!!selectedAnimator}
        animator={selectedAnimator}
        isFavorite={selectedAnimator && isAnimatorFav(selectedAnimator.id)}
        onClose={() => setSelectedAnimator(null)}
        onToggleFavorite={() => selectedAnimator && toggleAnimatorFav(selectedAnimator.id)}
      />
    </ScreenWrapper>
  );
}
