import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  Pressable, 
  ScrollView, 
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { supabase } from '../../lib/supabase';
import Icon from '../../assets/icons/Icon';
import Button from '../common/Button';

const MAX_MESSAGE_LENGTH = 1000;

/**
 * Modal de candidature
 * Permet de choisir un CV et d'ajouter un message avant de postuler
 */
const ApplyModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  userId,
  offerTitle,
  loading = false,
}) => {
  const [cvs, setCvs] = useState([]);
  const [loadingCvs, setLoadingCvs] = useState(true);
  const [selectedCvId, setSelectedCvId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (visible && userId) {
      loadCvs();
    }
  }, [visible, userId]);

  const loadCvs = async () => {
    setLoadingCvs(true);
    try {
      const { data, error } = await supabase
        .from('cvs')
        .select('id, title, is_default, created_at')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCvs(data || []);
      
      const defaultCv = data?.find(cv => cv.is_default);
      if (defaultCv) {
        setSelectedCvId(defaultCv.id);
      } else if (data?.length > 0) {
        setSelectedCvId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading CVs:', error);
    } finally {
      setLoadingCvs(false);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      cv_id: selectedCvId,
      message: message.trim() || null,
    });
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  const canSubmit = cvs.length === 0 || selectedCvId;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        <View style={styles.container}>
          {/* Header */}
          <View style={commonStyles.rowBetween}>
            <Text style={commonStyles.sectionTitle}>Postuler</Text>
            <Pressable style={commonStyles.actionButton} onPress={handleClose}>
              <Icon name="x" size={22} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Titre de l'offre */}
          <View style={[commonStyles.rowGapSmall, styles.offerInfo]}>
            <Icon name="briefcase" size={16} color={theme.colors.primary} />
            <Text style={[commonStyles.hint, { color: theme.colors.primary, flex: 1 }]} numberOfLines={2}>
              {offerTitle}
            </Text>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Sélection du CV */}
            <View style={commonStyles.section}>
              <View style={commonStyles.rowGapSmall}>
                <Icon name="fileText" size={18} color={theme.colors.text} />
                <Text style={commonStyles.label}>CV à joindre</Text>
              </View>
              
              {loadingCvs ? (
                <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: hp(2) }} />
              ) : cvs.length === 0 ? (
                <View style={[commonStyles.card, commonStyles.rowGapSmall, { marginTop: hp(1), backgroundColor: theme.colors.warning + '10' }]}>
                  <Icon name="alertCircle" size={20} color={theme.colors.warning} />
                  <Text style={[commonStyles.hint, { color: theme.colors.warning, flex: 1 }]}>
                    Vous n'avez pas encore de CV. Votre profil sera envoyé à la place.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: hp(1), marginTop: hp(1) }}>
                  {cvs.map((cv) => {
                    const isSelected = selectedCvId === cv.id;
                    return (
                      <Pressable
                        key={cv.id}
                        style={[commonStyles.cardCompact, isSelected && styles.cardSelected]}
                        onPress={() => setSelectedCvId(cv.id)}
                      >
                        <View style={commonStyles.rowGapSmall}>
                          <View style={[styles.radio, isSelected && styles.radioSelected]}>
                            {isSelected && <View style={styles.radioInner} />}
                          </View>
                          <Text style={commonStyles.listItemTitle}>{cv.title}</Text>
                          {cv.is_default && (
                            <View style={[commonStyles.badge, commonStyles.badgeSecondary]}>
                              <Text style={[commonStyles.badgeText, commonStyles.badgeTextSecondary]}>Par défaut</Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Message de motivation */}
            <View style={commonStyles.section}>
              <View style={commonStyles.rowBetween}>
                <View style={commonStyles.rowGapSmall}>
                  <Icon name="edit" size={18} color={theme.colors.text} />
                  <Text style={commonStyles.label}>Message (optionnel)</Text>
                </View>
                <Text style={commonStyles.hint}>{message.length}/{MAX_MESSAGE_LENGTH}</Text>
              </View>
              
              <TextInput
                style={commonStyles.textArea}
                placeholder="Présentez-vous brièvement et expliquez votre motivation..."
                placeholderTextColor={theme.colors.textLight}
                value={message}
                onChangeText={(text) => setMessage(text.slice(0, MAX_MESSAGE_LENGTH))}
                multiline
                numberOfLines={5}
              />
            </View>

            {/* Info anonymat */}
            <View style={[commonStyles.card, commonStyles.rowGapSmall, { backgroundColor: theme.colors.primary + '10' }]}>
              <Icon name="lock" size={16} color={theme.colors.primary} />
              <Text style={[commonStyles.hint, { color: theme.colors.primary, flex: 1, lineHeight: hp(2) }]}>
                Vos informations personnelles restent protégées jusqu'à ce que le recruteur accepte votre candidature.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[commonStyles.rowGap, styles.footer]}>
            <Pressable onPress={handleClose}>
              <Text style={commonStyles.hint}>Annuler</Text>
            </Pressable>
            <View style={commonStyles.flex1}>
              <Button
                title="Envoyer ma candidature"
                onPress={handleSubmit}
                loading={loading}
                disabled={!canSubmit}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    padding: wp(5),
    paddingBottom: hp(4),
    maxHeight: '85%',
  },
  offerInfo: {
    backgroundColor: theme.colors.primaryLight,
    padding: hp(1.2),
    borderRadius: theme.radius.md,
    marginTop: hp(1.5),
    marginBottom: hp(1),
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  footer: {
    paddingTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: hp(2),
  },
});

export default ApplyModal;