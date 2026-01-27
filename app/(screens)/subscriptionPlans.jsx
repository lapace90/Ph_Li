// app/(screens)/subscriptionPlans.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  Alert, StyleSheet, Modal, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService } from '../../services/subscriptionService';
import { getSubscriptionTiers } from '../../constants/profileOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';

// ============================================
// CONSTANTES
// ============================================

const TIER_COLORS = {
  free: '#9E9E9E',
  starter: theme.colors.secondary,
  pro: theme.colors.success,
  premium: theme.colors.warning,
  business: theme.colors.warning,
};

const TIER_ICONS = {
  free: 'user',
  starter: 'zap',
  pro: 'award',
  premium: 'star',
  business: 'shield',
};

// Tiers qui recoivent le badge "Populaire"
const POPULAR_TIERS = {
  laboratoire: 'pro',
  titulaire: 'pro',
  preparateur: 'premium',
  conseiller: 'premium',
  animateur: 'premium',
  etudiant: 'premium',
};

// ============================================
// SOUS-COMPOSANTS
// ============================================

const PlanCard = ({ tier, isCurrentTier, isPopular, isUpgrade, isDowngrade, onSelect, actionLoading }) => {
  const color = TIER_COLORS[tier.value] || TIER_COLORS.free;
  const icon = TIER_ICONS[tier.value] || 'user';

  const getButtonLabel = () => {
    if (isCurrentTier) return 'Forfait actuel';
    if (isDowngrade) return 'Retrograder';
    return 'Selectionner';
  };

  return (
    <View style={[
      styles.planCard,
      isPopular && styles.planCardPopular,
      isPopular && { borderColor: color },
    ]}>
      {/* Badge Populaire */}
      {isPopular && (
        <View style={[styles.popularBadge, { backgroundColor: color }]}>
          <Icon name="zap" size={10} color="white" />
          <Text style={styles.popularBadgeText}>Recommande</Text>
        </View>
      )}

      {/* Header colore */}
      <View style={[styles.planHeader, { backgroundColor: color + '12' }]}>
        <View style={[styles.planIconCircle, { backgroundColor: color + '25' }]}>
          <Icon name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.planName, { color }]}>{tier.label}</Text>
        {isCurrentTier && (
          <View style={[styles.currentBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.currentBadgeText, { color }]}>Actuel</Text>
          </View>
        )}
      </View>

      {/* Prix */}
      <View style={styles.priceSection}>
        {tier.price === 0 ? (
          <Text style={styles.priceFree}>Gratuit</Text>
        ) : (
          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>{tier.price}</Text>
            <View style={styles.priceMeta}>
              <Text style={styles.priceCurrency}>{'\u20AC'}</Text>
              <Text style={styles.pricePeriod}>/mois</Text>
            </View>
          </View>
        )}
      </View>

      {/* Separateur */}
      <View style={styles.divider} />

      {/* Features */}
      <View style={styles.featuresList}>
        {tier.features.map((feature, idx) => (
          <View key={idx} style={styles.featureRow}>
            <View style={[styles.featureCheck, { backgroundColor: color + '15' }]}>
              <Icon name="check" size={12} color={color} />
            </View>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Bouton */}
      <Pressable
        style={[
          styles.selectButton,
          isCurrentTier && styles.selectButtonDisabled,
          !isCurrentTier && !isDowngrade && { backgroundColor: color },
          isDowngrade && styles.selectButtonOutline,
          isDowngrade && { borderColor: color },
        ]}
        onPress={() => !isCurrentTier && onSelect(tier)}
        disabled={isCurrentTier || actionLoading}
      >
        {actionLoading && !isCurrentTier ? (
          <ActivityIndicator size="small" color={isDowngrade ? color : 'white'} />
        ) : (
          <Text style={[
            styles.selectButtonText,
            isCurrentTier && styles.selectButtonTextDisabled,
            isDowngrade && { color },
          ]}>
            {getButtonLabel()}
          </Text>
        )}
      </Pressable>
    </View>
  );
};

