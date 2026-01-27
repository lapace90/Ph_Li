import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService, getNotificationIcon, getNotificationColor, shouldAlertForType } from '../../services/notificationService';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const TOAST_DURATION = 4000;

export default function NotificationToast() {
  const { session } = useAuth();
  const router = useRouter();
  const [notification, setNotification] = useState(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const timeoutRef = useRef(null);

  const showToast = useCallback((notif) => {
    setNotification(notif);

    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();

    // Auto-hide
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => hideToast(), TOAST_DURATION);
  }, []);

  const hideToast = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setNotification(null));
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    const unsubscribe = notificationService.subscribeToNotifications(
      session.user.id,
      async (newNotification) => {
        const shouldShow = await shouldAlertForType(newNotification.type);
        if (shouldShow) {
          showToast(newNotification);
        }
      }
    );

    return () => {
      unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [session?.user?.id, showToast]);

  const handlePress = () => {
    hideToast();
    router.push('/(screens)/notifications');
  };

  if (!notification) return null;

  const iconName = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <Pressable style={styles.toast} onPress={handlePress}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Icon name={iconName} size={18} color={iconColor} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
          <Text style={styles.message} numberOfLines={1}>{notification.content}</Text>
        </View>
        <Pressable onPress={hideToast} hitSlop={8}>
          <Icon name="x" size={16} color={theme.colors.textLight} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: hp(6),
    paddingHorizontal: wp(4),
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    paddingHorizontal: wp(4),
    gap: wp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  message: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: 2,
  },
});
