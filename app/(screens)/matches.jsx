import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useMatches } from '../../hooks/useMatching';
import { getContractTypeLabel, getContractColor } from '../../constants/jobOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';

export default function MatchesScreen() {
  const router = useRouter();
  const { matches, loading, error, stats, refresh } = useMatches();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleMatchPress = useCallback((match) => {
    // Naviguer vers la conversation
    router.push({ pathname: '/(screens)/conversation', params: { matchId: match.id } });
  }, [router]);

  const handleOfferPress = useCallback((match) => {
    const offer = match.job_offers || match.internship_offers;
    if (match.job_offers) {
      router.push({ pathname: '/(screens)/jobOfferDetailCandidate', params: { id: offer.id } });
    } else {
      router.push({ pathname: '/(screens)/internshipOfferDetailCandidate', params: { id: offer.id } });
    }
  }, [router]);

  const renderMatchItem = useCallback(({ item: match }) => {
    const offer = match.job_offers || match.internship_offers;
    const pharmacyProfile = offer?.profiles;
    const isJobOffer = !!match.job_offers;
    const contractColor = isJobOffer ? getContractColor(offer.contract_type) : theme.colors.secondary;

    const matchDate = match.matched_at 
      ? new Date(match.matched_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      : '';

    return (
      <Pressable style={styles.matchCard} onPress={() => handleMatchPress(match)}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {pharmacyProfile?.photo_url ? (
            <Image source={{ uri: pharmacyProfile.photo_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Icon name="briefcase" size={24} color={theme.colors.primary} />
            </View>
          )}
          {/* Badge nouveau match */}
          {isNewMatch(match.matched_at) && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>

        {/* Infos */}
        <View style={styles.matchInfo}>
          <View style={styles.matchHeader}>
            <Text style={styles.offerTitle} numberOfLines={1}>
              {offer?.title || 'Offre'}
            </Text>
            <Text style={styles.matchDate}>{matchDate}</Text>
          </View>

          <Text style={styles.pharmacyName}>
            {pharmacyProfile 
              ? `${pharmacyProfile.first_name} ${pharmacyProfile.last_name?.[0]}.`
              : offer?.city
            }
          </Text>

          <View style={styles.matchDetails}>
            {isJobOffer && (
              <View style={[styles.contractBadge, { backgroundColor: contractColor + '15' }]}>
                <Text style={[styles.contractText, { color: contractColor }]}>
                  {getContractTypeLabel(offer.contract_type)}
                </Text>
              </View>
            )}
            {!isJobOffer && (
              <View style={[styles.contractBadge, { backgroundColor: theme.colors.secondary + '15' }]}>
                <Text style={[styles.contractText, { color: theme.colors.secondary }]}>
                  {offer.type === 'stage' ? 'Stage' : 'Alternance'}
                </Text>
              </View>
            )}
            <View style={styles.locationRow}>
              <Icon name="mapPin" size={12} color={theme.colors.textLight} />
              <Text style={styles.locationText}>{offer?.city}</Text>
            </View>
          </View>

          {/* Score */}
          {match.match_score && (
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Compatibilité :</Text>
              <Text style={styles.scoreValue}>{Math.round(match.match_score)}%</Text>
            </View>
          )}
        </View>

        {/* Action */}
        <Pressable 
          style={styles.messageButton}
          onPress={() => handleMatchPress(match)}
        >
          <Icon name="messageCircle" size={20} color={theme.colors.primary} />
        </Pressable>
      </Pressable>
    );
  }, [handleMatchPress]);

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Icon name="heart" size={50} color={theme.colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Aucun match pour le moment</Text>
      <Text style={styles.emptyText}>
        Commencez à swiper sur les offres qui vous intéressent pour créer des matchs !
      </Text>
      <Pressable 
        style={styles.discoverButton}
        onPress={() => router.push('/(screens)/swipe')}
      >
        <Icon name="search" size={18} color="white" />
        <Text style={styles.discoverButtonText}>Découvrir des offres</Text>
      </Pressable>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.total}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stats.thisWeek}</Text>
        <Text style={styles.statLabel}>Cette semaine</Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={commonStyles.loadingText}>Chargement des matchs...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Icon name="arrowLeft" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Mes Matchs</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Liste des matchs */}
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatchItem}
        ListHeaderComponent={matches.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={[
          styles.listContent,
          matches.length === 0 && styles.emptyListContent
        ]}
        showsVerticalScrollIndicator={false}
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

// Helper pour détecter les matchs récents (< 24h)
const isNewMatch = (matchedAt) => {
  if (!matchedAt) return false;
  const matchDate = new Date(matchedAt);
  const now = new Date();
  const diffHours = (now - matchDate) / (1000 * 60 * 60);
  return diffHours < 24;
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: theme.colors.text,
  },
  listContent: {
    padding: wp(4),
    gap: hp(2),
  },
  emptyListContent: {
    flex: 1,
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: hp(2.4),
    fontWeight: '700',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginTop: hp(0.3),
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginVertical: hp(0.5),
  },
  // Match card
  matchCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: wp(3.5),
    gap: wp(3),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.rose,
    paddingHorizontal: wp(1.5),
    paddingVertical: hp(0.2),
    borderRadius: theme.radius.xs,
  },
  newBadgeText: {
    color: 'white',
    fontSize: hp(0.9),
    fontWeight: '700',
  },
  matchInfo: {
    flex: 1,
    gap: hp(0.4),
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  offerTitle: {
    flex: 1,
    fontSize: hp(1.7),
    fontWeight: '600',
    color: theme.colors.text,
  },
  matchDate: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },
  pharmacyName: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  matchDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginTop: hp(0.5),
  },
  contractBadge: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  contractText: {
    fontSize: hp(1.2),
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  locationText: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginTop: hp(0.3),
  },
  scoreLabel: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },
  scoreValue: {
    fontSize: hp(1.3),
    fontWeight: '600',
    color: theme.colors.primary,
  },
  messageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
    gap: hp(2),
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: hp(2.2),
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: hp(2.4),
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    marginTop: hp(2),
  },
  discoverButtonText: {
    color: 'white',
    fontSize: hp(1.7),
    fontWeight: '600',
  },
});