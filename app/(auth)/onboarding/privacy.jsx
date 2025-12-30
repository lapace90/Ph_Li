// app/(auth)/onboarding/privacy.jsx

import { Alert, StyleSheet, Text, View, Switch, Pressable } from 'react-native';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../../../helpers/common';
import { theme } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { privacyService } from '../../../services/privacyService';
import { userService } from '../../../services/userService';
import ScreenWrapper from '../../../components/common/ScreenWrapper';
import BackButton from '../../../components/common/BackButton';
import Button from '../../../components/common/Button';
import Icon from '../../../assets/icons/Icon';

export default function OnboardingPrivacy() {
  const router = useRouter();
  const { role, gender } = useLocalSearchParams();
  const { session, refreshUserData } = useAuth();

  const [loading, setLoading] = useState(false);
  
  // Déterminer si c'est un titulaire (recruteur) ou un candidat
  const isTitulaire = role === 'titulaire';

  // Settings différents selon le rôle
  const [settings, setSettings] = useState({
    showFullName: isTitulaire, // Titulaires montrent leur nom par défaut
    showPhoto: isTitulaire,
    showExactLocation: isTitulaire,
    searchableByRecruiters: false, // Seulement pour candidats
    showPharmacyInfo: true, // Seulement pour titulaires
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // Créer les paramètres de confidentialité adaptés au rôle
      await privacyService.upsert(session.user.id, {
        profile_visibility: isTitulaire ? 'public' : 'anonymous',
        show_full_name: settings.showFullName,
        show_photo: settings.showPhoto,
        show_exact_location: settings.showExactLocation,
        show_current_employer: false,
        searchable_by_recruiters: isTitulaire ? false : settings.searchableByRecruiters,
      });

      // Marquer le profil comme complet
      await userService.update(session.user.id, {
        profile_completed: true,
      });

      // Rafraîchir les données
      await refreshUserData();

      // Rediriger vers l'app
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const SettingRow = ({ icon, title, description, value, onToggle }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Icon name={icon} size={22} color={theme.colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.colors.gray, true: theme.colors.primary + '50' }}
        thumbColor={value ? theme.colors.primary : theme.colors.darkLight}
      />
    </View>
  );

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <BackButton router={router} />

        <View style={styles.header}>
          <Text style={styles.step}>Étape 3/3</Text>
          <Text style={styles.title}>Confidentialité</Text>
          <Text style={styles.subtitle}>
            {isTitulaire 
              ? 'Configurez la visibilité de votre profil employeur.'
              : 'Contrôlez ce que les recruteurs peuvent voir.'}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Icon name={isTitulaire ? 'briefcase' : 'lock'} size={20} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            {isTitulaire
              ? 'En tant que titulaire, vous pourrez publier des offres d\'emploi et rechercher des candidats.'
              : 'Par défaut, votre profil est anonyme. Seules la région et les informations professionnelles sont visibles.'}
          </Text>
        </View>

        <View style={styles.settings}>
          <SettingRow
            icon="user"
            title="Afficher mon nom complet"
            description={isTitulaire ? 'Les candidats verront votre nom' : 'Votre prénom et nom seront visibles'}
            value={settings.showFullName}
            onToggle={() => toggleSetting('showFullName')}
          />

          <SettingRow
            icon="image"
            title="Afficher ma photo"
            description="Votre photo de profil sera visible"
            value={settings.showPhoto}
            onToggle={() => toggleSetting('showPhoto')}
          />

          <SettingRow
            icon="mapPin"
            title="Afficher ma ville exacte"
            description="Sinon, seule la région est affichée"
            value={settings.showExactLocation}
            onToggle={() => toggleSetting('showExactLocation')}
          />

          <View style={styles.divider} />

          {/* Section spécifique selon le rôle */}
          {isTitulaire ? (
            <>
              <View style={styles.roleInfoBox}>
                <Icon name="checkCircle" size={20} color={theme.colors.success} />
                <Text style={styles.roleInfoText}>
                  Vous pourrez publier des offres d'emploi, de stage et mettre en vente/location votre pharmacie depuis votre espace recruteur.
                </Text>
              </View>
            </>
          ) : (
            <SettingRow
              icon="search"
              title="Visible par les recruteurs"
              description="Les employeurs peuvent voir votre profil et vous contacter"
              value={settings.searchableByRecruiters}
              onToggle={() => toggleSetting('searchableByRecruiters')}
            />
          )}
        </View>

        <View style={styles.footer}>
          <Button
            title="Terminer"
            loading={loading}
            onPress={handleFinish}
          />
          <Text style={styles.footerHint}>
            {isTitulaire
              ? 'Vous pourrez configurer votre pharmacie depuis les paramètres'
              : 'Vous pourrez activer la visibilité recruteurs plus tard depuis votre profil'}
          </Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(4),
  },
  header: {
    marginTop: hp(2),
    marginBottom: hp(3),
  },
  step: {
    fontSize: hp(1.6),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    marginBottom: hp(1),
  },
  title: {
    fontSize: hp(3),
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
  },
  subtitle: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    marginTop: hp(0.5),
    lineHeight: hp(2.5),
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary + '10',
    padding: hp(2),
    borderRadius: theme.radius.lg,
    gap: wp(3),
    marginBottom: hp(3),
  },
  infoText: {
    flex: 1,
    fontSize: hp(1.6),
    color: theme.colors.text,
    lineHeight: hp(2.2),
  },
  roleInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.success + '10',
    padding: hp(2),
    borderRadius: theme.radius.lg,
    gap: wp(3),
  },
  roleInfoText: {
    flex: 1,
    fontSize: hp(1.5),
    color: theme.colors.text,
    lineHeight: hp(2.2),
  },
  settings: {
    flex: 1,
    gap: hp(0.5),
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: hp(2),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  settingIcon: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: wp(3),
    marginRight: wp(2),
  },
  settingTitle: {
    fontSize: hp(1.8),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  settingDescription: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: 2,
  },
  divider: {
    height: hp(2),
  },
  footer: {
    gap: hp(2),
  },
  footerHint: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});