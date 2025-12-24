import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../helpers/common';
import { theme } from '../constants/theme';
import ScreenWrapper from '../components/common/ScreenWrapper';
import Button from '../components/common/Button';
import Icon from '../assets/icons/Icon';
import Logo from '../assets/icons/Logo';

const Welcome = () => {
  const router = useRouter();

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Header avec logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Logo size={wp(45)} />
          </View>
          <View style={styles.titleRow}>
            <Text style={styles.titlePharma}>Pharma</Text>
            <Text style={styles.titleLink}>Link</Text>
          </View>
          <Text style={styles.subtitle}>
            La passerelle entre talents et pharmacies
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Icon name="search" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Offres d'emploi</Text>
              <Text style={styles.featureText}>
                CDI, CDD, vacations, stages et alternances
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Icon name="location" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Recherche géolocalisée</Text>
              <Text style={styles.featureText}>
                Trouvez des annonces près de chez vous
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Icon name="heart" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Matching intelligent</Text>
              <Text style={styles.featureText}>
                Swipez et matchez avec les offres qui vous correspondent
              </Text>
            </View>
          </View>
        </View>

        {/* Footer avec boutons */}
        <View style={styles.footer}>
          <Button
            title="Commencer"
            onPress={() => router.push('/(auth)/signUp')}
          />
          
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Déjà inscrit ? </Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(6),
    justifyContent: 'space-between',
    paddingTop: hp(6),
    paddingBottom: hp(4),
  },
  header: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: hp(2),
  },
  titleRow: {
    flexDirection: 'row',
  },
  titlePharma: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
  },
  titleLink: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold,
    color: theme.colors.secondary,
  },
  subtitle: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: hp(1),
    paddingHorizontal: wp(4),
    lineHeight: hp(2.6),
  },
  features: {
    gap: hp(2),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  featureIcon: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(4),
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: hp(1.9),
    fontWeight: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(0.3),
  },
  featureText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    lineHeight: hp(2.2),
  },
  footer: {
    gap: hp(2),
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
  },
  loginLink: {
    fontSize: hp(1.8),
    color: theme.colors.primary,
    fontWeight: theme.fonts.semiBold,
  },
});