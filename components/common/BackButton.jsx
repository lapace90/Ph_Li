import { StyleSheet, Pressable } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from '../../assets/icons/Icon';
import { theme } from '../../constants/theme';

const BackButton = ({ size = 26, router }) => {
  const navigation = useNavigation();
  
  // Ne pas afficher si on ne peut pas revenir en arrière
  if (!navigation.canGoBack()) {
    return null;
  }

  return (
    <Pressable 
      onPress={() => router.back()} 
      style={[styles.button, { borderRadius: theme.radius.sm }]}
    >
      <Icon name="arrowLeft" strokeWidth={2.5} size={size} color={theme.colors.text} />
    </Pressable>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.07)',
  },
});