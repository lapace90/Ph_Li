// Boutons et composants pour bloquer des utilisateurs

import { useState } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

/**
 * Bouton pour bloquer/débloquer un utilisateur
 *
 * @param {boolean} isBlocked - L'utilisateur est-il bloqué ?
 * @param {function} onToggle - Callback toggle (retourne une Promise)
 * @param {string} size - 'small' | 'medium' | 'large'
 * @param {boolean} disabled
 * @param {object} style
 */
export const BlockButton = ({
  isBlocked,
  onToggle,
  size = 'medium',
  disabled = false,
  style,
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
        isBlocked && styles.buttonBlocked,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={handlePress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isBlocked ? '#fff' : theme.colors.rose}
        />
      ) : (
        <Icon
          name={isBlocked ? 'user-x' : 'slash'}
          size={iconSize}
          color={isBlocked ? '#fff' : theme.colors.textLight}
        />
      )}
    </Pressable>
  );
};

/**
 * Bouton bloquer avec label
 */
export const BlockButtonWithLabel = ({
  isBlocked,
  onToggle,
  disabled = false,
  style,
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

  return (
    <Pressable
      style={[
        styles.buttonWithLabel,
        isBlocked && styles.buttonWithLabelBlocked,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={handlePress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isBlocked ? '#fff' : theme.colors.rose} />
      ) : (
        <>
          <Icon
            name={isBlocked ? 'user-x' : 'slash'}
            size={18}
            color={isBlocked ? '#fff' : theme.colors.rose}
          />
          <Text style={[
            styles.buttonLabel,
            isBlocked && styles.buttonLabelBlocked,
          ]}>
            {isBlocked ? 'Débloquer' : 'Bloquer'}
          </Text>
        </>
      )}
    </Pressable>
  );
};

/**
 * Item de liste pour la page des utilisateurs bloqués
 */
export const BlockedUserItem = ({
  user,
  onUnblock,
}) => {
  const [loading, setLoading] = useState(false);

  const handleUnblock = async () => {
    setLoading(true);
    try {
      await onUnblock(user.blocked_id);
    } finally {
      setLoading(false);
    }
  };

  const profile = user.blocked_user;

  return (
    <View style={styles.blockedItem}>
      <View style={styles.blockedAvatar}>
        {profile?.photo_url ? (
          <Image source={{ uri: profile.photo_url }} style={styles.avatarImage} />
        ) : (
          <Icon name="user" size={24} color={theme.colors.textLight} />
        )}
      </View>

      <View style={styles.blockedInfo}>
        <Text style={styles.blockedName} numberOfLines={1}>
          {profile?.first_name} {profile?.last_name}
        </Text>
        <Text style={styles.blockedDate}>
          Bloqué le {new Date(user.created_at).toLocaleDateString('fr-FR')}
        </Text>
      </View>

      <Pressable
        style={styles.unblockButton}
        onPress={handleUnblock}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Text style={styles.unblockText}>Débloquer</Text>
        )}
      </Pressable>
    </View>
  );
};

/**
 * Menu d'actions (signaler + bloquer) - pour header de profil
 */
export const UserActionsMenu = ({
  visible,
  onClose,
  onReport,
  onBlock,
  isBlocked,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.actionsMenu}>
      <Pressable style={styles.actionItem} onPress={onReport}>
        <Icon name="flag" size={20} color={theme.colors.rose} />
        <Text style={styles.actionText}>Signaler</Text>
      </Pressable>

      <View style={styles.actionDivider} />

      <Pressable style={styles.actionItem} onPress={onBlock}>
        <Icon name={isBlocked ? 'user-x' : 'slash'} size={20} color={theme.colors.textLight} />
        <Text style={[styles.actionText, isBlocked && styles.actionTextBlocked]}>
          {isBlocked ? 'Débloquer' : 'Bloquer'}
        </Text>
      </Pressable>
    </View>
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
  buttonBlocked: {
    backgroundColor: theme.colors.rose,
    borderColor: theme.colors.rose,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.rose,
    backgroundColor: 'transparent',
  },
  buttonWithLabelBlocked: {
    backgroundColor: theme.colors.rose,
    borderColor: theme.colors.rose,
  },
  buttonLabel: {
    marginLeft: wp(2),
    fontSize: hp(1.6),
    fontFamily: theme.fonts.medium,
    color: theme.colors.rose,
  },
  buttonLabelBlocked: {
    color: '#fff',
  },
  blockedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  blockedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  blockedInfo: {
    flex: 1,
    marginLeft: wp(3),
  },
  blockedName: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  blockedDate: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.regular,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  unblockButton: {
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
  },
  unblockText: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary,
  },
  actionsMenu: {
    position: 'absolute',
    right: wp(4),
    top: hp(6),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minWidth: wp(40),
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
  },
  actionText: {
    marginLeft: wp(3),
    fontSize: hp(1.7),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  actionTextBlocked: {
    color: theme.colors.rose,
  },
  actionDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: wp(2),
  },
});

export default BlockButton;
