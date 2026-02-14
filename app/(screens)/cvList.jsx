import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Modal, ActivityIndicator, Switch, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { useCVs } from '../../hooks/useCVs';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import { cvService } from '../../services/cvService';

export default function CVList() {
  const router = useRouter();
  const { session, profile, isAnimator } = useAuth();
  const { cvs, defaultCV, loading, deleteCV, refresh } = useCVs(session?.user?.id);
  const [showTypeChoice, setShowTypeChoice] = useState(false);
  const [generateQuota, setGenerateQuota] = useState(null);
  const [uploadQuota, setUploadQuota] = useState(null);
  const [showCvOnCard, setShowCvOnCard] = useState(profile?.show_cv_on_card ?? false);

  const loadQuotas = async () => {
    if (!session?.user?.id) return;
    try {
      const [gen, upl] = await Promise.all([
        cvService.canGenerateCV(session.user.id),
        cvService.canUploadCV(session.user.id),
      ]);
      setGenerateQuota(gen);
      setUploadQuota(upl);
    } catch (err) {
      console.error('Error loading CV quotas:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    loadQuotas();
  }, [cvs.length]);

  useEffect(() => {
    if (profile) setShowCvOnCard(profile.show_cv_on_card ?? false);
  }, [profile]);

  const handleToggleCvOnCard = async (value) => {
    setShowCvOnCard(value);
    const { error } = await supabase
      .from('profiles')
      .update({ show_cv_on_card: value })
      .eq('id', session?.user?.id);
    if (error) {
      console.warn('Erreur mise à jour show_cv_on_card:', error);
      setShowCvOnCard(!value);
    }
  };

  const handleViewCV = (cv) => {
    if (cv.has_structured_cv) {
      router.push({
        pathname: '/(screens)/cvView',
        params: { cvId: cv.id }
      });
    } else if (cv.file_url) {
      router.push({
        pathname: '/(screens)/cvPdfView',
        params: { url: cv.file_url, title: cv.title }
      });
    }
  };

  const handleDelete = (cv) => {
    Alert.alert(
      'Supprimer le CV',
      `Voulez-vous vraiment supprimer "${cv.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteCV(cv.id);
            if (error) Alert.alert('Erreur', error.message);
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={commonStyles.headerNoBorder}>
        <Pressable style={commonStyles.headerButton} onPress={() => router.back()}>
          <Icon name="arrowLeft" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={commonStyles.headerTitleLarge}>Mes CV</Text>
        {cvs.length > 0 && (generateQuota?.allowed || uploadQuota?.allowed) ? (
          <Pressable
            style={[commonStyles.headerButton, commonStyles.buttonIconPrimary]}
            onPress={() => setShowTypeChoice(true)}
          >
            <Icon name="plus" size={22} color={theme.colors.primary} />
          </Pressable>
        ) : (
          <View style={commonStyles.headerSpacer} />
        )}
      </View>

      {generateQuota && cvs.length > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: wp(4), paddingVertical: hp(1), paddingHorizontal: wp(5) }}>
          <Text style={{ fontSize: hp(1.3), color: theme.colors.textLight }}>
            CV generes : {generateQuota.current}/{generateQuota.limit}
          </Text>
          <Text style={{ fontSize: hp(1.3), color: theme.colors.textLight }}>
            Total : {cvs.length}/5
          </Text>
        </View>
      )}

      {cvs.length === 0 ? (
        <View style={commonStyles.emptyContainer}>
          <View style={commonStyles.emptyIcon}>
            <Icon name="fileText" size={40} color={theme.colors.primary} />
          </View>
          <Text style={commonStyles.emptyTitle}>Aucun CV</Text>
          <Text style={commonStyles.emptyText}>
            Créez votre premier CV pour postuler aux offres
          </Text>
          <Pressable 
            style={[commonStyles.buttonPrimary, { marginTop: hp(3) }]}
            onPress={() => setShowTypeChoice(true)}
          >
            <Text style={commonStyles.buttonPrimaryText}>Créer un CV</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={commonStyles.listContainer}>
          {cvs.map((cv) => (
            <Pressable 
              key={cv.id} 
              style={commonStyles.listItem}
              onPress={() => handleViewCV(cv)}
            >
              <View style={[commonStyles.emptyIcon, { width: wp(12), height: wp(12), marginBottom: 0 }]}>
                <Icon 
                  name={cv.has_structured_cv ? 'edit' : 'fileText'} 
                  size={24} 
                  color={theme.colors.primary} 
                />
              </View>
              <View style={commonStyles.listItemContent}>
                <Text style={commonStyles.listItemTitle}>{cv.title}</Text>
                <View style={[commonStyles.rowGapSmall, { marginTop: hp(0.5) }]}>
                  {cv.has_structured_cv && (
                    <View style={[commonStyles.badge, commonStyles.badgeSecondary]}>
                      <Text style={[commonStyles.badgeText, commonStyles.badgeTextSecondary]}>
                        {cv.structured_data?.cv_type === 'animator' ? 'Animateur' : 'Formulaire'}
                      </Text>
                    </View>
                  )}
                  {cv.has_pdf && (
                    <View style={[commonStyles.badge, commonStyles.badgePrimary]}>
                      <Text style={[commonStyles.badgeText, commonStyles.badgeTextPrimary]}>
                        PDF
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Pressable 
                style={commonStyles.modalCloseButton}
                onPress={() => handleDelete(cv)}
              >
                <Icon name="trash" size={20} color={theme.colors.rose} />
              </Pressable>
            </Pressable>
          ))}

          {/* CV sur la carte de matching */}
          <View style={styles.cardSection}>
            <Text style={commonStyles.sectionTitle}>CV sur la carte</Text>
            <Text style={commonStyles.hint}>
              Rendez votre CV par défaut visible sur votre carte de matching
            </Text>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Afficher mon CV sur ma carte</Text>
                {defaultCV && showCvOnCard && (
                  <Text style={commonStyles.hint}>{defaultCV.title}</Text>
                )}
              </View>
              <Switch
                value={showCvOnCard}
                onValueChange={(v) => {
                  if (v && !defaultCV) {
                    Alert.alert('Aucun CV', 'Créez d\'abord un CV.');
                    return;
                  }
                  handleToggleCvOnCard(v);
                }}
                trackColor={{ false: theme.colors.gray, true: theme.colors.primary + '50' }}
                thumbColor={showCvOnCard ? theme.colors.primary : '#f4f3f4'}
              />
            </View>

            {/* Aperçu carte */}
            {showCvOnCard && defaultCV && (
              <View style={styles.cardPreview}>
                <Text style={styles.cardPreviewLabel}>Aperçu sur votre carte</Text>
                <View style={styles.cardPreviewContent}>
                  <View style={styles.cardPreviewHeader}>
                    <View style={styles.cardPreviewAvatar}>
                      <Icon name="user" size={20} color={theme.colors.textLight} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardPreviewName} numberOfLines={1}>
                        {profile?.first_name || 'Prénom'}
                      </Text>
                      <Text style={commonStyles.hint}>Votre profil</Text>
                    </View>
                  </View>
                  <View style={styles.cardPreviewCvButton}>
                    <Icon name="fileText" size={14} color={theme.colors.primary} />
                    <Text style={styles.cardPreviewCvText}>Voir le CV</Text>
                    <Icon name="chevronRight" size={12} color={theme.colors.primary} />
                  </View>
                </View>
              </View>
            )}

            {/* Avertissement CV uploadé (PDF) */}
            {showCvOnCard && defaultCV?.has_pdf && !defaultCV?.has_structured_cv && (
              <View style={[commonStyles.card, { backgroundColor: theme.colors.warning + '10', marginTop: hp(1.5) }]}>
                <View style={[commonStyles.rowGapSmall, { alignItems: 'flex-start' }]}>
                  <Icon name="alertTriangle" size={18} color={theme.colors.warning} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[commonStyles.hint, { color: theme.colors.warning, fontWeight: '600' }]}>
                      Anonymat non garanti
                    </Text>
                    <Text style={[commonStyles.hint, { color: theme.colors.text, lineHeight: hp(2), marginTop: hp(0.5) }]}>
                      Votre CV par défaut est un PDF uploadé. Les informations personnelles qu'il contient seront visibles par les recruteurs.
                    </Text>
                    <Text style={[commonStyles.hint, { color: theme.colors.textLight, lineHeight: hp(2), marginTop: hp(0.5) }]}>
                      Créez un CV via le formulaire pour l'anonymisation automatique, ou assurez-vous que votre PDF ne contient pas d'infos sensibles.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Info CV formulaire (anonymisé) */}
            {showCvOnCard && defaultCV?.has_structured_cv && (
              <View style={[commonStyles.card, commonStyles.rowGapSmall, { backgroundColor: theme.colors.primary + '10', marginTop: hp(1.5) }]}>
                <Icon name="lock" size={16} color={theme.colors.primary} />
                <Text style={[commonStyles.hint, { color: theme.colors.primary, flex: 1, lineHeight: hp(2) }]}>
                  Votre CV formulaire sera affiché selon vos réglages de visibilité et d'anonymat.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* FAB si entre 1 et 4 CVs */}
      {cvs.length > 0 && (generateQuota?.allowed || uploadQuota?.allowed) && (
        <Pressable style={commonStyles.fab} onPress={() => setShowTypeChoice(true)}>
          <Icon name="plus" size={28} color="white" />
        </Pressable>
      )}

      {/* Modal choix type CV */}
      <Modal
        visible={showTypeChoice}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypeChoice(false)}
      >
        <Pressable 
          style={commonStyles.modalOverlay}
          onPress={() => setShowTypeChoice(false)}
        >
          <View style={commonStyles.modalContainer}>
            <View style={commonStyles.modalHeader}>
              <Text style={commonStyles.modalTitle}>Ajouter un CV</Text>
              <Pressable 
                style={commonStyles.modalCloseButton}
                onPress={() => setShowTypeChoice(false)}
              >
                <Icon name="x" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            <Pressable
              style={[commonStyles.card, { marginBottom: hp(1.5) }]}
              onPress={() => {
                if (!generateQuota?.allowed) {
                  Alert.alert('Limite atteinte', generateQuota?.message || 'Vous avez atteint la limite de CV generes.');
                  setShowTypeChoice(false);
                  return;
                }
                setShowTypeChoice(false);
                router.push(isAnimator ? '/(screens)/cvAnimatorCreate' : '/(screens)/cvCreate');
              }}
            >
              <View style={commonStyles.rowGap}>
                <View style={[commonStyles.emptyIcon, { marginBottom: 0, width: wp(12), height: wp(12) }]}>
                  <Icon name="edit" size={24} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={commonStyles.rowGapSmall}>
                    <Text style={commonStyles.listItemTitle}>Créer via formulaire</Text>
                    <View style={[commonStyles.badge, commonStyles.badgeSuccess]}>
                      <Text style={[commonStyles.badgeText, commonStyles.badgeTextSuccess]}>
                        Recommandé
                      </Text>
                    </View>
                  </View>
                  <Text style={commonStyles.hint}>
                    CV structuré, optimisé pour le matching
                  </Text>
                </View>
              </View>
            </Pressable>

            <Pressable
              style={commonStyles.card}
              onPress={() => {
                if (!uploadQuota?.allowed) {
                  Alert.alert('Limite atteinte', uploadQuota?.message || 'Stockage plein.');
                  setShowTypeChoice(false);
                  return;
                }
                setShowTypeChoice(false);
                router.push('/(screens)/cvAdd');
              }}
            >
              <View style={commonStyles.rowGap}>
                <View style={[commonStyles.emptyIcon, { marginBottom: 0, width: wp(12), height: wp(12) }]}>
                  <Icon name="fileText" size={24} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={commonStyles.listItemTitle}>Importer un PDF</Text>
                  <Text style={commonStyles.hint}>
                    Téléchargez un CV existant
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  cardSection: {
    marginTop: hp(3),
    paddingTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1),
    marginTop: hp(1),
  },
  toggleLabel: {
    fontSize: hp(1.7),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  cardPreview: {
    marginTop: hp(1.5),
  },
  cardPreviewLabel: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: hp(0.8),
  },
  cardPreviewContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  cardPreviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardPreviewName: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  cardPreviewCvButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.5),
    marginTop: hp(1.5),
    paddingVertical: hp(1),
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary + '08',
  },
  cardPreviewCvText: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    fontWeight: '600',
  },
});