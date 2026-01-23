// app/(screens)/settings.jsx
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
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
  const { signOut, profile } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: signOut },
    ]);
  };

  const MenuItem = ({ icon, label, onPress, danger }) => (
    <Pressable style={commonStyles.listItem} onPress={onPress}>
      <Icon name={icon} size={20} color={danger ? theme.colors.rose : theme.colors.textLight} />
      <Text style={[commonStyles.listItemTitle, danger && { color: theme.colors.rose }]}>{label}</Text>
      <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
    </Pressable>
  );

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Paramètres</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <ScrollView style={commonStyles.flex1} contentContainerStyle={commonStyles.scrollContent}>
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitleSmall}>Compte</Text>
          <View style={commonStyles.card}>
            <MenuItem icon="user" label="Mon profil" onPress={() => router.push('/profile')} />
            <MenuItem icon="bell" label="Notifications" onPress={() => router.push('/notificationSettings')} />
            <MenuItem icon="lock" label="Confidentialité" onPress={() => router.push('/privacySettings')} />
          </View>
        </View>

        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitleSmall}>Application</Text>
          <View style={commonStyles.card}>
            <MenuItem icon="helpCircle" label="Aide & Support" onPress={() => router.push('/help')} />
            <MenuItem icon="fileText" label="CGU" onPress={() => router.push({ pathname: '/legalDocument', params: { type: 'terms' } })} />
            <MenuItem icon="shield" label="Politique de confidentialité" onPress={() => router.push({ pathname: '/legalDocument', params: { type: 'privacy' } })} />
          </View>
        </View>

        <View style={commonStyles.section}>
          <View style={commonStyles.card}>
            <MenuItem icon="logOut" label="Déconnexion" onPress={handleSignOut} danger />
          </View>
        </View>

        <Text style={[commonStyles.hint, { textAlign: 'center', marginTop: hp(2) }]}>Version 1.0.0</Text>
      </ScrollView>
    </ScreenWrapper>
  );
}