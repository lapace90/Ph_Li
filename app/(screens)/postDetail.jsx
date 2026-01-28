// Détail d'une publication laboratoire

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Modal, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { laboratoryPostService } from '../../services/laboratoryPostService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import FollowButton from '../../components/laboratories/FollowButton';
import { POST_TYPE_CONFIG } from '../../constants/postOptions';
import { formatDate } from '../../helpers/dateUtils';

export default function PostDetail() {
  const router = useRouter();
  const { postId } = useLocalSearchParams();
  const { session } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageFullscreen, setImageFullscreen] = useState(false);

  const loadPost = useCallback(async () => {
    try {
      const data = await laboratoryPostService.getPostById(postId);
      setPost(data || null);
    } catch (err) {
      console.error('Erreur chargement post:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
    // Incrémenter les vues
    if (postId) {
      laboratoryPostService.incrementView(postId).catch(() => {});
    }
  }, [loadPost, postId]);

  if (loading) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={commonStyles.header}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Publication</Text>
          <View style={commonStyles.headerSpacer} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!post) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={commonStyles.header}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Publication</Text>
          <View style={commonStyles.headerSpacer} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <Icon name="fileText" size={40} color={theme.colors.gray} />
          <Text style={{ color: theme.colors.textLight, marginTop: hp(1) }}>Publication introuvable</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const typeConfig = POST_TYPE_CONFIG[post.type] || POST_TYPE_CONFIG.news;
  const lab = post.laboratory;
  const labName = lab?.brand_name || lab?.company_name || 'Laboratoire';

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Publication</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <ScrollView
        style={commonStyles.flex1}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        {post.image_url ? (
          <Pressable onPress={() => setImageFullscreen(true)}>
            <Image source={{ uri: post.image_url }} style={styles.heroImage} contentFit="cover" />
          </Pressable>
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Icon name={typeConfig.icon} size={40} color={typeConfig.color} />
          </View>
        )}

        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '15' }]}>
          <Icon name={typeConfig.icon} size={14} color={typeConfig.color} />
          <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
          {post.is_sponsored && (
            <>
              <View style={styles.badgeSeparator} />
              <Icon name="star" size={12} color={theme.colors.warning} />
              <Text style={[styles.typeBadgeText, { color: theme.colors.warning }]}>Sponsorisé</Text>
            </>
          )}
        </View>

        {/* Titre */}
        <Text style={styles.title}>{post.title}</Text>

        {/* Date */}
        <Text style={styles.date}>
          {formatDate(post.published_at || post.created_at)}
        </Text>

        {/* Labo */}
        <View style={styles.labCard}>
          <Pressable
            style={styles.labRow}
            onPress={() => lab?.id && router.push({ pathname: '/(screens)/viewLaboratoryProfile', params: { laboratoryId: lab.id } })}
          >
            {lab?.logo_url ? (
              <Image source={{ uri: lab.logo_url }} style={styles.labLogo} />
            ) : (
              <View style={[styles.labLogo, styles.labLogoPlaceholder]}>
                <Icon name="briefcase" size={16} color={theme.colors.primary} />
              </View>
            )}
            <View style={commonStyles.flex1}>
              <Text style={styles.labName}>{labName}</Text>
              {lab?.siret_verified && (
                <View style={styles.verifiedRow}>
                  <Icon name="checkCircle" size={12} color={theme.colors.success} />
                  <Text style={styles.verifiedText}>Vérifié</Text>
                </View>
              )}
            </View>
            <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
          </Pressable>
          {lab?.id && session?.user?.id && lab.id !== session.user.id && (
            <View style={styles.followRow}>
              <FollowButton laboratoryId={lab.id} size="small" />
            </View>
          )}
        </View>

        {/* Contenu */}
        {post.content ? (
          <Text style={styles.contentText}>{post.content}</Text>
        ) : null}

        {/* Infos événement */}
        {post.type === 'event' && (post.event_date || post.event_location) && (
          <View style={styles.eventCard}>
            {post.event_date && (
              <View style={styles.eventRow}>
                <Icon name="calendar" size={16} color={theme.colors.primary} />
                <Text style={styles.eventText}>{post.event_date}</Text>
              </View>
            )}
            {post.event_location && (
              <View style={styles.eventRow}>
                <Icon name="mapPin" size={16} color={theme.colors.primary} />
                <Text style={styles.eventText}>{post.event_location}</Text>
              </View>
            )}
          </View>
        )}

        {/* Vidéo */}
        {post.type === 'video' && post.video_url && (
          <View style={styles.eventCard}>
            <View style={styles.eventRow}>
              <Icon name="play" size={16} color={theme.colors.rose} />
              <Text style={[styles.eventText, { color: theme.colors.rose }]} numberOfLines={1}>
                {post.video_url}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fullscreen image viewer */}
      {post.image_url && (
        <Modal visible={imageFullscreen} transparent animationType="fade" onRequestClose={() => setImageFullscreen(false)}>
          <Pressable style={styles.fullscreenOverlay} onPress={() => setImageFullscreen(false)}>
            <Image source={{ uri: post.image_url }} style={styles.fullscreenImage} contentFit="contain" />
            <Pressable style={styles.fullscreenClose} onPress={() => setImageFullscreen(false)}>
              <Icon name="x" size={24} color="#fff" />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: hp(10),
  },
  heroImage: {
    width: '100%',
    height: hp(25),
  },
  heroPlaceholder: {
    backgroundColor: theme.colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp(1.5),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.md,
    marginHorizontal: wp(5),
    marginTop: hp(2),
  },
  typeBadgeText: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.semiBold,
  },
  badgeSeparator: {
    width: 1,
    height: hp(1.5),
    backgroundColor: theme.colors.border,
    marginHorizontal: wp(1),
  },
  title: {
    fontSize: hp(2.4),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginHorizontal: wp(5),
    marginTop: hp(1.5),
  },
  date: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginHorizontal: wp(5),
    marginTop: hp(0.5),
    marginBottom: hp(2),
  },
  labCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: wp(5),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  labRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(1.5),
    gap: wp(3),
  },
  labLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  labLogoPlaceholder: {
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labName: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginTop: hp(0.2),
  },
  verifiedText: {
    fontSize: hp(1.2),
    color: theme.colors.success,
  },
  followRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: hp(1.5),
    paddingVertical: hp(1),
    alignItems: 'flex-start',
  },
  contentText: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
    lineHeight: hp(2.4),
    marginHorizontal: wp(5),
    marginTop: hp(2),
  },
  eventCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: wp(5),
    marginTop: hp(2),
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: hp(1),
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  eventText: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    flex: 1,
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenClose: {
    position: 'absolute',
    top: hp(6),
    right: wp(5),
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
