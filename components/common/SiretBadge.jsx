import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const SiretBadge = ({ verified = false, size = 'small' }) => {
  if (!verified) return null;

  const isSmall = size === 'small';

  return (
    <View style={[styles.container, isSmall && styles.containerSmall]}>
      <Icon
        name="checkCircle"
        size={isSmall ? 12 : 16}
        color={theme.colors.success}
      />
      {!isSmall && <Text style={styles.text}>SIRET Vérifié</Text>}
    </View>
  );
};

export default SiretBadge;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '15',
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(2),
    borderRadius: theme.radius.md,
    gap: wp(1),
  },
  containerSmall: {
    paddingVertical: hp(0.3),
    paddingHorizontal: wp(1.5),
  },
  text: {
    fontSize: hp(1.3),
    color: theme.colors.success,
    fontFamily: theme.fonts.medium,
  },
});
