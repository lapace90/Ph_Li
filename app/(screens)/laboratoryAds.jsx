// app/(screens)/laboratoryAds.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  Alert, StyleSheet, Modal, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService } from '../../services/subscriptionService';
import { laboratoryAdsService } from '../../services/laboratoryAdsService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';

// ============================================
// CONSTANTES
// ============================================

const AD_TYPES = {
  featured: {
    key: 'featured',
    title: 'Labos a la une',
    description: 'Visible dans le carrousel de la page d\'accueil',
    icon: 'star',
    color: theme.colors.warning,
    basePrice: 50,
    firstPurchasePrice: 25,
    durationWeeks: 1,
  },
  sponsored_card: {
    key: 'sponsored_card',
    title: 'Card sponsorisee',
    description: 'Apparait en priorite dans le swipe animateurs',
    icon: 'zap',
    color: theme.colors.primary,
    basePrice: 80,
    firstPurchasePrice: 40,
    durationWeeks: 1,
  },
  priority_placement: {
    key: 'priority_placement',
    title: 'Placement prioritaire',
    description: 'Vos missions en haut des resultats de recherche',
    icon: 'arrowUp',
    color: theme.colors.success,
    basePrice: 30,
    firstPurchasePrice: 15,
    durationWeeks: 1,
  },
};

// ============================================
// SOUS-COMPOSANTS
// ============================================

