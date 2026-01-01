import { StyleSheet, Text, View, Pressable } from 'react-native';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { getContractTypeLabel, getContractColor, getPositionTypeLabel } from '../../constants/jobOptions';
import Icon from '../../assets/icons/Icon';

/**
 * Item d'annonce pour la liste (vue alternative à la carte)
 */
const JobListItem = ({ job, onPress, showDistance = true }) => {
  const contractColor = getContractColor(job.contract_type);

  return (
    <Pressable style={styles.container} onPress={() => onPress?.(job)}>
      <View style={styles.header}>
        <View style={[styles.contractBadge, { backgroundColor: contractColor + '15' }]}>
          <Text style={[styles.contractText, { color: contractColor }]}>
            {getContractTypeLabel(job.contract_type)}
          </Text>
        </View>
        {job.match_score && (
          <View style={styles.matchBadge}>
            <Icon name="heart" size={12} color={theme.colors.success} />
            <Text style={styles.matchText}>{job.match_score}%</Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
      <Text style={styles.position}>{getPositionTypeLabel(job.position_type)}</Text>

      <View style={styles.footer}>
        <View style={styles.locationRow}>
          <Icon name="mapPin" size={14} color={theme.colors.textLight} />
          <Text style={styles.location} numberOfLines={1}>
            {job.city}{job.department ? `, ${job.department}` : ''}
          </Text>
        </View>
        
        {showDistance && job.distance !== null && job.distance !== undefined && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{job.distance} km</Text>
          </View>
        )}
      </View>

      {/* Infos supplémentaires */}
      <View style={styles.extras}>
        {job.salary_range && (
          <View style={styles.extraItem}>
            <Icon name="briefcase" size={12} color={theme.colors.textLight} />
            <Text style={styles.extraText}>{job.salary_range}</Text>
          </View>
        )}
        {job.created_at && (
          <View style={styles.extraItem}>
            <Icon name="clock" size={12} color={theme.colors.textLight} />
            <Text style={styles.extraText}>{formatDate(job.created_at)}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export default JobListItem;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: hp(1.5),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  contractBadge: {
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.4),
    borderRadius: theme.radius.md,
  },
  contractText: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.semiBold,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    backgroundColor: theme.colors.success + '15',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  matchText: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.bold,
    color: theme.colors.success,
  },
  title: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(0.3),
  },
  position: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginBottom: hp(1.2),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  location: {
    flex: 1,
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  distanceBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  distanceText: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary,
  },
  extras: {
    flexDirection: 'row',
    gap: wp(4),
    marginTop: hp(1.2),
    paddingTop: hp(1.2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  extraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  extraText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
});