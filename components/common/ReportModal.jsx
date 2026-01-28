// Modal de signalement réutilisable

import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';
import { REPORT_REASONS, REPORT_REASON_LABELS } from '../../services/reportService';

/**
 * Modal de signalement d'utilisateur ou de contenu
 *
 * @param {boolean} visible - Afficher la modal
 * @param {function} onClose - Callback fermeture
 * @param {function} onSubmit - Callback soumission (reason, description) => Promise
 * @param {string} targetName - Nom de la cible (pour affichage)
 * @param {string} targetType - 'user' | 'content'
 */
export const ReportModal = ({
  visible,
  onClose,
  onSubmit,
  targetName = 'cet utilisateur',
  targetType = 'user',
}) => {
  const [selectedReason, setSelectedReason] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setLoading(true);
    try {
      await onSubmit(selectedReason, description.trim() || null);
      handleClose();
    } catch (err) {
      // L'erreur est gérée dans le hook
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription('');
    onClose();
  };

  const reasons = Object.values(REPORT_REASONS);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Icon name="flag" size={24} color={theme.colors.rose} />
            </View>
            <Text style={styles.title}>Signaler</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Icon name="x" size={24} color={theme.colors.textLight} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Pourquoi souhaitez-vous signaler {targetName} ?
            </Text>

            {/* Raisons */}
            <View style={styles.reasonsContainer}>
              {reasons.map((reason) => (
                <Pressable
                  key={reason}
                  style={[
                    styles.reasonItem,
                    selectedReason === reason && styles.reasonItemSelected,
                  ]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <View style={[
                    styles.radioOuter,
                    selectedReason === reason && styles.radioOuterSelected,
                  ]}>
                    {selectedReason === reason && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[
                    styles.reasonText,
                    selectedReason === reason && styles.reasonTextSelected,
                  ]}>
                    {REPORT_REASON_LABELS[reason]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Description optionnelle */}
            <Text style={styles.label}>Détails supplémentaires (optionnel)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Décrivez la situation..."
              placeholderTextColor={theme.colors.textLight}
              multiline
              numberOfLines={4}
              maxLength={500}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/500</Text>

            {/* Info */}
            <View style={styles.infoBox}>
              <Icon name="info" size={16} color={theme.colors.secondary} />
              <Text style={styles.infoText}>
                Votre signalement est confidentiel. Notre équipe l'examinera dans les plus brefs délais.
              </Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>

            <Pressable
              style={[
                styles.submitButton,
                !selectedReason && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Envoyer</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

/**
 * Bouton pour ouvrir la modal de signalement
 */
export const ReportButton = ({
  onPress,
  size = 'medium',
  style,
  showLabel = false,
}) => {
  const sizes = {
    small: { button: 32, icon: 16 },
    medium: { button: 40, icon: 20 },
    large: { button: 48, icon: 24 },
  };

  const { button: buttonSize, icon: iconSize } = sizes[size] || sizes.medium;

  if (showLabel) {
    return (
      <Pressable style={[styles.reportButtonWithLabel, style]} onPress={onPress}>
        <Icon name="flag" size={iconSize} color={theme.colors.rose} />
        <Text style={styles.reportButtonLabel}>Signaler</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[
        styles.reportButton,
        { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
        style,
      ]}
      onPress={onPress}
    >
      <Icon name="flag" size={iconSize} color={theme.colors.textLight} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.roseLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  title: {
    flex: 1,
    fontSize: hp(2.2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
  },
  subtitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: hp(2),
  },
  reasonsContainer: {
    marginBottom: hp(2),
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.md,
    marginBottom: hp(1),
    backgroundColor: theme.colors.background,
  },
  reasonItemSelected: {
    backgroundColor: theme.colors.rose + '15',
    borderWidth: 1,
    borderColor: theme.colors.rose,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.gray,
    marginRight: wp(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: theme.colors.rose,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.rose,
  },
  reasonText: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
  },
  reasonTextSelected: {
    fontFamily: theme.fonts.medium,
    color: theme.colors.rose,
  },
  label: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.medium,
    color: theme.colors.textLight,
    marginBottom: hp(1),
  },
  textInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    fontSize: hp(1.7),
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
    minHeight: hp(12),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  charCount: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.regular,
    color: theme.colors.textLight,
    textAlign: 'right',
    marginTop: hp(0.5),
    marginBottom: hp(2),
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.secondary + '10',
    padding: wp(3),
    borderRadius: theme.radius.md,
    marginBottom: hp(2),
  },
  infoText: {
    flex: 1,
    marginLeft: wp(2),
    fontSize: hp(1.5),
    fontFamily: theme.fonts.regular,
    color: theme.colors.secondary,
    lineHeight: hp(2.2),
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: wp(3),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.textLight,
  },
  submitButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.rose,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: '#fff',
  },
  reportButton: {
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reportButtonWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
  },
  reportButtonLabel: {
    marginLeft: wp(2),
    fontSize: hp(1.6),
    fontFamily: theme.fonts.medium,
    color: theme.colors.rose,
  },
});

export default ReportModal;
