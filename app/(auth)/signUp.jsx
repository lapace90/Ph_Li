import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Icon from '../../assets/icons/Icon';

const SignUp = () => {
  const router = useRouter();
  const { signUp } = useAuth();
  const emailRef = useRef('');
  const passwordRef = useRef('');
  const confirmPasswordRef = useRef('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const email = emailRef.current.trim();
    const password = passwordRef.current.trim();
    const confirmPassword = confirmPasswordRef.current.trim();

    if (!email || !password || !confirmPassword) {
      Alert.alert('Inscription', 'Veuillez remplir tous les champs');
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Email invalide', 'Veuillez entrer un email valide');
      return;
    }

    // Validation mot de passe
    if (password.length < 6) {
      Alert.alert('Mot de passe faible', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    const { data, error } = await signUp(email, password, {});
    setLoading(false);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else if (data?.user) {
      // Redirection vers onboarding
      router.replace('/(auth)/onboarding');
    }
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <BackButton router={router} />

        <View style={styles.header}>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez la communauté Pharma Link</Text>
        </View>

        <View style={styles.form}>
          <Input
            icon={<Icon name="mail" size={22} color={theme.colors.textLight} />}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(value) => (emailRef.current = value)}
          />

          <Input
            icon={<Icon name="lock" size={22} color={theme.colors.textLight} />}
            placeholder="Mot de passe"
            secureTextEntry
            onChangeText={(value) => (passwordRef.current = value)}
          />

          <Input
            icon={<Icon name="lock" size={22} color={theme.colors.textLight} />}
            placeholder="Confirmer le mot de passe"
            secureTextEntry
            onChangeText={(value) => (confirmPasswordRef.current = value)}
          />

          <Button 
            title="S'inscrire" 
            loading={loading} 
            onPress={onSubmit} 
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Vous avez déjà un compte ?</Text>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: hp(3),
    paddingHorizontal: wp(5),
    paddingTop: hp(8),
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
  form: {
    gap: hp(2),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    fontSize: hp(1.8),
    color: theme.colors.text,
  },
  footerLink: {
    fontSize: hp(1.8),
    color: theme.colors.primary,
    fontWeight: theme.fonts.semiBold,
  },
});