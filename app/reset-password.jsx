import { Alert, StyleSheet, Text, View } from 'react-native';
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../helpers/common';
import { theme } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { logService } from '../services/logService';
import ScreenWrapper from '../components/common/ScreenWrapper';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Icon from '../assets/icons/Icon';

export default function ResetPassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Récupérer l'email de l'utilisateur connecté via le lien de récupération
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, []);

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Log le changement de mot de passe
      if (user) {
        logService.auth.passwordChanged(user.id, user.email);
      }

      Alert.alert(
        'Mot de passe mis à jour',
        'Votre nouveau mot de passe a été enregistré. Vous pouvez maintenant vous connecter.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Déconnecter l'utilisateur pour qu'il se reconnecte avec son nouveau mdp
              supabase.auth.signOut();
              router.replace('/(auth)/login');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name="lock" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Nouveau mot de passe</Text>
          <Text style={styles.subtitle}>
            {userEmail
              ? `Définissez un nouveau mot de passe pour ${userEmail}`
              : 'Définissez votre nouveau mot de passe'}
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            icon={<Icon name="lock" size={22} color={theme.colors.textLight} />}
            placeholder="Nouveau mot de passe"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <Input
            icon={<Icon name="lock" size={22} color={theme.colors.textLight} />}
            placeholder="Confirmer le mot de passe"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Le mot de passe doit contenir :</Text>
            <Requirement met={newPassword.length >= 6} text="Au moins 6 caractères" />
            <Requirement met={/[A-Z]/.test(newPassword)} text="Une lettre majuscule" />
            <Requirement met={/[0-9]/.test(newPassword)} text="Un chiffre" />
          </View>

          <Button
            title="Enregistrer"
            loading={loading}
            onPress={handleSubmit}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const Requirement = ({ met, text }) => (
  <View style={styles.requirement}>
    <Icon
      name={met ? 'check' : 'x'}
      size={14}
      color={met ? theme.colors.success : theme.colors.textLight}
    />
    <Text style={[styles.requirementText, met && styles.requirementMet]}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(5),
    paddingTop: hp(8),
  },
  header: {
    alignItems: 'center',
    gap: hp(1.5),
    marginBottom: hp(4),
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  title: {
    fontSize: hp(2.8),
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
  },
  subtitle: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: hp(2.6),
    paddingHorizontal: wp(5),
  },
  form: {
    gap: hp(2),
  },
  requirements: {
    backgroundColor: theme.colors.card,
    padding: hp(2),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: hp(0.8),
  },
  requirementsTitle: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  requirementText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  requirementMet: {
    color: theme.colors.success,
  },
});
