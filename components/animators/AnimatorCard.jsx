// Carte animateur pour les labos (candidatures, favoris)

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';
import RoleAvatar from '../common/RoleAvatar';

/**
 * Carte animateur pour liste de candidatures
 */
export const AnimatorCandidateCard = ({ 
  animator, 
  profile,
  application,
  onPress,
  onFavoritePress,
  isFavorite = false,
}) => {
  const displayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name?.charAt(0) || ''}.`
    : 'Animateur';

  const formatRate = () => {
    if (animator?.daily_rate_min && animator?.daily_rate_max) {
      if (animator.daily_rate_min === animator.daily_rate_max) {
        return `${animator.daily_rate_min}€/jour`;
      }
      return `${animator.daily_rate_min}-${animator.daily_rate_max}€/jour`;
    }
    return animator?.daily_rate_min ? `${animator.daily_rate_min}€/jour` : null;
  };

  return (
    <Pressable style={styles.candidateCard} onPress={onPress}>
      {/* Avatar */}
      {profile?.photo_url ? (
        <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
      ) : (
        <RoleAvatar role="animateur" gender={profile?.gender} size={56} />
      )}

      {/* Contenu */}
      <View style={styles.cardContent}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          {isFavorite && (
            <Icon name="star-filled" size={14} color={theme.colors.primary} />
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {animator?.average_rating && (
            <View style={styles.statItem}>
              <Icon name="star" size={12} color={theme.colors.warning} />
              <Text style={styles.statText}>{animator.average_rating.toFixed(1)}</Text>
            </View>
          )}
          {animator?.missions_completed > 0 && (
            <View style={styles.statItem}>
              <Icon name="briefcase" size={12} color={theme.colors.textLight} />
              <Text style={styles.statText}>{animator.missions_completed} missions</Text>
            </View>
          )}
        </View>

        {/* Spécialités */}
        {animator?.animation_specialties?.length > 0 && (
          <Text style={styles.specialties} numberOfLines={1}>
            {animator.animation_specialties.slice(0, 3).join(' • ')}
          </Text>
        )}

        {/* Tarif et localisation */}
        <View style={styles.metaRow}>
          {formatRate() && (
            <Text style={styles.rate}>{formatRate()}</Text>
          )}
          {profile?.current_city && (
            <View style={styles.locationItem}>
              <Icon name="mapPin" size={12} color={theme.colors.textLight} />
              <Text style={styles.locationText}>{profile.current_city}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable 
          style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
          onPress={onFavoritePress}
        >
          <Icon 
            name={isFavorite ? 'star-filled' : 'star'} 
            size={18} 
            color={isFavorite ? '#fff' : theme.colors.primary} 
          />
        </Pressable>
        <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
      </View>
    </Pressable>
  );
};

/**
 * Carte animateur compacte (pour favoris)
 */
export const AnimatorCompactCard = ({ 
  animator, 
  profile,
  onPress,
  onRemove,
  showRemove = true,
}) => {
  const displayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name?.charAt(0) || ''}.`
    : 'Animateur';

  return (
    <Pressable style={styles.compactCard} onPress={onPress}>
      {/* Avatar */}
      {profile?.photo_url ? (
        <Image source={{ uri: profile.photo_url }} style={styles.compactAvatar} />
      ) : (
        <RoleAvatar role="animateur" gender={profile?.gender} size={48} />
      )}

      {/* Contenu */}
      <View style={styles.compactContent}>
        <Text style={styles.compactName} numberOfLines={1}>{displayName}</Text>
        
        <View style={styles.compactMeta}>
          {animator?.average_rating && (
            <View style={styles.statItem}>
              <Icon name="star" size={12} color={theme.colors.warning} />
              <Text style={styles.statText}>{animator.average_rating.toFixed(1)}</Text>
            </View>
          )}
          {profile?.current_city && (
            <Text style={styles.compactLocation}>{profile.current_city}</Text>
          )}
        </View>
      </View>

      {/* Bouton supprimer */}
      {showRemove ? (
        <Pressable style={styles.removeButton} onPress={onRemove}>
          <Icon name="star-filled" size={18} color={theme.colors.primary} />
        </Pressable>
      ) : (
        <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
      )}
    </Pressable>
  );
};

/**
 * Badge disponibilité
 */
export const AvailabilityBadge = ({ available, size = 'medium' }) => {
  const isSmall = size === 'small';
  
  return (
    <View style={[
      styles.availabilityBadge,
      available ? styles.availableNow : styles.notAvailable,
      isSmall && styles.availabilityBadgeSmall,
    ]}>
      <View style={[
        styles.availabilityDot,
        available ? styles.dotAvailable : styles.dotNotAvailable,
      ]} />
      {!isSmall && (
        <Text style={[
          styles.availabilityText,
          available ? styles.textAvailable : styles.textNotAvailable,
        ]}>
          {available ? 'Disponible' : 'Indisponible'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // ==========================================
  // CANDIDATE CARD
  // ==========================================
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  cardContent: {
    flex: 1,
    marginLeft: wp(3),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  name: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginTop: hp(0.5),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  statText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  specialties: {
    fontSize: hp(1.3),
    color: theme.colors.primary,
    marginTop: hp(0.5),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginTop: hp(0.5),
  },
  rate: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.success,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  locationText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  favoriteButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  // ==========================================
  // COMPACT CARD
  // ==========================================
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  compactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  compactContent: {
    flex: 1,
    marginLeft: wp(3),
  },
  compactName: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginTop: hp(0.3),
  },
  compactLocation: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ==========================================
  // AVAILABILITY BADGE
  // ==========================================
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.4),
    borderRadius: theme.radius.md,
    gap: wp(1),
  },
  availabilityBadgeSmall: {
    paddingHorizontal: wp(1.5),
    paddingVertical: hp(0.3),
  },
  availableNow: {
    backgroundColor: theme.colors.success + '15',
  },
  notAvailable: {
    backgroundColor: theme.colors.gray + '30',
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotAvailable: {
    backgroundColor: theme.colors.success,
  },
  dotNotAvailable: {
    backgroundColor: theme.colors.gray,
  },
  availabilityText: {
    fontSize: hp(1.2),
    fontFamily: theme.fonts.medium,
  },
  textAvailable: {
    color: theme.colors.success,
  },
  textNotAvailable: {
    color: theme.colors.textLight,
  },
});

export default {
  AnimatorCandidateCard,
  AnimatorCompactCard,
  AvailabilityBadge,
};