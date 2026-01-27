import { StyleSheet, Text, View, Pressable, Modal, ActivityIndicator } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const TIER_LABELS = {
  free: 'Gratuit',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
  premium: 'Premium',
};

const MissionFeeModal = ({
  visible,
  feeInfo,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!feeInfo) return null;

  const { amount, days, includedInSubscription, tier, contactsRemaining, contactsMax } = feeInfo;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Titre */}
          <View style={styles.header}>
            <Icon name="fileText" size={28} color={theme.colors.primary} />
            <Text style={styles.title}>Mise en relation</Text>
          </View>

          <Text style={styles.subtitle}>
            Confirmez la mise en relation pour cette mission
          </Text>

          {/* Détails mission */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Durée de la mission</Text>
              <Text style={styles.detailValue}>
                {days} jour{days > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Frais de mise en relation</Text>
              <Text style={styles.detailAmount}>{amount} EUR</Text>
            </View>
          </View>

          {/* Statut des frais */}
          {includedInSubscription ? (
            <View style={styles.includedBanner}>
              <Icon name="checkCircle" size={20} color={theme.colors.success} />
              <View style={styles.bannerTextContainer}>
                <Text style={styles.includedText}>
                  Mise en relation incluse dans votre forfait {TIER_LABELS[tier] || tier}
                </Text>
                {contactsMax !== Infinity && contactsMax != null && (
                  <Text style={styles.quotaText}>
                    {contactsRemaining} mise{contactsRemaining > 1 ? 's' : ''} en relation restante{contactsRemaining > 1 ? 's' : ''} ce mois-ci
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.payableBanner}>
              <Icon name="creditCard" size={20} color={theme.colors.warning} />
              <View style={styles.bannerTextContainer}>
                <Text style={styles.payableText}>
                  Frais de mise en relation : {amount} EUR
                </Text>
                <Text style={styles.payableHint}>
                  Passez au forfait Starter ou Pro pour inclure les MER
                </Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.confirmButton, loading && styles.buttonDisabled]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Icon
                    name={includedInSubscription ? 'check' : 'creditCard'}
                    size={18}
                    color="white"
                  />
                  <Text style={styles.confirmButtonText}>
                    {includedInSubscription ? 'Confirmer' : `Payer ${amount} EUR`}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default MissionFeeModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  card: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xxl,
    padding: wp(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginBottom: hp(1),
  },
  title: {
    fontSize: hp(2.4),
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    marginBottom: hp(2.5),
  },

  // Details
  detailsCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginBottom: hp(2),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(0.8),
  },
  detailLabel: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
  },
  detailValue: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: theme.colors.text,
  },
  detailAmount: {
    fontSize: hp(1.7),
    fontWeight: '700',
    color: theme.colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: hp(0.5),
  },

  // Banners
  includedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(3),
    backgroundColor: theme.colors.success + '12',
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginBottom: hp(3),
    borderWidth: 1,
    borderColor: theme.colors.success + '30',
  },
  bannerTextContainer: {
    flex: 1,
    gap: hp(0.3),
  },
  includedText: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: theme.colors.success,
  },
  quotaText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  payableBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(3),
    backgroundColor: theme.colors.warning + '12',
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginBottom: hp(3),
    borderWidth: 1,
    borderColor: theme.colors.warning + '30',
  },
  payableText: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: theme.colors.warning,
  },
  payableHint: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: wp(3),
  },
  button: {
    flex: 1,
    paddingVertical: hp(1.6),
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(2),
  },
  cancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: hp(1.6),
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: hp(1.6),
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
