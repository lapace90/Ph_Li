import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, Animated } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const MatchModal = ({
  visible,
  match,
  onClose,
  onMessage,
  onContinue,
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

  if (!match) return null;

  const offer = match.job_offers || match.internship_offers;
  const pharmacyProfile = offer?.profiles;

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
            Vous avez matché avec cette offre
          </Text>

          {/* Info de l'offre */}
          <View style={styles.offerCard}>
            <View style={styles.offerHeader}>
              {pharmacyProfile?.photo_url ? (
                <Image 
                  source={{ uri: pharmacyProfile.photo_url }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Icon name="briefcase" size={24} color={theme.colors.primary} />
                </View>
              )}
              <View style={styles.offerInfo}>
                <Text style={styles.offerTitle} numberOfLines={1}>
                  {offer?.title || 'Offre'}
                </Text>
                <Text style={styles.offerSubtitle}>
                  {pharmacyProfile 
                    ? `${pharmacyProfile.first_name} ${pharmacyProfile.last_name?.[0]}.`
                    : offer?.city
                  }
                </Text>
              </View>
            </View>
            <View style={styles.offerDetails}>
              <View style={styles.detailItem}>
                <Icon name="mapPin" size={14} color={theme.colors.textLight} />
                <Text style={styles.detailText}>{offer?.city}</Text>
              </View>
              {offer?.contract_type && (
                <View style={styles.detailItem}>
                  <Icon name="briefcase" size={14} color={theme.colors.textLight} />
                  <Text style={styles.detailText}>{offer.contract_type}</Text>
                </View>
              )}
            </View>
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
            Vous pouvez maintenant échanger avec cet employeur !
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