import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';

const LEGAL_CONTENT = {
  cgu: {
    title: "Conditions Générales d'Utilisation",
    lastUpdate: "1er janvier 2025",
    sections: [
      {
        title: "1. Objet",
        content: "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de l'application PharmaLink, plateforme de mise en relation entre professionnels du secteur pharmaceutique."
      },
      {
        title: "2. Acceptation des conditions",
        content: "L'utilisation de l'application implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application."
      },
      {
        title: "3. Inscription et compte",
        content: "L'accès aux fonctionnalités de l'application nécessite la création d'un compte. Vous vous engagez à fournir des informations exactes et à jour, et à maintenir la confidentialité de vos identifiants."
      },
      {
        title: "4. Services proposés",
        content: "PharmaLink permet aux professionnels de la pharmacie de : créer un profil professionnel, rechercher des opportunités d'emploi, publier des offres d'emploi, et entrer en contact avec d'autres professionnels."
      },
      {
        title: "5. Responsabilités",
        content: "Vous êtes responsable du contenu que vous publiez. PharmaLink se réserve le droit de supprimer tout contenu inapproprié ou contraire aux présentes CGU."
      },
      {
        title: "6. Propriété intellectuelle",
        content: "L'ensemble des éléments de l'application (textes, graphiques, logos, etc.) sont protégés par le droit de la propriété intellectuelle et appartiennent à PharmaLink."
      },
      {
        title: "7. Modification des CGU",
        content: "PharmaLink se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle."
      },
    ]
  },
  privacy: {
    title: "Politique de Confidentialité",
    lastUpdate: "1er janvier 2025",
    sections: [
      {
        title: "1. Collecte des données",
        content: "Nous collectons les données que vous nous fournissez lors de votre inscription et utilisation de l'application : nom, prénom, email, téléphone, informations professionnelles, CV, et données de localisation."
      },
      {
        title: "2. Utilisation des données",
        content: "Vos données sont utilisées pour : fournir nos services, améliorer l'expérience utilisateur, vous mettre en relation avec des employeurs ou candidats, et vous envoyer des communications relatives à nos services."
      },
      {
        title: "3. Partage des données",
        content: "Vos données peuvent être partagées avec : les autres utilisateurs selon vos paramètres de confidentialité, nos prestataires techniques, et les autorités si requis par la loi."
      },
      {
        title: "4. Protection des données",
        content: "Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction."
      },
      {
        title: "5. Conservation des données",
        content: "Vos données sont conservées pendant la durée de votre utilisation du service et jusqu'à 3 ans après la suppression de votre compte, sauf obligation légale contraire."
      },
      {
        title: "6. Vos droits",
        content: "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression, de portabilité et d'opposition concernant vos données personnelles."
      },
      {
        title: "7. Cookies",
        content: "L'application utilise des technologies de suivi pour améliorer votre expérience. Vous pouvez gérer vos préférences dans les paramètres de l'application."
      },
      {
        title: "8. Contact",
        content: "Pour toute question relative à vos données personnelles, contactez-nous à : privacy@pharmalink.fr"
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
      <View style={[commonStyles.flex1, commonStyles.scrollContent, { paddingTop: hp(2) }]}>
        <View style={commonStyles.rowBetween}>
          <BackButton router={router} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {type === 'privacy' ? 'Confidentialité' : 'CGU'}
          </Text>
          <View style={commonStyles.headerSpacer} />
        </View>

        <ScrollView 
          style={commonStyles.flex1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: hp(2) }}
        >
          <Text style={commonStyles.headerTitleLarge}>{content.title}</Text>
          <Text style={[commonStyles.hint, { marginBottom: hp(3) }]}>
            Dernière mise à jour : {content.lastUpdate}
          </Text>

          {content.sections.map((section, index) => (
            <View key={index} style={commonStyles.section}>
              <Text style={commonStyles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={[commonStyles.hint, commonStyles.textCenter]}>
              En utilisant PharmaLink, vous acceptez ces conditions.
            </Text>
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
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
});