import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image'
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const Avatar = ({ profile, size = 40, style }) => {
  const { theme } = useTheme();

  const avatarSize = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  // Construire le nom d'affichage
  const getDisplayName = () => {
    if (!profile) return '?';
    
    if (profile.show_full_name && profile.first_name) {
      return `${profile.first_name} ${profile.last_name || ''}`.trim();
    }
    
    return profile.username || '?';
  };

  // Extraire les initiales
  const getInitials = () => {
    const name = getDisplayName();
    const parts = name.split(' ').filter(p => p.length > 0);
    
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials();
  const fontSize = size * 0.4;

  // Si avatar_url existe
  if (profile?.avatar_url) {
    return <Image source={{ uri: profile.avatar_url }} style={[avatarSize, style]} />;
  }

  // Sinon afficher les initiales
  return (
    <View style={[styles.placeholder, { backgroundColor: theme.colors.primary }, avatarSize, style]}>
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
};

export default Avatar;

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: 'white',
    fontWeight: '700',
  },
});