import { Alert, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Icon from '../../assets/icons/Icon';

export default function ChangePassword() {
  const router = useRouter();
  const { session } = useAuth();

  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      // Vérifier le mot de passe actuel
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert('Erreur', 'Mot de passe actuel incorrect');
        setLoading(false);
        return;
      }

      // Mettre à jour le mot de passe
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      Alert.alert(
        'Mot de passe mis à jour',
        'Votre mot de passe a été changé avec succès.',
        [{ text: 'OK', onPress: () => router.back() }]
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
          <BackButton router={router} />
          <Text style={styles.title}>Mot de passe</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.form}>
          <Input
            icon={<Icon name="lock" size={22} color={theme.colors.textLight} />}
            placeholder="Mot de passe actuel"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />

          <View style={styles.divider} />

          <Input
            icon={<Icon name="lock" size={22} color={theme.colors.textLight} />}
            placeholder="Nouveau mot de passe"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <Input
            icon={<Icon name="lock" size={22} color={theme.colors.textLight} />}
            placeholder="Confirmer le nouveau mot de passe"
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
        </View>

        <Button
          title="Changer le mot de passe"
          loading={loading}
          onPress={handleSubmit}
        />
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
    paddingTop: hp(2),
    paddingBottom: hp(4),
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
  form: {
    flex: 1,
    gap: hp(2),
  },
  divider: {
    height: hp(1),
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