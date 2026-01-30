// app/(screens)/subscription.jsx
import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService } from '../../services/subscriptionService';
import { promotionService } from '../../services/promotionService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';

// ============================================
// CONSTANTES
// ============================================

const TIER_COLORS = {
  free: theme.colors.gray,
  starter: theme.colors.secondary,
  pro: theme.colors.success,
  premium: theme.colors.warning,
  business: theme.colors.warning,
};

// Configuration des quotas par type d'utilisateur
const QUOTA_CONFIG = {
  // Communs
  missions: { label: 'Missions', icon: 'briefcase' },
  contacts: { label: 'Mises en relation', icon: 'users' },
  alerts: { label: 'Alertes urgentes', icon: 'bell' },
  favorites: { label: 'Favoris', icon: 'star' },
  superLikes: { label: 'Super Likes / jour', icon: 'heart' },
  // Laboratoire
  posts: { label: 'Posts / mois', icon: 'fileText' },
  videos: { label: 'Videos / mois', icon: 'video' },
  photos: { label: 'Photos', icon: 'image' },
  sponsoredWeeks: { label: 'Semaines en vedette', icon: 'zap' },
  sponsoredCards: { label: 'Cartes sponsorisees', icon: 'creditCard' },
};

// ============================================
// SOUS-COMPOSANTS
// ============================================

const TierBadge = ({ tier }) => {
  const color = TIER_COLORS[tier] || theme.colors.gray;
  return (
    <View style={[styles.tierBadge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[styles.tierBadgeText, { color }]}>{tier?.toUpperCase()}</Text>
    </View>
  );
};

const QuotaRow = ({ label, icon, used, max, unlimited }) => {
  const percentage = unlimited ? 0 : max > 0 ? (used / max) * 100 : 0;
  const barColor = percentage >= 80 ? theme.colors.rose : percentage >= 50 ? theme.colors.warning : theme.colors.success;

  return (
    <View style={styles.quotaRow}>
      <View style={styles.quotaHeader}>
        <View style={styles.quotaLabelRow}>
          <Icon name={icon} size={16} color={theme.colors.textLight} />
          <Text style={styles.quotaLabel}>{label}</Text>
        </View>
        <Text style={styles.quotaValue}>
          {unlimited ? 'Illimite' : `${used}/${max}`}
        </Text>
      </View>
      {!unlimited && (
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: barColor }]} />
        </View>
      )}
    </View>
  );
};

const FeatureItem = ({ text, included }) => (
  <View style={styles.featureRow}>
    <View style={[styles.featureIcon, { backgroundColor: included ? theme.colors.success + '15' : theme.colors.gray + '20' }]}>
      <Icon name={included ? 'check' : 'lock'} size={14} color={included ? theme.colors.success : theme.colors.textLight} />
    </View>
    <Text style={[styles.featureText, !included && styles.featureTextLocked]}>{text}</Text>
  </View>
);

