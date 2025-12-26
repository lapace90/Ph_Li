import { StyleSheet, Text, View, Pressable, Modal } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

/**
 * Modal de sélection d'image personnalisé
 */
const ImagePickerModal = ({
  visible,
  onClose,
  onPickCamera,
  onPickGallery,
  onRemove,
  showRemove = false,
  title = 'Photo',
}) => {
  const handleOption = (callback) => {
    onClose();
    // Petit délai pour laisser le modal se fermer
    setTimeout(callback, 300);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>{title}</Text>
          </View>

          <View style={styles.options}>
            <OptionButton
              icon="camera"
              label="Prendre une photo"
              description="Utiliser la caméra"
              onPress={() => handleOption(onPickCamera)}
              color={theme.colors.primary}
            />

            <OptionButton
              icon="image"
              label="Choisir depuis la galerie"
              description="Parcourir vos photos"
              onPress={() => handleOption(onPickGallery)}
              color={theme.colors.secondary}
            />

            {showRemove && (
              <>
                <View style={styles.separator} />
                <OptionButton
                  icon="trash"
                  label="Supprimer la photo"
                  description="Retirer cette image"
                  onPress={() => handleOption(onRemove)}
                  color={theme.colors.rose}
                  danger
                />
              </>
            )}
          </View>

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const OptionButton = ({ icon, label, description, onPress, color, danger = false }) => (
  <Pressable
    style={({ pressed }) => [
      styles.optionButton,
      pressed && styles.optionButtonPressed,
    ]}
    onPress={onPress}
  >
    <View style={[styles.optionIcon, { backgroundColor: color + '15' }]}>
      <Icon name={icon} size={24} color={color} />
    </View>
    <View style={styles.optionContent}>
      <Text style={[styles.optionLabel, danger && styles.optionLabelDanger]}>
        {label}
      </Text>
      <Text style={styles.optionDescription}>{description}</Text>
    </View>
    <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
  </Pressable>
);

export default ImagePickerModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl * 1.5,
    borderTopRightRadius: theme.radius.xl * 1.5,
    paddingBottom: hp(4),
  },
  header: {
    alignItems: 'center',
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  handle: {
    width: wp(10),
    height: 4,
    backgroundColor: theme.colors.gray,
    borderRadius: 2,
    marginBottom: hp(1.5),
  },
  title: {
    fontSize: hp(2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  options: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(2),
    borderRadius: theme.radius.lg,
  },
  optionButtonPressed: {
    backgroundColor: theme.colors.border + '50',
  },
  optionIcon: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
    marginLeft: wp(4),
  },
  optionLabel: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  optionLabelDanger: {
    color: theme.colors.rose,
  },
  optionDescription: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: hp(1),
    marginHorizontal: wp(2),
  },
  cancelButton: {
    marginHorizontal: wp(5),
    marginTop: hp(2),
    paddingVertical: hp(1.8),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.medium,
    color: theme.colors.textLight,
  },
});