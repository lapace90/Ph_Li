// app/(screens)/legalDocument.jsx
import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import { shareLegalPdf } from '../../utils/legalPdfExport';

const LEGAL_CONTENT = {
  cgu: {
    title: "Conditions Générales d'Utilisation",
    lastUpdate: "28 janvier 2026",
    sections: [
      {
        title: "1. Objet",
        content: "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de l'application PharmaLink, plateforme de mise en relation entre professionnels du secteur pharmaceutique et de l'animation commerciale."
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
        content: "PharmaLink permet aux professionnels de : créer un profil professionnel, rechercher des opportunités d'emploi, publier des offres d'emploi, mettre en relation laboratoires et animateurs commerciaux, et entrer en contact avec d'autres professionnels. Un marketplace dédié permet aux laboratoires de trouver des animateurs freelance vérifiés."
      },
      {
        title: "5. Vérifications professionnelles",
        content: "Vérification RPPS : Les professionnels de santé (pharmaciens titulaires, préparateurs, candidats professionnels) peuvent soumettre leur numéro RPPS (Répertoire Partagé des Professionnels de Santé) pour obtenir un badge de vérification. Cette vérification est requise pour les titulaires souhaitant publier des offres d'emploi et renforce la crédibilité des candidats auprès des recruteurs.\n\nVérification SIRET : Les titulaires de pharmacie, animateurs freelance et laboratoires peuvent soumettre leur numéro SIRET pour obtenir un badge de vérification professionnelle. Cette vérification renforce la confiance sur le marketplace et sécurise les transactions.\n\nToutes ces vérifications sont facultatives mais fortement recommandées pour bénéficier de toutes les fonctionnalités de la plateforme."
      },
      {
        title: "6. Responsabilités",
        content: "Vous êtes responsable du contenu que vous publiez et de l'exactitude des informations fournies, y compris vos numéros RPPS et SIRET. PharmaLink se réserve le droit de supprimer tout contenu inapproprié, de retirer les badges de vérification en cas de signalement justifié ou d'informations frauduleuses, et de suspendre les comptes contrevenant aux présentes CGU."
      },
      {
        title: "7. Signalement et modération",
        content: "Signalement : Vous pouvez signaler tout utilisateur ou contenu que vous jugez inapproprié, frauduleux, offensant ou contraire aux présentes CGU. Les motifs de signalement incluent : spam, harcèlement, contenu inapproprié, faux profil, arnaque.\n\nTraitement : Chaque signalement est examiné par notre équipe de modération. Nous pouvons prendre les mesures suivantes : avertissement, suppression de contenu, suspension temporaire ou permanente du compte signalé.\n\nConfidentialité : L'identité des signaleurs n'est jamais communiquée aux utilisateurs signalés.\n\nAbus : Les signalements abusifs ou de mauvaise foi peuvent entraîner la suspension du compte du signaleur."
      },
      {
        title: "8. Blocage d'utilisateurs",
        content: "Vous pouvez bloquer tout utilisateur de votre choix. Conséquences du blocage :\n\n• L'utilisateur bloqué ne pourra plus vous contacter par messagerie\n• Vous ne verrez plus son profil, ses offres ou son contenu\n• Il ne verra plus votre profil ni vos offres\n• Les matchs existants avec cet utilisateur seront masqués\n\nVous pouvez débloquer un utilisateur à tout moment depuis Paramètres > Utilisateurs bloqués. Le blocage est une action privée : l'utilisateur bloqué n'est pas notifié."
      },
      {
        title: "9. Propriété intellectuelle",
        content: "L'ensemble des éléments de l'application (textes, graphiques, logos, etc.) sont protégés par le droit de la propriété intellectuelle et appartiennent à PharmaLink."
      },
      {
        title: "10. Modification des CGU",
        content: "PharmaLink se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle."
      },
    ]
  },
  privacy: {
    title: "Politique de Confidentialité",
    lastUpdate: "28 janvier 2026",
    sections: [
      {
        title: "1. Collecte des données",
        content: "Nous collectons les données que vous nous fournissez lors de votre inscription et utilisation de l'application : nom, prénom, email, téléphone, informations professionnelles, CV, données de localisation, numéro RPPS (pour professionnels de santé : pharmaciens titulaires, préparateurs, candidats professionnels), numéro SIRET (pour titulaires, animateurs et laboratoires), ainsi que les données liées à vos interactions (signalements effectués, utilisateurs bloqués)."
      },
      {
        title: "2. Traitement du numéro RPPS",
        content: "Finalité : Le numéro RPPS est collecté uniquement pour vérifier votre statut de professionnel de santé et attribuer un badge de confiance sur votre profil.\n\nBase légale : Consentement explicite lors de la soumission volontaire du numéro.\n\nTraitement : Votre numéro RPPS est vérifié via l'Annuaire Santé (API ANS) pour confirmer votre identité professionnelle. Nous comparons le nom associé au RPPS avec celui de votre profil.\n\nStockage : Le numéro RPPS est stocké de manière sécurisée dans notre base de données hébergée en Union Européenne. Seuls les 5 derniers chiffres peuvent être affichés partiellement sur votre profil.\n\nPartage : Le numéro RPPS complet n'est jamais partagé avec d'autres utilisateurs ni des tiers. Seul le statut \"vérifié\" ou \"non vérifié\" est visible.\n\nSuppression : En cas de suppression de compte, le numéro RPPS est anonymisé immédiatement avec l'ensemble de vos données personnelles."
      },
      {
        title: "3. Traitement du numéro SIRET",
        content: "Finalité : Le numéro SIRET est collecté pour vérifier le statut professionnel des titulaires de pharmacie, animateurs freelance et laboratoires, et attribuer un badge de confiance sur leur profil.\n\nBase légale : Consentement explicite lors de la soumission volontaire du numéro.\n\nTraitement : Votre numéro SIRET est vérifié via l'API Sirene (INSEE) pour confirmer l'existence et l'état actif de votre établissement. Nous vérifions également la correspondance entre les informations de l'établissement et votre profil.\n\nStockage : Le numéro SIRET est stocké de manière sécurisée dans notre base de données (table verification_documents) hébergée en Union Européenne. Le numéro peut être affiché formaté (XXX XXX XXX XXXXX) sur votre profil.\n\nPartage : Le numéro SIRET n'est jamais partagé avec des tiers commerciaux. Il peut être affiché sur votre profil public pour renforcer la confiance. Seul le statut \"vérifié\" ou \"non vérifié\" est obligatoirement visible.\n\nPharmacies multiples : Pour les titulaires gérant plusieurs pharmacies, chaque SIRET de pharmacie est stocké dans la table pharmacy_details avec vérification individuelle.\n\nSuppression : En cas de suppression de compte, le numéro SIRET et toutes les données de vérification sont anonymisés immédiatement avec l'ensemble de vos données personnelles."
      },
      {
        title: "4. Données de signalement et blocage",
        content: "Signalements : Lorsque vous signalez un utilisateur ou un contenu, nous collectons : votre identifiant, l'identifiant de la cible, le motif du signalement, et la description optionnelle. Ces données sont utilisées pour modérer la plateforme et ne sont accessibles qu'à notre équipe de modération.\n\nBlocages : Lorsque vous bloquez un utilisateur, nous enregistrons uniquement les identifiants des deux parties et la date. Cette information est utilisée pour filtrer le contenu que vous voyez et empêcher les communications.\n\nBase légale : Intérêt légitime (sécurité de la plateforme et des utilisateurs).\n\nConservation : Les signalements sont conservés 3 ans à des fins de traçabilité. Les blocages sont conservés tant que vous ne débloquez pas l'utilisateur ou que votre compte est actif.\n\nConfidentialité : L'identité des signaleurs n'est jamais communiquée aux utilisateurs signalés. Les utilisateurs bloqués ne sont pas informés du blocage."
      },
      {
        title: "5. Utilisation des données",
        content: "Vos données sont utilisées pour : fournir nos services, améliorer l'expérience utilisateur, vous mettre en relation avec des employeurs ou candidats, vérifier votre statut professionnel (RPPS/SIRET), assurer la sécurité de la plateforme (modération), et vous envoyer des communications relatives à nos services."
      },
      {
        title: "6. Partage des données",
        content: "Vos données peuvent être partagées avec : les autres utilisateurs selon vos paramètres de confidentialité, nos prestataires techniques (hébergement Supabase en UE), l'API INSEE pour vérification SIRET, l'API ANS pour vérification RPPS, et les autorités si requis par la loi. Les données de signalement ne sont jamais partagées avec les utilisateurs signalés. Vos données ne sont jamais vendues à des tiers."
      },
      {
        title: "7. Protection des données",
        content: "Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données : chiffrement en transit (TLS) et au repos, contrôle d'accès strict (Row Level Security), sauvegardes régulières, stockage sécurisé des numéros RPPS/SIRET avec contraintes d'unicité, et hébergement exclusif en Union Européenne."
      },
      {
        title: "8. Conservation des données",
        content: "Données de compte : conservées pendant la durée d'utilisation du service.\n\nAprès suppression du compte : anonymisation immédiate de toutes les données personnelles (nom, prénom, email, téléphone, RPPS, SIRET, localisation précise).\n\nDonnées de vérification (RPPS/SIRET) : conservées dans verification_documents avec statut et date, anonymisées à la suppression du compte.\n\nDonnées de signalement : conservées 3 ans pour traçabilité et prévention des abus.\n\nDonnées de blocage : conservées jusqu'au déblocage ou suppression du compte.\n\nDonnées de connexion : conservées 12 mois à des fins de sécurité.\n\nMessages : conservés 1 an puis supprimés automatiquement."
      },
      {
        title: "9. Vos droits (RGPD)",
        content: "Conformément au RGPD, vous disposez des droits suivants :\n\n• Droit d'accès : obtenir une copie de vos données (export JSON disponible dans l'app)\n• Droit de rectification : modifier vos informations à tout moment\n• Droit à l'effacement : supprimer votre compte et toutes vos données (y compris RPPS/SIRET)\n• Droit à la portabilité : récupérer vos données dans un format structuré\n• Droit d'opposition : refuser le matching automatique ou les communications marketing\n• Droit de retirer votre consentement : notamment pour les vérifications RPPS et SIRET (supprime les badges)\n\nPour exercer ces droits, rendez-vous dans Paramètres > Données personnelles ou contactez-nous."
      },
      {
        title: "10. Cookies et traceurs",
        content: "L'application mobile n'utilise pas de cookies. Des identifiants techniques sont utilisés uniquement pour le fonctionnement de l'authentification et des notifications push."
      },
      {
        title: "11. Transferts hors UE",
        content: "Vos données sont exclusivement stockées et traitées au sein de l'Union Européenne (hébergement Supabase région eu-west). Les vérifications RPPS (API ANS) et SIRET (API INSEE) sont effectuées via des API françaises. Aucun transfert vers des pays tiers n'est effectué."
      },
      {
        title: "12. Contact DPO",
        content: "Pour toute question relative à vos données personnelles ou pour exercer vos droits, contactez notre Délégué à la Protection des Données :\n\nEmail : dpo@pharmalink.fr\nAdresse : [Adresse de l'entreprise]\n\nVous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr)."
      },
    ]
  }
};

export default function LegalDocument() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const [exporting, setExporting] = useState(false);

  const content = LEGAL_CONTENT[type] || LEGAL_CONTENT.cgu;

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const result = await shareLegalPdf(content.title, content.lastUpdate, content.sections);
      if (!result.success) {
        Alert.alert('Erreur', result.error || 'Impossible de générer le PDF');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={[commonStyles.flex1, commonStyles.scrollContent, { paddingTop: hp(2) }]}>
        <View style={commonStyles.rowBetween}>
          <BackButton router={router} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {type === 'privacy' ? 'Confidentialité' : 'CGU'}
          </Text>
          <Pressable
            style={styles.downloadButton}
            onPress={handleExportPdf}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Icon name="download" size={22} color={theme.colors.primary} />
            )}
          </Pressable>
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
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
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