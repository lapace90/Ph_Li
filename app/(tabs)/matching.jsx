import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, PanResponder, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { useSwipeScreen } from '../../hooks/useMatching';
import { getContractTypeLabel, getContractColor, getPositionTypeLabel } from '../../constants/jobOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import MatchModal from '../../components/matching/MatchModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export default function Matching() {
  const router = useRouter();
  const { user } = useAuth();
  
  const userType = user?.user_type;
  const isStudent = userType === 'etudiant';
  const isTitulaire = userType === 'titulaire';
  const isCandidate = !isTitulaire;
  
  // Candidats voient des offres, titulaires voient des candidats
  const [offerType, setOfferType] = useState(
    isTitulaire ? 'candidate' : (isStudent ? 'internship_offer' : 'job_offer')
  );

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

  // Animation
  const position = useRef(new Animated.ValueXY()).current;
  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const dislikeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Refs pour accéder aux valeurs à jour dans le panResponder
  const handleSwipeRef = useRef(handleSwipe);
  const positionRef = useRef(position);
  
  useEffect(() => {
    handleSwipeRef.current = handleSwipe;
  }, [handleSwipe]);

  const swipeOut = useCallback((direction) => {
    const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : direction === 'left' ? -SCREEN_WIDTH * 1.5 : 0;
    const y = direction === 'up' ? -SCREEN_WIDTH * 1.5 : 0;

    Animated.timing(position, {
      toValue: { x, y },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      handleSwipeRef.current(direction);
      position.setValue({ x: 0, y: 0 });
    });
  }, [position]);

  const swipeOutRef = useRef(swipeOut);
  useEffect(() => {
    swipeOutRef.current = swipeOut;
  }, [swipeOut]);

  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeOutRef.current('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeOutRef.current('left');
        } else if (gesture.dy < -100) {
          swipeOutRef.current('up');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    }), [position]);

  const handleButtonSwipe = (direction) => {
    swipeOutRef.current(direction);
  };

  const handleMatchMessage = useCallback(() => {
    clearLastMatch();
    router.push('/(tabs)/messages');
  }, [clearLastMatch, router]);

  const handleMatchContinue = useCallback(() => {
    clearLastMatch();
  }, [clearLastMatch]);

  // Render card content
  const renderCard = () => {
    if (!currentCard) return null;

    const isJobOffer = offerType === 'job_offer';
    const contractColor = isJobOffer 
      ? getContractColor(currentCard.contract_type)
      : theme.colors.secondary;

    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate: rotation },
            ],
          },
        ]}
      >
        {/* Indicateurs de swipe */}
        <Animated.View style={[styles.indicator, styles.likeIndicator, { opacity: likeOpacity }]}>
          <Text style={[styles.indicatorText, { color: theme.colors.success }]}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.indicator, styles.dislikeIndicator, { opacity: dislikeOpacity }]}>
          <Text style={[styles.indicatorText, { color: theme.colors.rose }]}>NOPE</Text>
        </Animated.View>

        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: contractColor + '20' }]}>
            <Text style={[styles.badgeText, { color: contractColor }]}>
              {isJobOffer 
                ? getContractTypeLabel(currentCard.contract_type)
                : currentCard.type === 'stage' ? 'Stage' : 'Alternance'
              }
            </Text>
          </View>
          {currentCard.matchScore !== null && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{currentCard.matchScore}%</Text>
              <Text style={styles.scoreLabel}>match</Text>
            </View>
          )}
        </View>

        {/* Contenu */}
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2}>{currentCard.title}</Text>
          
          {isJobOffer && (
            <Text style={styles.subtitle}>{getPositionTypeLabel(currentCard.position_type)}</Text>
          )}

          <View style={styles.infoRow}>
            <Icon name="mapPin" size={16} color={theme.colors.textLight} />
            <Text style={styles.infoText}>{currentCard.city}, {currentCard.department}</Text>
          </View>

          {currentCard.salary_range && (
            <View style={styles.infoRow}>
              <Icon name="briefcase" size={16} color={theme.colors.textLight} />
              <Text style={styles.infoText}>{currentCard.salary_range}</Text>
            </View>
          )}

          {currentCard.duration_months && (
            <View style={styles.infoRow}>
              <Icon name="clock" size={16} color={theme.colors.textLight} />
              <Text style={styles.infoText}>{currentCard.duration_months} mois</Text>
            </View>
          )}

          <Text style={styles.description} numberOfLines={4}>
            {currentCard.description}
          </Text>
        </View>

        {/* Footer - Ville */}
        <View style={styles.cardFooter}>
          <View style={styles.pharmacyInfo}>
            <View style={[styles.pharmacyAvatar, styles.avatarPlaceholder]}>
              <Icon name="briefcase" size={16} color={theme.colors.gray} />
            </View>
            <Text style={styles.pharmacyName}>{currentCard.city}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Loading state
  if (cardsLoading) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Matching</Text>
          <View style={styles.headerRight}>
            <Pressable style={styles.headerButton} onPress={() => router.push('/(tabs)/messages')}>
              <Icon name="messageCircle" size={22} color={theme.colors.text} />
            </Pressable>
            <Pressable style={styles.headerButton} onPress={() => router.push('/(screens)/matches')}>
              <Icon name="heart" size={22} color={theme.colors.primary} />
            </Pressable>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Recherche d'opportunités...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Empty state
  if (!hasMoreCards || !currentCard) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Matching</Text>
          <View style={styles.headerRight}>
            <Pressable style={styles.headerButton} onPress={() => router.push('/(tabs)/messages')}>
              <Icon name="messageCircle" size={22} color={theme.colors.text} />
            </Pressable>
            <Pressable style={styles.headerButton} onPress={() => router.push('/(screens)/matches')}>
              <Icon name="heart" size={22} color={theme.colors.primary} />
            </Pressable>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <View style={styles.emptyIcon}>
            <Icon name="search" size={50} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Plus d'offres pour le moment</Text>
          <Text style={styles.emptyText}>
            Revenez plus tard ou élargissez vos critères de recherche
          </Text>
          <Pressable style={styles.refreshButton} onPress={refreshCards}>
            <Icon name="refresh" size={18} color="white" />
            <Text style={styles.refreshText}>Actualiser</Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Matching</Text>
          {/* Toggle type pour candidats non-étudiants */}
          {isCandidate && !isStudent && (
            <View style={styles.toggleContainer}>
              <Pressable
                style={[styles.toggleButton, offerType === 'job_offer' && styles.toggleActive]}
                onPress={() => setOfferType('job_offer')}
              >
                <Text style={[styles.toggleText, offerType === 'job_offer' && styles.toggleTextActive]}>
                  Emplois
                </Text>
              </Pressable>
              <Pressable
                style={[styles.toggleButton, offerType === 'internship_offer' && styles.toggleActive]}
                onPress={() => setOfferType('internship_offer')}
              >
                <Text style={[styles.toggleText, offerType === 'internship_offer' && styles.toggleTextActive]}>
                  Stages
                </Text>
              </Pressable>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.headerButton} onPress={() => router.push('/(tabs)/messages')}>
            <Icon name="messageCircle" size={22} color={theme.colors.text} />
          </Pressable>
          <Pressable style={styles.headerButton} onPress={() => router.push('/(screens)/matches')}>
            <Icon name="heart" size={22} color={theme.colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Cards */}
      <View style={styles.cardsContainer}>
        {renderCard()}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Pressable 
          style={[styles.actionButton, styles.dislikeButton]}
          onPress={() => handleButtonSwipe('left')}
        >
          <Icon name="close" size={28} color={theme.colors.rose} />
        </Pressable>

        <Pressable 
          style={[
            styles.actionButton, 
            styles.superLikeButton,
            superLikesRemaining <= 0 && styles.buttonDisabled
          ]}
          onPress={() => superLikesRemaining > 0 && handleButtonSwipe('up')}
          disabled={superLikesRemaining <= 0}
        >
          <Icon 
            name="star" 
            size={24} 
            color={superLikesRemaining > 0 ? theme.colors.warning : theme.colors.gray} 
          />
          <Text style={[styles.superLikeCount, superLikesRemaining <= 0 && styles.countDisabled]}>
            {superLikesRemaining}
          </Text>
        </Pressable>

        <Pressable 
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleButtonSwipe('right')}
        >
          <Icon name="heart" size={28} color={theme.colors.success} />
        </Pressable>
      </View>

      {/* Counter */}
      <View style={styles.counter}>
        <Text style={styles.counterText}>{remainingCards} offres restantes</Text>
      </View>

      {/* Match Modal */}
      <MatchModal
        visible={!!lastMatch}
        match={lastMatch}
        onClose={clearLastMatch}
        onMessage={handleMatchMessage}
        onContinue={handleMatchContinue}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flex: 1,
    gap: hp(1),
  },
  headerTitle: {
    fontSize: hp(2.4),
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    gap: wp(2),
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.darkLight,
    borderRadius: theme.radius.md,
    padding: 3,
    alignSelf: 'flex-start',
  },
  toggleButton: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.sm,
  },
  toggleActive: {
    backgroundColor: theme.colors.card,
  },
  toggleText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  // Cards
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
  },
  card: {
    width: SCREEN_WIDTH - wp(10),
    height: hp(58),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: wp(4),
  },
  badge: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.md,
  },
  badgeText: {
    fontSize: hp(1.5),
    fontWeight: '600',
  },
  scoreBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  scoreText: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: '700',
  },
  scoreLabel: {
    color: 'white',
    fontSize: hp(1.1),
    opacity: 0.8,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: wp(4),
    gap: hp(0.8),
  },
  title: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  infoText: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
  },
  description: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    lineHeight: hp(2.2),
    marginTop: hp(1),
  },
  cardFooter: {
    padding: wp(4),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  pharmacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  pharmacyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.darkLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pharmacyName: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    fontWeight: '500',
  },
  // Indicators
  indicator: {
    position: 'absolute',
    top: hp(8),
    padding: wp(3),
    borderWidth: 3,
    borderRadius: theme.radius.md,
    zIndex: 10,
  },
  likeIndicator: {
    right: wp(4),
    borderColor: theme.colors.success,
    transform: [{ rotate: '15deg' }],
  },
  dislikeIndicator: {
    left: wp(4),
    borderColor: theme.colors.rose,
    transform: [{ rotate: '-15deg' }],
  },
  indicatorText: {
    fontSize: hp(2),
    fontWeight: '800',
  },
  // Actions
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(6),
    paddingVertical: hp(2),
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dislikeButton: {
    borderColor: theme.colors.rose + '30',
  },
  likeButton: {
    borderColor: theme.colors.success + '30',
  },
  superLikeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderColor: theme.colors.warning + '30',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  superLikeCount: {
    position: 'absolute',
    bottom: -8,
    fontSize: hp(1.2),
    color: theme.colors.warning,
    fontWeight: '700',
    backgroundColor: theme.colors.card,
    paddingHorizontal: wp(1.5),
    borderRadius: 8,
  },
  countDisabled: {
    color: theme.colors.gray,
  },
  counter: {
    alignItems: 'center',
    paddingBottom: hp(1),
  },
  counterText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  // Empty & Loading
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
    gap: hp(2),
  },
  loadingText: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    marginTop: hp(2),
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: hp(2.2),
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: hp(2.4),
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    marginTop: hp(2),
  },
  refreshText: {
    color: 'white',
    fontSize: hp(1.7),
    fontWeight: '600',
  },
});