// Ecran de detail mission avec timeline visuelle

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, Alert, StyleSheet, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
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

const STATUS_LABELS = {
  draft: 'Brouillon',
  open: 'Publiee',
  proposal_sent: 'Proposition envoyee',
  animator_accepted: 'Acceptee par l\'animateur',
  confirmed: 'Confirmee',
  assigned: 'Assignee',
  in_progress: 'En cours',
  completed: 'Terminee',
  cancelled: 'Annulee',
};

export default function MissionDetail() {
  const router = useRouter();
  const { missionId } = useLocalSearchParams();
  const { session, profile } = useAuth();
  const userId = session?.user?.id;
  const isAnimator = profile?.user_type === 'animateur';

  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMission = useCallback(async () => {
    try {
      const data = await missionService.getById(missionId);
      setMission(data);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger la mission');
    } finally {
      setLoading(false);
    }
  }, [missionId]);

  useEffect(() => { loadMission(); }, [loadMission]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMission();
    setRefreshing(false);
  }, [loadMission]);

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  const [actionLoading, setActionLoading] = useState(false);

  const handleStartMission = async () => {
    setActionLoading(true);
    try {
      await missionService.start(mission.id);
      await loadMission();
      Alert.alert('Mission demarree', 'La mission est maintenant en cours.');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de demarrer la mission.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteMission = async () => {
    Alert.alert(
      'Terminer la mission ?',
      'Cette action est irreversible. Les deux parties pourront laisser un avis.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          onPress: async () => {
            setActionLoading(true);
            try {
              await missionService.complete(mission.id);
              await loadMission();
              Alert.alert('Mission terminee', 'Vous pouvez maintenant laisser un avis.');
            } catch (err) {
              Alert.alert('Erreur', 'Impossible de terminer la mission.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!mission) return null;

  const animator = mission.animator;
  const animatorProfile = animator?.profile;
  const clientProfile = mission.client_profile;
  const days = mission.start_date && mission.end_date
    ? missionService._getDatesBetween(mission.start_date, mission.end_date).length
    : 0;

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Detail mission</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <ScrollView
        style={commonStyles.flex1}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      >
        {/* Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.cardTitle}>Progression</Text>
          <MissionTimeline status={mission.status} />
        </View>

        {/* Statut actuel */}
        <View style={[styles.statusBadge, mission.status === 'confirmed' && styles.statusConfirmed, mission.status === 'cancelled' && styles.statusCancelled]}>
          <Icon
            name={mission.status === 'confirmed' ? 'checkCircle' : mission.status === 'cancelled' ? 'x' : 'clock'}
            size={16}
            color={mission.status === 'confirmed' ? theme.colors.success : mission.status === 'cancelled' ? theme.colors.rose : theme.colors.primary}
          />
          <Text style={[styles.statusText, mission.status === 'confirmed' && styles.statusTextConfirmed, mission.status === 'cancelled' && styles.statusTextCancelled]}>
            {STATUS_LABELS[mission.status] || mission.status}
          </Text>
        </View>

        {/* Titre mission */}
        <Text style={styles.missionTitle}>{mission.title}</Text>

        {/* Client (visible par l'animateur) */}
        {isAnimator && clientProfile && (
          <View style={styles.infoCard}>
            <View style={styles.personRow}>
              {clientProfile.logo_url ? (
                <Image source={{ uri: clientProfile.logo_url }} style={styles.logo} />
              ) : (
                <View style={[styles.logo, commonStyles.centered, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Icon name="building" size={20} color={theme.colors.primary} />
                </View>
              )}
              <View style={commonStyles.flex1}>
                <Text style={styles.personName}>
                  {clientProfile.company_name || clientProfile.brand_name || `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`}
                </Text>
                <Text style={styles.personSub}>
                  {mission.client_type === 'laboratory' ? 'Laboratoire' : 'Pharmacie titulaire'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Animateur (visible par le labo) */}
        {!isAnimator && animatorProfile && (
          <View style={styles.infoCard}>
            <View style={styles.personRow}>
              {animatorProfile.photo_url ? (
                <Image source={{ uri: animatorProfile.photo_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, commonStyles.centered, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Icon name="user" size={20} color={theme.colors.primary} />
                </View>
              )}
              <View style={commonStyles.flex1}>
                <Text style={styles.personName}>
                  {animatorProfile.first_name} {animatorProfile.last_name?.[0]}.
                </Text>
                {animator.average_rating > 0 && (
                  <View style={commonStyles.rowGapSmall}>
                    <Icon name="star" size={14} color={theme.colors.warning} />
                    <Text style={styles.personSub}>{animator.average_rating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Description */}
        {mission.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{mission.description}</Text>
          </View>
        )}

        {/* Infos cles */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Icon name="calendar" size={18} color={theme.colors.primary} />
            <Text style={styles.infoLabel}>Dates</Text>
            <Text style={styles.infoValue}>
              {mission.start_date
                ? new Date(mission.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                : '?'}
              {' - '}
              {mission.end_date
                ? new Date(mission.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                : '?'}
            </Text>
            {days > 0 && <Text style={styles.infoSub}>{days} jour{days > 1 ? 's' : ''}</Text>}
          </View>
          <View style={styles.infoItem}>
            <Icon name="mapPin" size={18} color={theme.colors.primary} />
            <Text style={styles.infoLabel}>Lieu</Text>
            <Text style={styles.infoValue}>{mission.city || 'Non precise'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="dollarSign" size={18} color={theme.colors.primary} />
            <Text style={styles.infoLabel}>Tarif</Text>
            <Text style={styles.infoValue}>
              {mission.daily_rate_min && mission.daily_rate_max
                ? mission.daily_rate_min === mission.daily_rate_max
                  ? `${mission.daily_rate_min} EUR/j`
                  : `${mission.daily_rate_min}-${mission.daily_rate_max} EUR/j`
                : mission.daily_rate_min ? `${mission.daily_rate_min} EUR/j`
                : mission.daily_rate_max ? `${mission.daily_rate_max} EUR/j`
                : 'Non précisé'
              }
            </Text>
          </View>
        </View>

        {/* Specialites */}
        {mission.specialties_required?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialites requises</Text>
            <View style={styles.tagsRow}>
              {mission.specialties_required.map((spec) => (
                <View key={spec} style={styles.tag}>
                  <Text style={styles.tagText}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions contextuelles */}
        {renderActions(mission, isAnimator, userId, router, { onStart: handleStartMission, onComplete: handleCompleteMission, actionLoading })}
      </ScrollView>
    </ScreenWrapper>
  );
}

function renderActions(mission, isAnimator, userId, router, { onStart, onComplete, actionLoading } = {}) {
  // Animateur : proposition recue → repondre
  if (isAnimator && mission.status === 'proposal_sent' && mission.animator_id === userId) {
    return (
      <Button
        title="Voir et repondre a la proposition"
        onPress={() => router.push({ pathname: '/(screens)/missionResponse', params: { missionId: mission.id } })}
        buttonStyle={styles.actionButton}
      />
    );
  }

  // Labo : animateur a accepte → confirmer
  if (!isAnimator && mission.status === 'animator_accepted' && mission.client_id === userId) {
    return (
      <Button
        title="Confirmer definitivement"
        onPress={() => router.push({ pathname: '/(screens)/missionConfirm', params: { missionId: mission.id } })}
        buttonStyle={styles.actionButton}
      />
    );
  }

  // Labo : proposition envoyee → en attente
  if (!isAnimator && mission.status === 'proposal_sent') {
    return (
      <View style={styles.waitingBanner}>
        <Icon name="clock" size={18} color={theme.colors.textLight} />
        <Text style={styles.waitingText}>En attente de la reponse de l'animateur</Text>
      </View>
    );
  }

  // Animateur : accepte, en attente de confirmation
  if (isAnimator && mission.status === 'animator_accepted') {
    return (
      <View style={styles.waitingBanner}>
        <Icon name="clock" size={18} color={theme.colors.textLight} />
        <Text style={styles.waitingText}>En attente de la confirmation du client</Text>
      </View>
    );
  }

  // Mission confirmee ou assignee → Demarrer (labo uniquement)
  if (['confirmed', 'assigned'].includes(mission.status) && !isAnimator && mission.client_id === userId) {
    return (
      <Button
        title="Demarrer la mission"
        onPress={onStart}
        loading={actionLoading}
        buttonStyle={styles.actionButton}
      />
    );
  }

  // Mission confirmee ou assignee → Animateur voit un bandeau
  if (['confirmed', 'assigned'].includes(mission.status) && isAnimator && mission.animator_id === userId) {
    return (
      <View style={styles.waitingBanner}>
        <Icon name="checkCircle" size={18} color={theme.colors.success} />
        <Text style={styles.waitingText}>Mission confirmee - en attente du demarrage</Text>
      </View>
    );
  }

  // Mission en cours → Terminer (labo uniquement)
  if (mission.status === 'in_progress' && !isAnimator && mission.client_id === userId) {
    return (
      <Button
        title="Terminer la mission"
        onPress={onComplete}
        loading={actionLoading}
        buttonStyle={[styles.actionButton, { backgroundColor: theme.colors.success }]}
      />
    );
  }

  // Mission en cours → Animateur voit un bandeau
  if (mission.status === 'in_progress' && isAnimator && mission.animator_id === userId) {
    return (
      <View style={styles.waitingBanner}>
        <Icon name="play" size={18} color={theme.colors.primary} />
        <Text style={styles.waitingText}>Mission en cours</Text>
      </View>
    );
  }

  // Mission terminee → Laisser un avis
  if (mission.status === 'completed') {
    const isParticipant = (isAnimator && mission.animator_id === userId) ||
                           (!isAnimator && mission.client_id === userId);
    if (isParticipant) {
      return (
        <Button
          title="Laisser un avis"
          onPress={() => router.push({
            pathname: '/(screens)/missionReview',
            params: { missionId: mission.id }
          })}
          buttonStyle={styles.actionButton}
        />
      );
    }
  }

  return null;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
  },
  timelineCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: wp(4),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: theme.colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: hp(1),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp(1.5),
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.md,
    marginBottom: hp(1.5),
  },
  statusConfirmed: {
    backgroundColor: theme.colors.success + '15',
  },
  statusCancelled: {
    backgroundColor: theme.colors.rose + '15',
  },
  statusText: {
    fontSize: hp(1.3),
    fontWeight: '600',
    color: theme.colors.primary,
  },
  statusTextConfirmed: {
    color: theme.colors.success,
  },
  statusTextCancelled: {
    color: theme.colors.rose,
  },
  missionTitle: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: hp(2),
  },
  infoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: wp(4),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  personName: {
    fontSize: hp(1.6),
    fontWeight: '700',
    color: theme.colors.text,
  },
  personSub: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginTop: hp(0.2),
  },
  section: {
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(0.8),
  },
  descriptionText: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    lineHeight: hp(2.2),
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(3),
    marginBottom: hp(2.5),
  },
  infoItem: {
    flex: 1,
    minWidth: wp(26),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: wp(3.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: hp(0.4),
  },
  infoLabel: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  infoValue: {
    fontSize: hp(1.4),
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  infoSub: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  tag: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.md,
  },
  tagText: {
    fontSize: hp(1.3),
    color: theme.colors.primary,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    marginTop: hp(1),
  },
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginTop: hp(1),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  waitingText: {
    flex: 1,
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
});
