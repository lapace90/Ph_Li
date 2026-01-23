// Bouton favori réutilisable (⭐ ou 🔖)

import { Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

/**
 * Bouton favori (étoile)
 * Utilisé pour : Titulaire→Candidat, Labo→Animateur, Animateur→Labo
 */
export const StarFavoriteButton = ({ 
  isFavorite, 
  onToggle, 
  size = 'medium',
  style,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading || disabled) return;
    setLoading(true);
    try {
      await onToggle();
    } finally {
      setLoading(false);
    }
  };

  const sizes = {
    small: { button: 32, icon: 16 },
    medium: { button: 40, icon: 20 },
    large: { button: 48, icon: 24 },
  };

  const { button: buttonSize, icon: iconSize } = sizes[size] || sizes.medium;

  return (
    <Pressable
      style={[
        styles.button,
        { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
        isFavorite && styles.buttonActive,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={handlePress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isFavorite ? '#fff' : theme.colors.primary} />
      ) : (
        <Icon
          name={isFavorite ? 'star-filled' : 'star'}
          size={iconSize}
          color={isFavorite ? '#fff' : theme.colors.primary}
        />
      )}
    </Pressable>
  );
};

/**
 * Bouton bookmark (signet)
 * Utilisé pour : Candidat→Offre, Animateur→Mission, Tous→Pharmacie
 */
export const BookmarkFavoriteButton = ({ 
  isFavorite, 
  onToggle, 
  size = 'medium',
  style,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading || disabled) return;
    setLoading(true);
    try {
      await onToggle();
    } finally {
      setLoading(false);
    }
  };

  const sizes = {
    small: { button: 32, icon: 16 },
    medium: { button: 40, icon: 20 },
    large: { button: 48, icon: 24 },
  };

  const { button: buttonSize, icon: iconSize } = sizes[size] || sizes.medium;

  return (
    <Pressable
      style={[
        styles.button,
        { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
        isFavorite && styles.buttonActiveSecondary,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={handlePress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isFavorite ? '#fff' : theme.colors.secondary} />
      ) : (
        <Icon
          name={isFavorite ? 'bookmark-filled' : 'bookmark'}
          size={iconSize}
          color={isFavorite ? '#fff' : theme.colors.secondary}
        />
      )}
    </Pressable>
  );
};

/**
 * Badge favori (petit indicateur sur une carte)
 */
export const FavoriteBadge = ({ visible, style }) => {
  if (!visible) return null;

  return (
    <Icon
      name="star-filled"
      size={14}
      color={theme.colors.primary}
      style={[styles.badge, style]}
    />
  );
};

/**
 * Badge "Labo favori" sur une carte mission
 */
export const FavoriteLaboBadge = ({ visible, style }) => {
  if (!visible) return null;

  return (
    <Icon
      name="star-filled"
      size={12}
      color={theme.colors.warning}
      style={[styles.laboBadge, style]}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  buttonActiveSecondary: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  laboBadge: {
    marginLeft: wp(1),
  },
});

export default {
  StarFavoriteButton,
  BookmarkFavoriteButton,
  FavoriteBadge,
  FavoriteLaboBadge,
};