// app/(screens)/myMissions.jsx
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useAnimatorMissions } from '../../hooks/useMissions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import { MissionListCard } from '../../components/missions/MissionCard';
import { EmptyState } from '../../components/common/DashboardComponents';

const TABS = [
  { key: 'pending', label: 'En attente', icon: 'clock' },
  { key: 'active', label: 'En cours', icon: 'play' },
  { key: 'completed', label: 'Terminées', icon: 'check' },
];

export default function MyMissions() {
  const router = useRouter();
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [refreshing, setRefreshing] = useState(false);

  const { myMissions, loading, refresh } = useAnimatorMissions(session?.user?.id);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const filterMissions = (tab) => {
    switch (tab) {
      case 'pending': return myMissions.filter(m => m.status === 'pending' || m.application_status === 'pending');
      case 'active': return myMissions.filter(m => ['assigned', 'in_progress'].includes(m.status));
      case 'completed': return myMissions.filter(m => m.status === 'completed');
      default: return [];
    }
  };

  const currentMissions = filterMissions(activeTab);
  const tabCounts = { pending: filterMissions('pending').length, active: filterMissions('active').length, completed: filterMissions('completed').length };

  const emptyConfig = {
    pending: { icon: 'clock', title: 'Aucune candidature', subtitle: 'Explorez les missions disponibles', action: () => router.push('/swipeMissions'), actionLabel: 'Explorer' },
    active: { icon: 'briefcase', title: 'Aucune mission en cours', subtitle: 'Vos missions assignées apparaîtront ici' },
    completed: { icon: 'checkCircle', title: 'Aucune mission terminée', subtitle: 'Votre historique apparaîtra ici' },
  };

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Mes missions</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <View style={commonStyles.tabsContainer}>
        {TABS.map(tab => (
          <Pressable key={tab.key} style={[commonStyles.tab, activeTab === tab.key && commonStyles.tabActive]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[commonStyles.tabText, activeTab === tab.key && commonStyles.tabTextActive]}>{tab.label}</Text>
            {tabCounts[tab.key] > 0 && (
              <View style={[commonStyles.tabBadge, activeTab === tab.key && commonStyles.tabBadgeActive]}>
                <Text style={[commonStyles.tabBadgeText, activeTab === tab.key && commonStyles.tabBadgeTextActive]}>{tabCounts[tab.key]}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={commonStyles.flex1}
          contentContainerStyle={commonStyles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        >
          {currentMissions.length > 0 ? (
            currentMissions.map(mission => (
              <MissionListCard key={mission.id} mission={mission} laboratory={mission.client_profile} showStatus={activeTab !== 'pending'} onPress={() => router.push(`/missionDetail/${mission.id}`)} />
            ))
          ) : (
            <EmptyState {...emptyConfig[activeTab]} />
          )}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}