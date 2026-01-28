import { View, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { hp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { theme } from '../../constants/theme';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import Icon from '../../assets/icons/Icon';
import Logo from '../../assets/icons/Logo';

export default function HomeHeader() {
  const router = useRouter();
  const unreadCount = useUnreadNotificationCount();

  return (
    <View style={commonStyles.homeHeader}>
      <Logo size={hp(5)} />
      <View style={commonStyles.homeHeaderButtons}>
        <Pressable style={commonStyles.headerButton} onPress={() => router.push('/(tabs)/messages')}>
          <Icon name="messageCircle" size={22} color={theme.colors.text} />
        </Pressable>
        <Pressable style={commonStyles.headerButton} onPress={() => router.push('/(screens)/notifications')}>
          <Icon name="bell" size={22} color={theme.colors.text} />
          {unreadCount > 0 && (
            <View style={commonStyles.notificationBadge}>
              <Text style={commonStyles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
