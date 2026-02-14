import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { pharmacyListingService } from '../../services/pharmacyListingService';
import {
  getListingTypeLabel,
  getListingTypeColor,
  getListingStatusInfo,
  formatNumber,
} from '../../constants/listingOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import Button from '../../components/common/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ListingDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const isOwner = listing?.user_id === session?.user?.id;

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
      Alert.alert('Erreur', 'Impossible de charger l\'annonce');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!listing) return;
    try {
      const newStatus = listing.status === 'active' ? 'inactive' : 'active';
      await pharmacyListingService.update(id, { status: newStatus });
      setListing(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le statut');
    }
  };

  const handleMarkAsSold = async () => {
    Alert.alert(
      'Marquer comme vendue',
      'Cette pharmacie a-t-elle été vendue ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await pharmacyListingService.update(id, { status: 'sold' });
              setListing(prev => ({ ...prev, status: 'sold' }));
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de mettre à jour');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert('Supprimer l\'annonce', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await pharmacyListingService.delete(id);
            router.back();
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer');
          }
        },
      },
    ]);
  };

  const handleContact = async () => {
    try {
      const { messagingService } = await import('../../services/messagingService');
      const conversation = await messagingService.getOrCreateListingConversation(id, session.user.id);

      router.push({
        pathname: '/(screens)/listingConversation',
        params: {
          listingId: id,
          isNew: conversation.isNew,
        },
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Erreur', error.message || 'Impossible de démarrer la conversation');
    }
  };

  const handlePhotoScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentPhotoIndex(index);
  };

  if (loading) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!listing) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={commonStyles.emptyContainer}>
          <Icon name="alertCircle" size={50} color={theme.colors.rose} />
          <Text style={commonStyles.emptyTitle}>Annonce introuvable</Text>
          <Button title="Retour" onPress={() => router.back()} />
        </View>
      </ScreenWrapper>
    );
  }

  const photos = listing.photos || [];
  const characteristics = listing.characteristics || {};
  const statusInfo = getListingStatusInfo(listing.status);

  const getLocation = () => {
    if (listing.anonymized) return listing.region || 'France';
    return `${listing.city}, ${listing.region}`;
  };

  const getPrice = () => {
    if (!listing.price) return 'Prix sur demande';
    return `${formatNumber(listing.price)} €`;
  };

  const getPriceNegotiable = () => {
    return listing.negotiable ? '(négociable)' : '';
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <ScrollView style={commonStyles.flex1} showsVerticalScrollIndicator={false}>
        {/* Photos Gallery */}
        <View style={styles.gallery}>
          {photos.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handlePhotoScroll}
                scrollEventThrottle={16}
              >
                {photos.map((photo, index) => (
                  <Image key={index} source={{ uri: photo }} style={styles.photo} contentFit="cover" />
                ))}
              </ScrollView>
              {photos.length > 1 && (
                <View style={styles.pagination}>
                  {photos.map((_, index) => (
                    <View key={index} style={[styles.paginationDot, index === currentPhotoIndex && styles.paginationDotActive]} />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noPhoto}>
              <Icon name="home" size={50} color={theme.colors.gray} />
              <Text style={commonStyles.hint}>Aucune photo</Text>
            </View>
          )}

          {/* Back button overlay */}
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Icon name="arrowLeft" size={24} color="white" />
          </Pressable>

          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: getListingTypeColor(listing.type) }]}>
            <Text style={styles.typeBadgeText}>{getListingTypeLabel(listing.type)}</Text>
          </View>

          {/* Anonymous badge */}
          {listing.anonymized && (
            <View style={styles.anonymousBadge}>
              <Icon name="eyeOff" size={14} color="white" />
              <Text style={styles.anonymousBadgeText}>Anonyme</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={commonStyles.card}>
            {isOwner && (
              <View style={[commonStyles.badge, { backgroundColor: theme.colors[statusInfo.color] + '15', alignSelf: 'flex-start', marginBottom: hp(1) }]}>
                <Text style={[commonStyles.badgeText, { color: theme.colors[statusInfo.color] }]}>{statusInfo.label}</Text>
              </View>
            )}

            <Text style={commonStyles.sectionTitle}>{listing.title}</Text>
            
            <View style={[commonStyles.section, { marginTop: hp(1.5), marginBottom: 0 }]}>
              <InfoRow icon="mapPin" text={getLocation()} />
              <InfoRow icon="briefcase" text={`${getPrice()} ${getPriceNegotiable()}`} highlight />
            </View>
          </View>

          {/* Characteristics */}
          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitleSmall}>Caractéristiques</Text>
            
            <View style={styles.statsGrid}>
              {characteristics.surface_m2 && (
                <StatItem icon="home" value={`${characteristics.surface_m2} m²`} label="Surface" />
              )}
              {characteristics.staff_count && (
                <StatItem icon="users" value={characteristics.staff_count} label="Employés" />
              )}
              {characteristics.annual_revenue && (
                <StatItem icon="trendingUp" value={`${formatNumber(characteristics.annual_revenue)} €`} label="CA annuel" />
              )}
            </View>

            {/* Equipements */}
            <View style={[commonStyles.chipsContainerCompact, { marginTop: hp(2) }]}>
              {characteristics.parking && <FeatureChip icon="car" label="Parking" />}
              {characteristics.has_robot && <FeatureChip icon="cpu" label="Robot" />}
              {characteristics.has_lab && <FeatureChip icon="flask" label="Laboratoire" />}
              {characteristics.has_drive && <FeatureChip icon="shoppingBag" label="Drive" />}
            </View>

            {/* Nearby */}
            {characteristics.nearby?.length > 0 && (
              <View style={{ marginTop: hp(2) }}>
                <Text style={commonStyles.hint}>À proximité :</Text>
                <View style={[commonStyles.chipsContainerCompact, { marginTop: hp(0.8) }]}>
                  {characteristics.nearby.map((item, i) => (
                    <View key={i} style={[commonStyles.badge, commonStyles.badgeSecondary]}>
                      <Text style={[commonStyles.badgeText, commonStyles.badgeTextSecondary]}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Description */}
          {listing.description && (
            <View style={commonStyles.card}>
              <Text style={commonStyles.sectionTitleSmall}>Description</Text>
              <Text style={[commonStyles.hint, { lineHeight: hp(2.2) }]}>{listing.description}</Text>
            </View>
          )}

          {/* Owner Actions */}
          {isOwner && (
            <View style={commonStyles.card}>
              <Text style={commonStyles.sectionTitleSmall}>Gérer l'annonce</Text>
              <View style={{ gap: hp(1), marginTop: hp(1) }}>
                <Pressable style={commonStyles.menuItem} onPress={() => router.push({ pathname: '/(screens)/listingEdit', params: { id } })}>
                  <Icon name="edit" size={20} color={theme.colors.text} />
                  <Text style={commonStyles.menuItemLabel}>Modifier l'annonce</Text>
                  <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
                </Pressable>
                
                <Pressable style={commonStyles.menuItem} onPress={handleToggleStatus}>
                  <Icon name={listing.status === 'active' ? 'eyeOff' : 'eye'} size={20} color={theme.colors.text} />
                  <Text style={commonStyles.menuItemLabel}>
                    {listing.status === 'active' ? 'Désactiver' : 'Réactiver'}
                  </Text>
                  <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
                </Pressable>

                {listing.type === 'vente' && listing.status === 'active' && (
                  <Pressable style={commonStyles.menuItem} onPress={handleMarkAsSold}>
                    <Icon name="checkCircle" size={20} color={theme.colors.success} />
                    <Text style={[commonStyles.menuItemLabel, { color: theme.colors.success }]}>Marquer comme vendue</Text>
                    <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
                  </Pressable>
                )}

                <Pressable style={[commonStyles.menuItem, commonStyles.menuItemNoBorder]} onPress={handleDelete}>
                  <Icon name="trash" size={20} color={theme.colors.rose} />
                  <Text style={[commonStyles.menuItemLabel, { color: theme.colors.rose }]}>Supprimer</Text>
                  <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
                </Pressable>
              </View>
            </View>
          )}

          {/* Spacer for footer */}
          <View style={{ height: hp(10) }} />
        </View>
      </ScrollView>

      {/* Contact Footer (non-owner only) */}
      {!isOwner && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, hp(2)) }]}>
          <View>
            <Text style={styles.footerPrice}>{getPrice()}</Text>
            {listing.negotiable && (
              <Text style={styles.footerNegotiable}>{getPriceNegotiable()}</Text>
            )}
          </View>
          <Button title="Contacter" onPress={handleContact} buttonStyle={{ paddingHorizontal: wp(8) }} />
        </View>
      )}
    </ScreenWrapper>
  );
}

