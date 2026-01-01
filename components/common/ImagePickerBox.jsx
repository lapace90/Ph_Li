import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';
import ImagePickerModal from './ImagePickerModal';
import ImagePreviewModal from './ImagePreviewModal';

/**
 * ImagePickerBox - Composant réutilisable pour sélectionner des images
 */
const ImagePickerBox = ({
  value,
  values = [],
  onChange,
  onAdd,
  onRemove,
  shape = 'square',
  size = 120,
  multiple = false,
  maxImages = 5,
  placeholder = 'Ajouter une photo',
  showCamera = true,
  loading = false,
  title = 'Photo',
}) => {
  const [localLoading, setLocalLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const isLoading = loading || localLoading;

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Nous avons besoin d\'accéder à vos photos pour continuer.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Nous avons besoin d\'accéder à votre caméra pour continuer.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImage = async (useCamera = false) => {
    if (useCamera) {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;
    } else {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;
    }

    setLocalLoading(true);

    try {
      const options = {
        mediaTypes: ['images'],
        allowsEditing: false,     // Pas de crop forcé
        quality: 0.5,             // Compression 50% pour réduire la taille
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        
        console.log('📷 Image selected:', {
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize ? `${(asset.fileSize / 1024 / 1024).toFixed(2)}MB` : 'unknown',
        });

        // Ouvrir le modal de preview
        setPendingImage(asset.uri);
        setPreviewVisible(true);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
      console.error('ImagePicker error:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handlePreviewConfirm = (asset) => {
    setPreviewVisible(false);
    setPendingImage(null);

    if (multiple && onAdd) {
      onAdd(asset);
    } else if (onChange) {
      onChange(asset);
    }
  };

  const handlePreviewClose = () => {
    setPreviewVisible(false);
    setPendingImage(null);
  };

  const openModal = (index = null) => {
    setSelectedIndex(index);
    setModalVisible(true);
  };

  const handleRemove = () => {
    if (multiple && onRemove && selectedIndex !== null) {
      onRemove(selectedIndex);
    } else if (onChange) {
      onChange(null);
    }
    setSelectedIndex(null);
  };

  const getContainerStyle = () => {
    const baseStyle = {
      width: size,
      height: shape === 'rectangle' ? size * 0.5625 : size,
      borderRadius: shape === 'circle' ? size / 2 : theme.radius.lg,
    };
    return baseStyle;
  };

  // Mode Single
  if (!multiple) {
    return (
      <View style={styles.singleContainer}>
        <Pressable
          style={[
            styles.pickerBox,
            getContainerStyle(),
            value && styles.pickerBoxWithImage,
          ]}
          onPress={() => openModal()}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : value ? (
            <>
              <Image
                source={{ uri: value }}
                style={[styles.image, getContainerStyle()]}
                contentFit="cover"
              />
              <View style={styles.editOverlay}>
                <Icon name="camera" size={20} color="white" />
              </View>
            </>
          ) : (
            <View style={styles.placeholderContent}>
              <View style={styles.placeholderIconContainer}>
                <Icon name="camera" size={size * 0.2} color={theme.colors.primary} />
              </View>
              <Text style={styles.placeholderText}>{placeholder}</Text>
            </View>
          )}
        </Pressable>

        <ImagePickerModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onPickCamera={() => pickImage(true)}
          onPickGallery={() => pickImage(false)}
          onRemove={handleRemove}
          showRemove={!!value}
          title={value ? 'Modifier la photo' : 'Ajouter une photo'}
        />

        <ImagePreviewModal
          visible={previewVisible}
          imageUri={pendingImage}
          onClose={handlePreviewClose}
          onConfirm={handlePreviewConfirm}
          shape={shape}
          title="Aperçu"
        />
      </View>
    );
  }

  // Mode Multiple
  const canAddMore = values.length < maxImages;

  return (
    <View style={styles.multipleContainer}>
      <View style={styles.imagesGrid}>
        {values.map((uri, index) => (
          <Pressable 
            key={index} 
            style={styles.imageWrapper}
            onPress={() => openModal(index)}
          >
            <Image
              source={{ uri }}
              style={styles.gridImage}
              contentFit="cover"
            />
            <View style={styles.editOverlaySmall}>
              <Icon name="edit" size={14} color="white" />
            </View>
            {index === 0 && (
              <View style={styles.mainBadge}>
                <Text style={styles.mainBadgeText}>Principale</Text>
              </View>
            )}
          </Pressable>
        ))}

        {canAddMore && (
          <Pressable
            style={styles.addButton}
            onPress={() => openModal(null)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <>
                <View style={styles.addIconContainer}>
                  <Icon name="plus" size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.addButtonText}>Ajouter</Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      <Text style={styles.counterText}>
        {values.length}/{maxImages} photos
      </Text>

      <ImagePickerModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedIndex(null);
        }}
        onPickCamera={() => pickImage(true)}
        onPickGallery={() => pickImage(false)}
        onRemove={handleRemove}
        showRemove={selectedIndex !== null}
        title={selectedIndex !== null ? 'Modifier la photo' : 'Ajouter une photo'}
      />

      <ImagePreviewModal
        visible={previewVisible}
        imageUri={pendingImage}
        onClose={handlePreviewClose}
        onConfirm={handlePreviewConfirm}
        shape={shape}
        title="Aperçu"
      />
    </View>
  );
};

export default ImagePickerBox;

const styles = StyleSheet.create({
  // Single mode
  singleContainer: {
    alignItems: 'center',
  },
  pickerBox: {
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pickerBoxWithImage: {
    borderStyle: 'solid',
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContent: {
    alignItems: 'center',
    gap: hp(1.5),
  },
  placeholderIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    textAlign: 'center',
    fontFamily: theme.fonts.medium,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOverlaySmall: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Multiple mode
  multipleContainer: {
    gap: hp(1),
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  imageWrapper: {
    width: wp(28),
    height: wp(28),
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  mainBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    paddingVertical: 4,
    alignItems: 'center',
  },
  mainBadgeText: {
    fontSize: hp(1),
    color: 'white',
    fontFamily: theme.fonts.medium,
  },
  addButton: {
    width: wp(28),
    height: wp(28),
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    gap: hp(0.5),
  },
  addIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.medium,
  },
  counterText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    textAlign: 'right',
  },
});