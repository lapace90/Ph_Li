import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';
import SwipeCard from './SwipeCard';

const SwipeStack = ({
  cards,
  type = 'job_offer',
  loading,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onRefresh,
  superLikesRemaining = 0,
}) => {
  // Afficher seulement les 3 premières cartes
  const visibleCards = cards.slice(0, 3);

  if (loading) {
    return (
      <View style={commonStyles.emptyContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={commonStyles.emptyText}>Recherche d'opportunités...</Text>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={commonStyles.emptyContainer}>
        <View style={commonStyles.emptyIcon}>
          <Icon name="search" size={50} color={theme.colors.primary} />
        </View>
        <Text style={commonStyles.emptyTitle}>Plus d'offres pour le moment</Text>
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

  return (
    <View style={styles.container}>
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
            superLikesRemaining <= 0 && styles.buttonDisabled
          ]}
          onPress={() => superLikesRemaining > 0 && onSwipeUp?.(cards[0])}
          disabled={superLikesRemaining <= 0}
        >
          <Icon 
            name="star" 
            size={24} 
            color={superLikesRemaining > 0 ? theme.colors.warning : theme.colors.gray} 
          />
          {superLikesRemaining > 0 && (
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

      {/* Compteur */}
      <Text style={styles.remainingText}>
        {cards.length} offre{cards.length > 1 ? 's' : ''} restante{cards.length > 1 ? 's' : ''}
      </Text>
    </View>
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
  remainingText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    paddingBottom: hp(1),
  },
});

export default SwipeStack;