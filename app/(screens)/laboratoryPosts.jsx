// Gestion des publications — dashboard labo

import { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, Pressable, Alert, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { laboratoryPostService } from '../../services/laboratoryPostService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import { EmptyState } from '../../components/common/DashboardComponents';

const TABS = [
  { key: 'published', label: 'Publiées' },
  { key: 'draft', label: 'Brouillons' },
  { key: 'sponsored', label: 'Sponsorisées' },
];

const POST_TYPE_CONFIG = {
  news: { label: 'News', icon: 'bell', color: theme.colors.primary },
  formation: { label: 'Formation', icon: 'bookOpen', color: theme.colors.secondary },
  event: { label: 'Événement', icon: 'calendar', color: theme.colors.warning },
  video: { label: 'Vidéo', icon: 'play', color: theme.colors.rose },
};

export default function LaboratoryPosts() {
  const router = useRouter();
  const { session } = useAuth();
  const laboratoryId = session?.user?.id;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('published');

  const fetchPosts = useCallback(async () => {
    if (!laboratoryId) return;
    try {
      setLoading(true);
      const data = await laboratoryPostService.getPostsByLab(laboratoryId);
      setPosts(data);
    } catch (err) {
      console.error('Erreur chargement posts:', err);
    } finally {
      setLoading(false);
    }
  }, [laboratoryId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);

  const filteredPosts = posts.filter(p => {
    if (activeTab === 'published') return p.is_published && !p.is_sponsored;
    if (activeTab === 'draft') return !p.is_published;
    return p.is_sponsored;
  });

  const tabCounts = {
    published: posts.filter(p => p.is_published && !p.is_sponsored).length,
    draft: posts.filter(p => !p.is_published).length,
    sponsored: posts.filter(p => p.is_sponsored).length,
  };

  const handlePublish = (post) => {
    Alert.alert(
      'Publier',
      `Publier "${post.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Publier',
          onPress: async () => {
            try {
              const updated = await laboratoryPostService.publishPost(post.id);
              setPosts(prev => prev.map(p => p.id === post.id ? updated : p));
            } catch (err) {
              Alert.alert('Erreur', err.message || 'Impossible de publier');
            }
          },
        },
      ]
    );
  };

  const handleUnpublish = (post) => {
    Alert.alert(
      'Dépublier',
      `Retirer "${post.title}" du feed ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Dépublier',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await laboratoryPostService.unpublishPost(post.id);
              setPosts(prev => prev.map(p => p.id === post.id ? updated : p));
            } catch (err) {
              Alert.alert('Erreur', err.message || 'Impossible de dépublier');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (post) => {
    Alert.alert(
      'Supprimer',
      `Supprimer définitivement "${post.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await laboratoryPostService.deletePost(post.id);
              setPosts(prev => prev.filter(p => p.id !== post.id));
            } catch (err) {
              Alert.alert('Erreur', err.message || 'Impossible de supprimer');
            }
          },
        },
      ]
    );
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  const renderPost = ({ item }) => {
    const typeConfig = POST_TYPE_CONFIG[item.type] || POST_TYPE_CONFIG.news;
    const isDraft = !item.is_published;

    return (
      <Pressable
        style={styles.postCard}
        onPress={() => router.push({ pathname: '/(screens)/createPost', params: { postId: item.id } })}
      >
        <View style={styles.postRow}>
          {/* Thumbnail */}
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.postThumb} />
          ) : (
            <View style={[styles.postThumb, styles.postThumbPlaceholder]}>
              <Icon name={typeConfig.icon} size={20} color={typeConfig.color} />
            </View>
          )}

          {/* Contenu */}
          <View style={styles.postContent}>
            {/* Badges */}
            <View style={styles.badgeRow}>
              <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '15' }]}>
                <Icon name={typeConfig.icon} size={10} color={typeConfig.color} />
                <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
              </View>
              {isDraft && (
                <View style={[styles.typeBadge, { backgroundColor: theme.colors.gray + '30' }]}>
                  <Text style={[styles.typeBadgeText, { color: theme.colors.textLight }]}>Brouillon</Text>
                </View>
              )}
              {item.is_sponsored && (
                <View style={[styles.typeBadge, { backgroundColor: theme.colors.warning + '15' }]}>
                  <Icon name="star" size={10} color={theme.colors.warning} />
                  <Text style={[styles.typeBadgeText, { color: theme.colors.warning }]}>Sponsorisé</Text>
                </View>
              )}
            </View>

            {/* Titre */}
            <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>

            {/* Stats + date */}
            <View style={styles.postMeta}>
              {item.is_published && (
                <>
                  <View style={styles.metaItem}>
                    <Icon name="eye" size={12} color={theme.colors.textLight} />
                    <Text style={styles.metaText}>{item.views_count}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Icon name="target" size={12} color={theme.colors.textLight} />
                    <Text style={styles.metaText}>{item.clicks_count}</Text>
                  </View>
                </>
              )}
              <Text style={styles.metaText}>
                {item.published_at ? formatDate(item.published_at) : formatDate(item.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.postActions}>
          {isDraft ? (
            <>
              <Pressable style={styles.actionButton} onPress={() => handlePublish(item)}>
                <Icon name="send" size={14} color={theme.colors.success} />
              </Pressable>
              <Pressable style={styles.actionButton} onPress={() => handleDelete(item)}>
                <Icon name="trash" size={14} color={theme.colors.rose} />
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={styles.actionButton} onPress={() => handleUnpublish(item)}>
                <Icon name="eyeOff" size={14} color={theme.colors.warning} />
              </Pressable>
              <Pressable style={styles.actionButton} onPress={() => handleDelete(item)}>
                <Icon name="trash" size={14} color={theme.colors.rose} />
              </Pressable>
            </>
          )}
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => {
    const config = {
      published: {
        icon: 'fileText',
        title: 'Aucune publication',
        subtitle: 'Partagez des actualités avec vos abonnés',
        action: () => router.push('/(screens)/createPost'),
        actionLabel: 'Créer une publication',
      },
      draft: {
        icon: 'edit',
        title: 'Aucun brouillon',
        subtitle: 'Vos publications en cours de rédaction apparaîtront ici',
        action: () => router.push('/(screens)/createPost'),
        actionLabel: 'Créer une publication',
      },
      sponsored: {
        icon: 'star',
        title: 'Aucune publication sponsorisée',
        subtitle: 'Boostez vos publications pour plus de visibilité',
      },
    };
    return <EmptyState {...config[activeTab]} />;
  };

  if (loading && !refreshing) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={commonStyles.header}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Mes publications</Text>
          <View style={commonStyles.headerSpacer} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Mes publications</Text>
        <Pressable
          style={commonStyles.headerButton}
          onPress={() => router.push('/(screens)/createPost')}
        >
          <Icon name="plus" size={22} color={theme.colors.primary} />
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{posts.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>{tabCounts.published}</Text>
          <Text style={styles.statLabel}>Publiées</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.textLight }]}>{tabCounts.draft}</Text>
          <Text style={styles.statLabel}>Brouillons</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.warning }]}>{tabCounts.sponsored}</Text>
          <Text style={styles.statLabel}>Sponsorisées</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={commonStyles.tabsContainer}>
        {TABS.map(tab => (
          <Pressable
            key={tab.key}
            style={[commonStyles.tab, activeTab === tab.key && commonStyles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[commonStyles.tabText, activeTab === tab.key && commonStyles.tabTextActive]}>
              {tab.label}
            </Text>
            {tabCounts[tab.key] > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                  {tabCounts[tab.key]}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    marginHorizontal: wp(5),
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: hp(1),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    marginTop: hp(0.2),
  },
  statDivider: {
    width: 1,
    height: hp(3),
    backgroundColor: theme.colors.border,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.gray + '30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginLeft: wp(1),
  },
  tabBadgeActive: {
    backgroundColor: theme.colors.primary + '20',
  },
  tabBadgeText: {
    fontSize: hp(1.1),
    fontFamily: theme.fonts.medium,
    color: theme.colors.textLight,
  },
  tabBadgeTextActive: {
    color: theme.colors.primary,
  },
  listContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(10),
    gap: hp(1.5),
  },
  postCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: hp(1),
  },
  postRow: {
    flexDirection: 'row',
    gap: wp(3),
  },
  postThumb: {
    width: 70,
    height: 70,
    borderRadius: theme.radius.md,
  },
  postThumbPlaceholder: {
    backgroundColor: theme.colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContent: {
    flex: 1,
    gap: hp(0.5),
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(1.5),
  },
  typeBadge: {
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
  postTitle: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  metaText: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: wp(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: hp(1),
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
