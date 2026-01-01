import { StyleSheet, Text, View, Pressable } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { 
  getContractTypeLabel, 
  getContractColor, 
  getPositionTypeLabel,
  getInternshipTypeLabel,
  getInternshipColor,
  getDurationLabel,
} from '../../constants/jobOptions';
import Icon from '../../assets/icons/Icon';

/**
 * Item d'annonce pour la liste
 * Supporte les offres d'emploi ET les stages/alternances
 */
const JobListItem = ({ job, onPress, showDistance = true, isInternship = false }) => {
  // Pour les stages, utiliser job.type (stage/alternance), sinon job.contract_type
  const typeValue = isInternship ? job.type : job.contract_type;
  const typeLabel = isInternship 
    ? getInternshipTypeLabel(typeValue) 
    : getContractTypeLabel(typeValue);
  const typeColor = isInternship 
    ? getInternshipColor(typeValue) 
    : getContractColor(typeValue);

  return (
    <Pressable style={styles.container} onPress={() => onPress?.(job)}>
      <View style={styles.header}>
        <View style={[styles.contractBadge, { backgroundColor: typeColor + '15' }]}>
          <Text style={[styles.contractText, { color: typeColor }]}>
            {typeLabel || 'Non spécifié'}
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
      
      {/* Sous-titre différent selon le type */}
      {isInternship ? (
        <Text style={styles.position}>
          {job.duration_months ? getDurationLabel(job.duration_months) : 'Durée non précisée'}
        </Text>
      ) : (
        <Text style={styles.position}>{getPositionTypeLabel(job.position_type)}</Text>
      )}

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
        {!isInternship && job.salary_range && (
          <View style={styles.extraItem}>
            <Icon name="briefcase" size={12} color={theme.colors.textLight} />
            <Text style={styles.extraText}>{job.salary_range}</Text>
          </View>
        )}
        {isInternship && job.required_level && (
          <View style={styles.extraItem}>
            <Icon name="book" size={12} color={theme.colors.textLight} />
            <Text style={styles.extraText}>{job.required_level}</Text>
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
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    borderRadius: theme.radius.sm,
  },
  contractText: {
    fontSize: hp(1.3),
    fontWeight: '600',
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
    fontSize: hp(1.2),
    fontWeight: '600',
    color: theme.colors.success,
  },
  title: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(0.3),
  },
  position: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginBottom: hp(1),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    flex: 1,
  },
  location: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    flex: 1,
  },
  distanceBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  distanceText: {
    fontSize: hp(1.2),
    fontWeight: '500',
    color: theme.colors.primary,
  },
  extras: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(3),
    marginTop: hp(1),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  extraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  extraText: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },
});

export default JobListItem;