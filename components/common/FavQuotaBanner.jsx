import { View, Text } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

/**
 * Bannière affichant le quota de favoris animateurs.
 * Ne rend rien si favQuota est null ou si la limite est infinie.
 */
export default function FavQuotaBanner({ favQuota }) {
  if (!favQuota || favQuota.limit === Infinity) return null;

  return (
    <View style={styles.banner}>
      <Icon name="star" size={14} color={theme.colors.primary} />
      <Text style={styles.text}>
        Favoris : {favQuota.current}/{favQuota.limit}
      </Text>
      {favQuota.current >= favQuota.limit && (
        <View style={styles.fullBadge}>
          <Text style={styles.fullText}>Plein</Text>
        </View>
      )}
    </View>
  );
}

const styles = {
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    marginHorizontal: wp(5),
    marginBottom: hp(1),
    paddingVertical: hp(0.6),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  text: {
    fontSize: hp(1.3),
    color: theme.colors.text,
    fontWeight: '600',
  },
  fullBadge: {
    backgroundColor: theme.colors.rose + '15',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.2),
    borderRadius: theme.radius.sm,
  },
  fullText: {
    fontSize: hp(1.1),
    color: theme.colors.rose,
    fontWeight: '600',
  },
};
