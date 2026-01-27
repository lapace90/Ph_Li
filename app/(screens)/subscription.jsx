// app/(screens)/subscription.jsx
import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService } from '../../services/subscriptionService';
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

const QUOTA_CONFIG = {
  missions: { label: 'Missions', icon: 'briefcase' },
  contacts: { label: 'Mises en relation', icon: 'users' },
  alerts: { label: 'Alertes urgentes', icon: 'bell' },
  favorites: { label: 'Favoris', icon: 'star' },
  superLikes: { label: 'Super Likes / jour', icon: 'heart' },
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

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function Subscription() {
  const router = useRouter();
  const { session } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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

  const { subscription, tierInfo, nextTier, quotas } = status;
  const tierColor = TIER_COLORS[subscription.tier] || theme.colors.gray;
  const isPaid = subscription.tier !== 'free';
  const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null;

  // Compute locked features from next tier
  const currentFeatures = new Set(tierInfo.features);
  const lockedFeatures = nextTier
    ? nextTier.features.filter(f => !currentFeatures.has(f))
    : [];

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

        {/* Utilisation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utilisation</Text>
          <View style={styles.usageCard}>
            {Object.entries(quotas).map(([key, quota]) => {
              if (!quota) return null;
              const config = QUOTA_CONFIG[key];
              if (!config) return null;
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
