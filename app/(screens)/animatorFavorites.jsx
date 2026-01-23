import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../hooks/useFavorites';
import { FAVORITE_TYPES } from '../../services/favoritesService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import { MissionFavoriteCard } from '../../components/missions/MissionCard';
import { LaboratoryCompactCard, LaboratoryDetailModal } from '../../components/laboratories/LaboratoryCard';
import { EmptyState } from '../../components/common/DashboardComponents';

export default function AnimatorFavorites() {
  const router = useRouter();
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState('missions');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);

  const { favorites: missionFavs, loading: loadingM, removeFavorite: removeMission, refresh: refreshM } = useFavorites(session?.user?.id, FAVORITE_TYPES.MISSION);
  const { favorites: labFavs, favoriteIds: labIds, removeFavorite: removeLab, toggleFavorite: toggleLab, refresh: refreshL } = useFavorites(session?.user?.id, FAVORITE_TYPES.LABORATORY);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshM(), refreshL()]);
    setRefreshing(false);
  }, [refreshM, refreshL]);

  const missions = missionFavs.filter(f => f.mission);
  const laboratories = labFavs.filter(f => f.laboratory);
  const loading = loadingM || loadingL;

  const tabs = [
    { key: 'missions', label: 'Missions', count: missions.length, icon: 'bookmark' },
    { key: 'labs', label: 'Labos', count: laboratories.length, icon: 'star' },
  ];

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Mes favoris</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <View style={commonStyles.tabsContainer}>
        {tabs.map(tab => (
          <Pressable key={tab.key} style={[commonStyles.tab, activeTab === tab.key && commonStyles.tabActive]} onPress={() => setActiveTab(tab.key)}>
            <Icon name={tab.icon} size={16} color={activeTab === tab.key ? '#fff' : theme.colors.textLight} />
            <Text style={[commonStyles.tabText, activeTab === tab.key && commonStyles.tabTextActive]}>{tab.label}</Text>
            {tab.count > 0 && (
              <View style={[commonStyles.tabBadge, activeTab === tab.key && commonStyles.tabBadgeActive]}>
                <Text style={[commonStyles.tabBadgeText, activeTab === tab.key && commonStyles.tabBadgeTextActive]}>{tab.count}</Text>
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
          {activeTab === 'missions' ? (
            missions.length > 0 ? missions.map(fav => (
              <MissionFavoriteCard key={fav.id} mission={fav.mission} onPress={() => router.push(`/mission/${fav.mission.id}`)} onRemove={() => removeMission(fav.mission.id)} />
            )) : (
              <EmptyState icon="bookmark" title="Aucune mission sauvegardée" subtitle="Explorez les missions disponibles" action={() => router.push('/swipeMissions')} actionLabel="Explorer" />
            )
          ) : (
            laboratories.length > 0 ? laboratories.map(fav => (
              <LaboratoryCompactCard key={fav.id} laboratory={fav.laboratory} onPress={() => setSelectedLab(fav.laboratory)} onRemove={() => removeLab(fav.laboratory.id)} />
            )) : (
              <EmptyState icon="star" title="Aucun labo suivi" subtitle="Suivez des labos pour être notifié" action={() => router.push('/swipeMissions')} actionLabel="Découvrir" />
            )
          )}
        </ScrollView>
      )}

      <LaboratoryDetailModal
        visible={!!selectedLab}
        laboratory={selectedLab}
        isFavorite={selectedLab && labIds.includes(selectedLab.id)}
        onClose={() => setSelectedLab(null)}
        onToggleFavorite={() => selectedLab && toggleLab(selectedLab.id)}
        onMissionPress={m => { setSelectedLab(null); router.push(`/mission/${m.id}`); }}
      />
    </ScreenWrapper>
  );
}