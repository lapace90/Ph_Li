// app/(screens)/help.jsx
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Linking, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';

const FAQ_ITEMS = [
  {
    question: "Comment fonctionne le matching ?",
    answer: "PharmaLink utilise un système de matching inspiré de Tinder. Swipez à droite pour montrer votre intérêt, à gauche pour passer. Quand les deux parties swipent à droite, un match est créé et vous pouvez commencer à discuter."
  },
  {
    question: "Comment vérifier mon profil RPPS ?",
    answer: "Rendez-vous dans Paramètres > Mon profil > Vérification RPPS. Entrez votre numéro RPPS à 11 chiffres et validez. La vérification est effectuée via l'Annuaire Santé officiel."
  },
  {
    question: "Comment vérifier mon SIRET ?",
    answer: "Pour les titulaires, animateurs freelance et laboratoires : allez dans Paramètres > Mon profil > Vérification SIRET. Entrez votre numéro SIRET à 14 chiffres. La vérification est effectuée via l'API INSEE."
  },
  {
    question: "Comment signaler un utilisateur ?",
    answer: "Sur le profil de l'utilisateur concerné, appuyez sur les trois points en haut à droite puis sur 'Signaler'. Choisissez un motif et ajoutez une description si nécessaire. Notre équipe examinera le signalement."
  },
  {
    question: "Comment bloquer un utilisateur ?",
    answer: "Sur le profil de l'utilisateur, appuyez sur les trois points puis sur 'Bloquer'. L'utilisateur bloqué ne pourra plus vous contacter et vous ne verrez plus son contenu. Vous pouvez débloquer depuis Paramètres > Utilisateurs bloqués."
  },
  {
    question: "Comment supprimer mon compte ?",
    answer: "Allez dans Paramètres > Données personnelles > Supprimer mon compte. Cette action est irréversible et supprimera toutes vos données conformément au RGPD."
  },
  {
    question: "Comment modifier mes préférences de recherche ?",
    answer: "Depuis l'écran de matching, appuyez sur l'icône de filtres. Vous pouvez ajuster la localisation, le rayon de recherche, les types de contrats et d'autres critères."
  },
  {
    question: "Comment créer plusieurs CV ?",
    answer: "Les utilisateurs premium peuvent créer jusqu'à 3 CV différents. Allez dans Mon profil > Mes CV > Créer un nouveau CV. Vous pouvez choisir lequel afficher sur votre carte de matching."
  },
];

const SUPPORT_EMAIL = 'contact@pharmalink.pro';

