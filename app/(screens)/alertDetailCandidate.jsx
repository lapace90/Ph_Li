// Détail d'une alerte urgente — pour candidat/animateur (répondre)
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../hooks/useUrgentAlerts';
import { urgentAlertService } from '../../services/urgentAlertService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Button from '../../components/common/Button';
import Icon from '../../assets/icons/Icon';
import { EmptyState } from '../../components/common/DashboardComponents';

export default function AlertDetailCandidate() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const { alert: alertData, loading } = useAlert(id);

  const [hasResponded, setHasResponded] = useState(false);
  const [checkingResponse, setCheckingResponse] = useState(true);
  const [responding, setResponding] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);

  // Check if already responded
  useEffect(() => {
    const check = async () => {
      if (!id || !session?.user?.id) return;
      try {
        const responded = await urgentAlertService.hasResponded(id, session.user.id);
        setHasResponded(responded);
      } catch {
        // ignore
      } finally {
        setCheckingResponse(false);
      }
    };
    check();
  }, [id, session?.user?.id]);

  const handleRespond = async () => {
    setResponding(true);
    try {
      await urgentAlertService.respond(id, session.user.id, message.trim() || null);
      setHasResponded(true);
      Alert.alert(
        'Candidature envoyée !',
        'Le recruteur a été notifié de votre intérêt.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer votre candidature');
    } finally {
      setResponding(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }) : '—';

  const formatDateShort = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short'
  }) : '—';

  const getDaysCount = () => {
    if (!alertData?.start_date || !alertData?.end_date) return 0;
    const diff = new Date(alertData.end_date) - new Date(alertData.start_date);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={commonStyles.header}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Alerte urgente</Text>
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
          <Text style={commonStyles.headerTitle}>Alerte urgente</Text>
          <View style={commonStyles.headerSpacer} />
        </View>
        <EmptyState icon="alertCircle" title="Alerte introuvable" subtitle="Cette alerte n'est plus disponible" />
      </ScreenWrapper>
    );
  }

  const isExpired = alertData.status !== 'active';
  const daysCount = getDaysCount();

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Alerte urgente</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <ScrollView
        style={commonStyles.flex1}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Urgent banner */}
        <View style={styles.urgentBanner}>
          <Icon name="zap" size={20} color={theme.colors.warning} />
          <View style={commonStyles.flex1}>
            <Text style={styles.urgentTitle}>Remplacement urgent</Text>
            {alertData.distance_km !== undefined && (
              <Text style={styles.urgentDistance}>à {alertData.distance_km} km de vous</Text>
            )}
          </View>
          {isExpired && (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredText}>
                {alertData.status === 'filled' ? 'Pourvue' : 'Expirée'}
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{alertData.title}</Text>

        {/* Description */}
        {alertData.description && (
          <Text style={styles.description}>{alertData.description}</Text>
        )}

        {/* Info card */}
        <View style={commonStyles.card}>
          <View style={styles.infoGrid}>
            <InfoBlock icon="calendar" label="Période" value={`${formatDateShort(alertData.start_date)} - ${formatDateShort(alertData.end_date)}`} subvalue={daysCount > 0 ? `${daysCount} jour${daysCount > 1 ? 's' : ''}` : null} />
            <InfoBlock icon="mapPin" label="Lieu" value={alertData.city || '—'} subvalue={`Rayon ${alertData.radius_km} km`} />
          </View>
          <View style={styles.infoGrid}>
            <InfoBlock
              icon="dollarSign"
              label="Rémunération"
              value={alertData.hourly_rate ? `${alertData.hourly_rate}€/h` : 'Non précisée'}
              highlight={!!alertData.hourly_rate}
            />
            <InfoBlock
              icon="user"
              label="Profil recherché"
              value={
                alertData.position_type === 'animateur' ? 'Animateur' :
                alertData.position_type === 'preparateur' ? 'Préparateur' :
                alertData.position_type === 'conseiller' ? 'Conseiller' : 'Étudiant'
              }
            />
          </View>
        </View>

        {/* Required specialties */}
        {alertData.required_specialties?.length > 0 && (
          <View style={styles.specialtiesSection}>
            <Text style={commonStyles.sectionTitle}>Spécialités requises</Text>
            <View style={commonStyles.chipsContainer}>
              {alertData.required_specialties.map(s => (
                <View key={s} style={styles.specialtyChip}>
                  <Text style={styles.specialtyText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Creator info */}
        {alertData.creator_profile && (
          <View style={styles.creatorCard}>
            <Icon name="building" size={20} color={theme.colors.primary} />
            <View style={commonStyles.flex1}>
              <Text style={styles.creatorName}>
                {alertData.creator_profile.brand_name || alertData.creator_profile.company_name}
              </Text>
              <Text style={commonStyles.hint}>Publié par</Text>
            </View>
          </View>
        )}

        {/* Response section */}
        {!isExpired && !checkingResponse && (
          <View style={styles.responseSection}>
            {hasResponded ? (
              <View style={styles.respondedCard}>
                <Icon name="checkCircle" size={24} color={theme.colors.success} />
                <View style={commonStyles.flex1}>
                  <Text style={styles.respondedTitle}>Candidature envoyée</Text>
                  <Text style={commonStyles.hint}>Le recruteur examinera votre profil</Text>
                </View>
              </View>
            ) : (
              <>
                {showMessageInput && (
                  <View style={styles.messageSection}>
                    <Text style={commonStyles.label}>Message (optionnel)</Text>
                    <TextInput
                      style={styles.messageInput}
                      value={message}
                      onChangeText={setMessage}
                      placeholder="Présentez-vous brièvement..."
                      placeholderTextColor={theme.colors.textLight}
                      multiline
                      maxLength={300}
                    />
                    <Text style={styles.charCount}>{message.length}/300</Text>
                  </View>
                )}

                {!showMessageInput && (
                  <Pressable style={styles.addMessageLink} onPress={() => setShowMessageInput(true)}>
                    <Icon name="edit" size={14} color={theme.colors.primary} />
                    <Text style={styles.addMessageText}>Ajouter un message</Text>
                  </Pressable>
                )}

                <Button
                  title="Je suis disponible !"
                  onPress={handleRespond}
                  loading={responding}
                  buttonStyle={{ backgroundColor: theme.colors.warning }}
                />
              </>
            )}
          </View>
        )}

        {isExpired && (
          <View style={styles.expiredCard}>
            <Icon name="clock" size={24} color={theme.colors.textLight} />
            <Text style={styles.expiredCardText}>
              {alertData.status === 'filled'
                ? 'Cette alerte a été pourvue'
                : 'Cette alerte a expiré'}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

// Sous-composant bloc d'info
const InfoBlock = ({ icon, label, value, subvalue, highlight }) => (
  <View style={styles.infoBlock}>
    <Icon name={icon} size={16} color={highlight ? theme.colors.primary : theme.colors.textLight} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, highlight && { color: theme.colors.primary }]}>{value}</Text>
    {subvalue && <Text style={styles.infoSubvalue}>{subvalue}</Text>}
  </View>
);

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(10),
    gap: hp(2),
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: theme.colors.warning + '10',
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
  },
  urgentTitle: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.warning,
  },
  urgentDistance: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    marginTop: hp(0.2),
  },
  expiredBadge: {
    backgroundColor: theme.colors.textLight + '20',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  expiredText: {
    fontSize: hp(1.2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.textLight,
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
  infoGrid: {
    flexDirection: 'row',
    gap: wp(3),
  },
  infoBlock: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(1.5),
    gap: hp(0.3),
  },
  infoLabel: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },
  infoValue: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  infoSubvalue: {
    fontSize: hp(1.1),
    color: theme.colors.textLight,
  },
  specialtiesSection: {
    gap: hp(1),
  },
  specialtyChip: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.md,
  },
  specialtyText: {
    fontSize: hp(1.3),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: theme.colors.card,
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  creatorName: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  responseSection: {
    gap: hp(1.5),
  },
  respondedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: theme.colors.success + '10',
    padding: hp(2),
    borderRadius: theme.radius.lg,
  },
  respondedTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.success,
  },
  messageSection: {
    gap: hp(0.5),
  },
  messageInput: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: hp(1.5),
    color: theme.colors.text,
    minHeight: hp(10),
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: hp(1.1),
    color: theme.colors.textLight,
    textAlign: 'right',
  },
  addMessageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    alignSelf: 'flex-start',
  },
  addMessageText: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  expiredCard: {
    alignItems: 'center',
    gap: hp(1),
    paddingVertical: hp(3),
  },
  expiredCardText: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});
