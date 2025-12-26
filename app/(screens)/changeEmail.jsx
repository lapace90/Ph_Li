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

export default function ChangeEmail() {
  const router = useRouter();
  const { session } = useAuth();

  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!newEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nouvel email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }

    if (!password) {
      Alert.alert('Erreur', 'Veuillez entrer votre mot de passe actuel');
      return;
    }

    setLoading(true);
    try {
      // Vérifier le mot de passe actuel
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: password,
      });

      if (signInError) {
        Alert.alert('Erreur', 'Mot de passe incorrect');
        setLoading(false);
        return;
      }

      // Mettre à jour l'email
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });

      if (error) throw error;

      Alert.alert(
        'Email mis à jour',
        'Un email de confirmation a été envoyé à votre nouvelle adresse. Veuillez le confirmer pour finaliser le changement.',
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
          <Text style={styles.title}>Changer d'email</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.infoBox}>
          <Icon name="info" size={20} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            Votre email actuel : {session?.user?.email}
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            icon={<Icon name="mail" size={22} color={theme.colors.textLight} />}
            placeholder="Nouvel email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={newEmail}
            onChangeText={setNewEmail}
          />

          <Input
            icon={<Icon name="lock" size={22} color={theme.colors.textLight} />}
            placeholder="Mot de passe actuel"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.hint}>
            Un email de confirmation sera envoyé à votre nouvelle adresse.
          </Text>
        </View>

        <Button
          title="Mettre à jour"
          loading={loading}
          onPress={handleSubmit}
        />
      </View>
    </ScreenWrapper>
  );
}

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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    padding: hp(2),
    borderRadius: theme.radius.lg,
    gap: wp(3),
    marginBottom: hp(3),
  },
  infoText: {
    flex: 1,
    fontSize: hp(1.5),
    color: theme.colors.text,
  },
  form: {
    flex: 1,
    gap: hp(2),
  },
  hint: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});