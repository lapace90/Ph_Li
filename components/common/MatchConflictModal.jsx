import { Modal, StyleSheet, Text, View, Pressable } from 'react-native';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Button from './Button';
import Icon from '../../assets/icons/Icon';

/**
 * Modal d'avertissement en cas de conflit de dates avec un match existant
 */
export default function MatchConflictModal({ visible, conflicts, onContinue, onCancel }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Icon name="alertTriangle" size={48} color={theme.colors.warning} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Match en cours</Text>

          {/* Message */}
          <Text style={styles.message}>
            Vous avez déjà un match confirmé avec accès au chat pour:
          </Text>

          {/* Conflicts list */}
          <View style={styles.conflictsContainer}>
            {conflicts.map((conflict) => (
              <View key={conflict.id} style={styles.conflictItem}>
                <View style={styles.conflictIcon}>
                  <Icon name="calendar" size={16} color={theme.colors.primary} />
                </View>
                <View style={styles.conflictContent}>
                  <Text style={styles.missionTitle} numberOfLines={1}>
                    {conflict.mission?.title || 'Mission'}
                  </Text>
                  <Text style={styles.dates}>
                    {formatDate(conflict.mission?.start_date)} - {formatDate(conflict.mission?.end_date)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Warning */}
          <View style={styles.warningBox}>
            <Icon name="info" size={18} color={theme.colors.warning} />
            <Text style={styles.warningText}>
              Si les deux missions sont confirmées, vous devrez en refuser une.
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Button
              title="Annuler"
              onPress={onCancel}
              buttonStyle={styles.cancelButton}
              textStyle={styles.cancelButtonText}
            />
            <Button
              title="Continuer"
              onPress={onContinue}
              buttonStyle={styles.continueButton}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  modal: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(3),
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: hp(2),
  },
  title: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: hp(1),
  },
  message: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: hp(2),
    lineHeight: hp(2.4),
  },
  conflictsContainer: {
    gap: hp(1.5),
    marginBottom: hp(2),
  },
  conflictItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: hp(1.5),
    borderRadius: theme.radius.md,
    gap: wp(3),
  },
  conflictIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conflictContent: {
    flex: 1,
  },
  missionTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(0.3),
  },
  dates: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.warning + '10',
    padding: hp(1.5),
    borderRadius: theme.radius.md,
    gap: wp(2),
    marginBottom: hp(2.5),
  },
  warningText: {
    flex: 1,
    fontSize: hp(1.4),
    color: theme.colors.warning,
    lineHeight: hp(2),
  },
  buttons: {
    flexDirection: 'row',
    gap: wp(3),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.text,
  },
  continueButton: {
    flex: 1,
  },
});
