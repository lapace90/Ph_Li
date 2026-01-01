// app/(screens)/privacySettings.jsx

import { Alert, StyleSheet, Text, View, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { usePrivacy } from '../../hooks/usePrivacy';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';

export default function PrivacySettings() {
  const router = useRouter();
  const { session, user } = useAuth();
  const { privacy, updatePrivacy } = usePrivacy(session?.user?.id);

  const isRecruiter = user?.user_type === 'titulaire';

  const handleToggle = async (key, value) => {
    const { error } = await updatePrivacy({ [key]: value });
    if (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour les paramètres');
    }
  };

  const SettingRow = ({ icon, title, description, settingKey }) => (
    <View style={[commonStyles.card, commonStyles.row, { padding: hp(2) }]}>
      <View style={styles.settingIcon}>
        <Icon name={icon} size={22} color={theme.colors.primary} />
      </View>
      <View style={[commonStyles.flex1, { marginLeft: wp(3), marginRight: wp(2) }]}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={commonStyles.hint}>{description}</Text>
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
      <View style={[commonStyles.flex1, { paddingHorizontal: wp(5), paddingTop: hp(2) }]}>
        {/* Header */}
        <View style={[commonStyles.rowBetween, { marginBottom: hp(3) }]}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Confidentialité</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Info box */}
        <View style={[commonStyles.row, styles.infoBox]}>
          <Icon name="lock" size={20} color={theme.colors.primary} />
          <Text style={[commonStyles.flex1, commonStyles.hint, { lineHeight: hp(2.2) }]}>
            {isRecruiter
              ? 'Contrôlez les informations visibles sur vos annonces et votre profil recruteur.'
              : 'Par défaut, votre profil est anonyme. Seules la région et les informations professionnelles sont visibles aux recruteurs.'
            }
          </Text>
        </View>

        {/* Settings */}
        <View style={{ gap: hp(1) }}>
          {isRecruiter ? (
            // Options pour les recruteurs
            <>
              <SettingRow
                icon="user"
                title="Afficher mon nom complet"
                description="Votre nom sera visible sur vos annonces"
                settingKey="show_full_name"
              />

              <SettingRow
                icon="image"
                title="Afficher ma photo"
                description="Votre photo de profil sera visible sur vos annonces"
                settingKey="show_photo"
              />

              <SettingRow
                icon="mail"
                title="Afficher mon email"
                description="Les candidats pourront vous contacter par email"
                settingKey="show_email"
              />

              <SettingRow
                icon="mapPin"
                title="Afficher l'adresse complète"
                description="Sinon, seule la ville est affichée"
                settingKey="show_exact_location"
              />
            </>
          ) : (
            // Options pour les candidats
            <>
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

              <View style={{ height: hp(1) }} />

              <SettingRow
                icon="search"
                title="Visible par les recruteurs"
                description="Les employeurs peuvent voir votre profil"
                settingKey="searchable_by_recruiters"
              />
            </>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  infoBox: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary + '10',
    padding: hp(2),
    borderRadius: theme.radius.lg,
    gap: wp(3),
    marginBottom: hp(3),
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