// Carousel horizontal d'actualités labo pour les home screens

import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { POST_TYPE_CONFIG } from '../../constants/postOptions';
import Icon from '../../assets/icons/Icon';

// ============================================
// CARTE COMPACTE (pour toi, mes publications)
// ============================================

const PostCard = ({ post, onPress }) => {
  const typeConfig = POST_TYPE_CONFIG[post.type] || POST_TYPE_CONFIG.news;
  const labName = post.laboratory?.brand_name || post.laboratory?.company_name || '';

  return (
    <Pressable style={styles.card} onPress={() => onPress?.(post)}>
      {/* Image ou placeholder */}
      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Icon name={typeConfig.icon} size={24} color={typeConfig.color} />
        </View>
      )}

      {/* Badge type */}
      <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '15' }]}>
        <Icon name={typeConfig.icon} size={10} color={typeConfig.color} />
        <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>{typeConfig.shortLabel}</Text>
      </View>

      {/* Contenu */}
      <View style={styles.cardContent}>
        {/* Labo */}
        <View style={styles.labRow}>
          {post.laboratory?.logo_url ? (
            <Image source={{ uri: post.laboratory.logo_url }} style={styles.labLogo} />
          ) : (
            <View style={[styles.labLogo, styles.labLogoPlaceholder]}>
              <Icon name="briefcase" size={10} color={theme.colors.primary} />
            </View>
          )}
          <Text style={styles.labName} numberOfLines={1}>{labName}</Text>
        </View>

        {/* Titre */}
        <Text style={styles.cardTitle} numberOfLines={2}>{post.title}</Text>
      </View>
    </Pressable>
  );
};

// ============================================
// CARTE FEATURED (à la une, sponsorisé)
// ============================================

const FeaturedCard = ({ post, onPress }) => {
  const typeConfig = POST_TYPE_CONFIG[post.type] || POST_TYPE_CONFIG.news;
  const labName = post.laboratory?.brand_name || post.laboratory?.company_name || '';
  const isVerified = post.laboratory?.siret_verified;

  return (
    <Pressable style={featuredStyles.card} onPress={() => onPress?.(post)}>
      {/* Image grande */}
      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={featuredStyles.image} contentFit="cover" />
      ) : (
        <View style={[featuredStyles.image, featuredStyles.imagePlaceholder]}>
          <Icon name={typeConfig.icon} size={40} color={typeConfig.color} />
        </View>
      )}

      {/* Overlay sombre en bas */}
      <View style={featuredStyles.gradient} />

      {/* Badges en haut */}
      <View style={featuredStyles.badgeRow}>
        <View style={[featuredStyles.typeBadge, { backgroundColor: typeConfig.color }]}>
          <Icon name={typeConfig.icon} size={12} color="#fff" />
          <Text style={featuredStyles.typeBadgeText}>{typeConfig.shortLabel}</Text>
        </View>
        {post.is_sponsored && (
          <View style={featuredStyles.sponsorBadge}>
            <Icon name="zap" size={10} color={theme.colors.warning} />
            <Text style={featuredStyles.sponsorBadgeText}>Sponsorise</Text>
          </View>
        )}
      </View>

      {/* Contenu en bas sur le gradient */}
      <View style={featuredStyles.overlay}>
        {/* Labo */}
        <View style={featuredStyles.labRow}>
          {post.laboratory?.logo_url ? (
            <Image source={{ uri: post.laboratory.logo_url }} style={featuredStyles.labLogo} />
          ) : (
            <View style={[featuredStyles.labLogo, featuredStyles.labLogoPlaceholder]}>
              <Icon name="briefcase" size={12} color="#fff" />
            </View>
          )}
          <Text style={featuredStyles.labName} numberOfLines={1}>{labName}</Text>
          {isVerified && (
            <Icon name="checkCircle" size={14} color={theme.colors.success} />
          )}
        </View>

        {/* Titre */}
        <Text style={featuredStyles.title} numberOfLines={2}>{post.title}</Text>

        {/* Sous-titre (contenu tronque) */}
        {post.content ? (
          <Text style={featuredStyles.subtitle} numberOfLines={1}>{post.content}</Text>
        ) : null}
      </View>
    </Pressable>
  );
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function LaboCarousel({ title, posts, onPostPress, emptyMessage, variant = 'compact' }) {
  const isFeatured = variant === 'featured';

  if (!posts || posts.length === 0) {
    if (!emptyMessage) return null;
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.emptyContainer}>
          <Icon name="fileText" size={20} color={theme.colors.gray} />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={isFeatured ? FEATURED_CARD_WIDTH + 14 : undefined}
        decelerationRate={isFeatured ? 'fast' : undefined}
        ItemSeparatorComponent={() => <View style={{ width: isFeatured ? 14 : 12 }} />}
        renderItem={({ item }) => (
          isFeatured
            ? <FeaturedCard post={item} onPress={onPostPress} />
            : <PostCard post={item} onPress={onPostPress} />
        )}
      />
    </View>
  );
}

// ============================================
// STYLES COMPACT
// ============================================

const CARD_WIDTH = 150;
const CARD_IMAGE_HEIGHT = 100;

const styles = StyleSheet.create({
  container: {
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    paddingHorizontal: wp(5),
    marginBottom: hp(1),
  },
  listContent: {
    paddingHorizontal: wp(5),
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_IMAGE_HEIGHT,
  },
  cardImagePlaceholder: {
    backgroundColor: theme.colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
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
  typeBadgeText: {
    fontSize: hp(1),
    fontFamily: theme.fonts.semiBold,
  },
  cardContent: {
    padding: hp(1),
    gap: hp(0.5),
  },
  labRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  labLogo: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  labLogoPlaceholder: {
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labName: {
    flex: 1,
    fontSize: hp(1.1),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.medium,
  },
  cardTitle: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    lineHeight: hp(1.8),
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginHorizontal: wp(5),
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
});

// ============================================
// STYLES FEATURED
// ============================================

const FEATURED_CARD_WIDTH = wp(75);
const FEATURED_IMAGE_HEIGHT = hp(22);

const featuredStyles = StyleSheet.create({
  card: {
    width: FEATURED_CARD_WIDTH,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
  },
  image: {
    width: FEATURED_CARD_WIDTH,
    height: FEATURED_IMAGE_HEIGHT,
  },
  imagePlaceholder: {
    backgroundColor: theme.colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: FEATURED_IMAGE_HEIGHT * 0.55,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  badgeRow: {
    position: 'absolute',
    top: wp(3),
    left: wp(3),
    right: wp(3),
    flexDirection: 'row',
    gap: wp(2),
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.4),
    borderRadius: theme.radius.md,
  },
  typeBadgeText: {
    fontSize: hp(1.2),
    fontFamily: theme.fonts.semiBold,
    color: '#fff',
  },
  sponsorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.4),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.warning + '20',
  },
  sponsorBadgeText: {
    fontSize: hp(1.1),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.warning,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp(4),
    gap: hp(0.5),
  },
  labRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  labLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  labLogoPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labName: {
    flex: 1,
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
    color: '#fff',
  },
  title: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.bold,
    color: '#fff',
    lineHeight: hp(2.4),
  },
  subtitle: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.regular,
    color: 'rgba(255,255,255,0.7)',
  },
});
