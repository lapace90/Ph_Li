import { Alert, StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';

export default function Settings() {
  const router = useRouter();
  const { session, signOut } = useAuth();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('privacy_settings').delete().eq('user_id', session.user.id);
              await supabase.from('cvs').delete().eq('user_id', session.user.id);
              await supabase.from('profiles').delete().eq('id', session.user.id);
              await supabase.from('users').delete().eq('id', session.user.id);
              
              await signOut();
              router.replace('/welcome');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le compte');
            }
          },
        },
      ]
    );
  };

  const MenuItem = ({ icon, label, onPress, danger = false }) => (
    <Pressable style={commonStyles.menuItem} onPress={onPress}>
      <Icon name={icon} size={22} color={danger ? theme.colors.rose : theme.colors.text} />
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
    </Pressable>
  );

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BackButton router={router} />
          <Text style={styles.title}>Paramètres</Text>
          <View style={commonStyles.headerSpacer} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          <View style={styles.menuSection}>
            <MenuItem 
              icon="mail" 
              label="Changer d'email" 
              onPress={() => router.push('/(screens)/changeEmail')} 
            />
            <MenuItem 
              icon="lock" 
              label="Changer de mot de passe" 
              onPress={() => router.push('/(screens)/changePassword')} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Données personnelles</Text>
          <View style={styles.menuSection}>
            <MenuItem 
              icon="clipboard" 
              label="Exporter mes données" 
              onPress={() => router.push('/(screens)/exportData')} 
            />
            <MenuItem 
              icon="trash" 
              label="Supprimer mon compte" 
              onPress={handleDeleteAccount} 
              danger 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.menuSection}>
            <MenuItem 
              icon="bell" 
              label="Préférences de notification" 
              onPress={() => router.push('/(screens)/notificationSettings')} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Légal</Text>
          <View style={styles.menuSection}>
            <MenuItem 
              icon="fileText" 
              label="Conditions d'utilisation" 
              onPress={() => router.push({ pathname: '/(screens)/legalDocument', params: { type: 'cgu' } })} 
            />
            <MenuItem 
              icon="lock" 
              label="Politique de confidentialité" 
              onPress={() => router.push({ pathname: '/(screens)/legalDocument', params: { type: 'privacy' } })} 
            />
          </View>
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
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
  sectionTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.medium,
    color: theme.colors.textLight,
    marginBottom: hp(1),
    paddingLeft: wp(2),
  },
  menuSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  menuLabel: {
    flex: 1,
    marginLeft: wp(4),
    fontSize: hp(1.8),
    color: theme.colors.text,
  },
  menuLabelDanger: {
    color: theme.colors.rose,
  },
  version: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginVertical: hp(4),
  },
});