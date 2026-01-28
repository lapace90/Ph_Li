// Composant de notation par etoiles (1-5)

import { View, Pressable, Text, StyleSheet } from 'react-native';
import Icon from '../../assets/icons/Icon';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';

const StarRatingInput = ({ label, iconName, value = 0, onChange, readOnly = false }) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        {iconName && <Icon name={iconName} size={16} color={theme.colors.textLight} />}
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => !readOnly && onChange?.(star)}
            hitSlop={4}
            disabled={readOnly}
          >
            <Icon
              name={star <= value ? 'star-filled' : 'star'}
              size={26}
              color={star <= value ? theme.colors.warning : theme.colors.gray}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default StarRatingInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.2),
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    flex: 1,
  },
  label: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  starsRow: {
    flexDirection: 'row',
    gap: wp(1),
  },
});
