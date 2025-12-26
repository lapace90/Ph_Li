import { StyleSheet, Text, View, Pressable, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { usePrivacy } from '../../hooks/usePrivacy';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';

export default function Profile() {
  const router = useRouter();
  const { session, user, profile, signOut } = useAuth();
  const { privacy, setSearchable } = usePrivacy(session?.user?.id);

  const handleToggleSearchable = async (value) => {
    await setSearchable(value);
  };

  const getAvatarIcon = () => {
    // TODO: Retourner l'avatar selon role + gender
    return 'user';
  };

  const getRoleLabel = () => {
    const roles = {
      preparateur: 'Préparateur(trice)',
      titulaire: 'Titulaire',
      conseiller: 'Conseiller(ère)',
      etudiant: 'Étudiant(e)',
    };
    return roles[user?.user_type] || 'Utilisateur';
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mon Profil</Text>
        </View>

        {/* Carte profil */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Icon name={getAvatarIcon()} size={40} color={theme.colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {profile?.first_name} {profile?.last_name}
            </Text>
            <Text style={styles.role}>{getRoleLabel()}</Text>
            <Text style={styles.location}>
              <Icon name="mapPin" size={14} color={theme.colors.textLight} />
              {' '}{profile?.current_city || 'Ville non renseignée'}
            </Text>
          </View>
          <Pressable style={styles.editButton}>
            <Icon name="edit" size={20} color={theme.colors.primary} />
          </Pressable>
        </View>

        {/* Toggle Recherche active */}
        <View style={styles.searchToggle}>
          <View style={styles.searchToggleContent}>
            <View style={[
              styles.searchToggleIcon,
              privacy?.searchable_by_recruiters && styles.searchToggleIconActive,
            ]}>
              <Icon
                name="search"
                size={22}
                color={privacy?.searchable_by_recruiters ? 'white' : theme.colors.primary}
              />
            </View>
            <View style={styles.searchToggleText}>
              <Text style={styles.searchToggleTitle}>
                {privacy?.searchable_by_recruiters ? 'Recherche active' : 'Recherche inactive'}
              </Text>
              <Text style={styles.searchToggleDescription}>
                {privacy?.searchable_by_recruiters
                  ? 'Les recruteurs peuvent voir votre profil'
                  : 'Votre profil est invisible aux recruteurs'}
              </Text>
            </View>
          </View>
          <Switch
            value={privacy?.searchable_by_recruiters || false}
            onValueChange={handleToggleSearchable}
            trackColor={{ false: theme.colors.gray, true: theme.colors.primary + '50' }}
            thumbColor={privacy?.searchable_by_recruiters ? theme.colors.primary : theme.colors.darkLight}
          />
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          <MenuItem icon="fileText" label="Mes CV" onPress={() => {}} />
          <MenuItem icon="settings" label="Paramètres" onPress={() => {}} />
          <MenuItem icon="lock" label="Confidentialité" onPress={() => {}} />
          <MenuItem icon="info" label="À propos" onPress={() => {}} />
        </View>

        {/* Déconnexion */}
        <Pressable style={styles.logoutButton} onPress={signOut}>
          <Icon name="logout" size={20} color={theme.colors.rose} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>
      </ScrollView>
    </ScreenWrapper>
  );
}

const MenuItem = ({ icon, label, onPress }) => (
  <Pressable style={styles.menuItem} onPress={onPress}>
    <Icon name={icon} size={22} color={theme.colors.text} />
    <Text style={styles.menuLabel}>{label}</Text>
    <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(5),
    paddingTop: hp(6),
  },
  header: {
    marginBottom: hp(3),
  },
  title: {
    fontSize: hp(3),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: hp(2),
    borderRadius: theme.radius.xl,
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatar: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(8),
    backgroundColor: theme.colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: wp(4),
  },
  name: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  role: {
    fontSize: hp(1.6),
    color: theme.colors.primary,
    marginTop: 2,
  },
  location: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    marginTop: 4,
  },
  editButton: {
    padding: hp(1),
  },
  searchToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: hp(2),
    borderRadius: theme.radius.xl,
    marginBottom: hp(3),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchToggleContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchToggleIcon: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchToggleIconActive: {
    backgroundColor: theme.colors.primary,
  },
  searchToggleText: {
    flex: 1,
    marginLeft: wp(3),
  },
  searchToggleTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  searchToggleDescription: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: hp(3),
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuLabel: {
    flex: 1,
    marginLeft: wp(4),
    fontSize: hp(1.9),
    color: theme.colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(2),
    gap: wp(2),
    marginBottom: hp(4),
  },
  logoutText: {
    fontSize: hp(1.9),
    color: theme.colors.rose,
    fontFamily: theme.fonts.medium,
  },
});