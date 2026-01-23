// Favoris de l'animateur : missions sauvegardées + labos suivis

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { favoritesService, FAVORITE_TYPES } from '../../services/favoritesService';
import { missionService } from '../../services/missionService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import { MissionFavoriteCard } from '../../components/missions/MissionCard';
import { LaboratoryCompactCard, LaboratoryDetailModal } from '../../components/laboratories/LaboratoryCard';
import { EmptyState } from '../../components/common/DashboardComponents';

export default function AnimatorFavorites() {
  const router = useRouter();
  const { session } = useAuth();
  
  const [activeTab, setActiveTab] = useState('missions'); // 'missions' | 'labs'
  const [missions, setMissions] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favoriteLabIds, setFavoriteLabIds] = useState(new Set());

  // Modal labo
  const [selectedLab, setSelectedLab] = useState(null);
  const [labMissions, setLabMissions] = useState([]);
  const [showLabModal, setShowLabModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const [missionsFavs, labsFavs] = await Promise.all([
        favoritesService.getMissionFavorites(session.user.id),
        favoritesService.getLaboratoryFavorites(session.user.id),
      ]);

      setMissions(missionsFavs);
      setLaboratories(labsFavs);
      setFavoriteLabIds(new Set(labsFavs.map(f => f.target_id)));
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Supprimer une mission des favoris
  const removeMissionFavorite = async (missionId) => {
    try {
      await favoritesService.remove(session.user.id, FAVORITE_TYPES.MISSION, missionId);
      setMissions(prev => prev.filter(m => m.target_id !== missionId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  // Supprimer un labo des favoris
  const removeLabFavorite = async (labId) => {
    try {
      await favoritesService.remove(session.user.id, FAVORITE_TYPES.LABORATORY, labId);
      setLaboratories(prev => prev.filter(l => l.target_id !== labId));
      setFavoriteLabIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(labId);
        return newSet;
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  // Toggle favori labo (depuis modal)
  const toggleLabFavorite = async () => {
    if (!selectedLab) return;

    const isCurrentlyFavorite = favoriteLabIds.has(selectedLab.id);

    try {
      if (isCurrentlyFavorite) {
        await removeLabFavorite(selectedLab.id);
      } else {
        await favoritesService.add(session.user.id, FAVORITE_TYPES.LABORATORY, selectedLab.id);
        setFavoriteLabIds(prev => new Set([...prev, selectedLab.id]));
        // Recharger les favoris
        loadData();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Ouvrir la fiche labo
  const openLabDetail = async (lab) => {
    setSelectedLab(lab);
    setShowLabModal(true);

    try {
      const labMissionsData = await missionService.searchMissions({
        clientId: lab.id,
        status: 'open',
      });
      setLabMissions(labMissionsData);
    } catch (error) {
      console.error('Error loading lab missions:', error);
    }
  };

  const tabs = [
    { key: 'missions', label: 'Missions', count: missions.length, icon: 'bookmark' },
    { key: 'labs', label: 'Labos', count: laboratories.length, icon: 'star' },
  ];

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Mes favoris</Text>
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
            <Icon 
              name={activeTab === tab.key ? `${tab.icon}-filled` : tab.icon} 
              size={18} 
              color={activeTab === tab.key ? '#fff' : theme.colors.textLight} 
            />
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
        {activeTab === 'missions' ? (
          // Missions sauvegardées
          missions.length > 0 ? (
            missions.map((fav) => (
              <MissionFavoriteCard
                key={fav.id}
                mission={fav.mission}
                laboratory={fav.mission?.client_profile}
                isFavoriteLab={fav.mission?.client_id && favoriteLabIds.has(fav.mission.client_id)}
                onPress={() => router.push(`/missionDetail/${fav.target_id}`)}
                onRemove={() => removeMissionFavorite(fav.target_id)}
              />
            ))
          ) : (
            <EmptyState
              icon="bookmark"
              title="Aucune mission sauvegardée"
              subtitle="Sauvegardez des missions pendant le swipe pour les retrouver ici"
              action={() => router.push('/swipeMissions')}
              actionLabel="Explorer les missions"
            />
          )
        ) : (
          // Labos suivis
          laboratories.length > 0 ? (
            laboratories.map((fav) => (
              <LaboratoryCompactCard
                key={fav.id}
                laboratory={fav.laboratory}
                onPress={() => openLabDetail(fav.laboratory)}
                onRemove={() => removeLabFavorite(fav.target_id)}
              />
            ))
          ) : (
            <EmptyState
              icon="star"
              title="Aucun labo suivi"
              subtitle="Suivez des labos pour être notifié de leurs nouvelles missions"
              action={() => router.push('/swipeMissions')}
              actionLabel="Découvrir des labos"
            />
          )
        )}
      </ScrollView>

      {/* Modal fiche labo */}
      <LaboratoryDetailModal
        visible={showLabModal}
        onClose={() => setShowLabModal(false)}
        laboratory={selectedLab}
        missions={labMissions}
        isFavorite={selectedLab && favoriteLabIds.has(selectedLab.id)}
        onToggleFavorite={toggleLabFavorite}
        onMissionPress={(mission) => {
          setShowLabModal(false);
          router.push(`/missionDetail/${mission.id}`);
        }}
      />
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
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    gap: wp(3),
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    gap: wp(2),
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.textLight,
  },
  tabTextActive: {
    color: '#fff',
  },
  tabBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: hp(1.2),
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