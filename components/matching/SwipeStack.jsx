import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { theme } from '../../constants/theme';
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Recherche d'opportunités...</Text>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.emptyIcon}>
          <Icon name="search" size={50} color={theme.colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Plus d'offres pour le moment</Text>
        <Text style={styles.emptyText}>
          Revenez plus tard ou élargissez vos critères de recherche
        </Text>
        {onRefresh && (
          <Pressable style={styles.refreshButton} onPress={onRefresh}>
            <Icon name="refresh" size={18} color="white" />
            <Text style={styles.refreshText}>Actualiser</Text>
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
          <Text style={[
            styles.superLikeCount,
            superLikesRemaining <= 0 && styles.countDisabled
          ]}>
            {superLikesRemaining}
          </Text>
        </Pressable>

        {/* Like */}
        <Pressable 
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => onSwipeRight?.(cards[0])}
        >
          <Icon name="heart" size={28} color={theme.colors.success} />
        </Pressable>
      </View>

      {/* Compteur de cartes */}
      <View style={styles.counter}>
        <Text style={styles.counterText}>{cards.length} offres restantes</Text>
      </View>
    </View>
  );
};

export default SwipeStack;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
  },
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
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dislikeButton: {
    borderColor: theme.colors.rose + '30',
  },
  likeButton: {
    borderColor: theme.colors.success + '30',
  },
  superLikeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderColor: theme.colors.warning + '30',
    position: 'relative',
  },
  buttonDisabled: {
    opacity: 0.5,
    borderColor: theme.colors.gray,
  },
  superLikeCount: {
    position: 'absolute',
    bottom: -8,
    fontSize: hp(1.2),
    color: theme.colors.warning,
    fontWeight: '700',
    backgroundColor: theme.colors.card,
    paddingHorizontal: wp(1.5),
    borderRadius: 8,
  },
  countDisabled: {
    color: theme.colors.gray,
  },
  counter: {
    alignItems: 'center',
    paddingBottom: hp(2),
  },
  counterText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  // Empty state
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
    gap: hp(2),
  },
  loadingText: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    marginTop: hp(2),
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
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    marginTop: hp(2),
  },
  refreshText: {
    color: 'white',
    fontSize: hp(1.7),
    fontWeight: '600',
  },
});