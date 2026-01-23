// Carte mission réutilisable (swipe, listes, favoris)

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';
import { formatDistanceToNow } from '../../helpers/dateUtils';

/**
 * Carte mission pour le swipe
 */
export const MissionSwipeCard = ({ 
  mission, 
  laboratory,
  distance,
  isFavoriteLab = false,
  onLabPress,
}) => {
  const formatDates = () => {
    if (!mission.start_date) return 'Dates flexibles';
    const start = new Date(mission.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const end = mission.end_date 
      ? new Date(mission.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      : null;
    return end ? `${start} → ${end}` : start;
  };

  const formatRate = () => {
    if (mission.daily_rate_max && mission.daily_rate_max !== mission.daily_rate_min) {
      return `${mission.daily_rate_min} - ${mission.daily_rate_max}€/jour`;
    }
    return `${mission.daily_rate_min || mission.daily_rate_max}€/jour`;
  };

  return (
    <View style={styles.swipeCard}>
      {/* Header avec labo */}
      <Pressable style={styles.labHeader} onPress={onLabPress}>
        {laboratory?.logo_url ? (
          <Image source={{ uri: laboratory.logo_url }} style={styles.labLogo} />
        ) : (
          <View style={styles.labLogoPlaceholder}>
            <Icon name="laboratory" size={24} color={theme.colors.primary} />
          </View>
        )}
        <View style={styles.labInfo}>
          <View style={styles.labNameRow}>
            <Text style={styles.labName} numberOfLines={1}>
              {laboratory?.brand_name || laboratory?.company_name || 'Laboratoire'}
            </Text>
            {isFavoriteLab && (
              <Icon name="star-filled" size={14} color={theme.colors.warning} />
            )}
          </View>
          {laboratory?.siret_verified && (
            <View style={styles.verifiedBadge}>
              <Icon name="checkCircle" size={12} color={theme.colors.success} />
              <Text style={styles.verifiedText}>Vérifié</Text>
            </View>
          )}
        </View>
        <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
      </Pressable>

      {/* Contenu mission */}
      <View style={styles.missionContent}>
        <Text style={styles.missionTitle} numberOfLines={2}>{mission.title}</Text>
        
        {mission.description && (
          <Text style={styles.missionDescription} numberOfLines={3}>
            {mission.description}
          </Text>
        )}

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {mission.mission_type && (
            <View style={[styles.tag, styles.tagType]}>
              <Text style={styles.tagText}>{getMissionTypeLabel(mission.mission_type)}</Text>
            </View>
          )}
          {mission.requires_experience && (
            <View style={[styles.tag, styles.tagExperience]}>
              <Text style={styles.tagText}>Expérience requise</Text>
            </View>
          )}
        </View>

        {/* Infos principales */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Icon name="calendar" size={16} color={theme.colors.primary} />
            <Text style={styles.infoText}>{formatDates()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="mapPin" size={16} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              {mission.city || 'Lieu à définir'}
              {distance && ` • ${Math.round(distance)} km`}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="dollarSign" size={16} color={theme.colors.success} />
            <Text style={[styles.infoText, styles.rateText]}>{formatRate()}</Text>
          </View>
        </View>

        {/* Spécialités requises */}
        {mission.required_specialties?.length > 0 && (
          <View style={styles.specialtiesContainer}>
            <Text style={styles.specialtiesLabel}>Spécialités :</Text>
            <Text style={styles.specialtiesText} numberOfLines={1}>
              {mission.required_specialties.join(' • ')}
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.postedDate}>
          Publiée {formatDistanceToNow(mission.created_at)}
        </Text>
        {mission.applications_count > 0 && (
          <Text style={styles.applicationsCount}>
            {mission.applications_count} candidature{mission.applications_count > 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </View>
  );
};

/**
 * Carte mission compacte pour les listes
 */
export const MissionListCard = ({ 
  mission, 
  laboratory,
  onPress,
  showStatus = false,
  isFavoriteLab = false,
}) => {
  const formatDates = () => {
    if (!mission.start_date) return 'Dates flexibles';
    const start = new Date(mission.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return start;
  };

  const getStatusConfig = (status) => {
    const configs = {
      open: { label: 'Ouverte', color: theme.colors.success, bg: theme.colors.success + '15' },
      assigned: { label: 'Assignée', color: theme.colors.warning, bg: theme.colors.warning + '15' },
      in_progress: { label: 'En cours', color: theme.colors.primary, bg: theme.colors.primary + '15' },
      completed: { label: 'Terminée', color: theme.colors.textLight, bg: theme.colors.gray + '30' },
      cancelled: { label: 'Annulée', color: theme.colors.rose, bg: theme.colors.rose + '15' },
    };
    return configs[status] || configs.open;
  };

  const statusConfig = getStatusConfig(mission.status);

  return (
    <Pressable style={styles.listCard} onPress={onPress}>
      {/* Logo labo */}
      {laboratory?.logo_url ? (
        <Image source={{ uri: laboratory.logo_url }} style={styles.listLogo} />
      ) : (
        <View style={styles.listLogoPlaceholder}>
          <Icon name="laboratory" size={20} color={theme.colors.primary} />
        </View>
      )}

      {/* Contenu */}
      <View style={styles.listContent}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle} numberOfLines={1}>{mission.title}</Text>
          {isFavoriteLab && (
            <Icon name="star-filled" size={12} color={theme.colors.warning} />
          )}
        </View>
        
        <Text style={styles.listLabName} numberOfLines={1}>
          {laboratory?.brand_name || laboratory?.company_name}
        </Text>

        <View style={styles.listMeta}>
          <View style={styles.listMetaItem}>
            <Icon name="calendar" size={12} color={theme.colors.textLight} />
            <Text style={styles.listMetaText}>{formatDates()}</Text>
          </View>
          <View style={styles.listMetaItem}>
            <Icon name="mapPin" size={12} color={theme.colors.textLight} />
            <Text style={styles.listMetaText}>{mission.city || 'N/C'}</Text>
          </View>
          <Text style={styles.listRate}>{mission.daily_rate_min}€/j</Text>
        </View>
      </View>

      {/* Status ou chevron */}
      {showStatus ? (
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      ) : (
        <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
      )}
    </Pressable>
  );
};

/**
 * Carte mission pour les favoris (avec bouton supprimer)
 */
export const MissionFavoriteCard = ({ 
  mission, 
  laboratory,
  onPress,
  onRemove,
  isFavoriteLab = false,
}) => {
  return (
    <View style={styles.favoriteCard}>
      <MissionListCard 
        mission={mission} 
        laboratory={laboratory} 
        onPress={onPress}
        isFavoriteLab={isFavoriteLab}
      />
      <Pressable style={styles.removeButton} onPress={onRemove}>
        <Icon name="bookmark-filled" size={20} color={theme.colors.secondary} />
      </Pressable>
    </View>
  );
};

// Helper pour les labels de type de mission
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

const styles = StyleSheet.create({
  // ==========================================
  // SWIPE CARD
  // ==========================================
  swipeCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  labHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  labLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  labLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labInfo: {
    flex: 1,
    marginLeft: wp(3),
  },
  labNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  labName: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginTop: hp(0.3),
  },
  verifiedText: {
    fontSize: hp(1.2),
    color: theme.colors.success,
  },
  missionContent: {
    padding: hp(2),
  },
  missionTitle: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: hp(1),
  },
  missionDescription: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    lineHeight: hp(2.2),
    marginBottom: hp(1.5),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginBottom: hp(1.5),
  },
  tag: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.md,
  },
  tagType: {
    backgroundColor: theme.colors.primary + '15',
  },
  tagExperience: {
    backgroundColor: theme.colors.warning + '15',
  },
  tagText: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  infoGrid: {
    gap: hp(1),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  infoText: {
    fontSize: hp(1.5),
    color: theme.colors.text,
  },
  rateText: {
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.success,
  },
  specialtiesContainer: {
    marginTop: hp(1.5),
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  specialtiesLabel: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginBottom: hp(0.5),
  },
  specialtiesText: {
    fontSize: hp(1.4),
    color: theme.colors.text,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: hp(2),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  postedDate: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  applicationsCount: {
    fontSize: hp(1.3),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },

  // ==========================================
  // LIST CARD
  // ==========================================
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  listLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flex: 1,
    marginLeft: wp(3),
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  listTitle: {
    flex: 1,
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  listLabName: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: hp(0.2),
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.8),
    gap: wp(3),
  },
  listMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  listMetaText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  listRate: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.success,
  },
  statusBadge: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.4),
    borderRadius: theme.radius.md,
  },
  statusText: {
    fontSize: hp(1.2),
    fontFamily: theme.fonts.medium,
  },

  // ==========================================
  // FAVORITE CARD
  // ==========================================
  favoriteCard: {
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: hp(1.5),
    right: hp(1.5),
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});

export default {
  MissionSwipeCard,
  MissionListCard,
  MissionFavoriteCard,
};