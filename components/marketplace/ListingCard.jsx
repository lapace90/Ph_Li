import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const LISTING_TYPES = {
  vente: { label: 'Vente', color: theme.colors.primary },
  'location-gerance': { label: 'Location-gérance', color: theme.colors.secondary },
  collaboration: { label: 'Collaboration', color: theme.colors.warning },
  association: { label: 'Association', color: theme.colors.success },
};

const ListingCard = ({ listing, onPress }) => {
  const typeConfig = LISTING_TYPES[listing.type] || LISTING_TYPES.vente;
  const characteristics = listing.characteristics || {};

  const formatPrice = () => {
    if (listing.anonymized && !listing.show_exact_price) {
      if (characteristics.price_min && characteristics.price_max) {
        return `${formatNumber(characteristics.price_min)} - ${formatNumber(characteristics.price_max)} €`;
      }
      return 'Prix sur demande';
    }
    return listing.price ? `${formatNumber(listing.price)} €` : 'Prix sur demande';
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const getLocation = () => {
    if (listing.anonymized) {
      return listing.region || 'France';
    }
    return listing.city || listing.region || 'France';
  };

  const photos = listing.photos || [];
  const mainPhoto = photos[0];

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {/* Image */}
      <View style={styles.imageContainer}>
        {mainPhoto ? (
          <Image source={{ uri: mainPhoto }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon name="home" size={30} color={theme.colors.gray} />
          </View>
        )}
        <View style={[styles.typeBadge, { backgroundColor: typeConfig.color }]}>
          <Text style={styles.typeText}>{typeConfig.label}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
        
        <View style={styles.locationRow}>
          <Icon name="mapPin" size={14} color={theme.colors.textLight} />
          <Text style={styles.location}>{getLocation()}</Text>
        </View>

        <View>
          <Text style={styles.price}>{formatPrice()}</Text>
          {listing.negotiable && (
            <Text style={styles.negotiable}>(négociable)</Text>
          )}
        </View>

        {/* Features */}
        <View style={styles.features}>
          {characteristics.surface_m2 && (
            <View style={styles.feature}>
              <Icon name="home" size={12} color={theme.colors.textLight} />
              <Text style={styles.featureText}>{characteristics.surface_m2} m²</Text>
            </View>
          )}
          {characteristics.staff_count && (
            <View style={styles.feature}>
              <Icon name="users" size={12} color={theme.colors.textLight} />
              <Text style={styles.featureText}>{characteristics.staff_count} pers.</Text>
            </View>
          )}
          {characteristics.annual_revenue && (
            <View style={styles.feature}>
              <Icon name="briefcase" size={12} color={theme.colors.textLight} />
              <Text style={styles.featureText}>CA: {formatNumber(characteristics.annual_revenue / 1000)}k€</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default ListingCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  imageContainer: {
    height: hp(15),
    backgroundColor: theme.colors.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: hp(1),
    left: wp(3),
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.4),
    borderRadius: theme.radius.md,
  },
  typeText: {
    fontSize: hp(1.2),
    fontFamily: theme.fonts.semiBold,
    color: 'white',
  },
  content: {
    padding: hp(1.5),
    gap: hp(0.8),
  },
  title: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  location: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  price: {
    fontSize: hp(1.9),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary,
  },
  negotiable: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginTop: hp(0.2),
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(3),
    marginTop: hp(0.5),
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  featureText: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },
});