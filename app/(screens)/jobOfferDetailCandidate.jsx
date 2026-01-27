import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  getContractTypeLabel,
  getContractColor,
  getPositionTypeLabel,
  getSalaryRangeLabel,
  getExperienceLabel,
  getDiplomaLabel,
  getBenefitLabel,
} from '../../constants/jobOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import Button from '../../components/common/Button';
import ApplyModal from '../../components/application/ApplyModal';
import { notificationService, NOTIFICATION_TYPES } from '../../services/notificationService';

export default function JobOfferDetailCandidate() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadOffer();
      checkIfApplied();
    }
  }, [id]);

  const loadOffer = async () => {
    try {
      const { data, error } = await supabase
        .from('job_offers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setOffer(data);
    } catch (error) {
      console.error('Error loading offer:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'annonce');
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    if (!session?.user?.id) return;
    try {
      const { data } = await supabase
        .from('applications')
        .select('id')
        .eq('job_offer_id', id)
        .eq('candidate_id', session.user.id)
        .single();

      setHasApplied(!!data);
    } catch (error) {
      // Pas de candidature existante
    }
  };

  const handleApplyPress = () => {
    if (!session?.user?.id) {
      Alert.alert('Connexion requise', 'Vous devez être connecté pour postuler.');
      return;
    }

    if (hasApplied) {
      Alert.alert('Déjà postulé', 'Vous avez déjà postulé à cette offre.');
      return;
    }

    setShowApplyModal(true);
  };

  const handleSubmitApplication = async ({ cv_id, message }) => {
    setApplying(true);
    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          job_offer_id: id,
          candidate_id: session.user.id,
          cv_id: cv_id,
          message: message,
          status: 'pending',
        });

      if (error) throw error;

      setHasApplied(true);
      setShowApplyModal(false);
      Alert.alert('Succès', 'Votre candidature a été envoyée !');

      // Notifier le recruteur
      if (offer?.pharmacy_owner_id) {
        notificationService.createNotification(
          offer.pharmacy_owner_id,
          NOTIFICATION_TYPES.APPLICATION_RECEIVED,
          'Nouvelle candidature',
          `Un candidat a postulé à "${offer.title}"`,
          { offer_id: id, offer_type: 'job' }
        ).catch(err => console.error('Error creating application notification:', err));
      }
    } catch (error) {
      console.error('Error applying:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer votre candidature');
    } finally {
      setApplying(false);
    }
  };

  if (loading || !offer) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const contractColor = getContractColor(offer.contract_type);

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={commonStyles.header}>
        <Pressable style={commonStyles.headerButton} onPress={() => router.back()}>
          <Icon name="arrowLeft" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={commonStyles.headerTitle}>Détail de l'offre</Text>
        <View style={commonStyles.headerButton} />
      </View>

      <ScrollView 
        style={commonStyles.flex1} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Card */}
        <View style={commonStyles.card}>
          <View style={[commonStyles.badge, { backgroundColor: contractColor + '15', alignSelf: 'flex-start', marginBottom: hp(1) }]}>
            <Text style={[commonStyles.badgeText, { color: contractColor }]}>
              {getContractTypeLabel(offer.contract_type)}
            </Text>
          </View>
          
          <Text style={styles.title}>{offer.title}</Text>
          <Text style={styles.subtitle}>{getPositionTypeLabel(offer.position_type)}</Text>

          <View style={styles.infoSection}>
            <InfoRow icon="mapPin" text={offer.address || offer.city} />
            <InfoRow icon="map" text={`${offer.city}, ${offer.department}`} />
            {offer.salary_range && (
              <InfoRow icon="briefcase" text={getSalaryRangeLabel(offer.salary_range)} />
            )}
            <InfoRow icon="award" text={getExperienceLabel(offer.required_experience)} />
            {offer.start_date && (
              <InfoRow icon="calendar" text={`Début : ${new Date(offer.start_date).toLocaleDateString('fr-FR')}`} />
            )}
          </View>
        </View>

        {/* Description */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionTitleSmall}>Description</Text>
          <Text style={styles.description}>{offer.description}</Text>
        </View>

        {/* Diplômes requis */}
        {offer.required_diplomas?.length > 0 && (
          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitleSmall}>Diplômes requis</Text>
            <View style={styles.chipsContainer}>
              {offer.required_diplomas.map((d, i) => (
                <View key={i} style={[commonStyles.badge, commonStyles.badgePrimary]}>
                  <Text style={[commonStyles.badgeText, commonStyles.badgeTextPrimary]}>
                    {getDiplomaLabel(d)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Avantages */}
        {offer.benefits?.length > 0 && (
          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitleSmall}>Avantages</Text>
            <View style={styles.chipsContainer}>
              {offer.benefits.map((b, i) => (
                <View key={i} style={styles.benefitChip}>
                  <Icon name="check" size={12} color={theme.colors.success} />
                  <Text style={styles.benefitText}>{getBenefitLabel(b)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Date de publication */}
        <View style={styles.metaInfo}>
          <Icon name="clock" size={14} color={theme.colors.textLight} />
          <Text style={styles.metaText}>
            Publiée le {new Date(offer.created_at).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </Text>
        </View>
      </ScrollView>

      {/* Footer avec bouton postuler */}
      <View style={styles.footer}>
        <Button
          title={hasApplied ? 'Candidature envoyée' : 'Postuler'}
          onPress={handleApplyPress}
          loading={applying}
          disabled={hasApplied}
          buttonStyle={hasApplied ? styles.appliedButton : undefined}
        />
      </View>

      {/* Modal de candidature */}
      <ApplyModal
        visible={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onSubmit={handleSubmitApplication}
        userId={session?.user?.id}
        offerTitle={offer?.title}
        loading={applying}
      />
    </ScreenWrapper>
  );
}

const InfoRow = ({ icon, text }) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={16} color={theme.colors.textLight} />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  scrollContent: {
    padding: wp(5),
    paddingBottom: hp(12),
    gap: hp(2),
  },
  title: {
    fontSize: hp(2.4),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    marginBottom: hp(1.5),
  },
  infoSection: {
    gap: hp(1),
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  infoText: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    flex: 1,
  },
  description: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    lineHeight: hp(2.4),
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginTop: hp(1),
  },
  benefitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    backgroundColor: theme.colors.success + '10',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: theme.radius.md,
  },
  benefitText: {
    fontSize: hp(1.3),
    color: theme.colors.success,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: hp(1),
  },
  metaText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  footer: {
    padding: wp(5),
    paddingBottom: hp(4),
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  appliedButton: {
    backgroundColor: theme.colors.success,
  },
});