import { StyleSheet, View, Text } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import AnimatedLogo from './AnimatedLogo';

const LoadingScreen = ({ message = 'Chargement...' }) => {
  return (
    <View style={styles.container}>
      <AnimatedLogo size={wp(35)} />
      <Text style={styles.brand}>PharmaLink</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    gap: hp(2),
  },
  brand: {
    fontSize: hp(3),
    fontFamily: theme.fonts.extraBold,
    color: theme.colors.primary,
    marginTop: hp(2),
    paddingHorizontal: wp(5),
    textAlign: 'center',
    width: '100%',
  },
  message: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    paddingHorizontal: wp(5),
    textAlign: 'center',
    width: '100%',
  },
});