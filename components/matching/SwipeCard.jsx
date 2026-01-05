import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';
import { getContractTypeLabel, getContractColor, getPositionTypeLabel } from '../../constants/jobOptions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

const SwipeCard = ({
  card,
  type = 'job_offer',
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  isFirst = false,
  index = 0,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  const handleSwipeComplete = (direction) => {
    'worklet';
    if (direction === 'left') {
      runOnJS(onSwipeLeft)();
    } else if (direction === 'right') {
      runOnJS(onSwipeRight)();
    } else if (direction === 'up') {
      runOnJS(onSwipeUp)();
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (!isFirst) return;
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      rotation.value = interpolate(
        e.translationX,
        [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        [-15, 0, 15],
        Extrapolation.CLAMP
      );
    })
    .onEnd((e) => {
      if (!isFirst) return;

      // Swipe up = super like
      if (translateY.value < -150) {
        translateY.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 });
        handleSwipeComplete('up');
        return;
      }

      // Swipe horizontal
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        const direction = translateX.value > 0 ? 'right' : 'left';
        translateX.value = withTiming(
          direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5,
          { duration: 300 }
        );
        rotation.value = withTiming(direction === 'right' ? 30 : -30, { duration: 300 });
        handleSwipeComplete(direction);
      } else {
        // Reset position
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(index, [0, 1, 2], [1, 0.95, 0.9], Extrapolation.CLAMP);
    const translateYOffset = interpolate(index, [0, 1, 2], [0, 10, 20], Extrapolation.CLAMP);

    return {
      transform: [
        { translateX: isFirst ? translateX.value : 0 },
        { translateY: isFirst ? translateY.value : translateYOffset },
        { rotate: isFirst ? `${rotation.value}deg` : '0deg' },
        { scale },
      ],
      opacity: interpolate(index, [0, 1, 2, 3], [1, 0.9, 0.8, 0], Extrapolation.CLAMP),
    };
  });

  // Indicateurs like/dislike
  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const dislikeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const superLikeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [-150, 0], [1, 0], Extrapolation.CLAMP),
  }));

  // Rendu selon le type
  const renderContent = () => {
    if (type === 'job_offer' || type === 'internship_offer') {
      return renderOfferCard();
    }
    return renderCandidateCard();
  };

  const renderOfferCard = () => {
    const contractColor = type === 'job_offer' 
      ? getContractColor(card.contract_type)
      : theme.colors.secondary;

    return (
      <>
        {/* Header avec badge */}
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: contractColor + '20' }]}>
            <Text style={[styles.badgeText, { color: contractColor }]}>
              {type === 'job_offer' 
                ? getContractTypeLabel(card.contract_type)
                : card.type === 'stage' ? 'Stage' : 'Alternance'
              }
            </Text>
          </View>
          {card.matchScore !== null && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{card.matchScore}%</Text>
              <Text style={styles.scoreLabel}>match</Text>
            </View>
          )}
        </View>

        {/* Contenu principal */}
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2}>{card.title}</Text>
          
          {type === 'job_offer' && (
            <Text style={styles.subtitle}>{getPositionTypeLabel(card.position_type)}</Text>
          )}

          <View style={styles.infoRow}>
            <Icon name="mapPin" size={16} color={theme.colors.textLight} />
            <Text style={styles.infoText}>{card.city}, {card.department}</Text>
          </View>

          {card.salary_range && (
            <View style={styles.infoRow}>
              <Icon name="briefcase" size={16} color={theme.colors.textLight} />
              <Text style={styles.infoText}>{card.salary_range}</Text>
            </View>
          )}

          {card.duration_months && (
            <View style={styles.infoRow}>
              <Icon name="clock" size={16} color={theme.colors.textLight} />
              <Text style={styles.infoText}>{card.duration_months} mois</Text>
            </View>
          )}

          <Text style={styles.description} numberOfLines={4}>
            {card.description}
          </Text>
        </View>

        {/* Footer pharmacie */}
        {card.profiles && (
          <View style={styles.cardFooter}>
            <View style={styles.pharmacyInfo}>
              {card.profiles.photo_url ? (
                <Image source={{ uri: card.profiles.photo_url }} style={styles.pharmacyAvatar} />
              ) : (
                <View style={[styles.pharmacyAvatar, styles.avatarPlaceholder]}>
                  <Icon name="user" size={16} color={theme.colors.gray} />
                </View>
              )}
              <Text style={styles.pharmacyName}>
                {card.profiles.first_name} {card.profiles.last_name?.[0]}.
              </Text>
            </View>
          </View>
        )}
      </>
    );
  };

  const renderCandidateCard = () => {
    const privacy = card.privacy_settings || {};
    const showPhoto = privacy.show_photo !== false;
    const showFullName = privacy.show_full_name !== false;

    return (
      <>
        {/* Photo ou placeholder */}
        <View style={styles.candidatePhotoContainer}>
          {showPhoto && card.photo_url ? (
            <Image source={{ uri: card.photo_url }} style={styles.candidatePhoto} />
          ) : (
            <View style={[styles.candidatePhoto, styles.photoPlaceholder]}>
              <Icon name="user" size={60} color={theme.colors.gray} />
            </View>
          )}
          {card.matchScore !== null && (
            <View style={styles.scoreOverlay}>
              <Text style={styles.scoreOverlayText}>{card.matchScore}%</Text>
            </View>
          )}
        </View>

        {/* Infos candidat */}
        <View style={styles.candidateInfo}>
          <Text style={styles.candidateName}>
            {showFullName 
              ? `${card.first_name} ${card.last_name}`
              : `${card.first_name} ${card.last_name?.[0]}.`
            }
          </Text>

          {card.experience_years !== undefined && (
            <Text style={styles.candidateDetail}>
              {card.experience_years} ans d'expérience
            </Text>
          )}

          {card.current_city && (
            <View style={styles.infoRow}>
              <Icon name="mapPin" size={14} color={theme.colors.textLight} />
              <Text style={styles.infoText}>{card.current_city}</Text>
            </View>
          )}

          {card.availability_date && (
            <View style={styles.infoRow}>
              <Icon name="calendar" size={14} color={theme.colors.textLight} />
              <Text style={styles.infoText}>
                Disponible le {new Date(card.availability_date).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}
        </View>
      </>
    );
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        {/* Indicateurs de swipe */}
        {isFirst && (
          <>
            <Animated.View style={[styles.indicator, styles.likeIndicator, likeOpacity]}>
              <Text style={styles.indicatorText}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.indicator, styles.dislikeIndicator, dislikeOpacity]}>
              <Text style={styles.indicatorText}>NOPE</Text>
            </Animated.View>
            <Animated.View style={[styles.indicator, styles.superLikeIndicator, superLikeOpacity]}>
              <Icon name="star" size={24} color={theme.colors.warning} />
              <Text style={[styles.indicatorText, { color: theme.colors.warning }]}>SUPER</Text>
            </Animated.View>
          </>
        )}

        {renderContent()}
      </Animated.View>
    </GestureDetector>
  );
};

