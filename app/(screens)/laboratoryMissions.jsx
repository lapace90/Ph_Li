// Gestion des missions — dashboard labo
import { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, Alert, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useClientMissions } from '../../hooks/useMissions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import { EmptyState } from '../../components/common/DashboardComponents';

const TABS = [
  { key: 'open', label: 'Ouvertes' },
  { key: 'active', label: 'En cours' },
  { key: 'draft', label: 'Brouillons' },
  { key: 'past', label: 'Terminées' },
];

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: theme.colors.textLight, icon: 'edit' },
  open: { label: 'Ouverte', color: theme.colors.success, icon: 'eye' },
  proposal_sent: { label: 'Proposition envoyée', color: theme.colors.warning, icon: 'send' },
  animator_accepted: { label: 'Acceptée', color: theme.colors.primary, icon: 'checkCircle' },
  confirmed: { label: 'Confirmée', color: theme.colors.primary, icon: 'check' },
  assigned: { label: 'Assignée', color: theme.colors.warning, icon: 'user' },
  in_progress: { label: 'En cours', color: theme.colors.primary, icon: 'activity' },
  completed: { label: 'Terminée', color: theme.colors.success, icon: 'checkCircle' },
  cancelled: { label: 'Annulée', color: theme.colors.rose, icon: 'x' },
};

const getMissionTypeLabel = (type) => {
  const labels = {
    animation: 'Animation',
    formation: 'Formation',
    audit: 'Audit',
    merchandising: 'Merchandising',
    event: 'Événement',
  };
  return labels[type] || type;
};