const ConfirmModal = ({ visible, tier, isDowngrade, expiresAt, onConfirm, onCancel, loading }) => {
  if (!tier) return null;
  const color = TIER_COLORS[tier.value] || TIER_COLORS.free;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Icon */}
          <View style={[styles.modalIcon, { backgroundColor: (isDowngrade ? theme.colors.warning : color) + '15' }]}>
            <Icon
              name={isDowngrade ? 'alertTriangle' : 'zap'}
              size={28}
              color={isDowngrade ? theme.colors.warning : color}
            />
          </View>

          {/* Titre */}
          <Text style={styles.modalTitle}>
            {isDowngrade ? 'Retrograder votre forfait' : 'Confirmer votre choix'}
          </Text>

          {/* Message */}
          {isDowngrade ? (
            <Text style={styles.modalMessage}>
              Le passage au forfait {tier.label} prendra effet a la fin de votre
              periode actuelle{expiresAt ? ` (${expiresAt.toLocaleDateString('fr-FR')})` : ''}.
              Vos quotas seront ajustes a ce moment-la.
            </Text>
          ) : (
            <View style={styles.modalRecap}>
              <View style={styles.modalRecapRow}>
                <Text style={styles.modalRecapLabel}>Forfait</Text>
                <Text style={styles.modalRecapValue}>{tier.label}</Text>
              </View>
              <View style={styles.modalRecapDivider} />
              <View style={styles.modalRecapRow}>
                <Text style={styles.modalRecapLabel}>Prix</Text>
                <Text style={styles.modalRecapValue}>{tier.price}{'\u20AC'} / mois</Text>
              </View>
              <View style={styles.modalRecapDivider} />
              <View style={styles.modalRecapRow}>
                <Text style={styles.modalRecapLabel}>Facturation</Text>
                <Text style={styles.modalRecapValue}>Mensuelle</Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancelButton} onPress={onCancel} disabled={loading}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[
                styles.modalConfirmButton,
                { backgroundColor: isDowngrade ? theme.colors.warning : color },
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.modalConfirmText}>
                  {isDowngrade ? 'Confirmer' : 'Payer et activer'}
                </Text>
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

export default function SubscriptionPlans() {
  const router = useRouter();
  const { session } = useAuth();

  const [tiers, setTiers] = useState([]);
  const [currentTier, setCurrentTier] = useState('free');
  const [userType, setUserType] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal
  const [confirmModal, setConfirmModal] = useState({ visible: false, tier: null, isDowngrade: false });

  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const [subscription, uType] = await Promise.all([
        subscriptionService.ensureSubscription(session.user.id),
        subscriptionService._getUserType(session.user.id),
      ]);
      setCurrentTier(subscription.tier || 'free');
      setUserType(uType);
      setExpiresAt(subscription.expires_at ? new Date(subscription.expires_at) : null);
      setTiers(getSubscriptionTiers(uType));
    } catch (err) {
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getTierIndex = (tierValue) => tiers.findIndex(t => t.value === tierValue);

  const handleSelect = (tier) => {
    const currentIdx = getTierIndex(currentTier);
    const selectedIdx = getTierIndex(tier.value);
    const isDowngrade = selectedIdx < currentIdx;

    setConfirmModal({ visible: true, tier, isDowngrade });
  };

  const handleConfirm = async () => {
    const { tier, isDowngrade } = confirmModal;
    if (!tier) return;

    setActionLoading(true);
    try {
      if (isDowngrade) {
        // Pour un downgrade, on programme le changement a l'expiration
        await subscriptionService.upgradeTier(session.user.id, tier.value);
        setConfirmModal({ visible: false, tier: null, isDowngrade: false });
        Alert.alert(
          'Forfait modifie',
          `Votre forfait passera en ${tier.label} a la fin de votre periode actuelle.`
        );
      } else {
        // Upgrade : appliquer immediatement (placeholder paiement)
        await subscriptionService.upgradeTier(session.user.id, tier.value);
        setConfirmModal({ visible: false, tier: null, isDowngrade: false });
        Alert.alert(
          'Forfait active',
          `Vous etes maintenant sur le forfait ${tier.label} !`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
      await loadData();
    } catch (err) {
      Alert.alert('Erreur', err.message || 'Impossible de changer de forfait.');
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
        <Text style={styles.headerTitle}>Choisissez votre forfait</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Debloquez plus de fonctionnalites pour developper votre activite.
      </Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Plans */}
        {tiers.map((tier) => {
          const currentIdx = getTierIndex(currentTier);
          const tierIdx = getTierIndex(tier.value);
          return (
            <PlanCard
              key={tier.value}
              tier={tier}
              isCurrentTier={tier.value === currentTier}
              isPopular={tier.value === POPULAR_TIERS[userType]}
              isUpgrade={tierIdx > currentIdx}
              isDowngrade={tierIdx < currentIdx}
              onSelect={handleSelect}
              actionLoading={actionLoading}
            />
          );
        })}

        {/* Footer aide */}
        <View style={styles.helpSection}>
          <Icon name="messageCircle" size={20} color={theme.colors.textLight} />
          <Text style={styles.helpText}>
            Besoin d'aide ? <Text style={styles.helpLink} onPress={() => Linking.openURL('mailto:support@pharmalink.fr')}>Contactez-nous</Text>
          </Text>
        </View>

        <View style={{ height: hp(4) }} />
      </ScrollView>

      {/* Modal confirmation */}
      <ConfirmModal
        visible={confirmModal.visible}
        tier={confirmModal.tier}
        isDowngrade={confirmModal.isDowngrade}
        expiresAt={expiresAt}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModal({ visible: false, tier: null, isDowngrade: false })}
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
    paddingBottom: hp(0.5),
  },
  headerTitle: {
    fontSize: hp(2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    textAlign: 'center',
    paddingHorizontal: wp(10),
    marginBottom: hp(2),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
  },

  // ============================================
  // PLAN CARD
  // ============================================
  planCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xxl,
    marginBottom: hp(2),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  planCardPopular: {
    borderWidth: 2,
  },

  // Popular badge
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1),
    paddingVertical: hp(0.5),
  },
  popularBadgeText: {
    color: 'white',
    fontSize: hp(1.15),
    fontFamily: theme.fonts.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Header colore
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
  },
  planIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planName: {
    flex: 1,
    fontSize: hp(2),
    fontFamily: theme.fonts.bold,
  },

  // Current badge
  currentBadge: {
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.35),
    borderRadius: theme.radius.sm,
  },
  currentBadgeText: {
    fontSize: hp(1.1),
    fontFamily: theme.fonts.semiBold,
  },

  // Prix
  priceSection: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(1.5),
  },
  priceFree: {
    fontSize: hp(3),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: hp(3.5),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    lineHeight: hp(4),
  },
  priceMeta: {
    marginLeft: wp(1),
    marginBottom: hp(0.4),
  },
  priceCurrency: {
    fontSize: hp(2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  pricePeriod: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.medium,
  },

  // Separateur
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: wp(5),
  },

  // Features
  featuresList: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    gap: hp(1.2),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: hp(1.4),
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
  },

  // Bouton
  selectButton: {
    marginHorizontal: wp(5),
    marginBottom: hp(2),
    paddingVertical: hp(1.6),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  selectButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  selectButtonText: {
    color: 'white',
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
  },
  selectButtonTextDisabled: {
    color: theme.colors.textLight,
  },

  // ============================================
  // HELP SECTION
  // ============================================
  helpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    marginTop: hp(1),
    paddingVertical: hp(2),
  },
  helpText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.regular,
  },
  helpLink: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
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
    marginBottom: hp(1.5),
  },
  modalMessage: {
    fontSize: hp(1.45),
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: hp(2.2),
    marginBottom: hp(2.5),
  },

  // Recap
  modalRecap: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    marginBottom: hp(2.5),
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

  // Actions
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
