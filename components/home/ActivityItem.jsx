import { StyleSheet, Text, View, Pressable } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const ACTIVITY_CONFIG = {
  match: {
    icon: 'heart',
    color: theme.colors.rose,
    label: 'Nouveau match',
  },
  message: {
    icon: 'messageCircle',
    color: theme.colors.secondary,
    label: 'Message reçu',
  },
  application_viewed: {
    icon: 'eye',
    color: theme.colors.primary,
    label: 'Candidature vue',
  },
  application_accepted: {
    icon: 'checkCircle',
    color: theme.colors.success,
    label: 'Candidature acceptée',
  },
  application_rejected: {
    icon: 'x',
    color: theme.colors.rose,
    label: 'Candidature refusée',
  },
};

const ActivityItem = ({ activity, onPress }) => {
  const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.message;

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: config.color + '15' }]}>
        <Icon name={config.icon} size={20} color={config.color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{config.label}</Text>
        <Text style={styles.title} numberOfLines={1}>{activity.title}</Text>
      </View>
      <Text style={styles.time}>{formatTime(activity.created_at)}</Text>
    </Pressable>
  );
};

export default ActivityItem;

// Ajouter l'icône "eye" dans Icon.jsx
// eye: { lib: 'feather', name: 'eye' },

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: wp(3),
  },
  label: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  title: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginTop: 2,
  },
  time: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },
});