export default function Help() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Demande de support - PharmaLink');
    const body = encodeURIComponent('\n\n---\nVersion app: 1.0.0\nPlateforme: ');
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  };

  const handleReportBug = () => {
    const subject = encodeURIComponent('Signalement de bug - PharmaLink');
    const body = encodeURIComponent('Description du bug:\n\n\nÉtapes pour reproduire:\n1. \n2. \n3. \n\nComportement attendu:\n\n\n---\nVersion app: 1.0.0\nPlateforme: ');
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  };

  const handleRateApp = () => {
    Alert.alert(
      'Noter l\'application',
      'Vous aimez PharmaLink ? Laissez-nous un avis sur le store !',
      [
        { text: 'Plus tard', style: 'cancel' },
        {
          text: 'Noter maintenant',
          onPress: () => {
            // TODO: Remplacer par les vrais liens store
            // Linking.openURL('https://apps.apple.com/app/pharmalink/...');
            Alert.alert('Bientôt disponible', 'Les liens vers les stores seront ajoutés au lancement.');
          }
        },
      ]
    );
  };

  const MenuItem = ({ icon, label, description, onPress }) => (
    <Pressable style={[commonStyles.card, { padding: hp(2) }]} onPress={onPress}>
      <View style={commonStyles.row}>
        <View style={styles.menuIcon}>
          <Icon name={icon} size={22} color={theme.colors.primary} />
        </View>
        <View style={[commonStyles.flex1, { marginLeft: wp(3) }]}>
          <Text style={styles.menuTitle}>{label}</Text>
          {description && <Text style={styles.menuDescription}>{description}</Text>}
        </View>
        <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
      </View>
    </Pressable>
  );

  const FaqItem = ({ item, index }) => {
    const isExpanded = expandedFaq === index;

    return (
      <Pressable
        style={[commonStyles.card, { padding: hp(2) }]}
        onPress={() => toggleFaq(index)}
      >
        <View style={commonStyles.rowBetween}>
          <Text style={[styles.faqQuestion, commonStyles.flex1]}>{item.question}</Text>
          <Icon
            name={isExpanded ? 'chevronUp' : 'chevronDown'}
            size={18}
            color={theme.colors.textLight}
          />
        </View>
        {isExpanded && (
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        )}
      </Pressable>
    );
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={[commonStyles.flex1, { paddingHorizontal: wp(5), paddingTop: hp(2) }]}>
        <View style={[commonStyles.rowBetween, { marginBottom: hp(3) }]}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Aide & Support</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={commonStyles.flex1} showsVerticalScrollIndicator={false}>
          {/* Contact Section */}
          <Text style={[commonStyles.sectionTitleSmall, { marginBottom: hp(1) }]}>Contact</Text>
          <View style={{ gap: hp(1), marginBottom: hp(2.5) }}>
            <MenuItem
              icon="mail"
              label="Contacter le support"
              description="Réponse sous 24-48h"
              onPress={handleContactSupport}
            />
            <MenuItem
              icon="alertCircle"
              label="Signaler un bug"
              description="Aidez-nous à améliorer l'app"
              onPress={handleReportBug}
            />
            <MenuItem
              icon="star"
              label="Noter l'application"
              description="Votre avis compte !"
              onPress={handleRateApp}
            />
          </View>

          {/* FAQ Section */}
          <Text style={[commonStyles.sectionTitleSmall, { marginBottom: hp(1) }]}>
            Questions fréquentes
          </Text>
          <View style={{ gap: hp(1), marginBottom: hp(2.5) }}>
            {FAQ_ITEMS.map((item, index) => (
              <FaqItem key={index} item={item} index={index} />
            ))}
          </View>

          {/* About Section */}
          <Text style={[commonStyles.sectionTitleSmall, { marginBottom: hp(1) }]}>
            À propos
          </Text>
          <View style={[commonStyles.card, { padding: hp(2), marginBottom: hp(4) }]}>
            <View style={styles.aboutHeader}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>PL</Text>
              </View>
              <View style={{ marginLeft: wp(3) }}>
                <Text style={styles.appName}>PharmaLink</Text>
                <Text style={styles.appVersion}>Version 1.0.0</Text>
              </View>
            </View>
            <Text style={styles.aboutDescription}>
              PharmaLink est la plateforme de référence pour les professionnels du secteur pharmaceutique.
              Trouvez votre prochain emploi, stage ou mission d'animation en quelques swipes.
            </Text>
            <View style={styles.aboutLinks}>
              <Pressable
                style={styles.aboutLink}
                onPress={() => router.push({ pathname: '/legalDocument', params: { type: 'cgu' } })}
              >
                <Text style={styles.aboutLinkText}>CGU</Text>
              </Pressable>
              <Text style={styles.aboutLinkDivider}>•</Text>
              <Pressable
                style={styles.aboutLink}
                onPress={() => router.push({ pathname: '/legalDocument', params: { type: 'privacy' } })}
              >
                <Text style={styles.aboutLinkText}>Confidentialité</Text>
              </Pressable>
            </View>
            <Text style={[commonStyles.hint, { textAlign: 'center', marginTop: hp(2) }]}>
              © 2026 PharmaLink - Tous droits réservés
            </Text>
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  menuIcon: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: hp(1.7),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  menuDescription: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.regular,
    marginTop: 2,
  },
  faqQuestion: {
    fontSize: hp(1.6),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    paddingRight: wp(2),
  },
  faqAnswer: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.regular,
    marginTop: hp(1.5),
    lineHeight: hp(2.2),
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  logoContainer: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(3),
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: hp(2.5),
    fontFamily: theme.fonts.bold,
    color: 'white',
  },
  appName: {
    fontSize: hp(2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  appVersion: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.regular,
    color: theme.colors.textLight,
  },
  aboutDescription: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.regular,
    lineHeight: hp(2.2),
    textAlign: 'center',
  },
  aboutLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(2),
  },
  aboutLink: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
  },
  aboutLinkText: {
    fontSize: hp(1.5),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  aboutLinkDivider: {
    color: theme.colors.textLight,
    marginHorizontal: wp(1),
  },
});
