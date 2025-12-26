import { StyleSheet, Text, View, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
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
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Icon name={icon} size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
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
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton router={router} />
          <Text style={styles.title}>Notifications</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Général</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="bell"
              title="Notifications push"
              description="Activer toutes les notifications"
              settingKey="pushEnabled"
            />
          </View>
        </View>

        <View style={[styles.section, !settings.pushEnabled && styles.sectionDisabled]}>
          <Text style={styles.sectionTitle}>Activité</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="heart"
              title="Nouveaux matchs"
              description="Quand un employeur matche avec vous"
              settingKey="newMatch"
            />
            <View style={styles.separator} />
            <SettingRow
              icon="messageCircle"
              title="Messages"
              description="Nouveaux messages reçus"
              settingKey="newMessage"
            />
            <View style={styles.separator} />
            <SettingRow
              icon="briefcase"
              title="Candidatures"
              description="Mise à jour du statut de vos candidatures"
              settingKey="applicationStatus"
            />
          </View>
        </View>

        <View style={[styles.section, !settings.pushEnabled && styles.sectionDisabled]}>
          <Text style={styles.sectionTitle}>Découverte</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon="mapPin"
              title="Nouvelles offres"
              description="Offres dans votre zone de recherche"
              settingKey="newJobInArea"
            />
            <View style={styles.separator} />
            <SettingRow
              icon="mail"
              title="Résumé hebdomadaire"
              description="Email récapitulatif chaque semaine"
              settingKey="weeklyDigest"
            />
          </View>
        </View>

        {!settings.pushEnabled && (
          <Text style={styles.disabledHint}>
            Activez les notifications push pour personnaliser vos préférences
          </Text>
        )}
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
  section: {
    marginBottom: hp(3),
  },
  sectionDisabled: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.medium,
    color: theme.colors.textLight,
    marginBottom: hp(1),
    paddingLeft: wp(2),
  },
  sectionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(2),
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
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: wp(15),
  },
  disabledHint: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});