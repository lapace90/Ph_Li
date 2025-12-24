import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { hp } from '../../helpers/common'
import Loading from './Loading'

const Button = ({
  buttonStyle,
  textStyle,
  title = '',
  onPress = () => {},
  loading = false,
  hasShadow = true,
}) => {
  const { theme } = useTheme();

  const shadowStyle = {
    shadowColor: theme.colors.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  }

  if (loading) {
    return (
      <View style={[
        styles.button, 
        {  borderRadius: theme.radius.xl },
        buttonStyle
      ]}>
        <Loading />
      </View>
    )
  }

  return (
    <Pressable 
      onPress={onPress} 
      style={[
        styles.button, 
        { backgroundColor: theme.colors.primary, borderRadius: theme.radius.xl },
        buttonStyle, 
        hasShadow && shadowStyle
      ]}
    >
      <Text style={[styles.text, { fontWeight: theme.fonts.bold }, textStyle]}>
        {title}
      </Text>
    </Pressable>
  )
}

export default Button

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
})