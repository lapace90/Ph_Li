import { StyleSheet, Text, View, ScrollView, Linking, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Logo from '../../assets/icons/Logo';
import Icon from '../../assets/icons/Icon';

export default function About() {
  const router = useRouter();

  const handleContact = () => {
    Linking.openURL('mailto:contact@pharmalink.fr');
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BackButton router={router} />
          <Text style={styles.title}>À propos</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.logoContainer}>
          <Logo size={wp(30)} />
          <View style={styles.titleRow}>
            <Text style={styles.titlePharma}>Pharma</Text>
            <Text style={styles.titleLink}>Link</Text>
          </View>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notre mission</Text>
          <Text style={styles.cardText}>
            PharmaLink connecte les professionnels de la pharmacie avec les meilleures opportunités. 
            Notre plateforme facilite le recrutement tout en garantissant la confidentialité des candidats en poste.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fonctionnalités</Text>
          <View style={styles.featureList}>
            <FeatureItem icon="search" text="Recherche d'emploi géolocalisée" />
            <FeatureItem icon="heart" text="Matching intelligent" />
            <FeatureItem icon="lock" text="Profils anonymes" />
            <FeatureItem icon="messageCircle" text="Messagerie sécurisée" />
            <FeatureItem icon="fileText" text="Gestion multi-CV" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact</Text>
          <Pressable style={styles.contactButton} onPress={handleContact}>
            <Icon name="mail" size={20} color={theme.colors.primary} />
            <Text style={styles.contactText}>contact@pharmalink.fr</Text>
          </Pressable>
        </View>

        <Text style={styles.copyright}>
          © 2025 PharmaLink. Tous droits réservés.
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}

const FeatureItem = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <Icon name={icon} size={18} color={theme.colors.primary} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: hp(3),
  },
  titleRow: {
    flexDirection: 'row',
    marginTop: hp(1),
  },
  titlePharma: {
    fontSize: hp(2.5),
    fontFamily: theme.fonts.extraBold,
    color: theme.colors.primary,
  },
  titleLink: {
    fontSize: hp(2.5),
    fontFamily: theme.fonts.bold,
    color: theme.colors.secondary,
  },
  version: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: hp(0.5),
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: hp(2),
  },
  cardTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(1),
  },
  cardText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    lineHeight: hp(2.4),
  },
  featureList: {
    gap: hp(1),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  featureText: {
    fontSize: hp(1.6),
    color: theme.colors.text,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  contactText: {
    fontSize: hp(1.7),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  copyright: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginVertical: hp(4),
  },
});