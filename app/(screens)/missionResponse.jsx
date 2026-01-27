// Ecran de reponse a une proposition de mission (cote Animateur)

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

export default function MissionResponse() {
  const router = useRouter();
  const { missionId, matchId } = useLocalSearchParams();
  const { session } = useAuth();

  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadMission();
  }, [missionId]);

  const loadMission = async () => {
    try {
      const data = await missionService.getById(missionId);
      setMission(data);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger la proposition');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading('accept');
    try {
      await missionService.acceptProposal(missionId, session?.user?.id);
      Alert.alert(
        'Proposition acceptee',
        'Le laboratoire va maintenant confirmer definitivement la mission.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'accepter la proposition.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async () => {
    Alert.alert(
      'Decliner la proposition',
      'Etes-vous sur de vouloir decliner cette proposition ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, decliner',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('decline');
            try {
              await missionService.declineProposal(missionId, session?.user?.id);
              Alert.alert('Proposition declinee', 'La mission reste disponible pour d\'autres animateurs.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err) {
              Alert.alert('Erreur', 'Impossible de decliner la proposition.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleDiscuss = () => {
    if (matchId) {
      router.push({ pathname: '/(screens)/conversation', params: { matchId } });
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

  if (!mission) return null;

  const clientProfile = mission.client_profile;
  const days = mission.start_date && mission.end_date
    ? missionService._getDatesBetween(mission.start_date, mission.end_date).length
    : 0;
  const isProposal = mission.status === 'proposal_sent';

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Proposition de mission</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <ScrollView style={commonStyles.flex1} contentContainerStyle={styles.content}>
        {/* Timeline */}
        <MissionTimeline status={mission.status} />

        {/* En-tete client */}
        <View style={styles.clientCard}>
          <View style={styles.clientHeader}>
            {clientProfile?.logo_url ? (
              <Image source={{ uri: clientProfile.logo_url }} style={styles.clientLogo} />
            ) : (
              <View style={[styles.clientLogo, commonStyles.centered, { backgroundColor: theme.colors.primary + '15' }]}>
                <Icon name="building" size={22} color={theme.colors.primary} />
              </View>
            )}
            <View style={commonStyles.flex1}>
              <Text style={styles.clientName}>
                {clientProfile?.company_name || clientProfile?.brand_name || `${clientProfile?.first_name || ''} ${clientProfile?.last_name || ''}`}
              </Text>
              <Text style={styles.clientType}>
                {mission.client_type === 'laboratory' ? 'Laboratoire' : 'Pharmacie titulaire'}
              </Text>
            </View>
          </View>
        </View>

        {/* Titre mission */}
        <Text style={styles.missionTitle}>{mission.title}</Text>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{mission.description}</Text>
        </View>

        {/* Grille d'infos */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Icon name="calendar" size={18} color={theme.colors.primary} />
            <Text style={styles.infoLabel}>Dates</Text>
            <Text style={styles.infoValue}>
              {mission.start_date ? new Date(mission.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '?'}
              {' - '}
              {mission.end_date ? new Date(mission.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '?'}
            </Text>
            <Text style={styles.infoSub}>{days} jour{days > 1 ? 's' : ''}</Text>
          </View>

          <View style={styles.infoItem}>
            <Icon name="mapPin" size={18} color={theme.colors.primary} />
            <Text style={styles.infoLabel}>Lieu</Text>
            <Text style={styles.infoValue}>{mission.city || 'Non precise'}</Text>
            {mission.department && <Text style={styles.infoSub}>{mission.department}</Text>}
          </View>

          <View style={styles.infoItem}>
            <Icon name="dollarSign" size={18} color={theme.colors.primary} />
            <Text style={styles.infoLabel}>Tarif journalier</Text>
            <Text style={styles.infoValue}>{mission.daily_rate_min} EUR</Text>
            {days > 0 && <Text style={styles.infoSub}>Total : {mission.daily_rate_min * days} EUR</Text>}
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

        {/* Actions (seulement si status = proposal_sent) */}
        {isProposal && (
          <View style={styles.actionsContainer}>
            <View style={styles.actionsRow}>
              <Button
                title="Decliner"
                onPress={handleDecline}
                loading={actionLoading === 'decline'}
                buttonStyle={styles.declineButton}
                textStyle={styles.declineButtonText}
              />
              <Button
                title="Accepter"
                onPress={handleAccept}
                loading={actionLoading === 'accept'}
                buttonStyle={styles.acceptButton}
              />
            </View>
            <Pressable style={styles.discussButton} onPress={handleDiscuss}>
              <Icon name="messageCircle" size={18} color={theme.colors.primary} />
              <Text style={styles.discussButtonText}>Discuter avant de decider</Text>
            </Pressable>
          </View>
        )}

        {/* Statut non-actionnable */}
        {!isProposal && (
          <View style={styles.statusBanner}>
            <Icon
              name={mission.status === 'animator_accepted' ? 'checkCircle' : 'clock'}
              size={20}
              color={mission.status === 'animator_accepted' ? theme.colors.success : theme.colors.textLight}
            />
            <Text style={styles.statusText}>
              {mission.status === 'animator_accepted'
                ? 'Vous avez accepte cette proposition. En attente de confirmation du client.'
                : mission.status === 'confirmed'
                ? 'Mission confirmee !'
                : `Statut : ${mission.status}`
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
  },
  clientCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: wp(4),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  clientLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  clientName: {
    fontSize: hp(1.7),
    fontWeight: '700',
    color: theme.colors.text,
  },
  clientType: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginTop: hp(0.2),
  },
  missionTitle: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: hp(2),
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
    textAlign: 'center',
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
  actionsContainer: {
    marginTop: hp(1),
    gap: hp(1.5),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: wp(3),
  },
  declineButton: {
    flex: 1,
    backgroundColor: theme.colors.rose + '15',
    borderWidth: 1,
    borderColor: theme.colors.rose + '40',
  },
  declineButtonText: {
    color: theme.colors.rose,
  },
  acceptButton: {
    flex: 2,
    backgroundColor: theme.colors.success,
  },
  discussButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  discussButtonText: {
    fontSize: hp(1.5),
    fontWeight: '500',
    color: theme.colors.primary,
  },
  statusBanner: {
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
  statusText: {
    flex: 1,
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    lineHeight: hp(2),
  },
});
