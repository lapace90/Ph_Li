import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Icon from '../../assets/icons/Icon';

const ROLES = [
  { value: 'preparateur', label: 'Préparateur(trice)', icon: 'briefcase' },
  { value: 'titulaire', label: 'Titulaire / Pharmacien', icon: 'user' },
  { value: 'conseiller', label: 'Conseiller(ère)', icon: 'users' },
  { value: 'etudiant', label: 'Étudiant(e)', icon: 'book' },
];

const Onboarding = () => {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  const firstNameRef = useRef('');
  const lastNameRef = useRef('');
  const cityRef = useRef('');

  const onSubmit = async () => {
    if (!selectedRole) {
      Alert.alert('Rôle manquant', 'Veuillez sélectionner votre rôle');
      return;
    }

    const firstName = firstNameRef.current.trim();
    const lastName = lastNameRef.current.trim();
    const city = cityRef.current.trim();

    if (!firstName || !lastName || !city) {
      Alert.alert('Informations manquantes', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      // Créer ou mettre à jour le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          city: city,
        });

      if (profileError) throw profileError;

      // Mettre à jour le user_type dans users
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          user_type: selectedRole,
          profile_completed: true 
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Rafraîchir le profil
      await refreshProfile();

      // Rediriger vers l'app
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Bienvenue ! 👋</Text>
          <Text style={styles.subtitle}>Complétez votre profil pour commencer</Text>
        </View>

        {/* Choix du rôle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quel est votre rôle ?</Text>
          <View style={styles.rolesGrid}>
            {ROLES.map((role) => (
              <Pressable
                key={role.value}
                style={[
                  styles.roleCard,
                  selectedRole === role.value && styles.roleCardSelected,
                ]}
                onPress={() => setSelectedRole(role.value)}
              >
                <Icon 
                  name={role.icon} 
                  size={32} 
                  color={selectedRole === role.value ? theme.colors.primary : theme.colors.textLight} 
                />
                <Text style={[
                  styles.roleLabel,
                  selectedRole === role.value && styles.roleLabelSelected,
                ]}>
                  {role.label}
                </Text>
                {selectedRole === role.value && (
                  <View style={styles.checkBadge}>
                    <Icon name="check" size={16} color="white" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Informations personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vos informations</Text>
          <View style={styles.form}>
            <Input
              icon={<Icon name="user" size={22} color={theme.colors.textLight} />}
              placeholder="Prénom"
              onChangeText={(value) => (firstNameRef.current = value)}
            />

            <Input
              icon={<Icon name="user" size={22} color={theme.colors.textLight} />}
              placeholder="Nom"
              onChangeText={(value) => (lastNameRef.current = value)}
            />

            <Input
              icon={<Icon name="globe" size={22} color={theme.colors.textLight} />}
              placeholder="Ville"
              onChangeText={(value) => (cityRef.current = value)}
            />
          </View>
        </View>

        <Button 
          title="Commencer" 
          loading={loading} 
          onPress={onSubmit}
          buttonStyle={styles.submitButton}
        />
      </ScrollView>
    </ScreenWrapper>
  );
};

export default Onboarding;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(5),
    paddingTop: hp(8),
    paddingBottom: hp(4),
    gap: hp(3),
  },
  header: {
    gap: hp(1),
  },
  title: {
    fontSize: hp(3),
    color: theme.colors.text,
    fontWeight: theme.fonts.bold,
  },
  subtitle: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
  },
  section: {
    gap: hp(2),
  },
  sectionTitle: {
    fontSize: hp(2),
    color: theme.colors.text,
    fontWeight: theme.fonts.semiBold,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hp(2),
  },
  roleCard: {
    width: (wp(90) - hp(2)) / 2,
    aspectRatio: 1.2,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
    gap: hp(1),
    borderWidth: 2,
    borderColor: theme.colors.gray,
  },
  roleCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight + '10',
  },
  roleLabel: {
    fontSize: hp(1.6),
    color: theme.colors.text,
    fontWeight: theme.fonts.medium,
    textAlign: 'center',
  },
  roleLabelSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.bold,
  },
  checkBadge: {
    position: 'absolute',
    top: hp(1),
    right: hp(1),
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: hp(2),
  },
  submitButton: {
    marginTop: hp(2),
  },
});