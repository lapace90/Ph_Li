// app/(screens)/myMissions.jsx
// Liste des missions de l'animateur (en cours + historique)

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { missionService } from '../../services/missionService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import { MissionListCard } from '../../components/missions/MissionCard';
import { EmptyState, DashboardSection } from '../../components/common/DashboardComponents';

export default function MyMissions() {
  const router = useRouter();
  const { session } = useAuth();
  
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'pending'
  const [missions, setMissions] = useState({
    active: [],
    completed: [],
    pending: [], // Candidatures en attente
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadMissions = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // Charger en parallèle
      const [active, completed, applications] = await Promise.all([
        missionService.getAnimatorMissions(session.user.id, ['assigned', 'in_progress']),
        missionService.getAnimatorMissions(session.user.id, ['completed']),
        missionService.getAnimatorApplications(session.user.id, 'pending'),
      ]);

      setMissions({
        active,
        completed,
        pending: applications,
      });
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMissions();
    setRefreshing(false);
  };

  const tabs = [
    { key: 'active', label: 'En cours', count: missions.active.length },
    { key: 'pending', label: 'Candidatures', count: missions.pending.length },
    { key: 'completed', label: 'Terminées', count: missions.completed.length },
  ];

  const currentMissions = missions[activeTab] || [];

  const getEmptyConfig = () => {
    switch (activeTab) {
      case 'active':
        return {
          icon: 'briefcase',
          title: 'Aucune mission en cours',
          subtitle: 'Vos missions assignées apparaîtront ici',
          action: () => router.push('/swipeMissions'),
          actionLabel: 'Chercher des missions',
        };
      case 'pending':
        return {
          icon: 'clock',
          title: 'Aucune candidature en attente',
          subtitle: 'Candidatez à des missions pour les voir ici',
          action: () => router.push('/swipeMissions'),
          actionLabel: 'Chercher des missions',
        };
      case 'completed':
        return {
          icon: 'checkCircle',
          title: 'Aucune mission terminée',
          subtitle: 'Votre historique apparaîtra ici',
        };
      default:
        return {};
    }
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Mes missions</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Liste */}
      <ScrollView
        style={commonStyles.flex1}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {currentMissions.length > 0 ? (
          currentMissions.map((mission) => (
            <MissionListCard
              key={mission.id}
              mission={mission}
              laboratory={mission.client_profile}
              showStatus={activeTab !== 'pending'}
              onPress={() => router.push(`/missionDetail/${mission.id}`)}
            />
          ))
        ) : (
          <EmptyState {...getEmptyConfig()} />
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

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
  headerTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    gap: wp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    gap: wp(1),
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.medium,
    color: theme.colors.textLight,
  },
  tabTextActive: {
    color: '#fff',
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: hp(1.1),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  tabBadgeTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: wp(5),
    gap: hp(1.5),
  },
});