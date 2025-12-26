import { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Pressable,
    Modal,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Modal de preview/confirmation d'image personnalisé
 */
const ImagePreviewModal = ({
    visible,
    imageUri,
    onClose,
    onConfirm,
    shape = 'square',
    title = 'Aperçu',
}) => {
    const [rotation, setRotation] = useState(0);
    const [processing, setProcessing] = useState(false);

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleConfirm = async () => {
        setProcessing(true);
        try {
            let actions = [];

            // Rotation si nécessaire
            if (rotation !== 0) {
                actions.push({ rotate: rotation });
            }

            // Redimensionner si l'image est trop grande (max 1200px de large)
            actions.push({ resize: { width: 1200 } });

            // Toujours appliquer une compression
            const result = await ImageManipulator.manipulateAsync(
                imageUri,
                actions,
                {
                    compress: 0.7,  // Compression à 70%
                    format: ImageManipulator.SaveFormat.JPEG
                }
            );

            onConfirm({ uri: result.uri });
        } catch (error) {
            console.error('Image processing error:', error);
            // En cas d'erreur, envoyer l'image originale
            onConfirm({ uri: imageUri });
        } finally {
            setProcessing(false);
            setRotation(0);
        }
    };

    const handleClose = () => {
        setRotation(0);
        onClose();
    };

    const previewSize = SCREEN_WIDTH - wp(10);
    const previewHeight = shape === 'rectangle' ? previewSize * 0.5625 : previewSize;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable style={styles.closeButton} onPress={handleClose}>
                            <Icon name="x" size={24} color={theme.colors.text} />
                        </Pressable>
                        <Text style={styles.title}>{title}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Image Preview */}
                    <View style={styles.previewContainer}>
                        <View
                            style={[
                                styles.imageFrame,
                                {
                                    width: previewSize,
                                    height: previewHeight,
                                    borderRadius: shape === 'circle' ? previewSize / 2 : theme.radius.xl,
                                },
                            ]}
                        >
                            {imageUri && (
                                <Image
                                    source={{ uri: imageUri }}
                                    style={[
                                        styles.image,
                                        {
                                            borderRadius: shape === 'circle' ? previewSize / 2 : theme.radius.xl,
                                            transform: [{ rotate: `${rotation}deg` }],
                                        },
                                    ]}
                                    contentFit="cover"
                                />
                            )}
                        </View>

                        {/* Indicateur de forme pour circle */}
                        {shape === 'circle' && (
                            <Text style={styles.shapeHint}>
                                L'image sera affichée en cercle
                            </Text>
                        )}
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Pressable
                            style={styles.actionButton}
                            onPress={handleRotate}
                            disabled={processing}
                        >
                            <View style={styles.actionIcon}>
                                <Icon name="refresh" size={22} color={theme.colors.primary} />
                            </View>
                            <Text style={styles.actionText}>Pivoter</Text>
                        </Pressable>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttons}>
                        <Pressable
                            style={styles.cancelButton}
                            onPress={handleClose}
                            disabled={processing}
                        >
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </Pressable>

                        <Pressable
                            style={styles.confirmButton}
                            onPress={handleConfirm}
                            disabled={processing}
                        >
                            {processing ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Icon name="check" size={20} color="white" />
                                    <Text style={styles.confirmButtonText}>Confirmer</Text>
                                </>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ImagePreviewModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        paddingTop: hp(6),
        paddingBottom: hp(4),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        marginBottom: hp(3),
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: hp(2.2),
        fontFamily: theme.fonts.semiBold,
        color: 'white',
    },
    previewContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(5),
    },
    imageFrame: {
        overflow: 'hidden',
        backgroundColor: theme.colors.dark,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    shapeHint: {
        fontSize: hp(1.4),
        color: theme.colors.gray,
        marginTop: hp(2),
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: hp(3),
        gap: wp(8),
    },
    actionButton: {
        alignItems: 'center',
        gap: hp(0.8),
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        fontSize: hp(1.4),
        color: 'white',
        fontFamily: theme.fonts.medium,
    },
    buttons: {
        flexDirection: 'row',
        paddingHorizontal: wp(5),
        gap: wp(3),
    },
    cancelButton: {
        flex: 1,
        paddingVertical: hp(2),
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: hp(1.8),
        fontFamily: theme.fonts.medium,
        color: theme.colors.text,
    },
    confirmButton: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: hp(2),
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(2),
    },
    confirmButtonText: {
        fontSize: hp(1.8),
        fontFamily: theme.fonts.semiBold,
        color: 'white',
    },
});