import { useRef, useMemo, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Animated, PanResponder, Dimensions, Modal, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';
import { getContractTypeLabel, getContractColor, getPositionTypeLabel } from '../../constants/jobOptions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;

// Labels
const BENEFITS_LABELS = {
  mutuelle: 'Mutuelle',
  tickets_restaurant: 'Tickets resto',
  prime_interessement: 'Intéressement',
  formation: 'Formation',
  transport: 'Transport',
  parking: 'Parking',
  ce: 'CE',
  teletravail: 'Télétravail',
};

const DIPLOMAS_LABELS = {
  bp: 'BP',
  deust: 'DEUST',
  licence_pro: 'Licence Pro',
  docteur_pharmacie: 'Docteur Pharmacie',
  master: 'Master',
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

// Composant InfoRow réutilisable
const InfoRow = ({ icon, text }) => (
  <View style={commonStyles.rowGapSmall}>
    <Icon name={icon} size={15} color={theme.colors.primary} />
    <Text style={commonStyles.hint}>{text}</Text>
  </View>
);

const SwipeCard = ({
  card,
  type = 'job_offer',
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  isFirst = false,
  index = 0,
}) => {
  const position = useRef(new Animated.ValueXY()).current;
  const [showDetail, setShowDetail] = useState(false);
  
  // Animation pour les cartes qui avancent dans la pile
  const scaleAnim = useRef(new Animated.Value(isFirst ? 1 : 1 - index * 0.05)).current;
  const translateYAnim = useRef(new Animated.Value(isFirst ? 0 : index * 10)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Animer quand la carte devient première ou change de position
  useEffect(() => {
    if (isFirst) {
      // Animation d'entrée en premier plan - grandir et monter
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 7,
          tension: 40,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 7,
          tension: 40,
        }),
      ]).start();
    } else {
      // Cartes en arrière-plan
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1 - index * 0.05,
          useNativeDriver: true,
          friction: 6,
          tension: 80,
        }),
        Animated.spring(translateYAnim, {
          toValue: index * 10,
          useNativeDriver: true,
          friction: 6,
          tension: 80,
        }),
      ]).start();
    }
  }, [index, isFirst]);

  // Style de carte - utiliser les animations pour toutes les cartes
  const getCardTransform = () => {
    if (isFirst) {
      // Première carte: gérer le swipe + animation d'entrée
      return {
        transform: [
          { translateX: position.x },
          { translateY: position.y },
          { rotate: rotation },
          { scale: scaleAnim },
        ],
      };
    }
    // Cartes en arrière-plan
    return {
      transform: [
        { scale: scaleAnim },
        { translateY: translateYAnim },
      ],
    };
  };

  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
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

  const superLikeOpacity = position.y.interpolate({
    inputRange: [-150, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => isFirst,
      onMoveShouldSetPanResponder: () => isFirst,
      onPanResponderMove: (_, gesture) => {
        if (!isFirst) return;
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (!isFirst) return;

        if (gesture.dy < -100) {
          Animated.timing(position, {
            toValue: { x: 0, y: -SCREEN_HEIGHT },
            duration: 200,
            useNativeDriver: true,
          }).start(() => onSwipeUp?.());
        } else if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: SCREEN_WIDTH * 1.5, y: gesture.dy },
            duration: 200,
            useNativeDriver: true,
          }).start(() => onSwipeRight?.());
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: -SCREEN_WIDTH * 1.5, y: gesture.dy },
            duration: 200,
            useNativeDriver: true,
          }).start(() => onSwipeLeft?.());
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            friction: 5,
          }).start();
        }
      },
    }), [isFirst, onSwipeLeft, onSwipeRight, onSwipeUp, position]);

  const cardStyle = getCardTransform();

  const renderOfferCard = () => {
    const isJob = type === 'job_offer';
    const contractColor = isJob ? getContractColor(card.contract_type) : theme.colors.secondary;
    const benefits = card.benefits || [];
    const diplomas = card.required_diplomas || [];

    return (
      <>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[commonStyles.badge, { backgroundColor: contractColor + '20' }]}>
            <Text style={[commonStyles.badgeText, { color: contractColor }]}>
              {isJob ? getContractTypeLabel(card.contract_type) : (card.type === 'stage' ? 'Stage' : 'Alternance')}
            </Text>
          </View>
          {card.matchScore != null && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{card.matchScore}%</Text>
              <Text style={styles.scoreLabel}>match</Text>
            </View>
          )}
        </View>

        {/* Contenu */}
        <View style={styles.cardContent}>
          <Text style={commonStyles.sectionTitle} numberOfLines={2}>{card.title}</Text>
          
          {isJob && card.position_type && (
            <Text style={[commonStyles.hint, { color: theme.colors.primary }]}>
              {getPositionTypeLabel(card.position_type)}
            </Text>
          )}

          {/* Infos */}
          <View style={styles.infoSection}>
            <InfoRow icon="mapPin" text={`${card.city}, ${card.department}`} />
            {card.salary_range && <InfoRow icon="briefcase" text={card.salary_range} />}
            {card.required_experience != null && (
              <InfoRow 
                icon="award" 
                text={card.required_experience === 0 ? 'Débutant accepté' : `${card.required_experience} an${card.required_experience > 1 ? 's' : ''} requis`} 
              />
            )}
            {card.start_date && <InfoRow icon="calendar" text={`Début : ${formatShortDate(card.start_date)}`} />}
            {card.duration_months && <InfoRow icon="clock" text={`${card.duration_months} mois`} />}
          </View>

          {/* Diplômes */}
          {diplomas.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsSectionTitle}>Diplômes requis</Text>
              <View style={commonStyles.chipsContainerCompact}>
                {diplomas.map((d, i) => (
                  <View key={i} style={[commonStyles.badge, commonStyles.badgeSecondary]}>
                    <Text style={[commonStyles.badgeText, commonStyles.badgeTextSecondary]}>
                      {DIPLOMAS_LABELS[d] || d}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description avec bouton voir plus */}
          <View style={styles.descriptionContainer}>
            <Text style={[commonStyles.hint, { lineHeight: hp(1.9) }]} numberOfLines={12}>
              {card.description}
            </Text>
            <Pressable style={styles.seeMoreButton} onPress={() => setShowDetail(true)}>
              <Text style={styles.seeMoreText}>Voir l'annonce complète</Text>
              <Icon name="chevronDown" size={14} color={theme.colors.primary} />
            </Pressable>
          </View>

          {/* Avantages */}
          {benefits.length > 0 && (
            <View style={styles.benefitsSection}>
              <View style={commonStyles.chipsContainerCompact}>
                {benefits.slice(0, 4).map((b, i) => (
                  <View key={i} style={[commonStyles.badge, commonStyles.badgeSuccess, commonStyles.rowGapSmall]}>
                    <Icon name="check" size={12} color={theme.colors.success} />
                    <Text style={[commonStyles.badgeText, commonStyles.badgeTextSuccess]}>
                      {BENEFITS_LABELS[b] || b}
                    </Text>
                  </View>
                ))}
                {benefits.length > 4 && (
                  <Text style={commonStyles.hint}>+{benefits.length - 4}</Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={commonStyles.rowGapSmall}>
            <View style={styles.pharmacyAvatar}>
              <Icon name="home" size={16} color={theme.colors.gray} />
            </View>
            <Text style={commonStyles.hint}>{card.city}</Text>
          </View>
        </View>
      </>
    );
  };

  const renderCandidateCard = () => {
    const specs = card.specializations || [];
    const contracts = card.contract_types_sought || [];

    return (
      <>
        {/* Photo */}
        <View style={styles.candidatePhoto}>
          {card.photo_url ? (
            <Image source={{ uri: card.photo_url }} style={styles.candidateImage} />
          ) : (
            <View style={styles.candidatePlaceholder}>
              <Icon name="user" size={50} color={theme.colors.textLight} />
            </View>
          )}
          <View style={styles.candidateTypeBadge}>
            <Text style={styles.candidateTypeText}>
              {card.user_type === 'preparateur' ? 'Préparateur' : 
               card.user_type === 'etudiant' ? 'Étudiant' : 
               card.user_type === 'conseiller' ? 'Conseiller' : 'Pharmacien'}
            </Text>
          </View>
          {card.matchScore != null && (
            <View style={styles.candidateScoreBadge}>
              <Text style={styles.scoreText}>{card.matchScore}%</Text>
            </View>
          )}
        </View>

        {/* Infos */}
        <View style={styles.candidateContent}>
          <Text style={commonStyles.sectionTitle}>
            {card.show_full_name ? `${card.first_name} ${card.last_name}` : `${card.first_name} ${card.last_name?.[0]}.`}
          </Text>
          {card.experience_years != null && (
            <Text style={commonStyles.hint}>
              {card.experience_years} an{card.experience_years > 1 ? 's' : ''} d'expérience
            </Text>
          )}

          <View style={styles.infoSection}>
            {card.current_city && <InfoRow icon="mapPin" text={card.current_city} />}
            {card.availability_date && <InfoRow icon="calendar" text={`Dispo : ${formatShortDate(card.availability_date)}`} />}
            {card.search_radius && <InfoRow icon="navigation" text={`Rayon : ${card.search_radius} km`} />}
          </View>

          {contracts.length > 0 && (
            <View style={commonStyles.chipsContainerCompact}>
              {contracts.map((c, i) => (
                <View key={i} style={[commonStyles.badge, { backgroundColor: getContractColor(c) + '20' }]}>
                  <Text style={[commonStyles.badgeText, { color: getContractColor(c) }]}>
                    {getContractTypeLabel(c)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {specs.length > 0 && (
            <View style={[commonStyles.chipsContainerCompact, { marginTop: hp(0.5) }]}>
              {specs.slice(0, 4).map((s, i) => (
                <View key={i} style={[commonStyles.badge, commonStyles.badgePrimary]}>
                  <Text style={[commonStyles.badgeText, commonStyles.badgeTextPrimary]}>{s}</Text>
                </View>
              ))}
              {specs.length > 4 && <Text style={commonStyles.hint}>+{specs.length - 4}</Text>}
            </View>
          )}

          {card.bio && (
            <Text style={[commonStyles.hint, { marginTop: hp(1) }]} numberOfLines={3}>
              {card.bio}
            </Text>
          )}
        </View>
      </>
    );
  };

  // Modal détail complet
  const renderDetailModal = () => {
    const isJob = type === 'job_offer';
    const contractColor = isJob ? getContractColor(card.contract_type) : theme.colors.secondary;
    const benefits = card.benefits || [];
    const diplomas = card.required_diplomas || [];

    return (
      <Modal
        visible={showDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header modal */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <Pressable style={styles.modalCloseButton} onPress={() => setShowDetail(false)}>
                <Icon name="close" size={20} color={theme.colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Badge */}
              <View style={[commonStyles.badge, { backgroundColor: contractColor + '20', alignSelf: 'flex-start', marginBottom: hp(1) }]}>
                <Text style={[commonStyles.badgeText, { color: contractColor }]}>
                  {isJob ? getContractTypeLabel(card.contract_type) : (card.type === 'stage' ? 'Stage' : 'Alternance')}
                </Text>
              </View>

              {/* Titre */}
              <Text style={commonStyles.sectionTitle}>{card.title}</Text>
              {isJob && card.position_type && (
                <Text style={[commonStyles.hint, { color: theme.colors.primary, marginBottom: hp(1.5) }]}>
                  {getPositionTypeLabel(card.position_type)}
                </Text>
              )}

              {/* Infos */}
              <View style={[commonStyles.section, { marginBottom: hp(2) }]}>
                <InfoRow icon="mapPin" text={`${card.city}, ${card.department}`} />
                {card.salary_range && <InfoRow icon="briefcase" text={card.salary_range} />}
                {card.required_experience != null && (
                  <InfoRow 
                    icon="award" 
                    text={card.required_experience === 0 ? 'Débutant accepté' : `${card.required_experience} an${card.required_experience > 1 ? 's' : ''} requis`} 
                  />
                )}
                {card.start_date && <InfoRow icon="calendar" text={`Début : ${formatShortDate(card.start_date)}`} />}
                {card.duration_months && <InfoRow icon="clock" text={`${card.duration_months} mois`} />}
              </View>

              <View style={commonStyles.divider} />

              {/* Diplômes */}
              {diplomas.length > 0 && (
                <View style={commonStyles.section}>
                  <Text style={commonStyles.sectionTitleSmall}>Diplômes requis</Text>
                  <View style={commonStyles.chipsContainerCompact}>
                    {diplomas.map((d, i) => (
                      <View key={i} style={[commonStyles.badge, commonStyles.badgeSecondary]}>
                        <Text style={[commonStyles.badgeText, commonStyles.badgeTextSecondary]}>
                          {DIPLOMAS_LABELS[d] || d}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Description complète */}
              <View style={commonStyles.section}>
                <Text style={commonStyles.sectionTitleSmall}>Description</Text>
                <Text style={[commonStyles.hint, { lineHeight: hp(2.3) }]}>{card.description}</Text>
              </View>

              {/* Avantages */}
              {benefits.length > 0 && (
                <View style={commonStyles.section}>
                  <Text style={commonStyles.sectionTitleSmall}>Avantages</Text>
                  <View style={commonStyles.chipsContainerCompact}>
                    {benefits.map((b, i) => (
                      <View key={i} style={[commonStyles.badge, commonStyles.badgeSuccess, commonStyles.rowGapSmall]}>
                        <Icon name="check" size={14} color={theme.colors.success} />
                        <Text style={[commonStyles.badgeText, commonStyles.badgeTextSuccess]}>
                          {BENEFITS_LABELS[b] || b}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      {renderDetailModal()}
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.card, cardStyle]}
      >
        {/* Indicateurs */}
        {isFirst && (
          <>
            <Animated.View style={[styles.indicator, styles.likeIndicator, { opacity: likeOpacity }]}>
              <Text style={[styles.indicatorText, { color: theme.colors.success }]}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.indicator, styles.dislikeIndicator, { opacity: dislikeOpacity }]}>
              <Text style={[styles.indicatorText, { color: theme.colors.rose }]}>NOPE</Text>
            </Animated.View>
            <Animated.View style={[styles.indicator, styles.superIndicator, { opacity: superLikeOpacity }]}>
              <Icon name="star" size={32} color={theme.colors.warning} />
              <Text style={[styles.indicatorText, { color: theme.colors.warning }]}>SUPER</Text>
            </Animated.View>
          </>
        )}

        {type === 'candidate' ? renderCandidateCard() : renderOfferCard()}
      </Animated.View>
    </>
  );
};

// Styles locaux uniquement pour ce qui n'existe pas dans commonStyles
const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - wp(8),
    height: CARD_HEIGHT,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },

  // Header carte
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: wp(4),
    paddingBottom: hp(1),
  },
  scoreBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  scoreText: {
    color: 'white',
    fontSize: hp(1.5),
    fontWeight: '700',
  },
  scoreLabel: {
    color: 'white',
    fontSize: hp(0.9),
    opacity: 0.9,
  },

  // Contenu carte
  cardContent: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  infoSection: {
    gap: hp(0.5),
    marginVertical: hp(1),
  },
  tagsSection: {
    marginBottom: hp(1),
  },
  tagsSectionTitle: {
    fontSize: hp(1.1),
    color: theme.colors.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: hp(0.4),
  },

  // Description
  descriptionContainer: {
    flex: 1,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1),
    paddingVertical: hp(1),
  },
  seeMoreText: {
    fontSize: hp(1.3),
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Avantages & Footer
  benefitsSection: {
    paddingTop: hp(1),
    paddingBottom: hp(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 'auto',
  },
  cardFooter: {
    padding: wp(4),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  pharmacyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Candidat
  candidatePhoto: {
    height: hp(22),
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  candidateImage: {
    width: '100%',
    height: '100%',
  },
  candidatePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  candidateTypeBadge: {
    position: 'absolute',
    bottom: hp(1),
    left: wp(4),
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.4),
    borderRadius: theme.radius.full,
  },
  candidateTypeText: {
    color: 'white',
    fontSize: hp(1.2),
    fontWeight: '600',
  },
  candidateScoreBadge: {
    position: 'absolute',
    top: hp(1),
    right: wp(4),
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.md,
  },
  candidateContent: {
    flex: 1,
    padding: wp(4),
  },

  // Indicateurs swipe
  indicator: {
    position: 'absolute',
    top: hp(8),
    zIndex: 10,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.xl,
    borderWidth: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  indicatorText: {
    fontSize: hp(3.2),
    fontWeight: '900',
    letterSpacing: 3,
  },
  likeIndicator: {
    right: wp(5),
    borderColor: theme.colors.success,
    transform: [{ rotate: '15deg' }],
  },
  dislikeIndicator: {
    left: wp(5),
    borderColor: theme.colors.rose,
    transform: [{ rotate: '-15deg' }],
  },
  superIndicator: {
    alignSelf: 'center',
    left: '25%',
    borderColor: theme.colors.warning,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    maxHeight: '85%',
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: hp(1.5),
  },
  modalHandle: {
    width: wp(10),
    height: 4,
    backgroundColor: theme.colors.gray,
    borderRadius: 2,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 0,
    top: hp(1),
    padding: wp(2),
  },
});

export default SwipeCard;