export default function LaboratoryMissions() {
  const router = useRouter();
  const { session, profile } = useAuth();

  // Supporter les labos ET les titulaires
  const clientType = profile?.user_type === 'laboratoire' ? 'laboratory' : 'pharmacy';

  const {
    missions,
    loading,
    stats,
    refresh,
    publishMission,
    cancelMission,
    deleteMission,
  } = useClientMissions(session?.user?.id, clientType);

  const [activeTab, setActiveTab] = useState('open');
  const [refreshing, setRefreshing] = useState(false);

  const filteredMissions = missions.filter(m => {
    if (activeTab === 'open') return ['open', 'proposal_sent', 'animator_accepted', 'confirmed'].includes(m.status);
    if (activeTab === 'active') return ['assigned', 'in_progress'].includes(m.status);
    if (activeTab === 'draft') return m.status === 'draft';
    return ['completed', 'cancelled'].includes(m.status);
  });

  const tabCounts = {
    open: missions.filter(m => ['open', 'proposal_sent', 'animator_accepted', 'confirmed'].includes(m.status)).length,
    active: missions.filter(m => ['assigned', 'in_progress'].includes(m.status)).length,
    draft: missions.filter(m => m.status === 'draft').length,
    past: missions.filter(m => ['completed', 'cancelled'].includes(m.status)).length,
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handlePublish = (mission) => {
    Alert.alert(
      'Publier la mission',
      `Voulez-vous publier "${mission.title}" ? Elle sera visible par les animateurs.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Publier',
          onPress: async () => {
            const { success, error } = await publishMission(mission.id);
            if (!success) Alert.alert('Erreur', error || 'Impossible de publier');
          },
        },
      ]
    );
  };

  const handleCancel = (mission) => {
    Alert.alert(
      'Annuler la mission',
      `Voulez-vous annuler "${mission.title}" ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Annuler la mission',
          style: 'destructive',
          onPress: async () => {
            const { success, error } = await cancelMission(mission.id);
            if (!success) Alert.alert('Erreur', error || 'Impossible d\'annuler');
          },
        },
      ]
    );
  };

  const handleDelete = (mission) => {
    Alert.alert(
      'Supprimer le brouillon',
      `Voulez-vous supprimer "${mission.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const { success, error } = await deleteMission(mission.id);
            if (!success) Alert.alert('Erreur', error || 'Impossible de supprimer');
          },
        },
      ]
    );
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : null;

  const renderMission = ({ item }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.open;
    const isDraft = item.status === 'draft';
    const isOpen = item.status === 'open';
    const canCancel = ['open', 'proposal_sent', 'animator_accepted'].includes(item.status);
    const dateRange = item.start_date
      ? `${formatDate(item.start_date)}${item.end_date ? ` - ${formatDate(item.end_date)}` : ''}`
      : null;
    const rate = item.daily_rate_max && item.daily_rate_max !== item.daily_rate_min
      ? `${item.daily_rate_min} - ${item.daily_rate_max}€/j`
      : `${item.daily_rate_min || item.daily_rate_max || '?'}€/j`;

    return (
      <Pressable
        style={styles.missionCard}
        onPress={() => router.push({ pathname: '/(screens)/missionDetail', params: { missionId: item.id } })}
      >
        {/* Header : status + type */}
        <View style={styles.missionHeader}>
          <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
            <Icon name={config.icon} size={12} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
          {item.mission_type && (
            <View style={[styles.typeBadge]}>
              <Text style={styles.typeText}>{getMissionTypeLabel(item.mission_type)}</Text>
            </View>
          )}
        </View>

        {/* Titre */}
        <Text style={styles.missionTitle} numberOfLines={2}>{item.title}</Text>

        {/* Meta */}
        <View style={styles.missionMeta}>
          {dateRange && (
            <View style={styles.metaItem}>
              <Icon name="calendar" size={13} color={theme.colors.textLight} />
              <Text style={styles.metaText}>{dateRange}</Text>
            </View>
          )}
          {item.city && (
            <View style={styles.metaItem}>
              <Icon name="mapPin" size={13} color={theme.colors.textLight} />
              <Text style={styles.metaText}>{item.city}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Icon name="dollarSign" size={13} color={theme.colors.success} />
            <Text style={[styles.metaText, { color: theme.colors.success, fontFamily: theme.fonts.semiBold }]}>{rate}</Text>
          </View>
        </View>

        {/* Animateur assigné */}
        {item.animator?.profile && (
          <View style={styles.animatorRow}>
            <Icon name="user" size={13} color={theme.colors.primary} />
            <Text style={styles.animatorText}>
              {item.animator.profile.first_name} {item.animator.profile.last_name}
            </Text>
          </View>
        )}

        {/* Footer : date + actions */}
        <View style={styles.missionFooter}>
          <Text style={styles.footerDate}>Créée le {formatDate(item.created_at)}</Text>
          <View style={commonStyles.rowGapSmall}>
            {isDraft && (
              <Pressable style={styles.actionButton} onPress={() => handlePublish(item)}>
                <Icon name="send" size={14} color={theme.colors.success} />
              </Pressable>
            )}
            {canCancel && (
              <Pressable style={styles.actionButton} onPress={() => handleCancel(item)}>
                <Icon name="x" size={14} color={theme.colors.warning} />
              </Pressable>
            )}
            {isDraft && (
              <Pressable style={styles.actionButton} onPress={() => handleDelete(item)}>
                <Icon name="trash" size={14} color={theme.colors.rose} />
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => {
    const emptyConfig = {
      open: {
        icon: 'briefcase',
        title: 'Aucune mission ouverte',
        subtitle: 'Publiez une mission pour trouver des animateurs',
        action: () => router.push('/(screens)/createMission'),
        actionLabel: 'Créer une mission',
      },
      active: {
        icon: 'activity',
        title: 'Aucune mission en cours',
        subtitle: 'Les missions assignées apparaîtront ici',
      },
      draft: {
        icon: 'edit',
        title: 'Aucun brouillon',
        subtitle: 'Commencez à créer une mission',
        action: () => router.push('/(screens)/createMission'),
        actionLabel: 'Créer une mission',
      },
      past: {
        icon: 'clock',
        title: 'Aucun historique',
        subtitle: 'Vos missions terminées apparaîtront ici',
      },
    };
    return <EmptyState {...emptyConfig[activeTab]} />;
  };

  if (loading && !refreshing) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={commonStyles.header}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Mes missions</Text>
          <View style={commonStyles.headerSpacer} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Mes missions</Text>
        <Pressable
          style={commonStyles.headerButton}
          onPress={() => router.push('/(screens)/createMission')}
        >
          <Icon name="plus" size={22} color={theme.colors.primary} />
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>{stats.open}</Text>
          <Text style={styles.statLabel}>Ouvertes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.warning }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Terminées</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={commonStyles.tabsContainer}>
        {TABS.map(tab => (
          <Pressable
            key={tab.key}
            style={[commonStyles.tab, activeTab === tab.key && commonStyles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[commonStyles.tabText, activeTab === tab.key && commonStyles.tabTextActive]}>
              {tab.label}
            </Text>
            {tabCounts[tab.key] > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                  {tabCounts[tab.key]}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredMissions}
        keyExtractor={(item) => item.id}
        renderItem={renderMission}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    marginHorizontal: wp(5),
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: hp(1),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    marginTop: hp(0.2),
  },
  statDivider: {
    width: 1,
    height: hp(3),
    backgroundColor: theme.colors.border,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.gray + '30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginLeft: wp(1),
  },
  tabBadgeActive: {
    backgroundColor: theme.colors.primary + '20',
  },
  tabBadgeText: {
    fontSize: hp(1.1),
    fontFamily: theme.fonts.medium,
    color: theme.colors.textLight,
  },
  tabBadgeTextActive: {
    color: theme.colors.primary,
  },
  listContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(10),
    gap: hp(1.5),
  },
  missionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: hp(1),
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  statusText: {
    fontSize: hp(1.2),
    fontFamily: theme.fonts.semiBold,
  },
  typeBadge: {
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary + '10',
  },
  typeText: {
    fontSize: hp(1.2),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary,
  },
  missionTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  missionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(3),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  metaText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  animatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    paddingTop: hp(0.5),
  },
  animatorText: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary,
  },
  missionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(0.5),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerDate: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