export default SwipeCard;

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - wp(10),
    height: hp(65),
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
    gap: hp(1),
  },
  title: {
    fontSize: hp(2.4),
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: hp(1.7),
    color: theme.colors.textLight,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  infoText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  description: {
    fontSize: hp(1.6),
    color: theme.colors.text,
    lineHeight: hp(2.4),
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
    fontSize: hp(1.6),
    color: theme.colors.text,
    fontWeight: '500',
  },
  // Candidat
  candidatePhotoContainer: {
    height: hp(40),
    position: 'relative',
  },
  candidatePhoto: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    backgroundColor: theme.colors.darkLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreOverlay: {
    position: 'absolute',
    bottom: hp(2),
    right: wp(4),
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: theme.radius.lg,
  },
  scoreOverlayText: {
    color: 'white',
    fontSize: hp(2.2),
    fontWeight: '700',
  },
  candidateInfo: {
    flex: 1,
    padding: wp(4),
    gap: hp(0.8),
  },
  candidateName: {
    fontSize: hp(2.4),
    fontWeight: '700',
    color: theme.colors.text,
  },
  candidateDetail: {
    fontSize: hp(1.7),
    color: theme.colors.textLight,
  },
  // Indicateurs
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
  superLikeIndicator: {
    alignSelf: 'center',
    left: '35%',
    top: hp(4),
    borderColor: theme.colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  indicatorText: {
    fontSize: hp(2),
    fontWeight: '800',
    color: theme.colors.success,
  },
});