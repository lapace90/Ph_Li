import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { logService } from '../../services/logService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Icon from '../../assets/icons/Icon';

const ForgotPassword = () => {
  const router = useRouter();
  const emailRef = useRef('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    const email = emailRef.current?.trim();

    if (!email) {
      Alert.alert('Erreur', 'Veuillez entrer votre adresse email');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'pharmalink://reset-password',
    });

    setLoading(false);

    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }

    // Log la demande de réinitialisation
    logService.auth.passwordResetRequested(email);

    setSent(true);
  };

  if (sent) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <StatusBar style="dark" />
        <View style={styles.container}>
          <BackButton router={router} />

          <View style={styles.successContainer}>
            <View style={styles.iconContainer}>
              <Icon name="mail" size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles.successTitle}>Email envoyé !</Text>
            <Text style={styles.successText}>
              Si un compte existe avec cette adresse, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
            </Text>
            <Text style={styles.successHint}>
              Pensez à vérifier vos spams si vous ne voyez pas l'email.
            </Text>
          </View>

          <Button
            title="Retour à la connexion"
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <BackButton router={router} />

        <View style={styles.header}>
          <Text style={styles.title}>Mot de passe oublié ?</Text>
          <Text style={styles.subtitle}>
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            icon={<Icon name="mail" size={22} color={theme.colors.textLight} />}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(value) => (emailRef.current = value)}
          />

          <Button
            title="Envoyer le lien"
            loading={loading}
            onPress={onSubmit}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Vous vous souvenez ?</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.footerLink}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: hp(3),
    paddingHorizontal: wp(5),
    paddingTop: hp(8),
  },
  header: {
    gap: hp(1.5),
  },
  title: {
    fontSize: hp(3),
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
  },
  subtitle: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    lineHeight: hp(2.6),
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
    fontFamily: theme.fonts.semiBold,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(2),
    paddingBottom: hp(10),
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
  successTitle: {
    fontSize: hp(2.5),
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
  },
  successText: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: hp(2.6),
    paddingHorizontal: wp(5),
  },
  successHint: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
});
