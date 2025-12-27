import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { pharmacyListingService } from '../../services/pharmacyListingService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LISTING_TYPES = {
  vente: { label: 'Vente', color: theme.colors.primary },
  'location-gerance': { label: 'Location-gérance', color: theme.colors.secondary },
  collaboration: { label: 'Collaboration', color: theme.colors.warning },
  association: { label: 'Association', color: theme.colors.success },
};

export default function ListingDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { session } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const data = await pharmacyListingService.getById(id);
      setListing(data);
    } catch (error) {
      console.error('Error loading listing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!listing) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={styles.errorContainer}>
          <Icon name="alertCircle" size={60} color={theme.colors.gray} />
          <Text style={styles.errorText}>Annonce introuvable</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }

  const typeConfig = LISTING_TYPES[listing.type] || LISTING_TYPES.vente;
  const isOwner = session?.user?.id === listing.user_id;
  const photos = listing.photos || [];
  const characteristics = listing.characteristics || {};

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatPrice = () => {
    if (listing.anonymized) {
      if (characteristics.price_min && characteristics.price_max) {
        return `${formatNumber(characteristics.price_min)} - ${formatNumber(characteristics.price_max)} €`;
      }
      return 'Prix sur demande';
    }
    return listing.price ? `${formatNumber(listing.price)} €` : 'Prix sur demande';
  };

  const getLocation = () => {
    if (listing.anonymized) {
      return listing.region || 'France';
    }
    return listing.city ? `${listing.city}${listing.postal_code ? ` (${listing.postal_code})` : ''}` : listing.region || 'France';
  };

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentPhotoIndex(index);
  };

  const handleContact = () => {
    // TODO: Implement messaging
    console.log('Contact seller');
  };

  const handleEdit = () => {
    router.push({
      pathname: '/(screens)/listingEdit',
      params: { id: listing.id },
    });
  };

  return (
    <ScreenWrapper bg={theme.colors.background} edges={[]}>
      <StatusBar style="light" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Photos Carousel */}
        <View style={styles.photosContainer}>
          {photos.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                {photos.map((photo, index) => (
                  <Image
                    key={index}
                    source={{ uri: photo }}
                    style={styles.photo}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
              {photos.length > 1 && (
                <View style={styles.pagination}>
                  {photos.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        currentPhotoIndex === index && styles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noPhoto}>
              <Icon name="home" size={60} color={theme.colors.gray} />
              <Text style={styles.noPhotoText}>Aucune photo</Text>
            </View>
          )}

          {/* Back button overlay */}
          <Pressable style={styles.backOverlay} onPress={() => router.back()}>
            <Icon name="arrowLeft" size={24} color="white" />
          </Pressable>

          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.color }]}>
            <Text style={styles.typeBadgeText}>{typeConfig.label}</Text>
          </View>

          {/* Anonymous badge */}
          {listing.anonymized && (
            <View style={styles.anonymousBadge}>
              <Icon name="lock" size={14} color="white" />
              <Text style={styles.anonymousBadgeText}>Anonyme</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Price */}
          <View style={styles.header}>
            <Text style={styles.title}>{listing.title}</Text>
            <Text style={styles.price}>{formatPrice()}</Text>
            {listing.negotiable && (
              <Text style={styles.negotiable}>Prix négociable</Text>
            )}
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <Icon name="mapPin" size={18} color={theme.colors.primary} />
            <Text style={styles.location}>{getLocation()}</Text>
          </View>

          {/* Characteristics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caractéristiques</Text>
            <View style={styles.characteristicsGrid}>
              {characteristics.surface_m2 && (
                <CharacteristicItem
                  icon="home"
                  label="Surface"
                  value={`${characteristics.surface_m2} m²`}
                />
              )}
              {characteristics.staff_count && (
                <CharacteristicItem
                  icon="users"
                  label="Équipe"
                  value={`${characteristics.staff_count} personnes`}
                />
              )}
              {characteristics.annual_revenue && (
                <CharacteristicItem
                  icon="briefcase"
                  label="CA annuel"
                  value={`${formatNumber(characteristics.annual_revenue)} €`}
                />
              )}
              {characteristics.annual_profit && (
                <CharacteristicItem
                  icon="star"
                  label="Bénéfice"
                  value={`${formatNumber(characteristics.annual_profit)} €`}
                />
              )}
              {characteristics.opening_hours && (
                <CharacteristicItem
                  icon="clock"
                  label="Horaires"
                  value={characteristics.opening_hours}
                />
              )}
              {characteristics.parking !== undefined && (
                <CharacteristicItem
                  icon="map"
                  label="Parking"
                  value={characteristics.parking ? 'Oui' : 'Non'}
                />
              )}
            </View>
          </View>

          {/* Equipment */}
          {(characteristics.has_robot || characteristics.has_lab || characteristics.has_drive) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Équipements</Text>
              <View style={styles.equipmentRow}>
                {characteristics.has_robot && (
                  <View style={styles.equipmentBadge}>
                    <Text style={styles.equipmentText}>🤖 Robot</Text>
                  </View>
                )}
                {characteristics.has_lab && (
                  <View style={styles.equipmentBadge}>
                    <Text style={styles.equipmentText}>🔬 Laboratoire</Text>
                  </View>
                )}
                {characteristics.has_drive && (
                  <View style={styles.equipmentBadge}>
                    <Text style={styles.equipmentText}>🚗 Drive</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Nearby */}
          {characteristics.nearby && characteristics.nearby.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>À proximité</Text>
              <View style={styles.tagsRow}>
                {characteristics.nearby.map((item, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          {listing.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          )}

          {/* Anonymous info */}
          {listing.anonymized && !isOwner && (
            <View style={styles.anonymousInfo}>
              <Icon name="info" size={20} color={theme.colors.secondary} />
              <Text style={styles.anonymousInfoText}>
                Cette annonce est anonyme. Certaines informations seront dévoilées après votre premier contact avec le vendeur.
              </Text>
            </View>
          )}

          {/* Spacer for button */}
          <View style={{ height: hp(10) }} />
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionBar}>
        {isOwner ? (
          <Pressable style={styles.editButton} onPress={handleEdit}>
            <Icon name="edit" size={20} color="white" />
            <Text style={styles.actionButtonText}>Modifier l'annonce</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.contactButton} onPress={handleContact}>
            <Icon name="messageCircle" size={20} color="white" />
            <Text style={styles.actionButtonText}>Contacter le vendeur</Text>
          </Pressable>
        )}
      </View>
    </ScreenWrapper>
  );
}

const CharacteristicItem = ({ icon, label, value }) => (
  <View style={styles.characteristicItem}>
    <Icon name={icon} size={20} color={theme.colors.primary} />
    <View>
      <Text style={styles.characteristicLabel}>{label}</Text>
      <Text style={styles.characteristicValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(2),
  },
  errorText: {
    fontSize: hp(2),
    color: theme.colors.textLight,
  },
  backButton: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
  },
  backButtonText: {
    color: 'white',
    fontFamily: theme.fonts.semiBold,
  },
  photosContainer: {
    height: hp(35),
    backgroundColor: theme.colors.dark,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: hp(35),
  },
  noPhoto: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(1),
  },
  noPhotoText: {
    color: theme.colors.gray,
    fontSize: hp(1.6),
  },
  pagination: {
    position: 'absolute',
    bottom: hp(2),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(2),
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  paginationDotActive: {
    backgroundColor: 'white',
    width: 20,
  },
  backOverlay: {
    position: 'absolute',
    top: hp(6),
    left: wp(4),
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: hp(6),
    right: wp(4),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: theme.radius.lg,
  },
  typeBadgeText: {
    color: 'white',
    fontFamily: theme.fonts.semiBold,
    fontSize: hp(1.4),
  },
  anonymousBadge: {
    position: 'absolute',
    bottom: hp(2),
    right: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.md,
  },
  anonymousBadgeText: {
    color: 'white',
    fontSize: hp(1.3),
  },
  content: {
    padding: wp(5),
    gap: hp(2),
  },
  header: {
    gap: hp(0.5),
  },
  title: {
    fontSize: hp(2.4),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  price: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary,
  },
  negotiable: {
    fontSize: hp(1.4),
    color: theme.colors.success,
    fontFamily: theme.fonts.medium,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  location: {
    fontSize: hp(1.7),
    color: theme.colors.text,
  },
  section: {
    gap: hp(1.5),
  },
  sectionTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  characteristicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hp(1.5),
  },
  characteristicItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: theme.colors.card,
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  characteristicLabel: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  characteristicValue: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  equipmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  equipmentBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.lg,
  },
  equipmentText: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  tag: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: theme.radius.md,
  },
  tagText: {
    fontSize: hp(1.4),
    color: theme.colors.text,
  },
  description: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    lineHeight: hp(2.4),
  },
  anonymousInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(3),
    backgroundColor: theme.colors.secondary + '10',
    padding: hp(2),
    borderRadius: theme.radius.lg,
  },
  anonymousInfoText: {
    flex: 1,
    fontSize: hp(1.5),
    color: theme.colors.text,
    lineHeight: hp(2.2),
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp(5),
    paddingBottom: hp(4),
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(2),
    borderRadius: theme.radius.xl,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    backgroundColor: theme.colors.secondary,
    paddingVertical: hp(2),
    borderRadius: theme.radius.xl,
  },
  actionButtonText: {
    color: 'white',
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
  },
});