import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../../helpers/common';
import { theme } from '../../../constants/theme';
import ScreenWrapper from '../../../components/common/ScreenWrapper';
import Button from '../../../components/common/Button';
import Icon from '../../../assets/icons/Icon';

const ROLES = [
  { value: 'preparateur', label: 'Préparateur(trice)', icon: 'briefcase', description: 'Vous travaillez ou cherchez un poste en officine' },
  { value: 'titulaire', label: 'Titulaire / Pharmacien', icon: 'user', description: 'Vous gérez une ou plusieurs pharmacies' },
  { value: 'conseiller', label: 'Conseiller(ère)', icon: 'users', description: 'Vous conseillez en parapharmacie' },
  { value: 'etudiant', label: 'Étudiant(e)', icon: 'book', description: 'Vous êtes en formation pharmaceutique' },
];

export default function OnboardingRole() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(null);

  const handleContinue = () => {
    if (selectedRole) {
      router.push({
        pathname: '/(auth)/onboarding/form',
        params: { role: selectedRole },
      });
    }
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.step}>Étape 1/3</Text>
          <Text style={styles.title}>Quel est votre rôle ?</Text>
          <Text style={styles.subtitle}>
            Cela nous permet d'adapter votre expérience
          </Text>
        </View>

        <View style={styles.roles}>
          {ROLES.map((role) => (
            <Pressable
              key={role.value}
              style={[
                styles.roleCard,
                selectedRole === role.value && styles.roleCardSelected,
              ]}
              onPress={() => setSelectedRole(role.value)}
            >
              <View style={[
                styles.roleIcon,
                selectedRole === role.value && styles.roleIconSelected,
              ]}>
                <Icon
                  name={role.icon}
                  size={24}
                  color={selectedRole === role.value ? 'white' : theme.colors.primary}
                />
              </View>
              <View style={styles.roleContent}>
                <Text style={[
                  styles.roleLabel,
                  selectedRole === role.value && styles.roleLabelSelected,
                ]}>
                  {role.label}
                </Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </View>
              {selectedRole === role.value && (
                <Icon name="check" size={20} color={theme.colors.primary} />
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Button
            title="Continuer"
            onPress={handleContinue}
            disabled={!selectedRole}
            buttonStyle={!selectedRole && styles.buttonDisabled}
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
    paddingTop: hp(6),
    paddingBottom: hp(4),
  },
  header: {
    marginBottom: hp(4),
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
  },
  roles: {
    flex: 1,
    gap: hp(2),
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: hp(2),
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  roleCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '08',
  },
  roleIcon: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleIconSelected: {
    backgroundColor: theme.colors.primary,
  },
  roleContent: {
    flex: 1,
    marginLeft: wp(4),
  },
  roleLabel: {
    fontSize: hp(1.9),
    color: theme.colors.text,
    fontFamily: theme.fonts.semiBold,
  },
  roleLabelSelected: {
    color: theme.colors.primary,
  },
  roleDescription: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    marginTop: 2,
  },
  footer: {
    marginTop: hp(2),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});