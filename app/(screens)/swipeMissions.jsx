// Animateur swipe sur des missions - MATCHING BIDIRECTIONNEL
import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, PanResponder, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useSwipeMissions } from '../../hooks/useAnimatorMatching';
import { useFavoriteIds, useFavorites } from '../../hooks/useFavorites';
import { FAVORITE_TYPES } from '../../services/favoritesService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import { MissionSwipeCard } from '../../components/missions/MissionCard';
import { LaboratoryDetailModal } from '../../components/laboratories/LaboratoryCard';
import { EmptyState } from '../../components/common/DashboardComponents';
import MatchModal from '../../components/matching/MatchModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export default function SwipeMissions() {
  const router = useRouter();
  const { session } = useAuth();

  // Hook de matching
  const { missions, loading, lastMatch, swipeRight, swipeLeft, superLike, clearLastMatch, refresh } = useSwipeMissions();

  // Favoris (pour bookmarker sans swiper)
  const { isFavorite: isMissionFav } = useFavoriteIds(session?.user?.id, FAVORITE_TYPES.MISSION);
  const { isFavorite: isLabFav } = useFavoriteIds(session?.user?.id, FAVORITE_TYPES.LABORATORY);
  const { toggleFavorite: toggleMissionFav } = useFavorites(session?.user?.id, FAVORITE_TYPES.MISSION);
  const { toggleFavorite: toggleLabFav } = useFavorites(session?.user?.id, FAVORITE_TYPES.LABORATORY);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLab, setSelectedLab] = useState(null);

  // Animation
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dx, dy }) => position.setValue({ x: dx, y: dy }),
      onPanResponderRelease: (_, { dx, dy }) => {
        if (dx > SWIPE_THRESHOLD) handleSwipe('right');
        else if (dx < -SWIPE_THRESHOLD) handleSwipe('left');
        else if (dy < -SWIPE_THRESHOLD * 0.8) handleSwipe('up'); // Super like
        else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      },
    })
  ).current;

  const handleSwipe = async (direction) => {
    const currentMission = missions[currentIndex];
    if (!currentMission) return;

    const x = direction === 'right' ? SCREEN_WIDTH + 100 : direction === 'left' ? -SCREEN_WIDTH - 100 : 0;
    const y = direction === 'up' ? -SCREEN_WIDTH : 0;

    Animated.timing(position, { toValue: { x, y }, duration: 250, useNativeDriver: false }).start(async () => {
      // Appeler le bon swipe
      if (direction === 'right') await swipeRight(currentMission.id);
      else if (direction === 'left') await swipeLeft(currentMission.id);
      else if (direction === 'up') await superLike(currentMission.id);

      setCurrentIndex(i => i + 1);
      position.setValue({ x: 0, y: 0 });
    });
  };

  const handleMatchMessage = () => {
    if (lastMatch) {
      clearLastMatch();
      router.push({ pathname: '/animatorConversation', params: { matchId: lastMatch.id } });
    }
  };

  const handleMatchContinue = () => {
    clearLastMatch();
  };

  const currentMission = missions[currentIndex];

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={commonStyles.headerNoBorder}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Missions</Text>
          <View style={commonStyles.headerSpacer} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={commonStyles.loadingText}>Recherche de missions...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (currentIndex >= missions.length) {
    return (
      <ScreenWrapper>
        <View style={commonStyles.headerNoBorder}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Missions</Text>
          <View style={commonStyles.headerSpacer} />
        </View>
        <EmptyState
          icon="briefcase"
          title="Plus de missions"
          subtitle="Revenez plus tard ou élargissez vos zones de mobilité"
          action={() => { setCurrentIndex(0); refresh(); }}
          actionLabel="Actualiser"
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {/* Modal de match */}
      <AnimatorMatchModal
        visible={!!lastMatch}
        match={lastMatch}
        onMessage={handleMatchMessage}
        onContinue={handleMatchContinue}
        userType="animator"
      />

      <View style={commonStyles.headerNoBorder}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Missions</Text>
        <Text style={commonStyles.hint}>{currentIndex + 1}/{missions.length}</Text>
      </View>

      <View style={styles.cardsContainer}>
        {/* Indicateurs de swipe */}
        <Animated.View style={[styles.indicator, styles.likeIndicator, { opacity: likeOpacity }]}>
          <Icon name="heart" size={24} color="#fff" />
          <Text style={styles.indicatorText}>INTÉRESSÉ</Text>
        </Animated.View>
        <Animated.View style={[styles.indicator, styles.nopeIndicator, { opacity: nopeOpacity }]}>
          <Icon name="x" size={24} color="#fff" />
          <Text style={styles.indicatorText}>PASSER</Text>
        </Animated.View>

        {/* Cartes */}
        {missions.slice(currentIndex, currentIndex + 2).reverse().map((mission, i) => {
          const isFirst = i === 1;
          return (
            <Animated.View
              key={mission.id}
              style={[
                styles.cardWrapper,
                isFirst
                  ? { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] }
                  : { transform: [{ scale: 0.95 }], opacity: 0.7 }
              ]}
              {...(isFirst ? panResponder.panHandlers : {})}
            >
              <MissionSwipeCard
                mission={mission}
                isFavorite={isMissionFav(mission.id)}
                isLabFavorite={mission.client_profile && isLabFav(mission.client_profile.id)}
                onToggleFavorite={() => toggleMissionFav(mission.id)}
                onLabPress={() => setSelectedLab(mission.client_profile)}
              />
            </Animated.View>
          );
        })}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <ActionButton icon="x" color={theme.colors.rose} onPress={() => handleSwipe('left')} />
        <ActionButton icon="star" color={theme.colors.warning} onPress={() => handleSwipe('up')} small label="SUPER" />
        <ActionButton icon="heart" color={theme.colors.success} onPress={() => handleSwipe('right')} />
      </View>

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

const ActionButton = ({ icon, color, onPress, small, label }) => (
  <Pressable style={[styles.actionBtn, small && styles.actionBtnSmall, { borderColor: color }]} onPress={onPress}>
    <Icon name={icon} size={small ? 20 : 28} color={color} />
    {label && <Text style={[styles.actionLabel, { color }]}>{label}</Text>}
  </Pressable>
);

const styles = StyleSheet.create({
  cardsContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: wp(4) },
  cardWrapper: { position: 'absolute', width: SCREEN_WIDTH - wp(8) },
  indicator: { position: 'absolute', top: hp(8), paddingHorizontal: wp(5), paddingVertical: hp(1), borderRadius: theme.radius.xl, flexDirection: 'row', alignItems: 'center', gap: wp(2), zIndex: 10 },
  likeIndicator: { right: wp(8), backgroundColor: theme.colors.success, transform: [{ rotate: '15deg' }] },
  nopeIndicator: { left: wp(8), backgroundColor: theme.colors.rose, transform: [{ rotate: '-15deg' }] },
  indicatorText: { fontSize: hp(1.6), fontFamily: theme.fonts.bold, color: '#fff' },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: wp(4), paddingVertical: hp(2.5), paddingBottom: hp(4) },
  actionBtn: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  actionBtnSmall: { width: 50, height: 50, borderRadius: 25 },
  actionLabel: { fontSize: hp(0.9), fontFamily: theme.fonts.bold, marginTop: 2 },
});