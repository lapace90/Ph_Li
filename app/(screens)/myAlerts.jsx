// Mes alertes urgentes — écran liste pour titulaires et labos
import { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useCreatorAlerts } from '../../hooks/useUrgentAlerts';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Button from '../../components/common/Button';
import Icon from '../../assets/icons/Icon';
import { EmptyState } from '../../components/common/DashboardComponents';

const TABS = [
  { key: 'active', label: 'Actives', icon: 'zap' },
  { key: 'filled', label: 'Pourvues', icon: 'checkCircle' },
  { key: 'past', label: 'Passées', icon: 'clock' },
];

const STATUS_CONFIG = {
  active: { color: theme.colors.warning, label: 'Active', icon: 'zap' },
  filled: { color: theme.colors.success, label: 'Pourvue', icon: 'checkCircle' },
  expired: { color: theme.colors.textLight, label: 'Expirée', icon: 'clock' },
  cancelled: { color: theme.colors.rose, label: 'Annulée', icon: 'x' },
};

export default function MyAlerts() {
  const router = useRouter();
  const { session, user } = useAuth();
  const creatorType = user?.user_type === 'laboratoire' ? 'laboratory' : 'pharmacy';
  const { alerts, loading, stats, refresh } = useCreatorAlerts(session?.user?.id, creatorType);

  const [activeTab, setActiveTab] = useState('active');
  const [refreshing, setRefreshing] = useState(false);

  const filteredAlerts = alerts.filter(a => {
    if (activeTab === 'active') return a.status === 'active';
    if (activeTab === 'filled') return a.status === 'filled';
    return a.status === 'expired' || a.status === 'cancelled';
  });

  const tabCounts = {
    active: alerts.filter(a => a.status === 'active').length,
    filled: alerts.filter(a => a.status === 'filled').length,
    past: alerts.filter(a => a.status === 'expired' || a.status === 'cancelled').length,
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : null;

  const renderAlert = ({ item }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;
    const dateRange = item.start_date
      ? `${formatDate(item.start_date)}${item.end_date ? ` - ${formatDate(item.end_date)}` : ''}`
      : null;

    return (
      <Pressable
        style={styles.alertCard}
        onPress={() => router.push({ pathname: '/(screens)/alertDetail', params: { id: item.id } })}
      >
        <View style={styles.alertHeader}>
          <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
            <Icon name={config.icon} size={12} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
          {item.notified_count > 0 && (
            <Text style={styles.notifiedCount}>{item.notified_count} notifié{item.notified_count > 1 ? 's' : ''}</Text>
          )}
        </View>

        <Text style={styles.alertTitle} numberOfLines={2}>{item.title}</Text>

        <View style={styles.alertMeta}>
          {item.city && (
            <View style={styles.metaItem}>
              <Icon name="mapPin" size={13} color={theme.colors.textLight} />
              <Text style={styles.metaText}>{item.city} ({item.radius_km} km)</Text>
            </View>
          )}
          {dateRange && (
            <View style={styles.metaItem}>
              <Icon name="calendar" size={13} color={theme.colors.textLight} />
              <Text style={styles.metaText}>{dateRange}</Text>
            </View>
          )}
          {item.position_type && (
            <View style={styles.metaItem}>
              <Icon name="user" size={13} color={theme.colors.primary} />
              <Text style={[styles.metaText, { color: theme.colors.primary }]}>
                {item.position_type === 'animateur' ? 'Animateur' :
                 item.position_type === 'preparateur' ? 'Préparateur' :
                 item.position_type === 'conseiller' ? 'Conseiller' : 'Étudiant'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.alertFooter}>
          <Text style={styles.footerDate}>
            Créée le {formatDate(item.created_at)}
          </Text>
          <Icon name="chevronRight" size={16} color={theme.colors.textLight} />
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => {
    const emptyConfig = {
      active: {
        icon: 'zap',
        title: 'Aucune alerte active',
        subtitle: 'Créez une alerte urgente pour trouver rapidement un remplacement',
        action: () => router.push('/(screens)/createUrgentAlert'),
        actionLabel: 'Créer une alerte',
      },
      filled: {
        icon: 'checkCircle',
        title: 'Aucune alerte pourvue',
        subtitle: 'Les alertes pourvues apparaîtront ici',
      },
      past: {
        icon: 'clock',
        title: 'Aucun historique',
        subtitle: 'Vos alertes passées apparaîtront ici',
      },
    };
    return <EmptyState {...emptyConfig[activeTab]} />;
  };

  if (loading && !refreshing) {
    return (
      <ScreenWrapper>
        <View style={commonStyles.header}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Mes alertes</Text>
          <View style={commonStyles.headerSpacer} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Mes alertes</Text>
        <Pressable
          style={commonStyles.headerButton}
          onPress={() => router.push('/(screens)/createUrgentAlert')}
        >
          <Icon name="plus" size={22} color={theme.colors.primary} />
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.warning }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Actives</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>{stats.filled}</Text>
          <Text style={styles.statLabel}>Pourvues</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
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
        data={filteredAlerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlert}
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
  alertCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: hp(1),
  },
  alertHeader: {
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
  notifiedCount: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },
  alertTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  alertMeta: {
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
  alertFooter: {
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
});
