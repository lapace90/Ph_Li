import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const ProfileInfoCard = ({ title, items }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.items}>
        {items.map((item, index) => (
          item.value && (
            <View key={index} style={styles.item}>
              <Icon name={item.icon} size={18} color={theme.colors.primary} />
              <View style={styles.itemContent}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemValue}>{item.value}</Text>
              </View>
            </View>
          )
        ))}
      </View>
    </View>
  );
};

export default ProfileInfoCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(1.5),
  },
  items: {
    gap: hp(1.5),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(3),
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  itemValue: {
    fontSize: hp(1.6),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    marginTop: 2,
  },
});