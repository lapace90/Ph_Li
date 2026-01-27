// Ecran de confirmation definitive de mission (cote Labo/Titulaire)
// Etape 4 : animator_accepted → confirmed (frais factures)

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, Alert, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { missionService } from '../../services/missionService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Button from '../../components/common/Button';
import Icon from '../../assets/icons/Icon';
import MissionTimeline from '../../components/missions/MissionTimeline';

const TIER_LABELS = {
  free: 'Gratuit',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
  premium: 'Premium',
};

export default function MissionConfirm() {
  const router = useRouter();
  const { missionId } = useLocalSearchParams();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [mission, setMission] = useState(null);
  const [feeInfo, setFeeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [cgvAccepted, setCgvAccepted] = useState(false);

  useEffect(() => {
    loadData();
  }, [missionId]);

  const loadData = async () => {
    try {
      const [missionData, feeData] = await Promise.all([
        missionService.getById(missionId),
        missionService.checkFeeStatus(userId, missionId),
      ]);
      setMission(missionData);
      setFeeInfo(feeData);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger les details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!cgvAccepted) {
      Alert.alert('CGV requises', 'Veuillez accepter les conditions generales avant de confirmer.');
      return;
    }

    setConfirming(true);
    try {
      await missionService.confirmMission(missionId, mission.animator_id, userId);
      Alert.alert(
        'Mission confirmee !',
        'La mission est officiellement confirmee. L\'animateur a ete notifie.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de confirmer la mission. Reessayez.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!mission || !feeInfo) return null;

  const animator = mission.animator;
  const animatorProfile = animator?.profile;
  const days = feeInfo.days;

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Confirmation</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <ScrollView style={commonStyles.flex1} contentContainerStyle={styles.content}>
        {/* Timeline */}
        <MissionTimeline status={mission.status} />

        {/* Titre */}
        <Text style={styles.mainTitle}>Confirmer definitivement la mission</Text>

        {/* Recap animateur */}
        <View style={styles.recapCard}>
          <Text style={styles.recapTitle}>Animateur</Text>
          <View style={styles.animatorRow}>
            {animatorProfile?.photo_url ? (
              <Image source={{ uri: animatorProfile.photo_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, commonStyles.centered, { backgroundColor: theme.colors.primary + '15' }]}>
                <Icon name="user" size={22} color={theme.colors.primary} />
              </View>
            )}
            <View style={commonStyles.flex1}>
              <Text style={styles.animatorName}>
                {animatorProfile?.first_name || ''} {animatorProfile?.last_name?.[0] || ''}.
              </Text>
              {animator?.average_rating > 0 && (
                <View style={commonStyles.rowGapSmall}>
                  <Icon name="star" size={14} color={theme.colors.warning} />
                  <Text style={styles.smallText}>{animator.average_rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
            <View style={styles.acceptedBadge}>
              <Icon name="checkCircle" size={16} color={theme.colors.success} />
              <Text style={styles.acceptedText}>Accepte</Text>
            </View>
          </View>
        </View>

        {/* Recap mission */}
        <View style={styles.recapCard}>
          <Text style={styles.recapTitle}>Details de la mission</Text>

          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Mission</Text>
            <Text style={styles.recapValue}>{mission.title}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Dates</Text>
            <Text style={styles.recapValue}>
              {new Date(mission.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              {' - '}
              {new Date(mission.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Duree</Text>
            <Text style={styles.recapValue}>{days} jour{days > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Lieu</Text>
            <Text style={styles.recapValue}>{mission.city || 'Non precise'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Tarif journalier</Text>
            <Text style={styles.recapValue}>{mission.daily_rate_min} EUR</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Total animateur</Text>
            <Text style={[styles.recapValue, styles.recapTotal]}>
              {mission.daily_rate_min * days} EUR
            </Text>
          </View>
        </View>

        {/* Section frais MER */}
        <View style={styles.recapCard}>
          <Text style={styles.recapTitle}>Frais de mise en relation</Text>

          {feeInfo.includedInSubscription ? (
            <View style={styles.includedBanner}>
              <Icon name="checkCircle" size={20} color={theme.colors.success} />
              <View style={commonStyles.flex1}>
                <Text style={styles.includedText}>
                  Mise en relation incluse dans votre forfait {TIER_LABELS[feeInfo.tier] || feeInfo.tier}
                </Text>
                {feeInfo.contactsMax !== Infinity && feeInfo.contactsMax != null && (
                  <Text style={styles.quotaText}>
                    {feeInfo.contactsRemaining} mise{feeInfo.contactsRemaining > 1 ? 's' : ''} en relation restante{feeInfo.contactsRemaining > 1 ? 's' : ''} ce mois-ci
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.payableBanner}>
              <Icon name="creditCard" size={20} color={theme.colors.warning} />
              <View style={commonStyles.flex1}>
                <Text style={styles.payableText}>
                  Frais de mise en relation : {feeInfo.amount} EUR
                </Text>
                <Text style={styles.payableHint}>
                  Passez au forfait Starter ou Pro pour inclure les MER
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* CGV */}
        <Pressable style={styles.cgvRow} onPress={() => setCgvAccepted(!cgvAccepted)}>
          <View style={[styles.checkbox, cgvAccepted && styles.checkboxChecked]}>
            {cgvAccepted && <Icon name="check" size={14} color="white" />}
          </View>
          <Text style={styles.cgvText}>
            J'accepte les conditions generales de vente et la politique de facturation des frais de mise en relation.
          </Text>
        </Pressable>

        {/* Bouton confirmer */}
        <Button
          title={feeInfo.includedInSubscription
            ? 'Confirmer definitivement'
            : `Confirmer et payer ${feeInfo.amount} EUR`
          }
          onPress={handleConfirm}
          loading={confirming}
          buttonStyle={[styles.confirmButton, !cgvAccepted && styles.buttonDisabled]}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
  },
  mainTitle: {
    fontSize: hp(2),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: hp(2),
  },
  recapCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: wp(4),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recapTitle: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: theme.colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: hp(1.2),
  },
  animatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  animatorName: {
    fontSize: hp(1.6),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: hp(0.2),
  },
  smallText: {
    fontSize: hp(1.3),
    color: theme.colors.text,
    fontWeight: '600',
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    backgroundColor: theme.colors.success + '15',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.4),
    borderRadius: theme.radius.md,
  },
  acceptedText: {
    fontSize: hp(1.2),
    fontWeight: '600',
    color: theme.colors.success,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(0.8),
  },
  recapLabel: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  recapValue: {
    fontSize: hp(1.4),
    fontWeight: '600',
    color: theme.colors.text,
  },
  recapTotal: {
    fontSize: hp(1.6),
    fontWeight: '700',
    color: theme.colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  includedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(3),
    backgroundColor: theme.colors.success + '12',
    borderRadius: theme.radius.lg,
    padding: wp(4),
    borderWidth: 1,
    borderColor: theme.colors.success + '30',
  },
  includedText: {
    fontSize: hp(1.4),
    fontWeight: '600',
    color: theme.colors.success,
  },
  quotaText: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    marginTop: hp(0.3),
  },
  payableBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(3),
    backgroundColor: theme.colors.warning + '12',
    borderRadius: theme.radius.lg,
    padding: wp(4),
    borderWidth: 1,
    borderColor: theme.colors.warning + '30',
  },
  payableText: {
    fontSize: hp(1.4),
    fontWeight: '600',
    color: theme.colors.warning,
  },
  payableHint: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    marginTop: hp(0.3),
  },
  cgvRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(3),
    marginBottom: hp(2.5),
    paddingHorizontal: wp(1),
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(0.2),
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  cgvText: {
    flex: 1,
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    lineHeight: hp(1.9),
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    marginBottom: hp(2),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
