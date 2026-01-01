// app/(screens)/myListings.jsx

import { useState } from 'react';
import { View, Text, Pressable, FlatList, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { useMyListings } from '../../hooks/usePharmacyListings';
import {
  getListingTypeLabel,
  getListingTypeColor,
  getListingStatusInfo,
  formatNumber,
} from '../../constants/listingOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';

// TODO: Passer à false en production
const DEV_BYPASS_RPPS_CHECK = true;

export default function MyListings() {
  const router = useRouter();
  const { session, user } = useAuth();
  
  // Vérification : seuls les titulaires avec RPPS vérifié peuvent publier
  const canPublish = DEV_BYPASS_RPPS_CHECK || (user?.user_type === 'titulaire' && user?.rpps_verified);
  
  const { listings, loading, refresh, deleteListing } = useMyListings(session?.user?.id);

  const handleCreateListing = () => {
    if (!canPublish) {
      Alert.alert(
        'Vérification requise',
        'Seuls les titulaires avec un badge RPPS vérifié peuvent publier des annonces.\n\nRendez-vous dans votre profil pour soumettre votre vérification RPPS.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Vérifier mon profil', onPress: () => router.push('/(screens)/rppsVerification') }
        ]
      );
      return;
    }
    router.push('/(screens)/listingCreate');
  };

  const handleListingPress = (listing) => {
    router.push({ pathname: '/(screens)/listingDetail', params: { id: listing.id } });
  };

  const handleDelete = (listing) => {
    Alert.alert(
      'Supprimer l\'annonce',
      `Voulez-vous vraiment supprimer "${listing.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteListing(listing.id);
            if (error) Alert.alert('Erreur', 'Impossible de supprimer');
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getStats = () => {
    const total = listings.length;
    const active = listings.filter(l => l.status === 'active').length;
    const sold = listings.filter(l => l.status === 'sold').length;
    return { total, active, sold };
  };

  const stats = getStats();

  const renderListingCard = ({ item }) => {
    const statusInfo = getListingStatusInfo(item.status);
    const typeColor = getListingTypeColor(item.type);
    const photo = item.photos?.[0];

    return (
      <Pressable style={styles.listingCard} onPress={() => handleListingPress(item)}>
        {/* Photo */}
        <View style={styles.listingPhoto}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.listingImage} contentFit="cover" />
          ) : (
            <View style={styles.listingImagePlaceholder}>
              <Icon name="home" size={24} color={theme.colors.gray} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.listingInfo}>
          <View style={commonStyles.rowBetween}>
            <View style={[commonStyles.badge, { backgroundColor: theme.colors[statusInfo.color] + '15' }]}>
              <Text style={[commonStyles.badgeText, { color: theme.colors[statusInfo.color] }]}>
                {statusInfo.label}
              </Text>
            </View>
            <View style={[commonStyles.badge, { backgroundColor: typeColor + '15' }]}>
              <Text style={[commonStyles.badgeText, { color: typeColor }]}>{getListingTypeLabel(item.type)}</Text>
            </View>
          </View>

          <Text style={styles.listingTitle} numberOfLines={2}>{item.title}</Text>

          <View style={commonStyles.rowGapSmall}>
            <Icon name="mapPin" size={14} color={theme.colors.textLight} />
            <Text style={commonStyles.hint}>
              {item.anonymized ? item.region : `${item.city}, ${item.department}`}
            </Text>
          </View>

          {item.price && (
            <Text style={styles.listingPrice}>
              {formatNumber(item.price)} €{item.negotiable ? ' (nég.)' : ''}
            </Text>
          )}

          <View style={styles.listingFooter}>
            <Text style={commonStyles.hint}>Créée le {formatDate(item.created_at)}</Text>
            <Pressable style={styles.iconButton} onPress={() => handleDelete(item)}>
              <Icon name="trash" size={16} color={theme.colors.rose} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={commonStyles.emptyContainer}>
      <View style={commonStyles.emptyIcon}>
        <Icon name="home" size={40} color={theme.colors.primary} />
      </View>
      <Text style={commonStyles.emptyTitle}>Aucune annonce</Text>
      <Text style={commonStyles.emptyText}>
        Publiez une annonce pour vendre ou louer votre pharmacie
      </Text>
      <Pressable style={[commonStyles.buttonPrimary, commonStyles.rowGapSmall, { marginTop: hp(3) }]} onPress={handleCreateListing}>
        <Icon name="plus" size={18} color="white" />
        <Text style={commonStyles.buttonPrimaryText}>Créer une annonce</Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={commonStyles.headerNoBorder}>
        <Pressable style={commonStyles.headerButton} onPress={() => router.back()}>
          <Icon name="arrowLeft" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={commonStyles.headerTitleLarge}>Mes annonces</Text>
        <Pressable style={[commonStyles.headerButton, styles.addButton, !canPublish && styles.addButtonDisabled]} onPress={handleCreateListing}>
          <Icon name="plus" size={22} color="white" />
        </Pressable>
      </View>

      {/* Banner vérification requise */}
      {!canPublish && (
        <Pressable 
          style={styles.verificationBanner}
          onPress={() => router.push('/(screens)/rppsVerification')}
        >
          <Icon name="alertCircle" size={20} color={theme.colors.warning} />
          <View style={commonStyles.flex1}>
            <Text style={styles.bannerTitle}>Vérification RPPS requise</Text>
            <Text style={styles.bannerText}>Pour publier des annonces, faites vérifier votre profil</Text>
          </View>
          <Icon name="chevronRight" size={18} color={theme.colors.warning} />
        </Pressable>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard value={stats.total} label="Total" />
        <StatCard value={stats.active} label="Actives" color={theme.colors.success} />
        <StatCard value={stats.sold} label="Vendues" color={theme.colors.primary} />
      </View>

      {/* List */}
      {loading ? (
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderListingCard}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={listings.length === 0 ? commonStyles.flex1 : commonStyles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={refresh}
        />
      )}
    </ScreenWrapper>
  );
}

const StatCard = ({ value, label, color }) => (
  <View style={[styles.statCard, color && { backgroundColor: color + '10' }]}>
    <Text style={[styles.statValue, color && { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: theme.colors.primary,
  },
  addButtonDisabled: {
    backgroundColor: theme.colors.gray,
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '15',
    marginHorizontal: wp(5),
    marginBottom: hp(2),
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    gap: wp(3),
  },
  bannerTitle: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.warning,
  },
  bannerText: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    gap: wp(2),
    marginBottom: hp(2),
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: hp(1.1),
    color: theme.colors.textLight,
    marginTop: 2,
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  listingPhoto: {
    width: wp(28),
    height: '100%',
    minHeight: hp(16),
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  listingImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingInfo: {
    flex: 1,
    padding: hp(1.5),
    gap: hp(0.8),
  },
  listingTitle: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  listingPrice: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary,
  },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: hp(0.8),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});