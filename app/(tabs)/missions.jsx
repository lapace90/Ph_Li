// Liste des missions pour animateur

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useAnimatorMissions } from '../../hooks/useMissions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import { MissionListCard } from '../../components/missions/MissionCard';
import { EmptyState } from '../../components/common/DashboardComponents';

// Onglets
const TABS = [
  { key: 'active', label: 'En cours' },
  { key: 'pending', label: 'Candidatures' },
  { key: 'completed', label: 'Terminées' },
];

export default function Missions() {
  const router = useRouter();
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [refreshing, setRefreshing] = useState(false);

  // Hook pour les missions - BONNE PRATIQUE
  const {
    myMissions,
    loading,
    error,
    stats,
    refresh: refreshMissions,
  } = useAnimatorMissions(session?.user?.id);

  // Filtrer les missions par statut
  const getFilteredMissions = useCallback(() => {
    switch (activeTab) {
      case 'active':
        return myMissions.filter(m => 
          ['assigned', 'in_progress'].includes(m.status)
        );
      case 'pending':
        // TODO: Implémenter les candidatures avec une table dédiée
        // Pour l'instant on filtre sur un statut hypothétique
        return myMissions.filter(m => m.application_status === 'pending');
      case 'completed':
        return myMissions.filter(m => m.status === 'completed');
      default:
        return myMissions;
    }
  }, [activeTab, myMissions]);

  const filteredMissions = getFilteredMissions();

  // Compteurs pour les badges des onglets
  const tabCounts = {
    active: myMissions.filter(m => ['assigned', 'in_progress'].includes(m.status)).length,
    pending: myMissions.filter(m => m.application_status === 'pending').length,
    completed: myMissions.filter(m => m.status === 'completed').length,
  };

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshMissions();
    setRefreshing(false);
  };

  // Config vide selon l'onglet
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
          actionLabel: 'Explorer les missions',
        };
      case 'completed':
        return {
          icon: 'check-circle',
          title: 'Aucune mission terminée',
          subtitle: 'Vos missions complétées apparaîtront ici',
        };
      default:
        return {
          icon: 'inbox',
          title: 'Aucune mission',
        };
    }
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes missions</Text>
        <Pressable
          style={styles.searchButton}
          onPress={() => router.push('/swipeMissions')}
        >
          <Icon name="search" size={20} color={theme.colors.primary} />
        </Pressable>
      </View>

      {/* Onglets */}
      <View style={styles.tabsContainer}>
        {TABS.map(tab => (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {tabCounts[tab.key] > 0 && (
              <View style={[
                styles.badge,
                activeTab === tab.key && styles.badgeActive,
              ]}>
                <Text style={[
                  styles.badgeText,
                  activeTab === tab.key && styles.badgeTextActive,
                ]}>
                  {tabCounts[tab.key]}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Liste des missions */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={40} color={theme.colors.rose} />
            <Text style={styles.errorText}>Erreur: {error}</Text>
            <Pressable style={styles.retryButton} onPress={refreshMissions}>
              <Text style={styles.retryText}>Réessayer</Text>
            </Pressable>
          </View>
        ) : filteredMissions.length > 0 ? (
          <View style={styles.missionsList}>
            {filteredMissions.map(mission => (
              <MissionListCard
                key={mission.id}
                mission={mission}
                showStatus
                onPress={() => router.push(`/mission/${mission.id}`)}
              />
            ))}
          </View>
        ) : (
          <EmptyState {...getEmptyConfig()} />
        )}

        {/* Espace en bas */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },
  title: {
    fontSize: hp(2.8),
    fontWeight: theme.fonts.bold,
    color: theme.colors.textDark,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    gap: wp(1),
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    color: theme.colors.textLight,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.semibold,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeActive: {
    backgroundColor: theme.colors.primary,
  },
  badgeText: {
    fontSize: hp(1.4),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.textLight,
  },
  badgeTextActive: {
    color: theme.colors.white,
  },
  listContainer: {
    flex: 1,
  },
  missionsList: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    gap: hp(1.5),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
  },
  loadingText: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
    gap: hp(1.5),
  },
  errorText: {
    fontSize: hp(1.8),
    color: theme.colors.rose,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
  },
  retryText: {
    color: theme.colors.white,
    fontWeight: theme.fonts.semibold,
  },
  bottomSpacer: {
    height: hp(10),
  },
});