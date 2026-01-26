// Animateur swipe sur des missions - MATCHING BIDIRECTIONNEL
import { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useSwipeMissions } from '../../hooks/useAnimatorMatching';
import { useFavoriteIds, useFavorites } from '../../hooks/useFavorites';
import { FAVORITE_TYPES } from '../../services/favoritesService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import SwipeStack from '../../components/matching/SwipeStack';
import { LaboratoryDetailModal } from '../../components/laboratories/LaboratoryCard';
import MatchModal from '../../components/matching/MatchModal';

export default function SwipeMissions() {
  const router = useRouter();
  const { session } = useAuth();

  // Hook de matching
  const { missions, loading, lastMatch, swipeRight, swipeLeft, superLike, clearLastMatch, refresh } = useSwipeMissions();

  // Favoris
  const { isFavorite: isLabFav } = useFavoriteIds(session?.user?.id, FAVORITE_TYPES.LABORATORY);
  const { toggleFavorite: toggleLabFav } = useFavorites(session?.user?.id, FAVORITE_TYPES.LABORATORY);

  const [selectedLab, setSelectedLab] = useState(null);

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

  return (
    <ScreenWrapper>
      {/* Modal de match */}
      <MatchModal
        visible={!!lastMatch}
        match={lastMatch}
        onMessage={handleMatchMessage}
        onContinue={handleMatchContinue}
        userType="animator"
      />

      <View style={commonStyles.headerNoBorder}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Missions</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <SwipeStack
        cards={missions}
        type="mission"
        loading={loading}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onSwipeUp={handleSwipeUp}
        onRefresh={refresh}
        onCardPress={(card) => setSelectedLab(card.client_profile)}
      />

      {/* Modal détail labo */}
      <LaboratoryDetailModal
        visible={!!selectedLab}
        laboratory={selectedLab}
        isFavorite={selectedLab && isLabFav(selectedLab.id)}
        onClose={() => setSelectedLab(null)}
        onToggleFavorite={() => selectedLab && toggleLabFav(selectedLab.id)}
      />
    </ScreenWrapper>
  );
}
