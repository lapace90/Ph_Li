import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../helpers/common';
import { theme } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { logService } from '../services/logService';
import ScreenWrapper from '../components/common/ScreenWrapper';
import Button from '../components/common/Button';
import Icon from '../assets/icons/Icon';
import Loading from '../components/common/Loading';

export default function ConfirmSignup() {
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const checkConfirmation = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          setStatus('error');
          return;
        }

        if (user) {
          setUserEmail(user.email);

          // Log la confirmation d'email
          logService.auth.login(user.id, user.email);

          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (err) {
        setStatus('error');
      }
    };

    checkConfirmation();
  }, []);

  if (status === 'loading') {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <StatusBar style="dark" />
        <View style={styles.container}>
          <Loading size="large" />
          <Text style={styles.loadingText}>Vérification en cours...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (status === 'error') {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <StatusBar style="dark" />
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={[styles.iconContainer, styles.errorIcon]}>
              <Icon name="x" size={48} color={theme.colors.error} />
            </View>
            <Text style={styles.title}>Lien invalide</Text>
            <Text style={styles.subtitle}>
              Ce lien de confirmation a expiré ou est invalide. Veuillez vous reconnecter pour recevoir un nouveau lien.
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
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon name="check" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Email confirmé !</Text>
          <Text style={styles.subtitle}>
            {userEmail
              ? `Votre adresse ${userEmail} a été confirmée avec succès.`
              : 'Votre adresse email a été confirmée avec succès.'}
          </Text>
          <Text style={styles.hint}>
            Vous pouvez maintenant profiter de toutes les fonctionnalités de PharmaLink.
          </Text>
        </View>
        <Button
          title="Continuer"
          onPress={() => router.replace('/(main)/home')}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(5),
    paddingTop: hp(8),
    paddingBottom: hp(4),
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(2),
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
  errorIcon: {
    backgroundColor: '#FEE2E2',
  },
  title: {
    fontSize: hp(2.8),
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: hp(2.6),
    paddingHorizontal: wp(5),
  },
  hint: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: hp(1.8),
    color: theme.colors.textLight,
  },
});
