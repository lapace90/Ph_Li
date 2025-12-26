import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';

const LEGAL_CONTENT = {
  cgu: {
    title: "Conditions Générales d'Utilisation",
    lastUpdate: "1er décembre 2025",
    sections: [
      {
        title: "1. Objet",
        content: "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de l'application mobile PharmaLink, plateforme de mise en relation professionnelle dédiée au secteur pharmaceutique français."
      },
      {
        title: "2. Accès au service",
        content: "L'application est accessible gratuitement à tout professionnel du secteur pharmaceutique disposant d'un appareil mobile compatible. L'inscription nécessite une adresse email valide et l'acceptation des présentes CGU."
      },
      {
        title: "3. Inscription et compte utilisateur",
        content: "L'utilisateur s'engage à fournir des informations exactes lors de son inscription. Le numéro RPPS, s'il est fourni, fera l'objet d'une vérification manuelle. L'utilisateur est responsable de la confidentialité de ses identifiants."
      },
      {
        title: "4. Utilisation du service",
        content: "L'utilisateur s'engage à utiliser l'application de manière conforme à sa destination professionnelle. Toute utilisation frauduleuse, abusive ou contraire aux bonnes mœurs est strictement interdite."
      },
      {
        title: "5. Données personnelles",
        content: "Le traitement des données personnelles est effectué conformément au RGPD et à notre Politique de Confidentialité. L'utilisateur dispose d'un droit d'accès, de rectification et de suppression de ses données."
      },
      {
        title: "6. Propriété intellectuelle",
        content: "L'ensemble des éléments de l'application (design, code, contenus) sont protégés par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite."
      },
      {
        title: "7. Responsabilité",
        content: "PharmaLink agit en tant qu'intermédiaire et ne peut être tenu responsable des échanges entre utilisateurs. Nous nous efforçons d'assurer la disponibilité du service mais ne garantissons pas une accessibilité permanente."
      },
      {
        title: "8. Modification des CGU",
        content: "Nous nous réservons le droit de modifier les présentes CGU. Les utilisateurs seront informés de toute modification substantielle."
      },
      {
        title: "9. Droit applicable",
        content: "Les présentes CGU sont soumises au droit français. Tout litige sera de la compétence exclusive des tribunaux français."
      },
    ]
  },
  privacy: {
    title: "Politique de Confidentialité",
    lastUpdate: "1er décembre 2025",
    sections: [
      {
        title: "1. Responsable du traitement",
        content: "Le responsable du traitement des données personnelles est PharmaLink, application mobile de mise en relation professionnelle pour le secteur pharmaceutique."
      },
      {
        title: "2. Données collectées",
        content: "Nous collectons les données suivantes : informations d'identification (nom, prénom, email, téléphone), données professionnelles (expérience, spécialisations, CV), données de géolocalisation (ville, région), et numéro RPPS (optionnel)."
      },
      {
        title: "3. Finalités du traitement",
        content: "Vos données sont utilisées pour : gérer votre compte utilisateur, permettre la mise en relation avec des employeurs, améliorer nos services, et vous envoyer des notifications pertinentes."
      },
      {
        title: "4. Base légale",
        content: "Le traitement de vos données repose sur votre consentement (inscription), l'exécution du contrat (utilisation du service), et nos intérêts légitimes (amélioration du service)."
      },
      {
        title: "5. Destinataires des données",
        content: "Vos données peuvent être partagées avec : les employeurs (selon vos paramètres de confidentialité), nos sous-traitants techniques (hébergement, analytics), et les autorités compétentes si requis par la loi."
      },
      {
        title: "6. Durée de conservation",
        content: "Vos données sont conservées pendant la durée de votre inscription, puis anonymisées immédiatement après la suppression de votre compte. Les données de candidature sont conservées 2 ans."
      },
      {
        title: "7. Vos droits",
        content: "Conformément au RGPD, vous disposez des droits suivants : accès, rectification, effacement, portabilité, limitation et opposition au traitement. Vous pouvez exercer ces droits depuis l'application ou par email."
      },
      {
        title: "8. Sécurité",
        content: "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées : chiffrement des données, accès restreint, sauvegardes régulières, et hébergement en Europe (conformité RGPD)."
      },
      {
        title: "9. Cookies et traceurs",
        content: "L'application utilise des technologies de suivi à des fins d'analyse et d'amélioration du service. Vous pouvez gérer vos préférences depuis les paramètres de l'application."
      },
      {
        title: "10. Contact",
        content: "Pour toute question relative à vos données personnelles, vous pouvez nous contacter à : privacy@pharmalink.fr"
      },
    ]
  }
};

export default function LegalDocument() {
  const router = useRouter();
  const { type } = useLocalSearchParams();

  const content = LEGAL_CONTENT[type] || LEGAL_CONTENT.cgu;

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton router={router} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {type === 'privacy' ? 'Confidentialité' : 'CGU'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.lastUpdate}>
            Dernière mise à jour : {content.lastUpdate}
          </Text>

          {content.sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              En utilisant PharmaLink, vous acceptez ces conditions.
            </Text>
          </View>
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  headerTitle: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: hp(2.4),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  lastUpdate: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginBottom: hp(3),
  },
  section: {
    marginBottom: hp(2.5),
  },
  sectionTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(0.8),
  },
  sectionContent: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    lineHeight: hp(2.4),
  },
  footer: {
    paddingVertical: hp(4),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: hp(2),
  },
  footerText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});