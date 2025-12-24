import { StyleSheet, TextInput, View } from 'react-native'
import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { hp } from '../../helpers/common'

const Input = (props) => {
  const { theme } = useTheme();

  return (
    <View style={[
      styles.container, 
      { 
        borderColor: theme.colors.text,
        borderRadius: theme.radius.xxl,
      },
      props.containerStyles
    ]}>
      {props.icon && props.icon}
      <TextInput
        style={{ flex: 1, color: theme.colors.text }}
        placeholderTextColor={theme.colors.textLight}
        ref={props.inputRef}
        {...props}
      />
    </View>
  )
}

export default Input

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: hp(7.2),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.4,
    borderCurve: 'continuous',
    paddingHorizontal: 18,
    gap: 12
  }
})