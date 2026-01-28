// app/(screens)/settings.jsx
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';

export default function Settings() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: signOut },
    ]);
  };

  const MenuItem = ({ icon, label, onPress, danger }) => (
    <Pressable style={[commonStyles.card, commonStyles.row, { padding: hp(2) }]} onPress={onPress}>
      <View style={[styles.settingIcon, danger && { backgroundColor: theme.colors.rose + '15' }]}>
        <Icon name={icon} size={22} color={danger ? theme.colors.rose : theme.colors.primary} />
      </View>
      <View style={[commonStyles.flex1, { marginLeft: wp(3) }]}>
        <Text style={[styles.settingTitle, danger && { color: theme.colors.rose }]}>{label}</Text>
      </View>
      <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
    </Pressable>
  );

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={[commonStyles.flex1, { paddingHorizontal: wp(5), paddingTop: hp(2) }]}>
        <View style={[commonStyles.rowBetween, { marginBottom: hp(3) }]}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Paramètres</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={commonStyles.flex1} showsVerticalScrollIndicator={false}>
          <Text style={[commonStyles.sectionTitleSmall, { marginBottom: hp(1) }]}>Compte</Text>
          <View style={{ gap: hp(1), marginBottom: hp(2.5) }}>
            <MenuItem icon="user" label="Mon profil" onPress={() => router.push('/profile')} />
            <MenuItem icon="bell" label="Notifications" onPress={() => router.push('/notificationSettings')} />
            <MenuItem icon="lock" label="Confidentialité" onPress={() => router.push('/privacySettings')} />
            <MenuItem icon="slash" label="Utilisateurs bloqués" onPress={() => router.push('/blockedUsers')} />
          </View>

          <Text style={[commonStyles.sectionTitleSmall, { marginBottom: hp(1) }]}>Application</Text>
          <View style={{ gap: hp(1), marginBottom: hp(2.5) }}>
            <MenuItem icon="helpCircle" label="Aide & Support" onPress={() => router.push('/help')} />
            <MenuItem icon="fileText" label="CGU" onPress={() => router.push({ pathname: '/legalDocument', params: { type: 'cgu' } })} />
            <MenuItem icon="shield" label="Politique de confidentialité" onPress={() => router.push({ pathname: '/legalDocument', params: { type: 'privacy' } })} />
          </View>

          <View style={{ gap: hp(1), marginBottom: hp(2.5) }}>
            <MenuItem icon="logOut" label="Déconnexion" onPress={handleSignOut} danger />
          </View>

          <Text style={[commonStyles.hint, { textAlign: 'center', marginTop: hp(1) }]}>Version 1.0.0</Text>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
