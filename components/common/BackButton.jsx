import { StyleSheet, Pressable } from 'react-native'
import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import Icon from '../../assets/icons/index'

const BackButton = ({ size = 26, router, to }) => {
  const { theme } = useTheme();

  return (
    <Pressable 
      onPress={() => to ? router.push(to) : router.back()} 
      style={[styles.button, { borderRadius: theme.radius.sm }]}
    >
      <Icon name="arrowLeft" strokeWidth={2.5} size={size} color={theme.colors.text} />
    </Pressable>
  )
}

export default BackButton

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.07)'
  }
})