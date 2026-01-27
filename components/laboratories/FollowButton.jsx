// Bouton suivre / ne plus suivre un laboratoire

import { useState, useEffect, useCallback } from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { laboratoryPostService } from '../../services/laboratoryPostService';
import Icon from '../../assets/icons/Icon';

export default function FollowButton({ laboratoryId, size = 'default', onToggle }) {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const checkFollowing = useCallback(async () => {
    if (!userId || !laboratoryId) {
      setLoading(false);
      return;
    }
    try {
      const result = await laboratoryPostService.isFollowing(userId, laboratoryId);
      setFollowing(result);
    } catch (err) {
      console.error('Erreur check follow:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, laboratoryId]);

  useEffect(() => {
    checkFollowing();
  }, [checkFollowing]);

  const handleToggle = async () => {
    if (!userId || toggling) return;
    setToggling(true);
    try {
      if (following) {
        await laboratoryPostService.unfollowLab(userId, laboratoryId);
        setFollowing(false);
      } else {
        await laboratoryPostService.followLab(userId, laboratoryId);
        setFollowing(true);
      }
      onToggle?.(!following);
    } catch (err) {
      console.error('Erreur toggle follow:', err);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <Pressable style={[styles.button, size === 'small' && styles.buttonSmall]} disabled>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </Pressable>
    );
  }

  const isSmall = size === 'small';

  return (
    <Pressable
      style={[
        styles.button,
        isSmall && styles.buttonSmall,
        following && styles.buttonFollowing,
      ]}
      onPress={handleToggle}
      disabled={toggling}
    >
      {toggling ? (
        <ActivityIndicator size="small" color={following ? theme.colors.primary : '#FFFFFF'} />
      ) : following ? (
        <>
          <Icon name="check" size={isSmall ? 12 : 14} color={theme.colors.primary} />
          <Text style={[styles.text, styles.textFollowing, isSmall && styles.textSmall]}>Suivi</Text>
        </>
      ) : (
        <>
          <Icon name="plus" size={isSmall ? 12 : 14} color="#FFFFFF" />
          <Text style={[styles.text, isSmall && styles.textSmall]}>Suivre</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1),
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.lg,
    minWidth: wp(22),
  },
  buttonSmall: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    minWidth: wp(18),
    borderRadius: theme.radius.md,
  },
  buttonFollowing: {
    backgroundColor: theme.colors.primary + '15',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  text: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
    color: '#FFFFFF',
  },
  textSmall: {
    fontSize: hp(1.2),
  },
  textFollowing: {
    color: theme.colors.primary,
  },
});
