import { View, StyleSheet } from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * ScreenWrapper - Safe area wrapper with theme support
 * 
 * @param {string} bg - Optional background color override
 * @param {object} style - Additional styles
 * @param {boolean} edges - Safe area edges to apply (default: top)
 */
const ScreenWrapper = ({ 
  children, 
  bg, 
  style,
  edges = ['top'],
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const paddingStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bg || theme.colors.background },
        paddingStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default ScreenWrapper;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});