// Section quotas inclus dans l'abonnement
const IncludedAdsSection = ({ tier, quotas, onUseIncluded }) => {
  if (tier === 'free' || tier === 'starter') {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inclus dans votre forfait</Text>
        <View style={styles.emptyIncluded}>
          <Icon name="lock" size={24} color={theme.colors.textLight} />
          <Text style={styles.emptyIncludedText}>
            Passez a Pro ou Business pour beneficier de publicites incluses
          </Text>
        </View>
      </View>
    );
  }

  const includedItems = [];

  if (tier === 'pro') {
    includedItems.push({
      type: 'featured',
      label: '2 semaines "A la une"',
      used: quotas?.sponsoredWeeks?.used || 0,
      max: quotas?.sponsoredWeeks?.max || 2,
    });
    includedItems.push({
      type: 'sponsored_card',
      label: '2 cartes sponsorisees',
      used: quotas?.sponsoredCards?.used || 0,
      max: quotas?.sponsoredCards?.max || 2,
    });
  } else if (tier === 'business') {
    includedItems.push({
      type: 'featured',
      label: '4 semaines "A la une"',
      used: quotas?.sponsoredWeeks?.used || 0,
      max: quotas?.sponsoredWeeks?.max || 4,
    });
    includedItems.push({
      type: 'sponsored_card',
      label: '2 cartes sponsorisees',
      used: quotas?.sponsoredCards?.used || 0,
      max: quotas?.sponsoredCards?.max || 2,
    });
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Inclus dans votre forfait</Text>
      <View style={styles.includedList}>
        {includedItems.map((item, idx) => {
          const remaining = item.max - item.used;
          const adType = AD_TYPES[item.type];
          return (
            <View key={idx} style={styles.includedCard}>
              <View style={[styles.includedIcon, { backgroundColor: adType.color + '15' }]}>
                <Icon name={adType.icon} size={20} color={adType.color} />
              </View>
              <View style={styles.includedInfo}>
                <Text style={styles.includedLabel}>{item.label}</Text>
                <Text style={styles.includedUsage}>
                  {remaining > 0 ? `${remaining} restant(s)` : 'Quota epuise'}
                </Text>
              </View>
              <Pressable
                style={[
                  styles.useButton,
                  remaining <= 0 && styles.useButtonDisabled,
                ]}
                onPress={() => remaining > 0 && onUseIncluded(item.type)}
                disabled={remaining <= 0}
              >
                <Text style={[
                  styles.useButtonText,
                  remaining <= 0 && styles.useButtonTextDisabled,
                ]}>
                  {remaining > 0 ? 'Utiliser' : 'Epuise'}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Card d'achat de publicite
const AdPurchaseCard = ({ adType, isFirstPurchase, onPurchase, loading }) => {
  const price = isFirstPurchase ? adType.firstPurchasePrice : adType.basePrice;
  const hasDiscount = isFirstPurchase && adType.firstPurchasePrice < adType.basePrice;

  return (
    <View style={styles.adCard}>
      {hasDiscount && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountBadgeText}>-50% Premier achat !</Text>
        </View>
      )}

      <View style={styles.adCardHeader}>
        <View style={[styles.adCardIcon, { backgroundColor: adType.color + '15' }]}>
          <Icon name={adType.icon} size={24} color={adType.color} />
        </View>
        <View style={styles.adCardTitleRow}>
          <Text style={styles.adCardTitle}>{adType.title}</Text>
          <Text style={styles.adCardDuration}>{adType.durationWeeks} semaine</Text>
        </View>
      </View>

      <Text style={styles.adCardDescription}>{adType.description}</Text>

      <View style={styles.adCardFooter}>
        <View style={styles.priceContainer}>
          {hasDiscount && (
            <Text style={styles.priceOriginal}>{adType.basePrice}{'\u20AC'}</Text>
          )}
          <Text style={styles.priceAmount}>{price}{'\u20AC'}</Text>
        </View>
        <Pressable
          style={[styles.purchaseButton, { backgroundColor: adType.color }]}
          onPress={() => onPurchase(adType, price)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.purchaseButtonText}>Acheter</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

// Liste des pubs actives
const ActiveAdsSection = ({ activeAds, loading }) => {
  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes pubs actives</Text>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  if (!activeAds || activeAds.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes pubs actives</Text>
        <View style={styles.emptyAds}>
          <Icon name="image" size={24} color={theme.colors.textLight} />
          <Text style={styles.emptyAdsText}>Aucune publicite active</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Mes pubs actives</Text>
      <View style={styles.activeAdsList}>
        {activeAds.map((ad, idx) => {
          const adType = AD_TYPES[ad.type] || AD_TYPES.featured;
          const endDate = new Date(ad.ends_at);
          const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));

          return (
            <View key={idx} style={styles.activeAdCard}>
              <View style={[styles.activeAdIcon, { backgroundColor: adType.color + '15' }]}>
                <Icon name={adType.icon} size={18} color={adType.color} />
              </View>
              <View style={styles.activeAdInfo}>
                <Text style={styles.activeAdTitle}>{adType.title}</Text>
                <Text style={styles.activeAdExpiry}>
                  {daysLeft > 0 ? `${daysLeft}j restant(s)` : 'Expire aujourd\'hui'}
                </Text>
              </View>
              <View style={styles.activeAdStats}>
                <View style={styles.statItem}>
                  <Icon name="eye" size={14} color={theme.colors.textLight} />
                  <Text style={styles.statValue}>{ad.views || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="mousePointer" size={14} color={theme.colors.textLight} />
                  <Text style={styles.statValue}>{ad.clicks || 0}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Modal de confirmation d'achat
const PurchaseModal = ({ visible, adType, price, onConfirm, onCancel, loading }) => {
  if (!adType) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={[styles.modalIcon, { backgroundColor: adType.color + '15' }]}>
            <Icon name={adType.icon} size={28} color={adType.color} />
          </View>

          <Text style={styles.modalTitle}>Confirmer l'achat</Text>

          <View style={styles.modalRecap}>
            <View style={styles.modalRecapRow}>
              <Text style={styles.modalRecapLabel}>Produit</Text>
              <Text style={styles.modalRecapValue}>{adType.title}</Text>
            </View>
            <View style={styles.modalRecapDivider} />
            <View style={styles.modalRecapRow}>
              <Text style={styles.modalRecapLabel}>Duree</Text>
              <Text style={styles.modalRecapValue}>{adType.durationWeeks} semaine(s)</Text>
            </View>
            <View style={styles.modalRecapDivider} />
            <View style={styles.modalRecapRow}>
              <Text style={styles.modalRecapLabel}>Prix</Text>
              <Text style={[styles.modalRecapValue, { color: adType.color, fontFamily: theme.fonts.bold }]}>
                {price}{'\u20AC'}
              </Text>
            </View>
          </View>

          <Text style={styles.modalNote}>
            La publicite sera active immediatement apres le paiement.
          </Text>

          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancelButton} onPress={onCancel} disabled={loading}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[styles.modalConfirmButton, { backgroundColor: adType.color }]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.modalConfirmText}>Payer {price}{'\u20AC'}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function LaboratoryAds() {
  const router = useRouter();
  const { session } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tier, setTier] = useState('free');
  const [quotas, setQuotas] = useState({});
  const [activeAds, setActiveAds] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  // Modal
  const [purchaseModal, setPurchaseModal] = useState({
    visible: false,
    adType: null,
    price: 0,
  });

  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const [subscriptionData, ads, history] = await Promise.all([
        subscriptionService.getSubscriptionWithQuotas(session.user.id),
        laboratoryAdsService.getActiveAds(session.user.id),
        laboratoryAdsService.getPurchaseHistory(session.user.id),
      ]);

      setTier(subscriptionData.subscription?.tier || 'free');
      setQuotas(subscriptionData.quotas || {});
      setActiveAds(ads || []);
      setPurchaseHistory(history || {});
    } catch (err) {
      console.error('Error loading ads data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Verifier si c'est le premier achat pour un type
  const isFirstPurchase = (adTypeKey) => {
    return !purchaseHistory[adTypeKey];
  };

  // Utiliser une pub incluse dans l'abonnement
  const handleUseIncluded = async (adTypeKey) => {
    // TODO: Ouvrir un modal pour choisir quel post/mission promouvoir
    Alert.alert(
      'Utiliser votre quota',
      'Choisissez le contenu a mettre en avant depuis votre profil laboratoire.',
      [{ text: 'OK' }]
    );
  };

  // Ouvrir le modal d'achat
  const handlePurchase = (adType, price) => {
    setPurchaseModal({
      visible: true,
      adType,
      price,
    });
  };

  // Confirmer l'achat
  const handleConfirmPurchase = async () => {
    const { adType, price } = purchaseModal;
    if (!adType) return;

    setActionLoading(true);
    try {
      await laboratoryAdsService.purchaseAd(
        session.user.id,
        adType.key,
        price,
        adType.durationWeeks
      );

      setPurchaseModal({ visible: false, adType: null, price: 0 });

      Alert.alert(
        'Achat confirme !',
        `Votre ${adType.title} est maintenant active pour ${adType.durationWeeks} semaine(s).`,
        [{ text: 'OK' }]
      );

      await loadData();
    } catch (err) {
      Alert.alert('Erreur', err.message || 'Impossible de finaliser l\'achat.');
    } finally {
      setActionLoading(false);
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

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <BackButton router={router} />
        <Text style={styles.headerTitle}>Boostez votre visibilite</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Section 1: Pubs incluses */}
        <IncludedAdsSection
          tier={tier}
          quotas={quotas}
          onUseIncluded={handleUseIncluded}
        />

        {/* Section 2: Acheter de la pub */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acheter de la publicite</Text>
          <View style={styles.adCardsList}>
            {Object.values(AD_TYPES).map((adType) => (
              <AdPurchaseCard
                key={adType.key}
                adType={adType}
                isFirstPurchase={isFirstPurchase(adType.key)}
                onPurchase={handlePurchase}
                loading={actionLoading}
              />
            ))}
          </View>
        </View>

        {/* Section 3: Pubs actives */}
        <ActiveAdsSection activeAds={activeAds} loading={false} />

        <View style={{ height: hp(4) }} />
      </ScrollView>

      {/* Modal confirmation achat */}
      <PurchaseModal
        visible={purchaseModal.visible}
        adType={purchaseModal.adType}
        price={purchaseModal.price}
        onConfirm={handleConfirmPurchase}
        onCancel={() => setPurchaseModal({ visible: false, adType: null, price: 0 })}
        loading={actionLoading}
      />
    </ScreenWrapper>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1),
  },
  headerTitle: {
    fontSize: hp(2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
  },

  // ============================================
  // SECTIONS
  // ============================================
  section: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: hp(1.5),
  },

  // ============================================
  // INCLUDED ADS
  // ============================================
  emptyIncluded: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyIncludedText: {
    flex: 1,
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.regular,
  },
  includedList: {
    gap: hp(1.2),
  },
  includedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  includedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  includedInfo: {
    flex: 1,
    marginLeft: wp(3),
  },
  includedLabel: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  includedUsage: {
    fontSize: hp(1.25),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.regular,
    marginTop: hp(0.2),
  },
  useButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
  },
  useButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  useButtonText: {
    fontSize: hp(1.3),
    color: 'white',
    fontFamily: theme.fonts.semiBold,
  },
  useButtonTextDisabled: {
    color: theme.colors.textLight,
  },

  // ============================================
  // AD PURCHASE CARDS
  // ============================================
  adCardsList: {
    gap: hp(2),
  },
  adCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xxl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  discountBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colors.error,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.4),
    borderBottomLeftRadius: theme.radius.lg,
  },
  discountBadgeText: {
    fontSize: hp(1.1),
    color: 'white',
    fontFamily: theme.fonts.bold,
  },
  adCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  adCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adCardTitleRow: {
    flex: 1,
    marginLeft: wp(3),
  },
  adCardTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  adCardDuration: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.regular,
    marginTop: hp(0.2),
  },
  adCardDescription: {
    fontSize: hp(1.35),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.regular,
    marginBottom: hp(1.5),
  },
  adCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: wp(2),
  },
  priceOriginal: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.regular,
    textDecorationLine: 'line-through',
  },
  priceAmount: {
    fontSize: hp(2.5),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  purchaseButton: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.2),
    borderRadius: theme.radius.lg,
  },
  purchaseButtonText: {
    fontSize: hp(1.4),
    color: 'white',
    fontFamily: theme.fonts.semiBold,
  },

  // ============================================
  // ACTIVE ADS
  // ============================================
  emptyAds: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(3),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyAdsText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.regular,
  },
  activeAdsList: {
    gap: hp(1),
  },
  activeAdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeAdIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeAdInfo: {
    flex: 1,
    marginLeft: wp(3),
  },
  activeAdTitle: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  activeAdExpiry: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.regular,
  },
  activeAdStats: {
    flexDirection: 'row',
    gap: wp(3),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  statValue: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.medium,
  },

  // ============================================
  // MODAL
  // ============================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xxl,
    padding: hp(3),
    marginHorizontal: wp(8),
    width: wp(84),
    alignItems: 'center',
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: hp(2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: hp(2),
  },
  modalRecap: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    marginBottom: hp(1.5),
  },
  modalRecapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(0.8),
  },
  modalRecapLabel: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.regular,
  },
  modalRecapValue: {
    fontSize: hp(1.4),
    color: theme.colors.text,
    fontFamily: theme.fonts.semiBold,
  },
  modalRecapDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  modalNote: {
    fontSize: hp(1.25),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: hp(2),
    fontFamily: theme.fonts.regular,
  },
  modalActions: {
    flexDirection: 'row',
    gap: wp(3),
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  modalCancelText: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.medium,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: 'white',
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
  },
});
