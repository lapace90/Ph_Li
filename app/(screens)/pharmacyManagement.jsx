// app/(screens)/pharmacyManagement.jsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { siretVerificationService } from '../../services/siretVerificationService';
import { usePharmacyDetails } from '../../hooks/usePharmacyDetails';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import Button from '../../components/common/Button';
import SiretBadge from '../../components/common/SiretBadge';

export default function PharmacyManagement() {
  const router = useRouter();
  const { session, user } = useAuth();
  const { pharmacies, loading: pharmaciesLoading, addPharmacy } = usePharmacyDetails(session?.user?.id);

  const [siretVerificationStatus, setSiretVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger le statut de vérification SIRET personnel
  useEffect(() => {
    loadSiretStatus();
  }, []);

  const loadSiretStatus = async () => {
    if (!session?.user?.id) return;
    try {
      const status = await siretVerificationService.getVerificationStatus(session.user.id);
      setSiretVerificationStatus(status);
    } catch (error) {
      console.error('Erreur chargement statut SIRET:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPharmacy = () => {
    Alert.alert(
      'Ajouter une pharmacie',
      'Voulez-vous vérifier une pharmacie via son SIRET ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vérifier SIRET',
          onPress: () => {
            Alert.prompt(
              'SIRET de la pharmacie',
              'Entrez le numéro SIRET (14 chiffres)',
              async (siret) => {
                if (siret && siret.replace(/\s/g, '').length === 14) {
                  const result = await addPharmacy(siret);
                  if (result.success) {
                    Alert.alert('Succès', 'Pharmacie ajoutée et vérifiée');
                  } else {
                    Alert.alert('Erreur', result.error || 'Impossible d\'ajouter la pharmacie');
                  }
                } else {
                  Alert.alert('Erreur', 'Le SIRET doit contenir 14 chiffres');
                }
              }
            );
          },
        },
      ]
    );
  };

  const renderPersonalVerification = () => (
    <View style={commonStyles.section}>
      <Text style={commonStyles.sectionTitle}>Vérification personnelle</Text>
      <Text style={commonStyles.sectionHint}>
        Vérifiez votre SIRET personnel pour obtenir le badge "Titulaire Vérifié"
      </Text>

      {siretVerificationStatus?.verified ? (
        <View style={styles.verifiedCard}>
          <Icon name="checkCircle" size={24} color={theme.colors.success} />
          <View style={commonStyles.flex1}>
            <Text style={styles.verifiedTitle}>SIRET Personnel Vérifié</Text>
            <Text style={styles.verifiedSubtitle}>
              {siretVerificationStatus.siretNumber?.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(screens)/siretVerification')}>
            <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={styles.verifyButton}
          onPress={() => router.push('/(screens)/siretVerification')}
        >
          <View style={styles.verifyIcon}>
            <Icon name="shield" size={28} color={theme.colors.primary} />
          </View>
          <View style={commonStyles.flex1}>
            <Text style={styles.verifyTitle}>Vérifier mon SIRET</Text>
            <Text style={commonStyles.hint}>
              Badge vérifié + crédibilité renforcée
            </Text>
          </View>
          <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
        </Pressable>
      )}
    </View>
  );

  const renderPharmacies = () => (
    <View style={commonStyles.section}>
      <View style={commonStyles.rowBetween}>
        <Text style={commonStyles.sectionTitle}>Mes pharmacies</Text>
        <Pressable onPress={handleAddPharmacy} style={styles.addButton}>
          <Icon name="plus" size={20} color={theme.colors.primary} />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </Pressable>
      </View>
      <Text style={commonStyles.sectionHint}>
        Gérez vos pharmacies et leurs vérifications SIRET
      </Text>

      {pharmaciesLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={commonStyles.hint}>Chargement...</Text>
        </View>
      ) : pharmacies.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="building" size={40} color={theme.colors.textLight} />
          <Text style={styles.emptyText}>Aucune pharmacie enregistrée</Text>
          <Text style={commonStyles.hint}>
            Ajoutez vos pharmacies pour renforcer votre crédibilité
          </Text>
        </View>
      ) : (
        <View style={styles.pharmaciesList}>
          {pharmacies.map((pharmacy) => (
            <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} />
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={[commonStyles.flex1, commonStyles.centered]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={commonStyles.header}>
        <Pressable style={commonStyles.headerButton} onPress={() => router.back()}>
          <Icon name="arrowLeft" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={commonStyles.headerTitle}>Vérifications & Pharmacies</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <ScrollView
        style={commonStyles.flex1}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Icon name="info" size={24} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            Vérifiez votre SIRET et ajoutez vos pharmacies pour sécuriser votre profil sur le marketplace.
          </Text>
        </View>

        {renderPersonalVerification()}
        {renderPharmacies()}

        <View style={commonStyles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const PharmacyCard = ({ pharmacy }) => (
  <View style={styles.pharmacyCard}>
    <View style={styles.pharmacyIcon}>
      <Icon name="building" size={20} color={theme.colors.primary} />
    </View>
    <View style={commonStyles.flex1}>
      <View style={commonStyles.rowGapSmall}>
        <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
        {pharmacy.siret_verified && <SiretBadge verified={true} size="small" />}
      </View>
      <Text style={commonStyles.hint} numberOfLines={1}>
        {pharmacy.address}, {pharmacy.city}
      </Text>
      {pharmacy.siret && (
        <Text style={[commonStyles.hint, { fontSize: hp(1.2), marginTop: hp(0.3) }]}>
          SIRET: {pharmacy.siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')}
        </Text>
      )}
    </View>
    <Pressable>
      <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary + '10',
    padding: hp(2),
    borderRadius: theme.radius.lg,
    gap: wp(3),
    marginBottom: hp(2),
  },
  infoText: {
    flex: 1,
    fontSize: hp(1.5),
    color: theme.colors.primary,
    lineHeight: hp(2.2),
  },
  verifiedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: theme.colors.success + '15',
    padding: hp(2),
    borderRadius: theme.radius.lg,
  },
  verifiedTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.success,
    marginBottom: hp(0.3),
  },
  verifiedSubtitle: {
    fontSize: hp(1.3),
    color: theme.colors.success,
    fontFamily: theme.fonts.medium,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: theme.colors.card,
    padding: hp(2),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  verifyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(0.3),
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.md,
  },
  addButtonText: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: hp(3),
    gap: hp(1),
  },
  emptyCard: {
    alignItems: 'center',
    padding: hp(4),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: hp(1),
  },
  emptyText: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.medium,
    color: theme.colors.textLight,
  },
  pharmaciesList: {
    gap: hp(1.5),
  },
  pharmacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: theme.colors.card,
    padding: hp(1.8),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pharmacyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pharmacyName: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
});
