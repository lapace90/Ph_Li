import { useRef, useMemo, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Animated, PanResponder, Dimensions, Modal, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { getRoleLabelShort } from '../../helpers/roleLabel';
import { hp, wp } from '../../helpers/common';
import { getDisplayName } from '../../helpers/displayName';
import Icon from '../../assets/icons/Icon';
import SiretBadge from '../common/SiretBadge';
import { getContractTypeLabel, getContractColor, getPositionTypeLabel } from '../../constants/jobOptions';
import { getAnimationSpecialtyLabel } from '../../constants/profileOptions';
import { formatDistanceToNow } from '../../helpers/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { cvService } from '../../services/cvService';

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

const MISSION_TYPE_LABELS = {
  animation: 'Animation',
  formation: 'Formation',
  audit: 'Audit',
  merchandising: 'Merchandising',
  event: 'Événement',
};

const SwipeCard = ({
  card,
  type = 'job_offer',
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onCardPress,
  isFirst = false,
  index = 0,
}) => {
  const router = useRouter();
  const { session } = useAuth();
  const position = useRef(new Animated.ValueXY()).current;
  const [showDetail, setShowDetail] = useState(false);
  const [cvLoading, setCvLoading] = useState(false);

  const handleCvPress = async () => {
    if (cvLoading) return;
    setCvLoading(true);
    try {
      const { data: cv } = await supabase
        .from('cvs')
        .select('id')
        .eq('user_id', card.id)
        .eq('is_default', true)
        .maybeSingle();

      if (cv) {
        cvService.recordCvView(cv.id, card.id, session?.user?.id);
        router.push({ pathname: '/(screens)/cvView', params: { cvId: cv.id } });
      }
    } catch (err) {
      console.warn('Erreur chargement CV:', err);
    } finally {
      setCvLoading(false);
    }
  };
  
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
    const contracts = card.preferred_contract_types || card.contract_types_sought || [];

    return (
      <View style={styles.candidateContainer}>
        {/* Header avec avatar et infos principales */}
        <View style={styles.candidateHeader}>
          {card.photo_url && card.show_photo !== false ? (
            <Image source={{ uri: card.photo_url }} style={styles.candidateAvatar} />
          ) : (
            <View style={[styles.candidateAvatar, styles.candidateAvatarPlaceholder]}>
              <Icon name="user" size={32} color={theme.colors.primary} />
            </View>
          )}

          <View style={styles.candidateHeaderInfo}>
            <Text style={styles.candidateName}>
              {getDisplayName(card, !card.show_full_name)}
            </Text>
            <View style={[commonStyles.badge, commonStyles.badgePrimary, { alignSelf: 'flex-start', marginTop: hp(0.3) }]}>
              <Text style={[commonStyles.badgeText, commonStyles.badgeTextPrimary]}>
                {getRoleLabelShort(card.user_type, card.gender)}
              </Text>
            </View>
            {card.experience_years != null && (
              <Text style={[commonStyles.hint, { marginTop: hp(0.5) }]}>
                {card.experience_years} an{card.experience_years > 1 ? 's' : ''} d'expérience
              </Text>
            )}
          </View>

          {card.matchScore != null && card.matchScore > 0 && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{card.matchScore}%</Text>
              <Text style={styles.scoreLabel}>match</Text>
            </View>
          )}
        </View>

        {/* Localisation et disponibilité */}
        <View style={styles.candidateSection}>
          <View style={commonStyles.rowBetween}>
            {card.current_city && (
              <View style={commonStyles.rowGapSmall}>
                <Icon name="mapPin" size={15} color={theme.colors.primary} />
                <Text style={commonStyles.hint}>{card.current_city}{card.current_region ? `, ${card.current_region}` : ''}</Text>
              </View>
            )}
            {card.availability_date && (
              <View style={commonStyles.rowGapSmall}>
                <Icon name="calendar" size={15} color={theme.colors.success} />
                <Text style={[commonStyles.hint, { color: theme.colors.success }]}>
                  Dispo {formatShortDate(card.availability_date)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Types de contrats recherchés */}
        {contracts.length > 0 && (
          <View style={styles.candidateSection}>
            <Text style={styles.candidateSectionTitle}>Recherche</Text>
            <View style={commonStyles.chipsContainerCompact}>
              {contracts.map((c, i) => (
                <View key={i} style={[commonStyles.badge, { backgroundColor: getContractColor(c) + '20' }]}>
                  <Text style={[commonStyles.badgeText, { color: getContractColor(c) }]}>
                    {getContractTypeLabel(c)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Spécialisations */}
        {specs.length > 0 && (
          <View style={styles.candidateSection}>
            <Text style={styles.candidateSectionTitle}>Compétences</Text>
            <View style={commonStyles.chipsContainerCompact}>
              {specs.slice(0, 5).map((s, i) => (
                <View key={i} style={[commonStyles.badge, { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border }]}>
                  <Text style={[commonStyles.badgeText, { color: theme.colors.text }]}>{s}</Text>
                </View>
              ))}
              {specs.length > 5 && <Text style={commonStyles.hint}>+{specs.length - 5}</Text>}
            </View>
          </View>
        )}

        {/* Bio */}
        {card.bio && (
          <View style={styles.candidateSection}>
            <Text style={styles.candidateSectionTitle}>Présentation</Text>
            <Text style={commonStyles.hint} numberOfLines={4}>{card.bio}</Text>
          </View>
        )}

        {/* Bouton Voir CV */}
        <Pressable style={styles.cvButton} onPress={handleCvPress} disabled={cvLoading}>
          <Icon name="fileText" size={16} color={theme.colors.primary} />
          <Text style={styles.cvButtonText}>
            {cvLoading ? 'Chargement...' : 'Voir le CV complet'}
          </Text>
          <Icon name="chevronRight" size={14} color={theme.colors.primary} />
        </Pressable>
      </View>
    );
  };

  const renderAnimatorCard = () => {
    const profile = card.profile || card;
    const fullName = `${profile.first_name || ''} ${profile.last_name?.[0] || ''}.`;
    const specialties = card.animation_specialties || [];

    return (
      <View style={styles.animatorContainer}>
        {/* Header avec photo et infos */}
        <View style={styles.animatorHeader}>
          {profile.photo_url ? (
            <Image source={{ uri: profile.photo_url }} style={styles.animatorAvatar} />
          ) : (
            <View style={[styles.animatorAvatar, { backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center' }]}>
              <Icon name="user" size={40} color={theme.colors.primary} />
            </View>
          )}

          <View style={styles.animatorHeaderInfo}>
            <View style={commonStyles.rowGapSmall}>
              <Text style={styles.animatorName}>{fullName}</Text>
              <SiretBadge verified={card.siret_verified} size="small" />
            </View>

            {card.average_rating > 0 && (
              <View style={commonStyles.rowGapSmall}>
                <Icon name="star" size={14} color={theme.colors.warning} />
                <Text style={styles.animatorRating}>{card.average_rating.toFixed(1)}</Text>
                <Text style={commonStyles.hint}>({card.missions_completed || 0} missions)</Text>
              </View>
            )}

            {card.available_now && (
              <View style={[commonStyles.badge, commonStyles.badgeSuccess, { alignSelf: 'flex-start', marginTop: hp(0.5) }]}>
                <Text style={[commonStyles.badgeText, commonStyles.badgeTextSuccess]}>Disponible</Text>
              </View>
            )}
          </View>

          {card.matchScore > 0 && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{card.matchScore}%</Text>
              <Text style={styles.scoreLabel}>match</Text>
            </View>
          )}
        </View>

        {/* Spécialités */}
        {specialties.length > 0 && (
          <View style={styles.animatorSection}>
            <Text style={styles.animatorSectionTitle}>Spécialités</Text>
            <View style={commonStyles.chipsContainerCompact}>
              {specialties.slice(0, 4).map((spec, i) => (
                <View key={i} style={[commonStyles.badge, commonStyles.badgePrimary]}>
                  <Text style={[commonStyles.badgeText, commonStyles.badgeTextPrimary]}>
                    {getAnimationSpecialtyLabel(spec)}
                  </Text>
                </View>
              ))}
              {specialties.length > 4 && (
                <Text style={commonStyles.hint}>+{specialties.length - 4}</Text>
              )}
            </View>
          </View>
        )}

        {/* Tarif */}
        <View style={styles.animatorSection}>
          <View style={commonStyles.rowBetween}>
            <View style={commonStyles.rowGapSmall}>
              <Icon name="briefcase" size={16} color={theme.colors.textLight} />
              <Text style={commonStyles.hint}>Tarif journalier</Text>
            </View>
            <Text style={styles.animatorRate}>
              {card.daily_rate_min && card.daily_rate_max
                ? `${card.daily_rate_min}€ - ${card.daily_rate_max}€`
                : card.daily_rate_min
                  ? `À partir de ${card.daily_rate_min}€`
                  : 'Non renseigné'
              }
            </Text>
          </View>
        </View>

        {/* Mobilité */}
        {card.mobility_zones?.length > 0 && (
          <View style={styles.animatorSection}>
            <View style={commonStyles.rowGapSmall}>
              <Icon name="mapPin" size={16} color={theme.colors.textLight} />
              <Text style={commonStyles.hint}>
                {card.mobility_zones.length === 1
                  ? card.mobility_zones[0]
                  : `${card.mobility_zones.length} régions`
                }
              </Text>
              {card.has_vehicle && (
                <>
                  <Text style={commonStyles.hint}>•</Text>
                  <Icon name="car" size={14} color={theme.colors.success} />
                </>
              )}
            </View>
          </View>
        )}

        {/* Marques */}
        {card.brands_experience?.length > 0 && (
          <View style={styles.animatorSection}>
            <Text style={[commonStyles.hint, { marginBottom: hp(0.5) }]}>Expérience marques</Text>
            <Text style={styles.animatorBrands} numberOfLines={2}>
              {card.brands_experience.slice(0, 5).join(' • ')}
              {card.brands_experience.length > 5 && ` +${card.brands_experience.length - 5}`}
            </Text>
          </View>
        )}

        {/* Voir profil complet */}
        <Pressable style={styles.seeMoreButton} onPress={() => onCardPress?.()}>
          <Text style={styles.seeMoreText}>Voir le profil complet</Text>
          <Icon name="chevronRight" size={14} color={theme.colors.primary} />
        </Pressable>
      </View>
    );
  };

  const renderMissionCard = () => {
    const lab = card.client_profile;

    const formatDates = () => {
      if (!card.start_date) return 'Dates flexibles';
      const start = new Date(card.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      const end = card.end_date
        ? new Date(card.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        : null;
      return end ? `${start} → ${end}` : start;
    };

    const formatRate = () => {
      if (card.daily_rate_max && card.daily_rate_max !== card.daily_rate_min) {
        return `${card.daily_rate_min} - ${card.daily_rate_max}€/jour`;
      }
      return `${card.daily_rate_min || card.daily_rate_max}€/jour`;
    };

    return (
      <>
        {/* Header labo */}
        <Pressable style={styles.missionLabHeader} onPress={() => onCardPress?.()}>
          {lab?.logo_url ? (
            <Image source={{ uri: lab.logo_url }} style={styles.missionLabLogo} />
          ) : (
            <View style={styles.missionLabLogoPlaceholder}>
              <Icon name="laboratory" size={24} color={theme.colors.primary} />
            </View>
          )}
          <View style={styles.missionLabInfo}>
            <Text style={styles.missionLabName} numberOfLines={1}>
              {lab?.brand_name || lab?.company_name || 'Laboratoire'}
            </Text>
            {lab?.siret_verified && (
              <View style={commonStyles.rowGapSmall}>
                <Icon name="checkCircle" size={12} color={theme.colors.success} />
                <Text style={styles.missionVerifiedText}>Vérifié</Text>
              </View>
            )}
          </View>
          <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
        </Pressable>

        {/* Contenu mission */}
        <View style={styles.missionContent}>
          <Text style={styles.missionTitle} numberOfLines={2}>{card.title}</Text>

          {card.description && (
            <Text style={styles.missionDescription} numberOfLines={3}>
              {card.description}
            </Text>
          )}

          {/* Tags */}
          <View style={styles.missionTags}>
            {card.mission_type && (
              <View style={[commonStyles.badge, { backgroundColor: theme.colors.primary + '15' }]}>
                <Text style={[commonStyles.badgeText, { color: theme.colors.primary }]}>
                  {MISSION_TYPE_LABELS[card.mission_type] || card.mission_type}
                </Text>
              </View>
            )}
            {card.requires_experience && (
              <View style={[commonStyles.badge, { backgroundColor: theme.colors.warning + '15' }]}>
                <Text style={[commonStyles.badgeText, { color: theme.colors.warning }]}>
                  Expérience requise
                </Text>
              </View>
            )}
          </View>

          {/* Infos */}
          <View style={styles.infoSection}>
            <InfoRow icon="calendar" text={formatDates()} />
            <InfoRow icon="mapPin" text={card.city || 'Lieu à définir'} />
            <View style={commonStyles.rowGapSmall}>
              <Icon name="dollarSign" size={15} color={theme.colors.success} />
              <Text style={[commonStyles.hint, { color: theme.colors.success, fontWeight: '600' }]}>{formatRate()}</Text>
            </View>
          </View>

          {/* Spécialités requises */}
          {card.required_specialties?.length > 0 && (
            <View style={styles.missionSpecialties}>
              <Text style={[commonStyles.hint, { marginBottom: hp(0.3) }]}>Spécialités :</Text>
              <Text style={commonStyles.hint} numberOfLines={1}>
                {card.required_specialties.join(' • ')}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.missionFooter}>
          <Text style={commonStyles.hint}>
            Publiée {formatDistanceToNow(card.created_at)}
          </Text>
          {card.applications_count > 0 && (
            <Text style={[commonStyles.hint, { color: theme.colors.primary, fontWeight: '500' }]}>
              {card.applications_count} candidature{card.applications_count > 1 ? 's' : ''}
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

        {type === 'animator' ? renderAnimatorCard()
          : type === 'mission' ? renderMissionCard()
          : type === 'candidate' ? renderCandidateCard()
          : renderOfferCard()}
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

  // Candidat - Nouveau design compact
  candidateContainer: {
    flex: 1,
    padding: wp(4),
  },
  candidateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(2),
  },
  candidateAvatar: {
    width: hp(9),
    height: hp(9),
    borderRadius: hp(4.5),
    marginRight: wp(3),
  },
  candidateAvatarPlaceholder: {
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  candidateHeaderInfo: {
    flex: 1,
    paddingTop: hp(0.5),
  },
  candidateName: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  candidateSection: {
    marginBottom: hp(1.5),
    paddingBottom: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  candidateSectionTitle: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.textLight,
    marginBottom: hp(0.8),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cvButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.5),
    marginTop: hp(1.5),
    paddingVertical: hp(1),
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary + '08',
  },
  cvButtonText: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Animateur
  animatorContainer: {
    flex: 1,
    padding: wp(4),
  },
  animatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginBottom: hp(1.5),
  },
  animatorAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  animatorHeaderInfo: {
    flex: 1,
  },
  animatorName: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  animatorRating: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.warning,
  },
  animatorSection: {
    paddingVertical: hp(1),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  animatorSectionTitle: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.textLight,
    marginBottom: hp(0.8),
  },
  animatorRate: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  animatorBrands: {
    fontSize: hp(1.4),
    color: theme.colors.text,
    lineHeight: hp(2),
  },

  // Mission
  missionLabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  missionLabLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  missionLabLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionLabInfo: {
    flex: 1,
    marginLeft: wp(3),
  },
  missionLabName: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  missionVerifiedText: {
    fontSize: hp(1.2),
    color: theme.colors.success,
  },
  missionContent: {
    flex: 1,
    padding: hp(2),
  },
  missionTitle: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: hp(1),
  },
  missionDescription: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    lineHeight: hp(2.2),
    marginBottom: hp(1.5),
  },
  missionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginBottom: hp(1.5),
  },
  missionSpecialties: {
    marginTop: hp(1.5),
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  missionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: hp(2),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
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