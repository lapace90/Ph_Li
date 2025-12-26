import { View, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const AVATAR_CONFIG = {
  preparateur: {
    male: { icon: 'briefcase', bg: '#E3F2FD', color: '#1976D2' },
    female: { icon: 'briefcase', bg: '#FCE4EC', color: '#C2185B' },
    other: { icon: 'briefcase', bg: '#E8F5E9', color: '#388E3C' },
  },
  titulaire: {
    male: { icon: 'user', bg: '#FFF3E0', color: '#F57C00' },
    female: { icon: 'user', bg: '#F3E5F5', color: '#7B1FA2' },
    other: { icon: 'user', bg: '#E0F7FA', color: '#0097A7' },
  },
  conseiller: {
    male: { icon: 'users', bg: '#E8EAF6', color: '#3F51B5' },
    female: { icon: 'users', bg: '#FFEBEE', color: '#D32F2F' },
    other: { icon: 'users', bg: '#F1F8E9', color: '#689F38' },
  },
  etudiant: {
    male: { icon: 'book', bg: '#E1F5FE', color: '#0288D1' },
    female: { icon: 'book', bg: '#FFF8E1', color: '#FFA000' },
    other: { icon: 'book', bg: '#F9FBE7', color: '#AFB42B' },
  },
};

const RoleAvatar = ({ role, gender, size = 60, style }) => {
  const config = AVATAR_CONFIG[role]?.[gender] || AVATAR_CONFIG[role]?.other || {
    icon: 'user',
    bg: theme.colors.primaryLight + '20',
    color: theme.colors.primary,
  };

  const iconSize = size * 0.45;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: config.bg,
        },
        style,
      ]}
    >
      <Icon name={config.icon} size={iconSize} color={config.color} />
    </View>
  );
};

export default RoleAvatar;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});