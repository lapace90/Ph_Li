import { StyleSheet, Text, View, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';

const STORAGE_KEY = '@notification_settings';

const DEFAULT_SETTINGS = {
  pushEnabled: true,
  newMatch: true,
  newMessage: true,
  applicationStatus: true,
  newJobInArea: true,
  weeklyDigest: false,
};

export default function NotificationSettings() {
  const router = useRouter();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const SettingRow = ({ icon, title, description, settingKey }) => (
    <View style={[commonStyles.row, styles.settingRow]}>
      <View style={styles.settingIcon}>
        <Icon name={icon} size={20} color={theme.colors.primary} />
      </View>
      <View style={commonStyles.flex1}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={commonStyles.hint}>{description}</Text>}
      </View>
      <Switch
        value={settings[settingKey]}
        onValueChange={(value) => updateSetting(settingKey, value)}
        trackColor={{ false: theme.colors.gray, true: theme.colors.primary + '50' }}
        thumbColor={settings[settingKey] ? theme.colors.primary : theme.colors.darkLight}
        disabled={settingKey !== 'pushEnabled' && !settings.pushEnabled}
      />
    </View>
  );

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={[commonStyles.flex1, commonStyles.scrollContent, { paddingTop: hp(2) }]}>
        <View style={commonStyles.rowBetween}>
          <BackButton router={router} />
          <Text style={styles.title}>Notifications</Text>
          <View style={commonStyles.headerSpacer} />
        </View>

        <View style={styles.section}>
          <Text style={commonStyles.sectionTitleSmall}>Général</Text>
          <View style={[commonStyles.card, { padding: 0, overflow: 'hidden' }]}>
            <SettingRow
              icon="bell"
              title="Notifications push"
              description="Activer toutes les notifications"
              settingKey="pushEnabled"
            />
          </View>
        </View>

        <View style={[styles.section, !settings.pushEnabled && styles.sectionDisabled]}>
          <Text style={commonStyles.sectionTitleSmall}>Activité</Text>
          <View style={[commonStyles.card, { padding: 0, overflow: 'hidden' }]}>
            <SettingRow
              icon="heart"
              title="Nouveaux matchs"
              description="Quand un employeur matche avec vous"
              settingKey="newMatch"
            />
            <View style={commonStyles.dividerLight} />
            <SettingRow
              icon="messageCircle"
              title="Messages"
              description="Nouveaux messages reçus"
              settingKey="newMessage"
            />
            <View style={commonStyles.dividerLight} />
            <SettingRow
              icon="briefcase"
              title="Candidatures"
              description="Mise à jour du statut de vos candidatures"
              settingKey="applicationStatus"
            />
          </View>
        </View>

        <View style={[styles.section, !settings.pushEnabled && styles.sectionDisabled]}>
          <Text style={commonStyles.sectionTitleSmall}>Découverte</Text>
          <View style={[commonStyles.card, { padding: 0, overflow: 'hidden' }]}>
            <SettingRow
              icon="mapPin"
              title="Nouvelles offres"
              description="Offres dans votre zone de recherche"
              settingKey="newJobInArea"
            />
            <View style={commonStyles.dividerLight} />
            <SettingRow
              icon="mail"
              title="Résumé hebdomadaire"
              description="Email récapitulatif chaque semaine"
              settingKey="weeklyDigest"
            />
          </View>
        </View>

        {!settings.pushEnabled && (
          <Text style={[commonStyles.hint, commonStyles.textCenter]}>
            Activez les notifications push pour personnaliser vos préférences
          </Text>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  section: {
    marginTop: hp(3),
    gap: hp(1),
  },
  sectionDisabled: {
    opacity: 0.5,
  },
  settingRow: {
    padding: hp(2),
    gap: wp(3),
  },
  settingIcon: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: hp(1.7),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
});