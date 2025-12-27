import { StyleSheet, Text, View, Pressable, Modal } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

/**
 * Modal de choix : créer un CV via formulaire ou importer un PDF
 */
const CVTypeChoice = ({ visible, onClose, onChoosePDF, onChooseForm }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Ajouter un CV</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Icon name="x" size={22} color={theme.colors.text} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Comment souhaitez-vous créer votre CV ?
          </Text>

          <View style={styles.options}>
            {/* Option Formulaire */}
            <Pressable 
              style={styles.optionCard}
              onPress={onChooseForm}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                <Icon name="edit" size={28} color={theme.colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Créer via formulaire</Text>
                <Text style={styles.optionDescription}>
                  CV structuré Pharma Link avec version anonyme automatique
                </Text>
              </View>
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>Recommandé</Text>
              </View>
            </Pressable>

            {/* Option PDF */}
            <Pressable 
              style={styles.optionCard}
              onPress={onChoosePDF}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
                <Icon name="file" size={28} color={theme.colors.secondary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Importer un PDF</Text>
                <Text style={styles.optionDescription}>
                  Uploadez votre CV existant (visible après match uniquement)
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Icon name="info" size={18} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Le CV formulaire permet un meilleur matching avec les offres et une version anonyme automatique.
              Vous pouvez aussi ajouter un PDF en complément.
            </Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default CVTypeChoice;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    padding: wp(5),
    paddingBottom: hp(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  title: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  closeButton: {
    padding: hp(0.5),
  },
  subtitle: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    marginBottom: hp(2),
  },
  options: {
    gap: hp(1.5),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
    marginLeft: wp(3),
  },
  optionTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  optionDescription: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginTop: hp(0.3),
  },
  recommendedBadge: {
    position: 'absolute',
    top: hp(1),
    right: hp(1),
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  recommendedText: {
    fontSize: hp(1.1),
    color: 'white',
    fontFamily: theme.fonts.medium,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    marginTop: hp(2),
    gap: wp(2),
  },
  infoText: {
    flex: 1,
    fontSize: hp(1.3),
    color: theme.colors.primary,
    lineHeight: hp(1.9),
  },
});