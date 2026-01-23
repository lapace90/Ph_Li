// app/(tabs)/matching.jsx
import { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useMatching } from '../../hooks/useMatching';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import SwipeStack from '../../components/matching/SwipeStack';
import MatchModal from '../../components/matching/MatchModal';

export default function Matching() {
  const router = useRouter();
  const { profile } = useAuth();
  const [offerType, setOfferType] = useState('job_offer');

  const isCandidate = profile?.role === 'candidate';

  const {
    cards, loading, lastMatch, superLikesRemaining,
    handleSwipeLeft, handleSwipeRight, handleSwipeUp,
    clearLastMatch, refresh,
  } = useMatching(offerType);

  const handleMatchMessage = (matchId) => {
    clearLastMatch();
    router.push({ pathname: '/(screens)/conversation', params: { matchId } });
  };

  const handleMatchContinue = () => {
    clearLastMatch();
  };

  return (
    <ScreenWrapper>
      <MatchModal visible={!!lastMatch} match={lastMatch} onClose={clearLastMatch} onMessage={handleMatchMessage} onContinue={handleMatchContinue} />

      <View style={[commonStyles.headerNoBorder, commonStyles.rowBetween]}>
        <Text style={commonStyles.headerTitleLarge}>Matching</Text>
        <View style={commonStyles.rowGapSmall}>
          <Pressable style={commonStyles.headerButton} onPress={() => router.push('/(tabs)/messages')}>
            <Icon name="messageCircle" size={22} color={theme.colors.text} />
          </Pressable>
          <Pressable style={commonStyles.headerButton} onPress={() => router.push('/(screens)/matches')}>
            <Icon name="heart" size={22} color={theme.colors.primary} />
          </Pressable>
        </View>
      </View>

      {isCandidate && (
        <View style={commonStyles.tabsContainer}>
          <Pressable style={[commonStyles.tab, offerType === 'job_offer' && commonStyles.tabActive]} onPress={() => setOfferType('job_offer')}>
            <Text style={[commonStyles.tabText, offerType === 'job_offer' && commonStyles.tabTextActive]}>Emplois</Text>
          </Pressable>
          <Pressable style={[commonStyles.tab, offerType === 'internship_offer' && commonStyles.tabActive]} onPress={() => setOfferType('internship_offer')}>
            <Text style={[commonStyles.tabText, offerType === 'internship_offer' && commonStyles.tabTextActive]}>Stages</Text>
          </Pressable>
        </View>
      )}

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