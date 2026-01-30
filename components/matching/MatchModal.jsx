import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, Animated } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';
import { supabase } from '../../lib/supabase';

const MatchModal = ({
  visible,
  match,
  onClose,
  onMessage,
  onContinue,
  userType = 'candidate', // 'candidate' | 'titulaire' | 'animator' | 'laboratory'
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.1,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(200),
          Animated.spring(heartScale, {
            toValue: 1.3,
            useNativeDriver: true,
          }),
          Animated.spring(heartScale, {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      heartScale.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const [candidateProfile, setCandidateProfile] = useState(null);

  // Charger le profil du candidat si on est titulaire
  useEffect(() => {
    if (visible && userType === 'titulaire' && match?.candidate_id) {
      supabase
        .from('profiles')
        .select('id, first_name, last_name, photo_url, current_city, experience_years')
        .eq('id', match.candidate_id)
        .single()
        .then(({ data }) => setCandidateProfile(data));
    }
  }, [visible, userType, match?.candidate_id]);

  if (!match) return null;

  const isTitulaire = userType === 'titulaire';
  const isLaboratory = userType === 'laboratory';
  const isAnimator = userType === 'animator';

  // Données à afficher selon le type d'utilisateur
  const offer = match.job_offers || match.internship_offers;
  const pharmacyProfile = offer?.profiles;

  // Pour animator_matches (labo/animateur)
  const animatorData = match.animator?.profile || match.animator;
  const missionData = match.mission;
  const laboratoryData = match.laboratory;

  // Déterminer le contenu à afficher
  let displayProfile, displayTitle, displaySubtitle, displayIcon, displayDetails, matchMessage;

  if (isTitulaire) {
    // Titulaire voit le candidat
    displayProfile = candidateProfile;
    displayTitle = candidateProfile ? `${candidateProfile.first_name} ${candidateProfile.last_name?.[0] || ''}.` : 'Candidat';
    displaySubtitle = candidateProfile?.current_city || '';
    displayIcon = 'user';
    displayDetails = candidateProfile?.experience_years != null
      ? { icon: 'award', text: `${candidateProfile.experience_years} an${candidateProfile.experience_years > 1 ? 's' : ''} d'exp.` }
      : null;
    matchMessage = 'Vous pouvez maintenant échanger avec ce candidat !';
  } else if (isLaboratory) {
    // Labo voit l'animateur
    displayProfile = animatorData;
    displayTitle = animatorData ? `${animatorData.first_name} ${animatorData.last_name?.[0] || ''}.` : 'Animateur';
    displaySubtitle = missionData?.title || '';
    displayIcon = 'star';
    displayDetails = match.animator?.average_rating
      ? { icon: 'star', text: `${match.animator.average_rating.toFixed(1)} ★` }
      : null;
    matchMessage = 'Vous pouvez maintenant échanger avec cet animateur !';
  } else if (isAnimator) {
    // Animateur voit la mission/labo
    displayProfile = laboratoryData;
    displayTitle = missionData?.title || 'Mission';
    displaySubtitle = laboratoryData?.company_name || laboratoryData?.brand_name || '';
    displayIcon = 'briefcase';
    displayDetails = missionData?.daily_rate_max
      ? { icon: 'dollarSign', text: `${missionData.daily_rate_max}€/jour` }
      : null;
    matchMessage = 'Vous pouvez maintenant échanger avec ce laboratoire !';
  } else {
    // Candidat voit l'offre
    displayProfile = pharmacyProfile;
    displayTitle = offer?.title || 'Offre';
    displaySubtitle = pharmacyProfile ? `${pharmacyProfile.first_name} ${pharmacyProfile.last_name?.[0]}.` : offer?.city;
    displayIcon = 'briefcase';
    displayDetails = offer?.contract_type ? { icon: 'briefcase', text: offer.contract_type } : null;
    matchMessage = 'Vous pouvez maintenant échanger avec cet employeur !';
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Icône de match */}
          <Animated.View style={[styles.heartContainer, { transform: [{ scale: heartScale }] }]}>
            <View style={styles.heartCircle}>
              <Icon name="heart" size={40} color="white" />
            </View>
          </Animated.View>

          {/* Titre */}
          <Text style={styles.title}>C'est un Match ! 🎉</Text>
          <Text style={styles.subtitle}>
            {isTitulaire || isLaboratory
              ? (isLaboratory ? 'Vous avez matché avec cet animateur' : 'Vous avez matché avec ce candidat')
              : (isAnimator ? 'Vous avez matché avec cette mission' : 'Vous avez matché avec cette offre')}
          </Text>

          {/* Info du match */}
          <View style={styles.offerCard}>
            <View style={styles.offerHeader}>
              {(displayProfile?.photo_url || displayProfile?.logo_url) ? (
                <Image
                  source={{ uri: displayProfile.photo_url || displayProfile.logo_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Icon name={displayIcon} size={24} color={theme.colors.primary} />
                </View>
              )}
              <View style={styles.offerInfo}>
                <Text style={styles.offerTitle} numberOfLines={1}>
                  {displayTitle}
                </Text>
                {displaySubtitle ? (
                  <Text style={styles.offerSubtitle}>{displaySubtitle}</Text>
                ) : null}
              </View>
            </View>
            {displayDetails && (
              <View style={styles.offerDetails}>
                <View style={styles.detailItem}>
                  <Icon name={displayDetails.icon} size={14} color={theme.colors.textLight} />
                  <Text style={styles.detailText}>{displayDetails.text}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Score */}
          {match.match_score && (
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Compatibilité</Text>
              <Text style={styles.scoreValue}>{Math.round(match.match_score)}%</Text>
            </View>
          )}

          {/* Message */}
          <Text style={styles.message}>
            {matchMessage}
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable 
              style={[styles.button, styles.secondaryButton]}
              onPress={onContinue}
            >
              <Text style={styles.secondaryButtonText}>Continuer</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.button, styles.primaryButton]}
              onPress={onMessage}
            >
              <Icon name="messageCircle" size={18} color="white" />
              <Text style={styles.primaryButtonText}>Envoyer un message</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default MatchModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  card: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xxl,
    padding: wp(6),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  heartContainer: {
    marginTop: -hp(6),
    marginBottom: hp(2),
  },
  heartCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.rose,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.rose,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: hp(2.8),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    marginBottom: hp(3),
  },
  offerCard: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginBottom: hp(2),
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginBottom: hp(1.5),
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerInfo: {
    flex: 1,
  },
  offerTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.text,
  },
  offerSubtitle: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
  },
  offerDetails: {
    flexDirection: 'row',
    gap: wp(4),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  detailText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: theme.radius.lg,
    marginBottom: hp(2),
  },
  scoreLabel: {
    fontSize: hp(1.5),
    color: theme.colors.primary,
  },
  scoreValue: {
    fontSize: hp(2),
    fontWeight: '700',
    color: theme.colors.primary,
  },
  message: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: hp(3),
  },
  actions: {
    width: '100%',
    gap: hp(1.5),
  },
  button: {
    width: '100%',
    paddingVertical: hp(1.8),
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(2),
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: hp(1.8),
    fontWeight: '500',
  },
});