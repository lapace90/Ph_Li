import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { useSwipeCards, useSwipeActions } from '../../hooks/useMatching';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import SwipeStack from '../../components/matching/SwipeStack';
import MatchModal from '../../components/matching/MatchModal';

export default function Matching() {
  const router = useRouter();
  const { user } = useAuth();
  
  const userType = user?.user_type;
  const isStudent = userType === 'etudiant';
  const isTitulaire = userType === 'titulaire';
  const isCandidate = !isTitulaire;
  
  const [offerType, setOfferType] = useState(
    isTitulaire ? 'candidate' : (isStudent ? 'internship_offer' : 'job_offer')
  );

  const { cards, loading, refresh, removeCurrentCard } = useSwipeCards(offerType);
  const { swipeLeft, swipeRight, superLike, lastMatch, clearLastMatch, superLikesRemaining } = useSwipeActions();

  const handleSwipeLeft = useCallback(async (card) => {
    const result = await swipeLeft(offerType, card.id);
    if (result?.success) removeCurrentCard();
  }, [offerType, swipeLeft, removeCurrentCard]);

  const handleSwipeRight = useCallback(async (card) => {
    const result = await swipeRight(offerType, card.id);
    if (result?.success) removeCurrentCard();
  }, [offerType, swipeRight, removeCurrentCard]);

  const handleSwipeUp = useCallback(async (card) => {
    const result = await superLike(offerType, card.id);
    if (result?.success) removeCurrentCard();
  }, [offerType, superLike, removeCurrentCard]);

  const handleMatchMessage = useCallback(() => {
    clearLastMatch();
    router.push('/(tabs)/messages');
  }, [clearLastMatch, router]);

  const handleMatchContinue = useCallback(() => {
    clearLastMatch();
  }, [clearLastMatch]);

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Match modal */}
      <MatchModal
        visible={!!lastMatch}
        match={lastMatch}
        onClose={clearLastMatch}
        onMessage={handleMatchMessage}
        onContinue={handleMatchContinue}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matching</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.headerButton} onPress={() => router.push('/(tabs)/messages')}>
            <Icon name="messageCircle" size={22} color={theme.colors.text} />
          </Pressable>
          <Pressable style={styles.headerButton} onPress={() => router.push('/(screens)/matches')}>
            <Icon name="heart" size={22} color={theme.colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Tabs pour candidats */}
      {isCandidate && (
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, offerType === 'job_offer' && styles.tabActive]}
            onPress={() => setOfferType('job_offer')}
          >
            <Text style={[styles.tabText, offerType === 'job_offer' && styles.tabTextActive]}>
              Emplois
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, offerType === 'internship_offer' && styles.tabActive]}
            onPress={() => setOfferType('internship_offer')}
          >
            <Text style={[styles.tabText, offerType === 'internship_offer' && styles.tabTextActive]}>
              Stages
            </Text>
          </Pressable>
        </View>
      )}

      {/* SwipeStack */}
      <SwipeStack
        cards={cards || []}
        type={offerType}
        loading={loading}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onSwipeUp={handleSwipeUp}
        onRefresh={refresh}
        superLikesRemaining={superLikesRemaining}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
  },
  headerTitle: {
    fontSize: hp(2.8),
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    gap: wp(2),
  },
  headerButton: {
    backgroundColor: theme.colors.card,
    padding: wp(2.5),
    borderRadius: theme.radius.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: wp(5),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 4,
    marginBottom: hp(1),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(1),
    borderRadius: theme.radius.md,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  tabTextActive: {
    color: 'white',
  },
});