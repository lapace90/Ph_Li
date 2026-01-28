// Création / édition d'une publication laboratoire

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { laboratoryPostService } from '../../services/laboratoryPostService';
import { storageService } from '../../services/storageService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import SingleSelect from '../../components/common/SingleSelect';
import MultiSelect from '../../components/common/MultiSelect';
import ImagePickerBox from '../../components/common/ImagePickerBox';
import Icon from '../../assets/icons/Icon';
import { POST_TYPE_CONFIG } from '../../constants/postOptions';

const POST_TYPES = [
  { value: 'news', label: 'Actualité' },
  { value: 'formation', label: 'Formation' },
  { value: 'event', label: 'Événement' },
  { value: 'video', label: 'Vidéo' },
];

const TARGET_USER_TYPES = [
  { value: 'preparateur', label: 'Préparateurs' },
  { value: 'etudiant', label: 'Étudiants' },
  { value: 'conseiller', label: 'Conseillers' },
  { value: 'titulaire', label: 'Titulaires' },
  { value: 'animateur', label: 'Animateurs' },
];

export default function CreatePost() {
  const router = useRouter();
  const { postId } = useLocalSearchParams();
  const { session, laboratoryProfile } = useAuth();
  const laboratoryId = session?.user?.id;

  const isEditing = !!postId;

  const [form, setForm] = useState({
    type: 'news',
    title: '',
    content: '',
    imageUri: null,
    imageUrl: null,
    videoUrl: '',
    eventDate: '',
    eventLocation: '',
    targetUserTypes: [],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(isEditing);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Charger le post existant en mode édition
  useEffect(() => {
    if (!isEditing || !postId) return;

    const loadPost = async () => {
      try {
        setLoadingPost(true);
        const posts = await laboratoryPostService.getPostsByLab(laboratoryId);
        const post = posts.find(p => p.id === postId);
        if (post) {
          setForm({
            type: post.type || 'news',
            title: post.title || '',
            content: post.content || '',
            imageUri: null,
            imageUrl: post.image_url || null,
            videoUrl: post.video_url || '',
            eventDate: post.event_date || '',
            eventLocation: post.event_location || '',
            targetUserTypes: post.target_user_types || [],
          });
        }
      } catch (err) {
        console.error('Erreur chargement post:', err);
        Alert.alert('Erreur', 'Impossible de charger la publication');
      } finally {
        setLoadingPost(false);
      }
    };

    loadPost();
  }, [isEditing, postId, laboratoryId]);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const handleImageChange = (asset) => {
    if (asset) {
      updateForm('imageUri', asset.uri || asset);
    } else {
      setForm(prev => ({ ...prev, imageUri: null, imageUrl: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Le titre est requis';
    if (!form.type) newErrors.type = 'Le type est requis';
    if (form.type === 'video' && !form.videoUrl.trim()) {
      newErrors.videoUrl = 'L\'URL de la vidéo est requise';
    }
    if (form.targetUserTypes.length === 0) {
      newErrors.targetUserTypes = 'Sélectionnez au moins un type de profil';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImage = async () => {
    if (!form.imageUri) return form.imageUrl;
    try {
      setUploading(true);
      const url = await storageService.uploadImage(
        'laboratory-posts',
        laboratoryId,
        { uri: form.imageUri },
        'posts'
      );
      return url;
    } catch (err) {
      console.error('Erreur upload image:', err);
      throw new Error('Impossible d\'uploader l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (publish = false) => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs du formulaire');
      return;
    }

    try {
      setLoading(true);

      let imageUrl = form.imageUrl;
      if (form.imageUri) {
        imageUrl = await uploadImage();
      }

      const postData = {
        type: form.type,
        title: form.title.trim(),
        content: form.content.trim() || null,
        imageUrl,
        videoUrl: form.type === 'video' ? form.videoUrl.trim() : null,
        eventDate: form.type === 'event' ? form.eventDate.trim() || null : null,
        eventLocation: form.type === 'event' ? form.eventLocation.trim() || null : null,
        targetUserTypes: form.targetUserTypes,
        isPublished: publish,
      };

      if (isEditing) {
        await laboratoryPostService.updatePost(postId, {
          type: postData.type,
          title: postData.title,
          content: postData.content,
          image_url: postData.imageUrl,
          video_url: postData.videoUrl,
          event_date: postData.eventDate,
          event_location: postData.eventLocation,
          target_user_types: postData.targetUserTypes,
          is_published: postData.isPublished,
          published_at: publish ? new Date().toISOString() : undefined,
        });
      } else {
        await laboratoryPostService.createPost(laboratoryId, postData);
      }

      Alert.alert(
        'Succès',
        publish
          ? 'Votre publication a été publiée !'
          : 'Votre publication a été enregistrée en brouillon.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert('Erreur', err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPost) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={commonStyles.header}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Chargement...</Text>
          <View style={commonStyles.headerSpacer} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  const typeConfig = POST_TYPE_CONFIG[form.type] || POST_TYPE_CONFIG.news;
  const labName = laboratoryProfile?.brand_name || laboratoryProfile?.company_name || 'Mon laboratoire';
  const previewImageUri = form.imageUri || form.imageUrl;

  const renderPreview = () => (
    <ScrollView
      style={commonStyles.flex1}
      contentContainerStyle={styles.previewContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Carte carousel */}
      <Text style={styles.previewLabel}>Carte carousel (accueil)</Text>
      <View style={styles.carouselCard}>
        {previewImageUri ? (
          <Image source={{ uri: previewImageUri }} style={styles.carouselImage} contentFit="cover" />
        ) : (
          <View style={[styles.carouselImage, styles.carouselImagePlaceholder]}>
            <Icon name={typeConfig.icon} size={24} color={typeConfig.color} />
          </View>
        )}
        <View style={[styles.carouselBadge, { backgroundColor: typeConfig.color + '15' }]}>
          <Icon name={typeConfig.icon} size={10} color={typeConfig.color} />
          <Text style={[styles.carouselBadgeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
        </View>
        <View style={styles.carouselContent}>
          <View style={styles.carouselLabRow}>
            {laboratoryProfile?.logo_url ? (
              <Image source={{ uri: laboratoryProfile.logo_url }} style={styles.carouselLabLogo} />
            ) : (
              <View style={[styles.carouselLabLogo, styles.carouselLabLogoPlaceholder]}>
                <Icon name="briefcase" size={10} color={theme.colors.primary} />
              </View>
            )}
            <Text style={styles.carouselLabName} numberOfLines={1}>{labName}</Text>
          </View>
          <Text style={styles.carouselTitle} numberOfLines={2}>{form.title || 'Titre de la publication'}</Text>
        </View>
      </View>

      {/* Vue détail */}
      <Text style={[styles.previewLabel, { marginTop: hp(3) }]}>Vue détail</Text>
      <View style={styles.detailCard}>
        {previewImageUri ? (
          <Image source={{ uri: previewImageUri }} style={styles.detailImage} contentFit="cover" />
        ) : (
          <View style={[styles.detailImage, styles.detailImagePlaceholder]}>
            <Icon name={typeConfig.icon} size={40} color={typeConfig.color} />
          </View>
        )}

        <View style={styles.detailBody}>
          {/* Badge type */}
          <View style={[styles.detailBadge, { backgroundColor: typeConfig.color + '15' }]}>
            <Icon name={typeConfig.icon} size={14} color={typeConfig.color} />
            <Text style={[styles.detailBadgeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
          </View>

          {/* Titre */}
          <Text style={styles.detailTitle}>{form.title || 'Titre de la publication'}</Text>
          <Text style={styles.detailDate}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>

          {/* Labo */}
          <View style={styles.detailLabCard}>
            <View style={styles.detailLabRow}>
              {laboratoryProfile?.logo_url ? (
                <Image source={{ uri: laboratoryProfile.logo_url }} style={styles.detailLabLogo} />
              ) : (
                <View style={[styles.detailLabLogo, styles.detailLabLogoPlaceholder]}>
                  <Icon name="briefcase" size={16} color={theme.colors.primary} />
                </View>
              )}
              <View style={commonStyles.flex1}>
                <Text style={styles.detailLabName}>{labName}</Text>
              </View>
              <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
            </View>
          </View>

          {/* Contenu */}
          {form.content ? (
            <Text style={styles.detailContentText}>{form.content}</Text>
          ) : (
            <Text style={[styles.detailContentText, { color: theme.colors.textLight, fontStyle: 'italic' }]}>Aucun contenu</Text>
          )}

          {/* Event */}
          {form.type === 'event' && (form.eventDate || form.eventLocation) && (
            <View style={styles.detailEventCard}>
              {form.eventDate ? (
                <View style={styles.detailEventRow}>
                  <Icon name="calendar" size={16} color={theme.colors.primary} />
                  <Text style={styles.detailEventText}>{form.eventDate}</Text>
                </View>
              ) : null}
              {form.eventLocation ? (
                <View style={styles.detailEventRow}>
                  <Icon name="mapPin" size={16} color={theme.colors.primary} />
                  <Text style={styles.detailEventText}>{form.eventLocation}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Video */}
          {form.type === 'video' && form.videoUrl ? (
            <View style={styles.detailEventCard}>
              <View style={styles.detailEventRow}>
                <Icon name="play" size={16} color={theme.colors.rose} />
                <Text style={[styles.detailEventText, { color: theme.colors.rose }]} numberOfLines={1}>{form.videoUrl}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      {/* Bouton retour formulaire */}
      <Pressable style={styles.backToFormBtn} onPress={() => setShowPreview(false)}>
        <Icon name="edit" size={16} color={theme.colors.primary} />
        <Text style={styles.backToFormText}>Retour au formulaire</Text>
      </Pressable>
    </ScrollView>
  );

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>
          {isEditing ? 'Modifier la publication' : 'Nouvelle publication'}
        </Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      {/* Tabs Formulaire / Aperçu */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, !showPreview && styles.tabActive]}
          onPress={() => setShowPreview(false)}
        >
          <Icon name="edit" size={14} color={!showPreview ? theme.colors.primary : theme.colors.textLight} />
          <Text style={[styles.tabText, !showPreview && styles.tabTextActive]}>Formulaire</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, showPreview && styles.tabActive]}
          onPress={() => setShowPreview(true)}
        >
          <Icon name="eye" size={14} color={showPreview ? theme.colors.primary : theme.colors.textLight} />
          <Text style={[styles.tabText, showPreview && styles.tabTextActive]}>Aperçu</Text>
        </Pressable>
      </View>

      {showPreview ? renderPreview() : (
        <ScrollView
          style={commonStyles.flex1}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type */}
          <SingleSelect
            label="Type de publication *"
            options={POST_TYPES}
            selected={form.type}
            onChange={(v) => updateForm('type', v)}
            error={errors.type}
          />

          {/* Titre */}
          <Input
            label="Titre *"
            placeholder="Ex: Nouvelle gamme solaire 2026"
            value={form.title}
            onChangeText={(v) => updateForm('title', v)}
            error={errors.title}
          />

          {/* Contenu */}
          <Input
            label="Contenu"
            placeholder="Décrivez votre publication..."
            value={form.content}
            onChangeText={(v) => updateForm('content', v)}
            multiline
            numberOfLines={5}
            inputStyle={commonStyles.textArea}
          />

          {/* Image */}
          <View style={commonStyles.formGroup}>
            <Text style={commonStyles.label}>Image</Text>
            <ImagePickerBox
              value={form.imageUri || form.imageUrl}
              onChange={handleImageChange}
              shape="rectangle"
              size={wp(85)}
              placeholder="Ajouter une image"
              loading={uploading}
            />
          </View>

          {/* Video URL (si type video) */}
          {form.type === 'video' && (
            <Input
              label="URL de la vidéo *"
              placeholder="https://youtube.com/..."
              value={form.videoUrl}
              onChangeText={(v) => updateForm('videoUrl', v)}
              error={errors.videoUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
          )}

          {/* Event fields (si type event) */}
          {form.type === 'event' && (
            <>
              <Input
                label="Date de l'événement"
                placeholder="Ex: 15 mars 2026"
                value={form.eventDate}
                onChangeText={(v) => updateForm('eventDate', v)}
              />
              <Input
                label="Lieu de l'événement"
                placeholder="Ex: Paris, Palais des Congrès"
                value={form.eventLocation}
                onChangeText={(v) => updateForm('eventLocation', v)}
              />
            </>
          )}

          {/* Cible */}
          <MultiSelect
            label="Visible par *"
            options={TARGET_USER_TYPES}
            selected={form.targetUserTypes}
            onChange={(v) => updateForm('targetUserTypes', v)}
            error={errors.targetUserTypes}
            hint="Quels profils verront cette publication ?"
            showCount
          />

          {/* Actions */}
          <View style={commonStyles.rowGap}>
            <Button
              title="Brouillon"
              onPress={() => handleSubmit(false)}
              loading={loading && !uploading}
              buttonStyle={{ flex: 1, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.primary }}
              textStyle={{ color: theme.colors.primary }}
              hasShadow={false}
            />
            <Button
              title="Publier"
              onPress={() => handleSubmit(true)}
              loading={loading && !uploading}
              buttonStyle={{ flex: 1 }}
            />
          </View>
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

const CAROUSEL_CARD_WIDTH = 150;

const styles = StyleSheet.create({
  formContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(10),
    gap: hp(2),
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: wp(5),
    marginBottom: hp(1),
    backgroundColor: theme.colors.backgroundDark,
    borderRadius: theme.radius.lg,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.5),
    paddingVertical: hp(1),
    borderRadius: theme.radius.md,
  },
  tabActive: {
    backgroundColor: theme.colors.card,
  },
  tabText: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.medium,
    color: theme.colors.textLight,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
  },

  // Preview
  previewContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(10),
  },
  previewLabel: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: hp(1),
  },

  // Carousel card preview
  carouselCard: {
    width: CAROUSEL_CARD_WIDTH,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  carouselImage: {
    width: CAROUSEL_CARD_WIDTH,
    height: 100,
  },
  carouselImagePlaceholder: {
    backgroundColor: theme.colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: wp(1.5),
    paddingVertical: hp(0.2),
    borderRadius: theme.radius.xs,
  },
  carouselBadgeText: {
    fontSize: hp(1),
    fontFamily: theme.fonts.semiBold,
  },
  carouselContent: {
    padding: hp(1),
    gap: hp(0.5),
  },
  carouselLabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  carouselLabLogo: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  carouselLabLogoPlaceholder: {
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselLabName: {
    flex: 1,
    fontSize: hp(1.1),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.medium,
  },
  carouselTitle: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    lineHeight: hp(1.8),
  },

  // Detail preview
  detailCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  detailImage: {
    width: '100%',
    height: hp(20),
  },
  detailImagePlaceholder: {
    backgroundColor: theme.colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailBody: {
    padding: wp(4),
    gap: hp(1),
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp(1.5),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.md,
  },
  detailBadgeText: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.semiBold,
  },
  detailTitle: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  detailDate: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  detailLabCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  detailLabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(1.2),
    gap: wp(3),
  },
  detailLabLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  detailLabLogoPlaceholder: {
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabName: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  detailContentText: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
    lineHeight: hp(2.2),
  },
  detailEventCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: hp(1.2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: hp(0.8),
  },
  detailEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  detailEventText: {
    fontSize: hp(1.4),
    color: theme.colors.text,
    flex: 1,
  },

  // Back to form button
  backToFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    marginTop: hp(3),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.radius.lg,
  },
  backToFormText: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary,
  },
});
