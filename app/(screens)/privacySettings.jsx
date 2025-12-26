import { Alert, StyleSheet, Text, View, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { usePrivacy } from '../../hooks/usePrivacy';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';

export default function PrivacySettings() {
  const router = useRouter();
  const { session, refreshUserData } = useAuth();
  const { privacy, updatePrivacy } = usePrivacy(session?.user?.id);

  const handleToggle = async (key, value) => {
    const { error } = await updatePrivacy({ [key]: value });
    if (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour les paramètres');
    }
  };

  const SettingRow = ({ icon, title, description, settingKey }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Icon name={icon} size={22} color={theme.colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={privacy?.[settingKey] || false}
        onValueChange={(value) => handleToggle(settingKey, value)}
        trackColor={{ false: theme.colors.gray, true: theme.colors.primary + '50' }}
        thumbColor={privacy?.[settingKey] ? theme.colors.primary : theme.colors.darkLight}
      />
    </View>
  );

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton router={router} />
          <Text style={styles.title}>Confidentialité</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.infoBox}>
          <Icon name="lock" size={20} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            Par défaut, votre profil est anonyme. Seules la région et les informations professionnelles sont visibles aux recruteurs.
          </Text>
        </View>

        <View style={styles.settings}>
          <SettingRow
            icon="user"
            title="Afficher mon nom complet"
            description="Votre prénom et nom seront visibles"
            settingKey="show_full_name"
          />

          <SettingRow
            icon="image"
            title="Afficher ma photo"
            description="Votre photo de profil sera visible"
            settingKey="show_photo"
          />

          <SettingRow
            icon="mapPin"
            title="Afficher ma ville exacte"
            description="Sinon, seule la région est affichée"
            settingKey="show_exact_location"
          />

          <SettingRow
            icon="briefcase"
            title="Afficher mon employeur actuel"
            description="Votre employeur actuel sera visible"
            settingKey="show_current_employer"
          />

          <View style={styles.divider} />

          <SettingRow
            icon="search"
            title="Visible par les recruteurs"
            description="Les employeurs peuvent voir votre profil"
            settingKey="searchable_by_recruiters"
          />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(3),
  },
  title: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
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
    fontSize: hp(1.5),
    color: theme.colors.text,
    lineHeight: hp(2.2),
  },
  settings: {
    gap: hp(1),
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
    fontSize: hp(1.7),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  settingDescription: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: 2,
  },
  divider: {
    height: hp(1),
  },
});