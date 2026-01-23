// Écran de sélection du rôle utilisateur lors de l'onboarding

import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../../helpers/common';
import { theme } from '../../../constants/theme';
import ScreenWrapper from '../../../components/common/ScreenWrapper';
import Button from '../../../components/common/Button';
import Icon from '../../../assets/icons/Icon';

const ROLES = [
  // Section Candidats
  { 
    value: 'preparateur', 
    label: 'Préparateur(trice)', 
    icon: 'briefcase', 
    description: 'Vous travaillez ou cherchez un poste en officine',
    section: 'candidate',
  },
  { 
    value: 'conseiller', 
    label: 'Conseiller(ère)', 
    icon: 'users', 
    description: 'Vous conseillez en parapharmacie',
    section: 'candidate',
  },
  { 
    value: 'etudiant', 
    label: 'Étudiant(e)', 
    icon: 'book', 
    description: 'Vous êtes en formation pharmaceutique',
    section: 'candidate',
  },
  
  // Section Recruteurs
  { 
    value: 'titulaire', 
    label: 'Titulaire / Pharmacien', 
    icon: 'user', 
    description: 'Vous gérez une ou plusieurs pharmacies',
    section: 'recruiter',
  },
  
  // Section Freelance
  { 
    value: 'animateur', 
    label: 'Animateur(trice)', 
    icon: 'star', 
    description: 'Animation & formation en pharmacie',
    section: 'freelance',
  },
  
  // Section Business
  { 
    value: 'laboratoire', 
    label: 'Laboratoire', 
    icon: 'building', 
    description: 'Entreprise pharmaceutique B2B',
    section: 'business',
  },
];

const SECTIONS = {
  candidate: { title: 'Je cherche un emploi', color: theme.colors.primary },
  recruiter: { title: 'Je recrute', color: '#F57C00' },
  freelance: { title: 'Je suis freelance', color: '#E91E63' },
  business: { title: 'Je représente une entreprise', color: '#1565C0' },
};

export default function OnboardingRole() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(null);

  const handleContinue = () => {
    if (!selectedRole) return;

    // Rediriger vers le bon formulaire selon le type
    if (selectedRole === 'animateur') {
      router.push({
        pathname: '/(auth)/onboarding/animator',
        params: { role: selectedRole },
      });
    } else if (selectedRole === 'laboratoire') {
      router.push({
        pathname: '/(auth)/onboarding/laboratory',
        params: { role: selectedRole },
      });
    } else {
      router.push({
        pathname: '/(auth)/onboarding/form',
        params: { role: selectedRole },
      });
    }
  };

  // Grouper les rôles par section
  const rolesBySection = ROLES.reduce((acc, role) => {
    if (!acc[role.section]) acc[role.section] = [];
    acc[role.section].push(role);
    return acc;
  }, {});

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.step}>Étape 1/3</Text>
          <Text style={styles.title}>Quel est votre profil ?</Text>
          <Text style={styles.subtitle}>
            Cela nous permet d'adapter votre expérience
          </Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.roles}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(rolesBySection).map(([sectionKey, sectionRoles]) => (
            <View key={sectionKey} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: SECTIONS[sectionKey].color }]}>
                {SECTIONS[sectionKey].title}
              </Text>
              
              {sectionRoles.map((role) => (
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
                      color={selectedRole === role.value ? '#fff' : theme.colors.primary}
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
          ))}
        </ScrollView>

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
    paddingTop: hp(2),
  },
  header: {
    marginBottom: hp(2),
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
  scrollView: {
    flex: 1,
  },
  roles: {
    paddingBottom: hp(2),
  },
  section: {
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semibold,
    marginBottom: hp(1),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: hp(2),
    borderRadius: theme.radius.lg,
    marginBottom: hp(1),
    borderWidth: 2,
    borderColor: 'transparent',
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
    marginLeft: wp(3),
  },
  roleLabel: {
    fontSize: hp(1.9),
    color: theme.colors.text,
    fontFamily: theme.fonts.semibold,
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
    paddingVertical: hp(2),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});