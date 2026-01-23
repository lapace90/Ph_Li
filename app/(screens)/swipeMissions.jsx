// Swipe des missions pour les animateurs

import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, PanResponder, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { missionService } from '../../services/missionService';
import { favoritesService, FAVORITE_TYPES } from '../../services/favoritesService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import { MissionSwipeCard } from '../../components/missions/MissionCard';
import { LaboratoryDetailModal } from '../../components/laboratories/LaboratoryCard';
import { EmptyState } from '../../components/common/DashboardComponents';
import { BookmarkFavoriteButton } from '../../components/common/FavoriteButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export default function SwipeMissions() {
  const router = useRouter();
  const { session, animatorProfile } = useAuth();
  
  const [missions, setMissions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [favoriteLabIds, setFavoriteLabIds] = useState(new Set());
  const [favoriteMissionIds, setFavoriteMissionIds] = useState(new Set());
  
  // Modal labo
  const [selectedLab, setSelectedLab] = useState(null);
  const [labMissions, setLabMissions] = useState([]);
  const [showLabModal, setShowLabModal] = useState(false);

  // Animation
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  // Charger les missions
  const loadMissions = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);

      // Charger les IDs des labos et missions favoris
      const [favLabs, favMissions] = await Promise.all([
        favoritesService.getFavoriteIds(session.user.id, FAVORITE_TYPES.LABORATORY),
        favoritesService.getFavoriteIds(session.user.id, FAVORITE_TYPES.MISSION),
      ]);
      setFavoriteLabIds(new Set(favLabs));
      setFavoriteMissionIds(new Set(favMissions));

      // Charger les missions disponibles
      const data = await missionService.searchMissions({
        status: 'open',
        limit: 50,
        // TODO: Ajouter filtres géo basés sur animatorProfile
      });

      // Enrichir avec les infos du client
      const enriched = await Promise.all(
        data.map(async (mission) => {
          let clientProfile = null;
          if (mission.client_type === 'laboratory') {
            const { data: lab } = await missionService.getClientProfile(mission.client_id, 'laboratory');
            clientProfile = lab;
          }
          return { ...mission, client_profile: clientProfile };
        })
      );

      setMissions(enriched);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  // Pan responder pour le swipe
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      handleSwipe('left');
    });
  };

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      handleSwipe('right');
    });
  };

  const handleSwipe = async (direction) => {
    const currentMission = missions[currentIndex];
    
    if (direction === 'right' && currentMission) {
      // Candidater à la mission
      try {
        await missionService.applyToMission(currentMission.id, session.user.id, {
          // message: '', // TODO: Modal message de candidature?
        });
        // TODO: Feedback de succès
      } catch (error) {
        console.error('Error applying to mission:', error);
      }
    }

    // Passer à la mission suivante
    setCurrentIndex(prev => prev + 1);
    position.setValue({ x: 0, y: 0 });
  };

  // Toggle favori mission
  const toggleMissionFavorite = async () => {
    const mission = missions[currentIndex];
    if (!mission) return;

    try {
      const result = await favoritesService.toggle(
        session.user.id,
        FAVORITE_TYPES.MISSION,
        mission.id
      );

      setFavoriteMissionIds(prev => {
        const newSet = new Set(prev);
        if (result.added) {
          newSet.add(mission.id);
        } else {
          newSet.delete(mission.id);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Toggle favori labo
  const toggleLabFavorite = async () => {
    if (!selectedLab) return;

    try {
      const result = await favoritesService.toggle(
        session.user.id,
        FAVORITE_TYPES.LABORATORY,
        selectedLab.id
      );

      setFavoriteLabIds(prev => {
        const newSet = new Set(prev);
        if (result.added) {
          newSet.add(selectedLab.id);
        } else {
          newSet.delete(selectedLab.id);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error toggling lab favorite:', error);
    }
  };

  // Ouvrir la fiche labo
  const openLabDetail = async (lab) => {
    setSelectedLab(lab);
    setShowLabModal(true);

    // Charger les missions du labo
    try {
      const labMissionsData = await missionService.searchMissions({
        clientId: lab.id,
        status: 'open',
      });
      setLabMissions(labMissionsData);
    } catch (error) {
      console.error('Error loading lab missions:', error);
    }
  };

  // Render carte
  const renderCard = (mission, index) => {
    if (index < currentIndex) return null;
    
    const isFirst = index === currentIndex;
    const lab = mission.client_profile;
    const isFavoriteLab = lab && favoriteLabIds.has(lab.id);

    const cardStyle = isFirst
      ? {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate },
          ],
        }
      : {
          transform: [{ scale: 0.95 }],
          opacity: 0.8,
        };

    return (
      <Animated.View
        key={mission.id}
        style={[styles.cardContainer, cardStyle]}
        {...(isFirst ? panResponder.panHandlers : {})}
      >
        <MissionSwipeCard
          mission={mission}
          laboratory={lab}
          isFavoriteLab={isFavoriteLab}
          onLabPress={() => lab && openLabDetail(lab)}
        />
      </Animated.View>
    );
  };

  const currentMission = missions[currentIndex];
  const isMissionFavorite = currentMission && favoriteMissionIds.has(currentMission.id);
  const isLabFavorite = selectedLab && favoriteLabIds.has(selectedLab.id);

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des missions...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Missions</Text>
        <View style={styles.headerRight}>
          <Text style={styles.counter}>
            {currentIndex + 1} / {missions.length}
          </Text>
        </View>
      </View>

      {/* Zone de swipe */}
      <View style={styles.swipeContainer}>
        {missions.length > 0 && currentIndex < missions.length ? (
          <>
            {/* Cartes */}
            {missions.slice(currentIndex, currentIndex + 2).reverse().map((mission, i) =>
              renderCard(mission, currentIndex + (1 - i))
            )}

            {/* Indicateurs de swipe */}
            <Animated.View
              style={[
                styles.swipeIndicator,
                styles.likeIndicator,
                {
                  opacity: position.x.interpolate({
                    inputRange: [0, SWIPE_THRESHOLD],
                    outputRange: [0, 1],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            >
              <Icon name="check" size={32} color="#fff" />
              <Text style={styles.indicatorText}>Candidater</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.swipeIndicator,
                styles.passIndicator,
                {
                  opacity: position.x.interpolate({
                    inputRange: [-SWIPE_THRESHOLD, 0],
                    outputRange: [1, 0],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            >
              <Icon name="x" size={32} color="#fff" />
              <Text style={styles.indicatorText}>Passer</Text>
            </Animated.View>
          </>
        ) : (
          <EmptyState
            icon="briefcase"
            title="Plus de missions disponibles"
            subtitle="Revenez plus tard ou élargissez vos critères"
            action={loadMissions}
            actionLabel="Actualiser"
          />
        )}
      </View>

      {/* Boutons d'action */}
      {currentIndex < missions.length && (
        <View style={styles.actionsContainer}>
          {/* Passer */}
          <ActionButton
            icon="x"
            color={theme.colors.rose}
            onPress={swipeLeft}
          />

          {/* Sauvegarder */}
          <BookmarkFavoriteButton
            isFavorite={isMissionFavorite}
            onToggle={toggleMissionFavorite}
            size="large"
          />

          {/* Candidater */}
          <ActionButton
            icon="check"
            color={theme.colors.success}
            onPress={swipeRight}
            large
          />
        </View>
      )}

      {/* Modal fiche labo */}
      <LaboratoryDetailModal
        visible={showLabModal}
        onClose={() => setShowLabModal(false)}
        laboratory={selectedLab}
        missions={labMissions}
        isFavorite={isLabFavorite}
        onToggleFavorite={toggleLabFavorite}
        onMissionPress={(mission) => {
          setShowLabModal(false);
          // Trouver l'index de la mission et y aller
          const idx = missions.findIndex(m => m.id === mission.id);
          if (idx !== -1 && idx > currentIndex) {
            setCurrentIndex(idx);
          }
        }}
      />
    </ScreenWrapper>
  );
}

// Bouton d'action circulaire
const ActionButton = ({ icon, color, onPress, large = false }) => (
  <Pressable
    style={[
      styles.actionButton,
      { 
        backgroundColor: color + '15',
        borderColor: color,
        width: large ? 64 : 52,
        height: large ? 64 : 52,
        borderRadius: large ? 32 : 26,
      },
    ]}
    onPress={onPress}
  >
    <Icon name={icon} size={large ? 28 : 24} color={color} />
  </Pressable>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
  },
  headerTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  counter: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: hp(1.5),
    color: theme.colors.textLight,
  },
  swipeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(4),
  },
  cardContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH - wp(8),
    maxHeight: SCREEN_HEIGHT * 0.65,
  },
  swipeIndicator: {
    position: 'absolute',
    top: hp(10),
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  likeIndicator: {
    right: wp(8),
    backgroundColor: theme.colors.success,
    transform: [{ rotate: '15deg' }],
  },
  passIndicator: {
    left: wp(8),
    backgroundColor: theme.colors.rose,
    transform: [{ rotate: '-15deg' }],
  },
  indicatorText: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.bold,
    color: '#fff',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(6),
    paddingVertical: hp(3),
    paddingBottom: hp(5),
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
});