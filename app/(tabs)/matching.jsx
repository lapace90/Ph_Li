// app/(tabs)/matching.jsx
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useSwipeScreen } from '../../hooks/useMatching';
import { useSwipeMissions, useSwipeAnimators } from '../../hooks/useAnimatorMatching';
import { useClientMissions } from '../../hooks/useMissions';
import { useFavoriteIds, useFavorites } from '../../hooks/useFavorites';
import { FAVORITE_TYPES } from '../../services/favoritesService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import SwipeStack from '../../components/matching/SwipeStack';
import MatchModal from '../../components/matching/MatchModal';
import { EmptyState } from '../../components/common/DashboardComponents';
import { LaboratoryDetailModal } from '../../components/laboratories/LaboratoryCard';
import { AnimatorDetailModal } from '../../components/animators/AnimatorCard';

export default function Matching() {
  const router = useRouter();
  const { session, isAnimator, isLaboratory, isCandidate } = useAuth();

  // Animateur → Swipe missions directement dans l'onglet
  if (isAnimator) {
    return <AnimatorMatching router={router} userId={session?.user?.id} />;
  }

  // Laboratoire → Sélection mission puis swipe animateurs dans l'onglet
  if (isLaboratory) {
    return <LaboratoryMatching router={router} userId={session?.user?.id} />;
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
// ANIMATEUR → Swipe missions dans l'onglet
// ============================================
function AnimatorMatching({ router, userId }) {
  const { missions, loading, lastMatch, swipeRight, swipeLeft, superLike, clearLastMatch, refresh } = useSwipeMissions();
  const { isFavorite: isLabFav } = useFavoriteIds(userId, FAVORITE_TYPES.LABORATORY);
  const { toggleFavorite: toggleLabFav } = useFavorites(userId, FAVORITE_TYPES.LABORATORY);
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

  return (
    <ScreenWrapper>
      <MatchModal visible={!!lastMatch} match={lastMatch} onMessage={handleMatchMessage} onContinue={clearLastMatch} userType="animator" />

      <View style={[commonStyles.headerNoBorder, commonStyles.rowBetween]}>
        <Text style={commonStyles.headerTitleLarge}>Missions</Text>
        <View style={commonStyles.rowGapSmall}>
          <Pressable style={commonStyles.headerButton} onPress={() => router.push('/(tabs)/messages')}>
            <Icon name="messageCircle" size={22} color={theme.colors.text} />
          </Pressable>
          <Pressable style={commonStyles.headerButton} onPress={() => router.push('/(screens)/animatorMatches')}>
            <Icon name="heart" size={22} color={theme.colors.primary} />
          </Pressable>
        </View>
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

// ============================================
// LABORATOIRE → Sélection mission puis swipe animateurs
// ============================================
function LaboratoryMatching({ router, userId }) {
  const { missions, loading: missionsLoading } = useClientMissions(userId);
  const openMissions = missions?.filter(m => m.status === 'open') || [];
  const [selectedMissionId, setSelectedMissionId] = useState(null);

  // Si une mission est sélectionnée → swipe animateurs dans l'onglet
  if (selectedMissionId) {
    return (
      <LaboratorySwipeView
        router={router}
        userId={userId}
        missionId={selectedMissionId}
        onBack={() => setSelectedMissionId(null)}
      />
    );
  }

  // Sinon → sélection de mission
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

        {missionsLoading ? (
          <View style={commonStyles.loadingContainer}>
            <Text style={commonStyles.loadingText}>Chargement...</Text>
          </View>
        ) : openMissions.length > 0 ? (
          <View style={labStyles.missionsList}>
            {openMissions.map(mission => {
              const rate = mission.daily_rate_min && mission.daily_rate_max
                ? `${mission.daily_rate_min}-${mission.daily_rate_max}€/j`
                : mission.daily_rate_min ? `${mission.daily_rate_min}€/j`
                : mission.daily_rate ? `${mission.daily_rate}€/j` : null;

              const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : null;
              const dateRange = mission.start_date
                ? `${formatDate(mission.start_date)}${mission.end_date ? ` → ${formatDate(mission.end_date)}` : ''}`
                : null;

              return (
                <Pressable
                  key={mission.id}
                  style={labStyles.missionCard}
                  onPress={() => setSelectedMissionId(mission.id)}
                >
                  <View style={labStyles.missionIcon}>
                    <Icon name="briefcase" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={commonStyles.flex1}>
                    <Text style={labStyles.missionTitle} numberOfLines={1}>{mission.title}</Text>
                    <View style={labStyles.missionMeta}>
                      {mission.city && (
                        <View style={labStyles.missionMetaItem}>
                          <Icon name="mapPin" size={12} color={theme.colors.textLight} />
                          <Text style={labStyles.missionMetaText}>{mission.city}</Text>
                        </View>
                      )}
                      {dateRange && (
                        <View style={labStyles.missionMetaItem}>
                          <Icon name="calendar" size={12} color={theme.colors.textLight} />
                          <Text style={labStyles.missionMetaText}>{dateRange}</Text>
                        </View>
                      )}
                      {rate && (
                        <View style={labStyles.missionMetaItem}>
                          <Icon name="dollarSign" size={12} color={theme.colors.primary} />
                          <Text style={[labStyles.missionMetaText, { color: theme.colors.primary, fontFamily: theme.fonts.semiBold }]}>{rate}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={labStyles.missionArrow}>
                    <Icon name="chevronRight" size={18} color={theme.colors.primary} />
                  </View>
                </Pressable>
              );
            })}
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

// ============================================
// LABORATOIRE → Vue swipe animateurs (dans l'onglet)
// ============================================
function LaboratorySwipeView({ router, userId, missionId, onBack }) {
  const { animators, mission, loading, lastMatch, swipeRight, swipeLeft, superLike, clearLastMatch, refresh } = useSwipeAnimators(missionId);
  const { isFavorite: isAnimatorFav } = useFavoriteIds(userId, FAVORITE_TYPES.ANIMATOR);
  const { toggleFavorite: toggleAnimatorFav } = useFavorites(userId, FAVORITE_TYPES.ANIMATOR);
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

  return (
    <ScreenWrapper>
      <MatchModal visible={!!lastMatch} match={lastMatch} onMessage={handleMatchMessage} onContinue={clearLastMatch} userType="laboratory" />

      <View style={[commonStyles.headerNoBorder, commonStyles.rowBetween]}>
        <Pressable style={commonStyles.headerButton} onPress={onBack}>
          <Icon name="arrowLeft" size={24} color={theme.colors.text} />
        </Pressable>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={commonStyles.headerTitle}>Animateurs</Text>
          {mission && <Text style={commonStyles.hint} numberOfLines={1}>{mission.title}</Text>}
        </View>
        <View style={commonStyles.rowGapSmall}>
          <Pressable style={commonStyles.headerButton} onPress={() => router.push('/(tabs)/messages')}>
            <Icon name="messageCircle" size={22} color={theme.colors.text} />
          </Pressable>
          <Pressable style={commonStyles.headerButton} onPress={() => router.push('/(screens)/animatorMatches')}>
            <Icon name="heart" size={22} color={theme.colors.primary} />
          </Pressable>
        </View>
      </View>

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

// ============================================
// STYLES
// ============================================
const labStyles = StyleSheet.create({
  missionsList: {
    gap: hp(1.5),
    marginTop: hp(2),
  },
  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: hp(2),
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: wp(3),
  },
  missionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  missionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(3),
  },
  missionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  missionMetaText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  missionArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
});