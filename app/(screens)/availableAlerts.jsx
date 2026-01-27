// Alertes urgentes disponibles — pour candidats et animateurs
import { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useCandidateAlerts } from '../../hooks/useUrgentAlerts';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import { EmptyState } from '../../components/common/DashboardComponents';

export default function AvailableAlerts() {
  const router = useRouter();
  const { session, user } = useAuth();
  const { alerts, loading, count, refresh, respondToAlert } = useCandidateAlerts(session?.user?.id, user?.user_type);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : null;

  const renderAlert = ({ item }) => {
    const dateRange = item.start_date
      ? `${formatDate(item.start_date)}${item.end_date ? ` - ${formatDate(item.end_date)}` : ''}`
      : null;

    const rate = item.hourly_rate ? `${item.hourly_rate}€/h` : null;
    const labName = item.creator_profile?.brand_name || item.creator_profile?.company_name;

    return (
      <Pressable
        style={styles.alertCard}
        onPress={() => router.push({
          pathname: '/(screens)/alertDetailCandidate',
          params: { id: item.id },
        })}
      >
        {/* Urgent banner */}
        <View style={styles.urgentBanner}>
          <Icon name="zap" size={14} color={theme.colors.warning} />
          <Text style={styles.urgentText}>Urgent</Text>
          {item.distance_km !== undefined && (
            <Text style={styles.distanceText}>à {item.distance_km} km</Text>
          )}
        </View>

        <Text style={styles.alertTitle} numberOfLines={2}>{item.title}</Text>

        {item.description && (
          <Text style={styles.alertDescription} numberOfLines={2}>{item.description}</Text>
        )}

        <View style={styles.alertMeta}>
          {item.city && (
            <View style={styles.metaItem}>
              <Icon name="mapPin" size={13} color={theme.colors.textLight} />
              <Text style={styles.metaText}>{item.city}</Text>
            </View>
          )}
          {dateRange && (
            <View style={styles.metaItem}>
              <Icon name="calendar" size={13} color={theme.colors.textLight} />
              <Text style={styles.metaText}>{dateRange}</Text>
            </View>
          )}
          {rate && (
            <View style={styles.metaItem}>
              <Icon name="dollarSign" size={13} color={theme.colors.primary} />
              <Text style={[styles.metaText, { color: theme.colors.primary, fontFamily: theme.fonts.semiBold }]}>{rate}</Text>
            </View>
          )}
        </View>

        {labName && (
          <View style={styles.creatorRow}>
            <Icon name="building" size={13} color={theme.colors.textLight} />
            <Text style={styles.creatorName}>{labName}</Text>
          </View>
        )}

        <View style={styles.alertFooter}>
          {item.hasResponded ? (
            <View style={styles.respondedBadge}>
              <Icon name="check" size={14} color={theme.colors.success} />
              <Text style={styles.respondedText}>Candidature envoyée</Text>
            </View>
          ) : (
            <View style={styles.ctaBadge}>
              <Text style={styles.ctaText}>Voir les détails</Text>
              <Icon name="arrowRight" size={14} color={theme.colors.primary} />
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      icon="zap"
      title="Aucune alerte à proximité"
      subtitle="Les alertes urgentes des pharmacies et labos proches de vous apparaîtront ici"
    />
  );

  if (loading && !refreshing) {
    return (
      <ScreenWrapper>
        <View style={commonStyles.header}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Alertes urgentes</Text>
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
        <Text style={commonStyles.headerTitle}>Alertes urgentes</Text>
        {count > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{count}</Text>
          </View>
        )}
        {count === 0 && <View style={commonStyles.headerSpacer} />}
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Icon name="zap" size={16} color={theme.colors.warning} />
        <Text style={styles.infoBannerText}>
          Alertes urgentes à proximité de votre localisation
        </Text>
      </View>

      <FlatList
        data={alerts}
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
  headerBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    fontSize: hp(1.2),
    fontFamily: theme.fonts.bold,
    color: '#fff',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginHorizontal: wp(5),
    marginBottom: hp(1),
    padding: hp(1.2),
    backgroundColor: theme.colors.warning + '10',
    borderRadius: theme.radius.lg,
  },
  infoBannerText: {
    flex: 1,
    fontSize: hp(1.3),
    color: theme.colors.warning,
    fontFamily: theme.fonts.medium,
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
    borderColor: theme.colors.warning + '30',
    gap: hp(0.8),
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  urgentText: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.warning,
    flex: 1,
  },
  distanceText: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.medium,
  },
  alertTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  alertDescription: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    lineHeight: hp(2),
  },
  alertMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(3),
    marginTop: hp(0.3),
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
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    marginTop: hp(0.3),
  },
  creatorName: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.medium,
  },
  alertFooter: {
    marginTop: hp(0.5),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  respondedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  respondedText: {
    fontSize: hp(1.3),
    color: theme.colors.success,
    fontFamily: theme.fonts.medium,
  },
  ctaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: wp(1),
  },
  ctaText: {
    fontSize: hp(1.3),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
});
