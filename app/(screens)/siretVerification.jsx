// app/(screens)/siretVerification.jsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { siretVerificationService } from '../../services/siretVerificationService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function SiretVerification() {
  const router = useRouter();
  const { session, user, refreshUserData } = useAuth();

  const isAnimator = user?.user_type === 'animateur';
  const isLaboratory = user?.user_type === 'laboratoire';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [siretNumber, setSiretNumber] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);

  // Charger le statut actuel
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const status = await siretVerificationService.getVerificationStatus(session.user.id);
      setVerificationStatus(status);
      if (status.siretNumber) {
        setSiretNumber(status.siretNumber);
      }
    } catch (error) {
      console.error('Erreur chargement statut:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const cleanSiret = siretNumber.replace(/\s/g, '');

    if (!cleanSiret || cleanSiret.length !== 14) {
      Alert.alert('Erreur', 'Le numéro SIRET doit contenir exactement 14 chiffres');
      return;
    }

    setSubmitting(true);
    try {
      const result = await siretVerificationService.submitVerification(
        session.user.id,
        cleanSiret
      );

      if (result.verified) {
        Alert.alert(
          'Vérification réussie',
          isAnimator
            ? 'Votre numéro SIRET a été vérifié. Votre profil affiche maintenant le badge vérifié.'
            : 'Votre numéro SIRET a été vérifié. Votre laboratoire est maintenant certifié.',
          [{ text: 'Super !', onPress: () => {
            refreshUserData?.();
            router.back();
          }}]
        );
      } else {
        Alert.alert(
          'Vérification échouée',
          result.message || 'Le numéro SIRET n\'a pas pu être vérifié.',
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
      await siretVerificationService.deleteVerification(session.user.id);
      setVerificationStatus(null);
      setSiretNumber('');
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
          <Text style={styles.statusTitle}>SIRET Vérifié</Text>
          <Text style={styles.statusText}>
            Votre numéro SIRET a été vérifié avec succès.
          </Text>

          <View style={commonStyles.card}>
            <View style={styles.infoRow}>
              <Text style={commonStyles.label}>Numéro SIRET</Text>
              <Text style={styles.siretNumber}>{formatSiretNumber(verificationStatus.siretNumber)}</Text>
            </View>
            {verificationStatus.data?.name && (
              <View style={styles.infoRow}>
                <Text style={commonStyles.label}>Raison sociale</Text>
                <Text style={styles.infoValue}>{verificationStatus.data.name}</Text>
              </View>
            )}
            {verificationStatus.data?.activity && (
              <View style={styles.infoRow}>
                <Text style={commonStyles.label}>Activité</Text>
                <Text style={styles.infoValue}>{verificationStatus.data.activity}</Text>
              </View>
            )}
          </View>

          <Text style={[commonStyles.hint, commonStyles.textCenter, { marginTop: hp(3) }]}>
            {isAnimator
              ? 'Votre profil affiche maintenant le badge vérifié, renforçant votre crédibilité auprès des laboratoires.'
              : 'Votre laboratoire est maintenant certifié, ce qui renforce votre crédibilité auprès des animateurs.'}
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
            {verificationStatus.rejectionReason || 'Le numéro SIRET n\'a pas pu être vérifié.'}
          </Text>

          <View style={[commonStyles.card, { backgroundColor: theme.colors.rose + '10' }]}>
            <Text style={commonStyles.hint}>
              Numéro soumis : {formatSiretNumber(verificationStatus.siretNumber)}
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
            {isAnimator
              ? 'La vérification SIRET permet de certifier votre statut d\'auto-entrepreneur et d\'obtenir le badge vérifié sur votre profil.'
              : 'La vérification SIRET permet de certifier votre laboratoire et d\'obtenir le badge "Labo Vérifié".'}
          </Text>
        </View>

        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Numéro SIRET</Text>
          <Input
            icon={<Icon name="fileText" size={22} color={theme.colors.textLight} />}
            placeholder="Entrez vos 14 chiffres"
            keyboardType="numeric"
            maxLength={17} // 14 chiffres + 3 espaces
            value={siretNumber}
            onChangeText={(v) => {
              // Autoriser seulement les chiffres et espaces
              const cleaned = v.replace(/[^\d\s]/g, '');
              setSiretNumber(cleaned);
            }}
          />
          <Text style={commonStyles.hint}>
            {siretNumber.replace(/\s/g, '').length}/14 chiffres
          </Text>
        </View>

        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Où trouver mon numéro SIRET ?</Text>
          <Text style={commonStyles.hint}>
            • Sur votre avis de situation INSEE{'\n'}
            • Sur vos factures{'\n'}
            • Sur le site infogreffe.fr{'\n'}
            • Sur votre certificat d'inscription au répertoire SIRENE
          </Text>
        </View>

        <Button
          title="Vérifier mon SIRET"
          loading={submitting}
          disabled={siretNumber.replace(/\s/g, '').length !== 14}
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
        <Text style={commonStyles.headerTitle}>Vérification SIRET</Text>
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

// Formate le SIRET pour l'affichage (XXX XXX XXX XXXXX)
const formatSiretNumber = (siret) => {
  if (!siret) return '';
  const clean = siret.replace(/\s/g, '');
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4');
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
  siretNumber: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: hp(1.6),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    textAlign: 'right',
    flex: 1,
    marginLeft: wp(2),
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
