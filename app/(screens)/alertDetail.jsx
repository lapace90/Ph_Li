// Détail d'une alerte urgente — pour le créateur (titulaire/labo)
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAlert, useAlertResponses } from '../../hooks/useUrgentAlerts';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Button from '../../components/common/Button';
import Icon from '../../assets/icons/Icon';
import { EmptyState } from '../../components/common/DashboardComponents';

const STATUS_CONFIG = {
  active: { color: theme.colors.warning, label: 'Active', icon: 'zap' },
  filled: { color: theme.colors.success, label: 'Pourvue', icon: 'checkCircle' },
  expired: { color: theme.colors.textLight, label: 'Expirée', icon: 'clock' },
  cancelled: { color: theme.colors.rose, label: 'Annulée', icon: 'x' },
};

const RESPONSE_STATUS = {
  interested: { color: theme.colors.warning, label: 'Intéressé', icon: 'clock' },
  accepted: { color: theme.colors.success, label: 'Accepté', icon: 'check' },
  rejected: { color: theme.colors.rose, label: 'Refusé', icon: 'x' },
};

export default function AlertDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { alert: alertData, loading: alertLoading } = useAlert(id);
  const { responses, loading: responsesLoading, stats, acceptCandidate, rejectCandidate } = useAlertResponses(id);
  const [actionLoading, setActionLoading] = useState(null);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const handleAccept = async (candidateId, name) => {
    Alert.alert(
      'Accepter ce candidat ?',
      `${name} sera notifié et l'alerte sera marquée comme pourvue.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            setActionLoading(candidateId);
            const result = await acceptCandidate(candidateId);
            setActionLoading(null);
            if (!result.success) {
              Alert.alert('Erreur', result.error || 'Impossible d\'accepter ce candidat');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (candidateId) => {
    setActionLoading(candidateId);
    const result = await rejectCandidate(candidateId);
    setActionLoading(null);
    if (!result.success) {
      Alert.alert('Erreur', result.error || 'Impossible de refuser ce candidat');
    }
  };

  if (alertLoading) {
    return (
      <ScreenWrapper>
        <View style={commonStyles.header}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Détail alerte</Text>
          <View style={commonStyles.headerSpacer} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!alertData) {
    return (
      <ScreenWrapper>
        <View style={commonStyles.header}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Détail alerte</Text>
          <View style={commonStyles.headerSpacer} />
        </View>
        <EmptyState icon="alertCircle" title="Alerte introuvable" subtitle="Cette alerte n'existe plus" />
      </ScreenWrapper>
    );
  }

  const config = STATUS_CONFIG[alertData.status] || STATUS_CONFIG.active;
  const isActive = alertData.status === 'active';

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Détail alerte</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <ScrollView
        style={commonStyles.flex1}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status + Title */}
        <View style={styles.headerSection}>
          <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
            <Icon name={config.icon} size={14} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
          <Text style={styles.title}>{alertData.title}</Text>
          {alertData.description && (
            <Text style={styles.description}>{alertData.description}</Text>
          )}
        </View>

        {/* Info grid */}
        <View style={commonStyles.card}>
          <InfoRow icon="mapPin" label="Lieu" value={`${alertData.city || '—'} (${alertData.radius_km} km)`} />
          <InfoRow icon="calendar" label="Période" value={`${formatDate(alertData.start_date)} - ${formatDate(alertData.end_date)}`} />
          <InfoRow icon="user" label="Profil recherché" value={
            alertData.position_type === 'animateur' ? 'Animateur' :
            alertData.position_type === 'preparateur' ? 'Préparateur' :
            alertData.position_type === 'conseiller' ? 'Conseiller' : 'Étudiant'
          } />
          {alertData.hourly_rate && (
            <InfoRow icon="dollarSign" label="Rémunération" value={`${alertData.hourly_rate}€/h`} highlight />
          )}
          {alertData.notified_count > 0 && (
            <InfoRow icon="bell" label="Notifiés" value={`${alertData.notified_count} personne${alertData.notified_count > 1 ? 's' : ''}`} />
          )}
        </View>

        {/* Responses section */}
        <View style={styles.responsesSection}>
          <View style={commonStyles.rowBetween}>
            <Text style={commonStyles.sectionTitle}>Candidatures</Text>
            <Text style={styles.responseCount}>
              {stats.total} réponse{stats.total > 1 ? 's' : ''}
            </Text>
          </View>

          {stats.total > 0 && (
            <View style={styles.responsesStats}>
              <View style={[styles.responseStatBadge, { backgroundColor: theme.colors.warning + '15' }]}>
                <Text style={[styles.responseStatText, { color: theme.colors.warning }]}>{stats.interested} en attente</Text>
              </View>
              <View style={[styles.responseStatBadge, { backgroundColor: theme.colors.success + '15' }]}>
                <Text style={[styles.responseStatText, { color: theme.colors.success }]}>{stats.accepted} accepté{stats.accepted > 1 ? 's' : ''}</Text>
              </View>
            </View>
          )}

          {responsesLoading ? (
            <View style={commonStyles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : responses.length === 0 ? (
            <View style={styles.noResponses}>
              <Icon name="inbox" size={32} color={theme.colors.gray} />
              <Text style={styles.noResponsesText}>Aucune candidature pour le moment</Text>
              <Text style={commonStyles.hint}>Les candidats notifiés apparaîtront ici</Text>
            </View>
          ) : (
            <View style={styles.responsesList}>
              {responses.map(response => {
                const rConfig = RESPONSE_STATUS[response.status] || RESPONSE_STATUS.interested;
                const profile = response.candidate_profile;
                const name = profile?.profile
                  ? `${profile.profile.first_name} ${profile.profile.last_name}`
                  : profile?.first_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : 'Candidat';

                return (
                  <View key={response.id} style={styles.responseCard}>
                    <View style={styles.responseHeader}>
                      <View style={styles.responseAvatar}>
                        {(profile?.profile?.photo_url || profile?.photo_url) ? (
                          <Image
                            source={{ uri: profile?.profile?.photo_url || profile?.photo_url }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <View style={styles.avatarPlaceholder}>
                            <Icon name="user" size={18} color={theme.colors.textLight} />
                          </View>
                        )}
                      </View>
                      <View style={commonStyles.flex1}>
                        <Text style={styles.responseName}>{name}</Text>
                        <View style={styles.responseInfo}>
                          {(profile?.profile?.current_city || profile?.current_city) && (
                            <Text style={styles.responseInfoText}>
                              {profile?.profile?.current_city || profile?.current_city}
                            </Text>
                          )}
                          {profile?.average_rating && (
                            <Text style={styles.responseInfoText}>
                              ★ {profile.average_rating.toFixed(1)}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={[styles.responseStatusBadge, { backgroundColor: rConfig.color + '15' }]}>
                        <Text style={[styles.responseStatusText, { color: rConfig.color }]}>{rConfig.label}</Text>
                      </View>
                    </View>

                    {response.message && (
                      <Text style={styles.responseMessage} numberOfLines={2}>"{response.message}"</Text>
                    )}

                    {response.status === 'interested' && isActive && (
                      <View style={styles.responseActions}>
                        <Pressable
                          style={[styles.actionButton, styles.rejectButton]}
                          onPress={() => handleReject(response.candidate_id)}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === response.candidate_id ? (
                            <ActivityIndicator size="small" color={theme.colors.rose} />
                          ) : (
                            <>
                              <Icon name="x" size={16} color={theme.colors.rose} />
                              <Text style={[styles.actionText, { color: theme.colors.rose }]}>Refuser</Text>
                            </>
                          )}
                        </Pressable>
                        <Pressable
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => handleAccept(response.candidate_id, name)}
                          disabled={!!actionLoading}
                        >
                          <Icon name="check" size={16} color="#fff" />
                          <Text style={[styles.actionText, { color: '#fff' }]}>Accepter</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

// Sous-composant ligne d'info
const InfoRow = ({ icon, label, value, highlight }) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={16} color={highlight ? theme.colors.primary : theme.colors.textLight} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, highlight && { color: theme.colors.primary, fontFamily: theme.fonts.semiBold }]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(10),
    gap: hp(2),
  },
  headerSection: {
    gap: hp(1),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp(1.5),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.md,
  },
  statusText: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
  },
  title: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  description: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    lineHeight: hp(2.2),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    width: wp(25),
  },
  infoValue: {
    flex: 1,
    fontSize: hp(1.5),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    textAlign: 'right',
  },
  responsesSection: {
    gap: hp(1.5),
  },
  responseCount: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  responsesStats: {
    flexDirection: 'row',
    gap: wp(2),
  },
  responseStatBadge: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.4),
    borderRadius: theme.radius.md,
  },
  responseStatText: {
    fontSize: hp(1.2),
    fontFamily: theme.fonts.medium,
  },
  noResponses: {
    alignItems: 'center',
    paddingVertical: hp(4),
    gap: hp(1),
  },
  noResponsesText: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  responsesList: {
    gap: hp(1.5),
  },
  responseCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: hp(1.2),
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  responseAvatar: {},
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  responseName: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  responseInfo: {
    flexDirection: 'row',
    gap: wp(2),
    marginTop: hp(0.2),
  },
  responseInfoText: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },
  responseStatusBadge: {
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  responseStatusText: {
    fontSize: hp(1.1),
    fontFamily: theme.fonts.semiBold,
  },
  responseMessage: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    fontStyle: 'italic',
    paddingLeft: wp(2),
  },
  responseActions: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: hp(0.5),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.5),
    paddingVertical: hp(1),
    borderRadius: theme.radius.lg,
  },
  rejectButton: {
    backgroundColor: theme.colors.rose + '15',
  },
  acceptButton: {
    backgroundColor: theme.colors.success,
  },
  actionText: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
  },
});
