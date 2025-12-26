import { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import Logo from '../../assets/icons/Logo';
import { theme } from '../../constants/theme';

/**
 * Logo animé avec effet de remplissage
 */
const AnimatedLogo = ({ size = 100 }) => {
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fillAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(fillAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [fillAnim]);

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, size],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Logo grisé en fond */}
      <View style={styles.backgroundLogo}>
        <Logo size={size} crossColor={theme.colors.gray} symbolColor={theme.colors.darkLight} />
      </View>

      {/* Logo coloré avec masque animé (remplissage de bas en haut) */}
      <Animated.View style={[styles.fillMask, { width: size, height: fillHeight }]}>
        <View style={[styles.fillLogo, { height: size }]}>
          <Logo size={size} />
        </View>
      </Animated.View>
    </View>
  );
};

export default AnimatedLogo;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  backgroundLogo: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fillMask: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  fillLogo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
});