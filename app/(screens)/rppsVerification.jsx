// app/(screens)/rppsVerification.jsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { rppsService } from '../../services/rppsService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function RppsVerification() {
  const router = useRouter();
  const { session, user, profile, refreshUserData } = useAuth();
  
  const isTitulaire = user?.user_type === 'titulaire';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rppsNumber, setRppsNumber] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);

  // Charger le statut actuel
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const status = await rppsService.getVerificationStatus(session.user.id);
      setVerificationStatus(status);
      if (status.rppsNumber) {
        setRppsNumber(status.rppsNumber);
      }
    } catch (error) {
      console.error('Erreur chargement statut:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!rppsNumber || rppsNumber.length !== 11) {
      Alert.alert('Erreur', 'Le numéro RPPS doit contenir exactement 11 chiffres');
      return;
    }

    setSubmitting(true);
    try {
      const result = await rppsService.submitVerification(
        session.user.id,
        rppsNumber,
        profile.first_name,
        profile.last_name
      );

      if (result.verified) {
        Alert.alert(
          'Vérification réussie ✓',
          isTitulaire 
            ? 'Votre numéro RPPS a été vérifié. Vous pouvez maintenant publier des annonces.'
            : 'Votre numéro RPPS a été vérifié. Votre profil affiche maintenant le badge vérifié.',
          [{ text: 'Super !', onPress: () => {
            refreshUserData?.();
            router.back();
          }}]
        );
      } else {
        Alert.alert(
          'Vérification échouée',
          result.message || 'Le numéro RPPS n\'a pas pu être vérifié.',
          [{ text: 'Compris' }]
        );
        await loadStatus();
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async () => {
    try {
      await rppsService.deleteVerification(session.user.id);
      setVerificationStatus(null);
      setRppsNumber('');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de réinitialiser la vérification');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={[commonStyles.flex1, commonStyles.centered]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    // Déjà vérifié
    if (verificationStatus?.verified) {
      return (
        <View style={styles.statusContainer}>
          <View style={styles.successIcon}>
            <Icon name="checkCircle" size={60} color={theme.colors.success} />
          </View>
          <Text style={styles.statusTitle}>RPPS Vérifié ✓</Text>
          <Text style={styles.statusText}>
            Votre numéro RPPS a été vérifié avec succès.
          </Text>

          <View style={commonStyles.card}>
            <View style={styles.infoRow}>
              <Text style={commonStyles.label}>Numéro RPPS</Text>
              <Text style={styles.rppsNumber}>{formatRppsNumber(verificationStatus.rppsNumber)}</Text>
            </View>
            {verificationStatus.data?.profession && (
              <View style={styles.infoRow}>
                <Text style={commonStyles.label}>Profession</Text>
                <Text style={styles.infoValue}>{verificationStatus.data.profession}</Text>
              </View>
            )}
          </View>

          <Text style={[commonStyles.hint, commonStyles.textCenter, { marginTop: hp(3) }]}>
            {isTitulaire 
              ? 'Vous pouvez maintenant publier des offres d\'emploi, de stages et d\'annonces de pharmacies.'
              : 'Votre profil affiche maintenant le badge vérifié, renforçant votre crédibilité auprès des recruteurs.'}
          </Text>
        </View>
      );
    }

    // Rejeté
    if (verificationStatus?.status === 'rejected') {
      return (
        <View style={styles.statusContainer}>
          <View style={styles.errorIcon}>
            <Icon name="x" size={60} color={theme.colors.rose} />
          </View>
          <Text style={[styles.statusTitle, { color: theme.colors.rose }]}>Vérification échouée</Text>
          <Text style={styles.statusText}>
            {verificationStatus.rejectionReason || 'Le numéro RPPS n\'a pas pu être vérifié.'}
          </Text>

          <View style={[commonStyles.card, { backgroundColor: theme.colors.rose + '10' }]}>
            <Text style={commonStyles.hint}>
              Numéro soumis : {formatRppsNumber(verificationStatus.rppsNumber)}
            </Text>
          </View>

          <Button
            title="Réessayer"
            onPress={handleRetry}
            buttonStyle={{ marginTop: hp(3) }}
          />
        </View>
      );
    }

    // Formulaire de soumission
    return (
      <View style={styles.formContainer}>
        <View style={styles.infoCard}>
          <Icon name="info" size={24} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            {isTitulaire 
              ? 'La vérification RPPS permet de certifier votre statut de professionnel de santé et d\'accéder à la publication d\'annonces.'
              : 'La vérification RPPS permet de certifier votre statut de professionnel de santé et d\'obtenir le badge vérifié sur votre profil.'}
          </Text>
        </View>

        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Votre identité</Text>
          <View style={commonStyles.card}>
            <Text style={styles.identityName}>
              {profile?.first_name} {profile?.last_name}
            </Text>
            <Text style={commonStyles.hint}>
              Ces informations seront comparées avec le titulaire du numéro RPPS
            </Text>
          </View>
        </View>

        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Numéro RPPS</Text>
          <Input
            icon={<Icon name="hash" size={22} color={theme.colors.textLight} />}
            placeholder="Entrez vos 11 chiffres"
            keyboardType="numeric"
            maxLength={11}
            value={rppsNumber}
            onChangeText={(v) => setRppsNumber(v.replace(/\D/g, ''))}
          />
          <Text style={commonStyles.hint}>
            {rppsNumber.length}/11 chiffres
          </Text>
        </View>

        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Où trouver mon numéro RPPS ?</Text>
          <Text style={commonStyles.hint}>
            • Sur votre carte CPS{'\n'}
            • Sur l'Annuaire Santé (annuaire.sante.fr){'\n'}
            • Sur votre attestation de l'Ordre
          </Text>
        </View>

        <Button
          title="Vérifier mon RPPS"
          loading={submitting}
          disabled={rppsNumber.length !== 11}
          onPress={handleSubmit}
          buttonStyle={styles.submitButton}
        />
      </View>
    );
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={commonStyles.header}>
        <Pressable style={commonStyles.headerButton} onPress={() => router.back()}>
          <Icon name="arrowLeft" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={commonStyles.headerTitle}>Vérification RPPS</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <ScrollView
        style={commonStyles.flex1}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderContent()}
      </ScrollView>
    </ScreenWrapper>
  );
}

// Formate le RPPS pour l'affichage (XXX XXX XXX XX)
const formatRppsNumber = (rpps) => {
  if (!rpps) return '';
  return rpps.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1 $2 $3 $4');
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    paddingBottom: hp(4),
  },
  statusContainer: {
    alignItems: 'center',
    paddingTop: hp(4),
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.rose + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  statusTitle: {
    fontSize: hp(2.4),
    fontFamily: theme.fonts.bold,
    color: theme.colors.success,
    marginBottom: hp(1),
  },
  statusText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: hp(3),
    paddingHorizontal: wp(5),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1),
  },
  rppsNumber: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: hp(1.6),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  formContainer: {
    gap: hp(2),
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary + '10',
    padding: hp(2),
    borderRadius: theme.radius.lg,
    gap: wp(3),
  },
  infoText: {
    flex: 1,
    fontSize: hp(1.5),
    color: theme.colors.primary,
    lineHeight: hp(2.2),
  },
  identityName: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  helpCard: {
    backgroundColor: theme.colors.card,
    padding: hp(2),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  helpTitle: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(1),
  },
  submitButton: {
    marginTop: hp(2),
  },
});