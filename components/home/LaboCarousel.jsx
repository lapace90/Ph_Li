// Carousel horizontal d'actualités labo pour les home screens

import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const POST_TYPE_CONFIG = {
  news: { label: 'News', icon: 'bell', color: theme.colors.primary },
  formation: { label: 'Formation', icon: 'bookOpen', color: theme.colors.secondary },
  event: { label: 'Event', icon: 'calendar', color: theme.colors.warning },
  video: { label: 'Vidéo', icon: 'play', color: theme.colors.rose },
};

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
        <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
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

export default function LaboCarousel({ title, posts, onPostPress, emptyMessage }) {
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
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        renderItem={({ item }) => (
          <PostCard post={item} onPress={onPostPress} />
        )}
      />
    </View>
  );
}

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
