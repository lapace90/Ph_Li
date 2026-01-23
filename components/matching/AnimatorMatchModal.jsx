import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import Icon from '../../assets/icons/Icon';
import Animated, { FadeIn, BounceIn, ZoomIn } from 'react-native-reanimated';

const AnimatorMatchModal = ({ visible, match, onMessage, onContinue, userType }) => {
  if (!visible || !match) return null;

  const isAnimator = userType === 'animator';
  
  // Déterminer l'autre partie
  const otherParty = isAnimator 
    ? match.laboratory 
    : { ...match.animator, ...match.animator?.profile };
  
  const otherName = isAnimator 
    ? (match.laboratory?.brand_name || match.laboratory?.company_name)
    : `${otherParty?.first_name || ''} ${otherParty?.last_name?.[0] || ''}.`;

  const otherImage = isAnimator 
    ? match.laboratory?.logo_url 
    : otherParty?.photo_url;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={90} tint="dark" style={styles.overlay}>
        <Animated.View entering={BounceIn.delay(200)} style={styles.container}>
          {/* Confettis / Étoiles */}
          <Animated.View entering={ZoomIn.delay(400)} style={styles.celebration}>
            <Icon name="star" size={40} color={theme.colors.warning} />
          </Animated.View>

          {/* Titre */}
          <Animated.Text entering={FadeIn.delay(300)} style={styles.title}>
            C'est un Match ! 🎉
          </Animated.Text>

          {/* Avatars */}
          <View style={styles.avatarsRow}>
            <View style={styles.avatarContainer}>
              {isAnimator ? (
                <View style={[styles.avatar, commonStyles.centered, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Icon name="user" size={32} color={theme.colors.primary} />
                </View>
              ) : (
                <View style={[styles.avatar, commonStyles.centered, { backgroundColor: theme.colors.secondary + '20' }]}>
                  <Icon name="building" size={32} color={theme.colors.secondary} />
                </View>
              )}
              <Text style={styles.avatarLabel}>Vous</Text>
            </View>

            <Animated.View entering={ZoomIn.delay(500)} style={styles.heartContainer}>
              <Icon name="heart" size={32} color={theme.colors.rose} />
            </Animated.View>

            <View style={styles.avatarContainer}>
              {otherImage ? (
                <Image source={{ uri: otherImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, commonStyles.centered, { backgroundColor: theme.colors.gray + '30' }]}>
                  <Icon name={isAnimator ? 'building' : 'user'} size={32} color={theme.colors.gray} />
                </View>
              )}
              <Text style={styles.avatarLabel} numberOfLines={1}>{otherName}</Text>
            </View>
          </View>

          {/* Mission */}
          {match.mission && (
            <Animated.View entering={FadeIn.delay(600)} style={styles.missionCard}>
              <Icon name="briefcase" size={16} color={theme.colors.primary} />
              <Text style={styles.missionTitle} numberOfLines={2}>{match.mission.title}</Text>
            </Animated.View>
          )}

          {/* Message */}
          <Text style={styles.subtitle}>
            {isAnimator 
              ? `${otherName} est aussi intéressé par votre profil pour cette mission !`
              : `${otherName} est intéressé par votre mission !`
            }
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.messageButton} onPress={onMessage}>
              <Icon name="messageCircle" size={20} color="#fff" />
              <Text style={styles.messageButtonText}>Envoyer un message</Text>
            </Pressable>

            <Pressable style={styles.continueButton} onPress={onContinue}>
              <Text style={styles.continueButtonText}>Continuer à swiper</Text>
            </Pressable>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

export default AnimatorMatchModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xxl,
    padding: hp(4),
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  celebration: {
    position: 'absolute',
    top: -20,
  },
  title: {
    fontSize: hp(3),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginTop: hp(2),
    marginBottom: hp(3),
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(4),
    marginBottom: hp(2),
  },
  avatarContainer: {
    alignItems: 'center',
    gap: hp(1),
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  avatarLabel: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    maxWidth: 100,
    textAlign: 'center',
  },
  heartContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.rose + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: theme.radius.lg,
    marginBottom: hp(2),
  },
  missionTitle: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary,
    flex: 1,
  },
  subtitle: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: hp(3),
    lineHeight: hp(2.4),
  },
  actions: {
    width: '100%',
    gap: hp(1.5),
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.8),
    borderRadius: theme.radius.xl,
  },
  messageButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: '#fff',
  },
  continueButton: {
    paddingVertical: hp(1.5),
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
});