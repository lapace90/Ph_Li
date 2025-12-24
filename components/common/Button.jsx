import { Pressable, StyleSheet, Text, ActivityIndicator } from 'react-native';
import React from 'react';
import { theme } from '../../constants/theme';
import { hp } from '../../helpers/common';

const Button = ({
  buttonStyle,
  textStyle,
  title = '',
  onPress = () => {},
  loading = false,
  hasShadow = true,
}) => {
  const shadowStyle = {
    shadowColor: theme.colors.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  };

  return (
    <Pressable 
      onPress={onPress} 
      style={[
        styles.button, 
        { 
          backgroundColor: theme.colors.primary, 
          borderRadius: theme.radius.xl 
        },
        buttonStyle, 
        hasShadow && shadowStyle
      ]}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Text style={[styles.text, { fontWeight: theme.fonts.bold }, textStyle]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};

export default Button;

const styles = StyleSheet.create({
  button: {
    height: hp(6.6),
    justifyContent: 'center',
    alignItems: 'center',
    borderCurve: 'continuous',
  },
  text: {
    fontSize: hp(2.5),
    color: 'white',
  }
});