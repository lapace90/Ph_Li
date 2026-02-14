import { View, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { hp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { theme } from '../../constants/theme';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { useUnreadCount } from '../../hooks/useMessaging';
import Icon from '../../assets/icons/Icon';
import Logo from '../../assets/icons/Logo';

export default function HomeHeader() {
  const router = useRouter();
  const unreadNotificationCount = useUnreadNotificationCount();
  const unreadMessageCount = useUnreadCount();

  return (
    <View style={commonStyles.homeHeader}>
      <Logo size={hp(5)} />
      <View style={commonStyles.homeHeaderButtons}>
        <Pressable style={commonStyles.headerButton} onPress={() => router.push('/(tabs)/messages')}>
          <Icon name="messageCircle" size={22} color={theme.colors.text} />
          {unreadMessageCount > 0 && (
            <View style={commonStyles.notificationBadge}>
              <Text style={commonStyles.notificationBadgeText}>
                {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
              </Text>
            </View>
          )}
        </Pressable>
        <Pressable style={commonStyles.headerButton} onPress={() => router.push('/(screens)/notifications')}>
          <Icon name="bell" size={22} color={theme.colors.text} />
          {unreadNotificationCount > 0 && (
            <View style={commonStyles.notificationBadge}>
              <Text style={commonStyles.notificationBadgeText}>
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