const PromoCodeSection = ({ userId, userType, onPromoApplied }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { valid, error, promotion }

  const handleApply = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const validation = await promotionService.validatePromoCode(
        code,
        userId,
        userType,
        null // Pas de tier cible specifique ici
      );

      setResult(validation);

      if (validation.valid && onPromoApplied) {
        onPromoApplied(validation.promotion);
      }
    } catch (err) {
      setResult({ valid: false, error: err.message || 'Erreur de validation' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.promoCard}>
      <Text style={styles.promoTitle}>Code promo</Text>
      <View style={styles.promoInputRow}>
        <TextInput
          style={styles.promoInput}
          placeholder="Entrez votre code"
          placeholderTextColor={theme.colors.textLight}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Pressable
          style={[styles.promoButton, !code.trim() && styles.promoButtonDisabled]}
          onPress={handleApply}
          disabled={loading || !code.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.promoButtonText}>Appliquer</Text>
          )}
        </Pressable>
      </View>

      {result && (
        <View style={[
          styles.promoResult,
          { backgroundColor: result.valid ? theme.colors.success + '15' : theme.colors.rose + '15' }
        ]}>
          <Icon
            name={result.valid ? 'check' : 'x'}
            size={16}
            color={result.valid ? theme.colors.success : theme.colors.rose}
          />
          <Text style={[
            styles.promoResultText,
            { color: result.valid ? theme.colors.success : theme.colors.rose }
          ]}>
            {result.valid
              ? `${result.promotion.name} - ${result.promotion.discount_type === 'percent'
                  ? `-${result.promotion.discount_value}%`
                  : result.promotion.discount_type === 'fixed'
                    ? `-${result.promotion.discount_value}\u20AC`
                    : `${result.promotion.trial_days} jours d'essai`
                }`
              : result.error
            }
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function Subscription() {
  const router = useRouter();
  const { session, userType: authUserType } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);

  const loadStatus = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const data = await subscriptionService.getFullStatus(session.user.id);
      setStatus(data);
    } catch (err) {
      console.error('Error loading subscription:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleCancel = () => {
    Alert.alert(
      'Annuler l\'abonnement',
      'Votre abonnement restera actif jusqu\'a la date d\'expiration, puis repassera en forfait Gratuit.',
      [
        { text: 'Garder mon forfait', style: 'cancel' },
        {
          text: 'Confirmer l\'annulation',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await subscriptionService.cancelSubscription(session.user.id);
              await loadStatus();
              Alert.alert('Abonnement annule', 'Le renouvellement automatique a ete desactive.');
            } catch (err) {
              Alert.alert('Erreur', err.message || 'Impossible d\'annuler l\'abonnement.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
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

  if (!status) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={styles.header}>
          <BackButton router={router} />
          <Text style={styles.headerTitle}>Mon abonnement</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Impossible de charger les informations.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const { subscription, tierInfo, nextTier, quotas, userType } = status;
  const tierColor = TIER_COLORS[subscription.tier] || theme.colors.gray;
  const isPaid = subscription.tier !== 'free';
  const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null;

  // Compute locked features from next tier
  const currentFeatures = new Set(tierInfo.features);
  const lockedFeatures = nextTier
    ? nextTier.features.filter(f => !currentFeatures.has(f))
    : [];

  // Filtrer les quotas selon le type d'utilisateur
  const displayedQuotas = Object.entries(quotas).filter(([key, quota]) => {
    if (!quota) return false;
    const config = QUOTA_CONFIG[key];
    if (!config) return false;
    // Ne pas afficher les quotas a 0/0 non pertinents
    if (quota.max === 0 && quota.used === 0 && !quota.unlimited) return false;
    return true;
  });

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <BackButton router={router} />
        <Text style={styles.headerTitle}>Mon abonnement</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Forfait actuel */}
        <View style={[styles.planCard, { borderColor: tierColor }]}>
          <View style={styles.planCardHeader}>
            <View>
              <Text style={styles.planCardLabel}>Forfait actuel</Text>
              <Text style={styles.planCardName}>{tierInfo.label}</Text>
            </View>
            <TierBadge tier={subscription.tier} />
          </View>

          <Text style={styles.planCardPrice}>
            {tierInfo.price === 0 ? 'Gratuit' : `${tierInfo.price}\u20AC / mois`}
          </Text>

          {expiresAt && isPaid && (
            <View style={styles.planCardMeta}>
              <Icon name="calendar" size={14} color={theme.colors.textLight} />
              <Text style={styles.planCardMetaText}>
                {subscription.auto_renew ? 'Renouvellement' : 'Expire'} le{' '}
                {expiresAt.toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}

          <Pressable
            style={[styles.upgradeButton, { backgroundColor: nextTier ? (TIER_COLORS[nextTier.value] || theme.colors.primary) : tierColor }]}
            onPress={() => router.push('/(screens)/subscriptionPlans')}
          >
            <Icon name="zap" size={16} color="white" />
            <Text style={styles.upgradeButtonText}>
              {isPaid ? 'Changer de forfait' : `Passer au ${nextTier?.label || 'Premium'}`}
            </Text>
          </Pressable>
        </View>

        {/* Code promo */}
        {!isPaid && (
          <View style={styles.section}>
            <PromoCodeSection
              userId={session?.user?.id}
              userType={userType || authUserType}
              onPromoApplied={setAppliedPromo}
            />
          </View>
        )}

        {/* Promo appliquee */}
        {appliedPromo && (
          <View style={styles.appliedPromoCard}>
            <Icon name="gift" size={18} color={theme.colors.success} />
            <View style={styles.appliedPromoContent}>
              <Text style={styles.appliedPromoTitle}>{appliedPromo.name}</Text>
              <Text style={styles.appliedPromoDesc}>
                Sera applique lors de votre prochain abonnement
              </Text>
            </View>
          </View>
        )}

        {/* Utilisation */}
        {displayedQuotas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Votre usage ce mois</Text>
            <View style={styles.usageCard}>
              {displayedQuotas.map(([key, quota]) => {
                const config = QUOTA_CONFIG[key];
                return (
                  <QuotaRow
                    key={key}
                    label={config.label}
                    icon={config.icon}
                    used={quota.used}
                    max={quota.max}
                    unlimited={quota.unlimited}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* Fonctionnalites incluses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fonctionnalites incluses</Text>
          <View style={styles.featuresCard}>
            {tierInfo.features.map((f, i) => (
              <FeatureItem key={i} text={f} included />
            ))}
            {lockedFeatures.length > 0 && (
              <>
                <View style={styles.featureDivider} />
                <Text style={styles.lockedTitle}>
                  Disponible avec {nextTier.label}
                </Text>
                {lockedFeatures.map((f, i) => (
                  <FeatureItem key={`locked-${i}`} text={f} included={false} />
                ))}
              </>
            )}
          </View>
        </View>

        {/* Gestion paiement */}
        {isPaid && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gestion</Text>
            <View style={styles.managementCard}>
              {subscription.auto_renew ? (
                <Pressable style={styles.cancelButton} onPress={handleCancel} disabled={actionLoading}>
                  {actionLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.rose} />
                  ) : (
                    <>
                      <Icon name="x" size={18} color={theme.colors.rose} />
                      <Text style={styles.cancelButtonText}>Annuler le renouvellement</Text>
                    </>
                  )}
                </Pressable>
              ) : (
                <View style={styles.cancelledInfo}>
                  <Icon name="alertTriangle" size={18} color={theme.colors.warning} />
                  <Text style={styles.cancelledText}>
                    Le renouvellement est desactive. Votre forfait expirera le{' '}
                    {expiresAt?.toLocaleDateString('fr-FR')}.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={{ height: hp(4) }} />
      </ScrollView>
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
  errorText: {
    fontSize: hp(1.6),
    color: theme.colors.rose,
    textAlign: 'center',
  },
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
    paddingTop: hp(2),
    paddingBottom: hp(4),
  },

  // Plan Card
  planCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2.5),
    borderWidth: 2,
    marginBottom: hp(3),
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1),
  },
  planCardLabel: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginBottom: hp(0.3),
  },
  planCardName: {
    fontSize: hp(2.5),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  planCardPrice: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(1),
  },
  planCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(1.5),
  },
  planCardMetaText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },

  // Tier Badge
  tierBadge: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.4),
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  tierBadgeText: {
    fontSize: hp(1.1),
    fontFamily: theme.fonts.bold,
    letterSpacing: 1,
  },

  // Upgrade button
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    marginTop: hp(1),
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
  },

  // Section
  section: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(1.5),
  },

  // Promo Card
  promoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  promoTitle: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(1.5),
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: wp(3),
  },
  promoInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  promoButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingHorizontal: wp(5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoButtonDisabled: {
    backgroundColor: theme.colors.gray,
  },
  promoButtonText: {
    color: 'white',
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
  },
  promoResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginTop: hp(1.5),
    padding: hp(1.2),
    borderRadius: theme.radius.md,
  },
  promoResultText: {
    flex: 1,
    fontSize: hp(1.35),
    fontFamily: theme.fonts.medium,
  },

  // Applied Promo
  appliedPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: theme.colors.success + '10',
    borderRadius: theme.radius.xl,
    padding: hp(2),
    marginBottom: hp(3),
    borderWidth: 1,
    borderColor: theme.colors.success + '30',
  },
  appliedPromoContent: {
    flex: 1,
  },
  appliedPromoTitle: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.success,
  },
  appliedPromoDesc: {
    fontSize: hp(1.25),
    fontFamily: theme.fonts.regular,
    color: theme.colors.success,
    marginTop: hp(0.3),
  },

  // Usage Card
  usageCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    gap: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quotaRow: {
    gap: hp(0.8),
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotaLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  quotaLabel: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  quotaValue: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Features Card
  featuresCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    gap: hp(1.2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: hp(1.4),
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
  },
  featureTextLocked: {
    color: theme.colors.textLight,
  },
  featureDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: hp(0.5),
  },
  lockedTitle: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.textLight,
    marginBottom: hp(0.3),
  },

  // Management
  managementCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.rose + '10',
  },
  cancelButtonText: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.rose,
  },
  cancelledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    padding: hp(0.5),
  },
  cancelledText: {
    flex: 1,
    fontSize: hp(1.4),
    color: theme.colors.warning,
    fontFamily: theme.fonts.medium,
  },
});
