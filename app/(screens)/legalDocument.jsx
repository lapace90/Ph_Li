// app/(screens)/legalDocument.jsx
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
    lastUpdate: "1er janvier 2026",
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
        title: "5. Vérification RPPS",
        content: "Les titulaires de pharmacie et préparateurs peuvent soumettre leur numéro RPPS (Répertoire Partagé des Professionnels de Santé) pour obtenir un badge de vérification. Cette vérification permet de publier des offres d'emploi et renforce la confiance entre utilisateurs. La soumission du numéro RPPS est facultative mais requise pour certaines fonctionnalités."
      },
      {
        title: "6. Responsabilités",
        content: "Vous êtes responsable du contenu que vous publiez et de l'exactitude des informations fournies, y compris votre numéro RPPS. PharmaLink se réserve le droit de supprimer tout contenu inapproprié, de retirer le badge RPPS en cas de signalement justifié, et de suspendre les comptes contrevenant aux présentes CGU."
      },
      {
        title: "7. Propriété intellectuelle",
        content: "L'ensemble des éléments de l'application (textes, graphiques, logos, etc.) sont protégés par le droit de la propriété intellectuelle et appartiennent à PharmaLink."
      },
      {
        title: "8. Modification des CGU",
        content: "PharmaLink se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle."
      },
    ]
  },
  privacy: {
    title: "Politique de Confidentialité",
    lastUpdate: "1er janvier 2026",
    sections: [
      {
        title: "1. Collecte des données",
        content: "Nous collectons les données que vous nous fournissez lors de votre inscription et utilisation de l'application : nom, prénom, email, téléphone, informations professionnelles, CV, et données de localisation."
      },
      {
        title: "2. Traitement du numéro RPPS",
        content: "Finalité : Le numéro RPPS est collecté uniquement pour vérifier votre statut de professionnel de santé et attribuer un badge de confiance sur votre profil.\n\nBase légale : Consentement explicite lors de la soumission volontaire du numéro.\n\nTraitement : Votre numéro RPPS est vérifié via l'Annuaire Santé (API ANS) pour confirmer votre identité professionnelle. Nous comparons le nom associé au RPPS avec celui de votre profil.\n\nStockage : Le numéro RPPS est stocké de manière sécurisée dans notre base de données hébergée en Union Européenne. Seuls les 5 derniers chiffres peuvent être affichés partiellement sur votre profil.\n\nPartage : Le numéro RPPS complet n'est jamais partagé avec d'autres utilisateurs ni des tiers. Seul le statut \"vérifié\" ou \"non vérifié\" est visible.\n\nSuppression : En cas de suppression de compte, le numéro RPPS est anonymisé immédiatement avec l'ensemble de vos données personnelles."
      },
      {
        title: "3. Utilisation des données",
        content: "Vos données sont utilisées pour : fournir nos services, améliorer l'expérience utilisateur, vous mettre en relation avec des employeurs ou candidats, et vous envoyer des communications relatives à nos services."
      },
      {
        title: "4. Partage des données",
        content: "Vos données peuvent être partagées avec : les autres utilisateurs selon vos paramètres de confidentialité, nos prestataires techniques (hébergement Supabase en UE), et les autorités si requis par la loi. Vos données ne sont jamais vendues à des tiers."
      },
      {
        title: "5. Protection des données",
        content: "Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données : chiffrement en transit (TLS) et au repos, contrôle d'accès strict (Row Level Security), sauvegardes régulières, et hébergement exclusif en Union Européenne."
      },
      {
        title: "6. Conservation des données",
        content: "Données de compte : conservées pendant la durée d'utilisation du service.\n\nAprès suppression du compte : anonymisation immédiate de toutes les données personnelles (nom, prénom, email, téléphone, RPPS, localisation précise).\n\nDonnées de connexion : conservées 12 mois à des fins de sécurité.\n\nMessages : conservés 1 an puis supprimés automatiquement."
      },
      {
        title: "7. Vos droits (RGPD)",
        content: "Conformément au RGPD, vous disposez des droits suivants :\n\n• Droit d'accès : obtenir une copie de vos données (export JSON disponible dans l'app)\n• Droit de rectification : modifier vos informations à tout moment\n• Droit à l'effacement : supprimer votre compte et toutes vos données\n• Droit à la portabilité : récupérer vos données dans un format structuré\n• Droit d'opposition : refuser le matching automatique ou les communications marketing\n• Droit de retirer votre consentement : notamment pour la vérification RPPS\n\nPour exercer ces droits, rendez-vous dans Paramètres > Données personnelles ou contactez-nous."
      },
      {
        title: "8. Cookies et traceurs",
        content: "L'application mobile n'utilise pas de cookies. Des identifiants techniques sont utilisés uniquement pour le fonctionnement de l'authentification et des notifications push."
      },
      {
        title: "9. Transferts hors UE",
        content: "Vos données sont exclusivement stockées et traitées au sein de l'Union Européenne (hébergement Supabase région eu-west). Aucun transfert vers des pays tiers n'est effectué."
      },
      {
        title: "10. Contact DPO",
        content: "Pour toute question relative à vos données personnelles ou pour exercer vos droits, contactez notre Délégué à la Protection des Données :\n\nEmail : dpo@pharmalink.fr\nAdresse : [Adresse de l'entreprise]\n\nVous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr)."
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
          contentContainerStyle={{ paddingTop: hp(2), paddingBottom: hp(4) }}
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