const InfoRow = ({ icon, text, highlight }) => (
  <View style={commonStyles.rowGapSmall}>
    <Icon name={icon} size={16} color={highlight ? theme.colors.primary : theme.colors.textLight} />
    <Text style={[commonStyles.hint, highlight && { color: theme.colors.primary, fontFamily: theme.fonts.semiBold }]}>{text}</Text>
  </View>
);

const StatItem = ({ icon, value, label }) => (
  <View style={styles.statItem}>
    <Icon name={icon} size={20} color={theme.colors.primary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={commonStyles.hint}>{label}</Text>
  </View>
);

const FeatureChip = ({ icon, label }) => (
  <View style={[commonStyles.badge, commonStyles.badgePrimary, commonStyles.rowGapSmall]}>
    <Icon name={icon} size={12} color={theme.colors.primary} />
    <Text style={[commonStyles.badgeText, commonStyles.badgeTextPrimary]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  gallery: {
    width: SCREEN_WIDTH,
    height: hp(35),
    backgroundColor: theme.colors.backgroundDark,
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
  backButton: {
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: hp(1.5),
  },
  statItem: {
    alignItems: 'center',
    gap: hp(0.5),
  },
  statValue: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerPrice: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary,
  },
  footerNegotiable: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: hp(0.3),
  },
});