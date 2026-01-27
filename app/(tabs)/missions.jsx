import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useAnimatorMissions } from '../../hooks/useMissions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import { MissionListCard } from '../../components/missions/MissionCard';
import { EmptyState } from '../../components/common/DashboardComponents';

const TABS = [
  { key: 'available', label: 'Disponibles' },
  { key: 'applied', label: 'Candidatures' },
  { key: 'active', label: 'En cours' },
];

export default function Missions() {
  const router = useRouter();
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState('available');
  const [refreshing, setRefreshing] = useState(false);

  const { availableMissions, myMissions, loading, error, refresh } = useAnimatorMissions(session?.user?.id);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const filterMissions = (tab) => {
    switch (tab) {
      case 'available': return availableMissions;
      case 'applied': return myMissions.filter(m => m.application_status === 'pending' || ['proposal_sent', 'animator_accepted'].includes(m.status));
      case 'active': return myMissions.filter(m => ['confirmed', 'assigned', 'in_progress'].includes(m.status));
      default: return [];
    }
  };

  const currentMissions = filterMissions(activeTab);
  const tabCounts = { available: availableMissions.length, applied: filterMissions('applied').length, active: filterMissions('active').length };

  const emptyConfig = {
    available: { icon: 'mapPin', title: 'Aucune mission disponible', subtitle: 'Revenez plus tard ou élargissez votre zone' },
    applied: { icon: 'clock', title: 'Aucune candidature', subtitle: 'Postulez aux missions qui vous intéressent', action: () => setActiveTab('available'), actionLabel: 'Voir les missions' },
    active: { icon: 'briefcase', title: 'Aucune mission en cours', subtitle: 'Vos missions assignées apparaîtront ici' },
  };

  return (
    <ScreenWrapper>
      <View style={[commonStyles.headerNoBorder, commonStyles.rowBetween]}>
        <Text style={commonStyles.headerTitleLarge}>Mes missions</Text>
        <Pressable style={[commonStyles.headerButton, { backgroundColor: theme.colors.primaryLight }]} onPress={() => router.push('/swipeMissions')}>
          <Icon name="search" size={20} color={theme.colors.primary} />
        </Pressable>
      </View>

      <View style={commonStyles.tabsUnderline}>
        {TABS.map(tab => (
          <Pressable key={tab.key} style={[commonStyles.tabUnderline, activeTab === tab.key && commonStyles.tabUnderlineActive]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[commonStyles.tabUnderlineText, activeTab === tab.key && commonStyles.tabUnderlineTextActive]}>{tab.label}</Text>
            {tabCounts[tab.key] > 0 && (
              <View style={[commonStyles.tabBadge, activeTab === tab.key && commonStyles.tabBadgeActive]}>
                <Text style={[commonStyles.tabBadgeText, activeTab === tab.key && commonStyles.tabBadgeTextActive]}>{tabCounts[tab.key]}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={commonStyles.flex1}
        contentContainerStyle={commonStyles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      >
        {loading ? (
          <View style={commonStyles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : error ? (
          <View style={commonStyles.errorContainer}>
            <Icon name="alertCircle" size={40} color={theme.colors.rose} />
            <Text style={commonStyles.errorText}>Erreur: {error}</Text>
            <Pressable style={commonStyles.buttonPrimary} onPress={refresh}>
              <Text style={commonStyles.buttonPrimaryText}>Réessayer</Text>
            </Pressable>
          </View>
        ) : currentMissions.length > 0 ? (
          currentMissions.map(mission => (
            <MissionListCard key={mission.id} mission={mission} showStatus={activeTab !== 'available'} onPress={() => router.push({ pathname: '/(screens)/missionDetail', params: { missionId: mission.id } })} />
          ))
        ) : (
          <EmptyState {...emptyConfig[activeTab]} />
        )}

        <View style={commonStyles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}