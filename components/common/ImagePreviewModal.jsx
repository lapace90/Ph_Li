import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  Dimensions,
  ActivityIndicator,
  PanResponder,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Calcul distance entre 2 doigts
const getDistance = (touches) => {
  if (touches.length < 2) return 0;
  const [t1, t2] = touches;
  const dx = t1.pageX - t2.pageX;
  const dy = t1.pageY - t2.pageY;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Modal de preview/confirmation d'image avec pan et zoom
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
  
  // Position et scale
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const lastOffset = useRef({ x: 0, y: 0 });
  const lastScale = useRef(1);
  const initialPinchDistance = useRef(0);
  
  const previewSize = SCREEN_WIDTH - wp(10);
  const previewHeight = shape === 'rectangle' ? previewSize * 0.5625 : previewSize;

  const MIN_SCALE = 1;
  const MAX_SCALE = 3;

  // Reset quand le modal s'ouvre
  useEffect(() => {
    if (visible) {
      pan.setValue({ x: 0, y: 0 });
      scale.setValue(1);
      lastOffset.current = { x: 0, y: 0 };
      lastScale.current = 1;
      setRotation(0);
    }
  }, [visible, imageUri]);

  // Calculer les limites de déplacement selon le scale
  const getBounds = (currentScale) => {
    const scaledWidth = previewSize * currentScale;
    const scaledHeight = previewHeight * currentScale;
    
    const maxX = Math.max(0, (scaledWidth - previewSize) / 2);
    const maxY = Math.max(0, (scaledHeight - previewHeight) / 2);
    
    return { maxX, maxY };
  };

  // PanResponder pour gérer pan + pinch zoom
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt) => {
        lastOffset.current = {
          x: pan.x._value,
          y: pan.y._value,
        };
        lastScale.current = scale._value;
        
        // Si 2 doigts, init pinch
        if (evt.nativeEvent.touches.length === 2) {
          initialPinchDistance.current = getDistance(evt.nativeEvent.touches);
        }
      },
      
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        
        // Pinch zoom (2 doigts)
        if (touches.length === 2) {
          const currentDistance = getDistance(touches);
          
          if (initialPinchDistance.current > 0) {
            const pinchScale = currentDistance / initialPinchDistance.current;
            let newScale = lastScale.current * pinchScale;
            
            // Limiter le scale
            newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
            scale.setValue(newScale);
          }
        } 
        // Pan (1 doigt)
        else if (touches.length === 1) {
          const currentScale = scale._value;
          const { maxX, maxY } = getBounds(currentScale);
          
          let newX = lastOffset.current.x + gestureState.dx;
          let newY = lastOffset.current.y + gestureState.dy;
          
          // Limites
          newX = Math.max(-maxX, Math.min(maxX, newX));
          newY = Math.max(-maxY, Math.min(maxY, newY));
          
          pan.setValue({ x: newX, y: newY });
        }
      },
      
      onPanResponderRelease: (evt) => {
        lastOffset.current = {
          x: pan.x._value,
          y: pan.y._value,
        };
        lastScale.current = scale._value;
        initialPinchDistance.current = 0;
        
        // Ajuster la position si elle dépasse les limites après zoom
        const currentScale = scale._value;
        const { maxX, maxY } = getBounds(currentScale);
        
        let newX = pan.x._value;
        let newY = pan.y._value;
        
        newX = Math.max(-maxX, Math.min(maxX, newX));
        newY = Math.max(-maxY, Math.min(maxY, newY));
        
        if (newX !== pan.x._value || newY !== pan.y._value) {
          Animated.spring(pan, {
            toValue: { x: newX, y: newY },
            useNativeDriver: false,
          }).start();
          lastOffset.current = { x: newX, y: newY };
        }
      },
    })
  ).current;

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    // Reset position et zoom
    pan.setValue({ x: 0, y: 0 });
    scale.setValue(1);
    lastOffset.current = { x: 0, y: 0 };
    lastScale.current = 1;
  };

  const handleReset = () => {
    Animated.parallel([
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: false }),
    ]).start();
    lastOffset.current = { x: 0, y: 0 };
    lastScale.current = 1;
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      let actions = [];

      if (rotation !== 0) {
        actions.push({ rotate: rotation });
      }

      actions.push({ resize: { width: 1200 } });

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      onConfirm({ uri: result.uri });
    } catch (error) {
      console.error('Image processing error:', error);
      onConfirm({ uri: imageUri });
    } finally {
      setProcessing(false);
      setRotation(0);
      pan.setValue({ x: 0, y: 0 });
      scale.setValue(1);
      lastOffset.current = { x: 0, y: 0 };
      lastScale.current = 1;
    }
  };

  const handleClose = () => {
    setRotation(0);
    pan.setValue({ x: 0, y: 0 });
    scale.setValue(1);
    lastOffset.current = { x: 0, y: 0 };
    lastScale.current = 1;
    onClose();
  };

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

          {/* Image Preview avec Pan + Zoom */}
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
              {...panResponder.panHandlers}
            >
              {imageUri && (
                <Animated.View
                  style={[
                    styles.imageWrapper,
                    {
                      width: previewSize,
                      height: previewHeight,
                      transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { scale: scale },
                        { rotate: `${rotation}deg` },
                      ],
                    },
                  ]}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.image}
                    contentFit="cover"
                  />
                </Animated.View>
              )}
            </View>

            {/* Hint */}
            <Text style={styles.shapeHint}>
              👆 Glissez pour déplacer
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => {
                const newScale = Math.max(MIN_SCALE, lastScale.current - 0.3);
                scale.setValue(newScale);
                lastScale.current = newScale;
                // Ajuster position si besoin
                const { maxX, maxY } = getBounds(newScale);
                const newX = Math.max(-maxX, Math.min(maxX, pan.x._value));
                const newY = Math.max(-maxY, Math.min(maxY, pan.y._value));
                pan.setValue({ x: newX, y: newY });
                lastOffset.current = { x: newX, y: newY };
              }}
              disabled={processing}
            >
              <View style={styles.actionIcon}>
                <Icon name="minus" size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.actionText}>Zoom -</Text>
            </Pressable>

            <Pressable
              style={styles.actionButton}
              onPress={() => {
                const newScale = Math.min(MAX_SCALE, lastScale.current + 0.3);
                scale.setValue(newScale);
                lastScale.current = newScale;
              }}
              disabled={processing}
            >
              <View style={styles.actionIcon}>
                <Icon name="plus" size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.actionText}>Zoom +</Text>
            </Pressable>
            
            <Pressable
              style={styles.actionButton}
              onPress={handleRotate}
              disabled={processing}
            >
              <View style={styles.actionIcon}>
                <Icon name="refresh" size={22} color={theme.colors.secondary} />
              </View>
              <Text style={styles.actionText}>Pivoter</Text>
            </Pressable>
            
            <Pressable
              style={styles.actionButton}
              onPress={handleReset}
              disabled={processing}
            >
              <View style={styles.actionIcon}>
                <Icon name="x" size={22} color={theme.colors.rose} />
              </View>
              <Text style={styles.actionText}>Reset</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'absolute',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  shapeHint: {
    fontSize: hp(1.4),
    color: theme.colors.gray,
    marginTop: hp(2),
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: hp(2),
    gap: wp(4),
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