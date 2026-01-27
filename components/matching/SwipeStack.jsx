import { StyleSheet, Text, View, Pressable, ActivityIndicator, ImageBackground } from 'react-native';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';
import SwipeCard from './SwipeCard';

// Background PharmaLink
const BG_PATTERN = require('../../assets/icons/background_Ph_Li.png');

const TYPE_LABELS = {
  animator: { singular: 'animateur', plural: 'animateurs', search: "Recherche d'animateurs...", empty: "Plus d'animateurs pour le moment" },
  mission: { singular: 'mission', plural: 'missions', search: 'Recherche de missions...', empty: 'Plus de missions pour le moment' },
  candidate: { singular: 'candidat', plural: 'candidats', search: 'Recherche de candidats...', empty: 'Plus de candidats pour le moment' },
  job_offer: { singular: 'offre', plural: 'offres', search: "Recherche d'opportunités...", empty: "Plus d'offres pour le moment" },
  internship_offer: { singular: 'offre', plural: 'offres', search: "Recherche d'opportunités...", empty: "Plus d'offres pour le moment" },
};

const SwipeStack = ({
  cards,
  type = 'job_offer',
  loading,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onRefresh,
  onCardPress,
  superLikesRemaining,
  superLikeQuota,
  onSuperLikeBlocked,
}) => {
  // Afficher seulement les 3 premières cartes
  const visibleCards = cards.slice(0, 3);
  const labels = TYPE_LABELS[type] || TYPE_LABELS.job_offer;
  const superLikeDisabled = superLikesRemaining != null && superLikesRemaining <= 0;

  const handleSuperLikePress = () => {
    if (superLikeDisabled) {
      onSuperLikeBlocked?.();
    } else {
      onSwipeUp?.(cards[0]);
    }
  };

  // Loading state - pas de background
  if (loading) {
    return (
      <View style={commonStyles.emptyContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={commonStyles.emptyText}>{labels.search}</Text>
      </View>
    );
  }

  // Empty state - pas de background
  if (cards.length === 0) {
    return (
      <View style={commonStyles.emptyContainer}>
        <View style={commonStyles.emptyIcon}>
          <Icon name="search" size={50} color={theme.colors.primary} />
        </View>
        <Text style={commonStyles.emptyTitle}>{labels.empty}</Text>
        <Text style={commonStyles.emptyText}>
          Revenez plus tard ou élargissez vos critères de recherche
        </Text>
        {onRefresh && (
          <Pressable style={commonStyles.emptyButton} onPress={onRefresh}>
            <Icon name="refresh" size={18} color="white" />
            <Text style={commonStyles.emptyButtonText}>Actualiser</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // Avec cartes - background PharmaLink
  return (
    <ImageBackground
      source={BG_PATTERN}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Stack de cartes */}
      <View style={styles.cardsContainer}>
        {visibleCards.map((card, index) => (
          <SwipeCard
            key={card.id}
            card={card}
            type={type}
            index={index}
            isFirst={index === 0}
            onSwipeLeft={() => onSwipeLeft?.(card)}
            onSwipeRight={() => onSwipeRight?.(card)}
            onSwipeUp={() => onSwipeUp?.(card)}
            onCardPress={() => onCardPress?.(card)}
          />
        )).reverse()}
      </View>

      {/* Boutons d'action */}
      <View style={styles.actionsContainer}>
        {/* Dislike */}
        <Pressable
          style={[styles.actionButton, styles.dislikeButton]}
          onPress={() => onSwipeLeft?.(cards[0])}
        >
          <Icon name="close" size={28} color={theme.colors.rose} />
        </Pressable>

        {/* Super Like */}
        <Pressable
          style={[
            styles.actionButton,
            styles.superLikeButton,
            superLikeDisabled && styles.buttonDisabled
          ]}
          onPress={handleSuperLikePress}
        >
          <Icon
            name="star"
            size={24}
            color={superLikeDisabled ? theme.colors.gray : theme.colors.warning}
          />
          {superLikesRemaining != null && superLikesRemaining > 0 && (
            <Text style={styles.superLikeCount}>{superLikesRemaining}</Text>
          )}
        </Pressable>

        {/* Like */}
        <Pressable
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => onSwipeRight?.(cards[0])}
        >
          <Icon name="heart" size={28} color={theme.colors.success} />
        </Pressable>
      </View>

      {/* Compteur super likes */}
      {superLikeQuota && !superLikeQuota.unlimited && (
        <View style={styles.superLikeQuotaRow}>
          <Icon name="star" size={14} color={theme.colors.warning} />
          <Text style={styles.superLikeQuotaText}>
            {superLikeQuota.used}/{superLikeQuota.max} Super Likes aujourd'hui
          </Text>
        </View>
      )}

      {/* Compteur */}
      <Text style={styles.remainingText}>
        {cards.length} {cards.length > 1 ? labels.plural : labels.singular} restant{cards.length > 1 ? 's' : ''}
      </Text>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  cardsContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(6),
    paddingVertical: hp(2),
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dislikeButton: {
    borderWidth: 2,
    borderColor: theme.colors.rose,
  },
  superLikeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: theme.colors.warning,
  },
  likeButton: {
    borderWidth: 2,
    borderColor: theme.colors.success,
  },
  buttonDisabled: {
    borderColor: theme.colors.gray,
    opacity: 0.5,
  },
  superLikeCount: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: theme.colors.warning,
    color: 'white',
    fontSize: hp(1.1),
    fontWeight: '700',
    width: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    lineHeight: 18,
    overflow: 'hidden',
  },
  superLikeQuotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  superLikeQuotaText: {
    fontSize: hp(1.2),
    color: theme.colors.warning,
    fontWeight: '600',
  },
  remainingText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    paddingBottom: hp(1),
  },
});

export default SwipeStack;
