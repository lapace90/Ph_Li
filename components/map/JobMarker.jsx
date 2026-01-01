import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { getContractTypeLabel, getContractColor } from '../../constants/jobOptions';
import Icon from '../../assets/icons/Icon';

/**
 * Marker personnalisé pour une annonce d'emploi
 */
const JobMarker = ({ job, onPress, selected }) => {
  const contractColor = getContractColor(job.contract_type);
  
  return (
    <Marker
      coordinate={{
        latitude: job.latitude,
        longitude: job.longitude,
      }}
      onPress={() => onPress?.(job)}
      tracksViewChanges={false}
    >
      {/* Custom Marker */}
      <View style={[styles.markerContainer, selected && styles.markerSelected]}>
        <View style={[styles.marker, { backgroundColor: contractColor }]}>
          <Icon name="briefcase" size={14} color="white" />
        </View>
        <View style={[styles.markerTail, { borderTopColor: contractColor }]} />
      </View>

      {/* Callout (info bubble) */}
      <Callout tooltip onPress={() => onPress?.(job)}>
        <View style={styles.callout}>
          <View style={styles.calloutHeader}>
            <View style={[styles.contractBadge, { backgroundColor: contractColor + '20' }]}>
              <Text style={[styles.contractText, { color: contractColor }]}>
                {getContractTypeLabel(job.contract_type)}
              </Text>
            </View>
            {job.match_score && (
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{job.match_score}%</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.calloutTitle} numberOfLines={2}>
            {job.title}
          </Text>
          
          <View style={styles.calloutLocation}>
            <Icon name="mapPin" size={12} color={theme.colors.textLight} />
            <Text style={styles.calloutCity}>{job.city}</Text>
            {job.distance && (
              <Text style={styles.calloutDistance}>• {job.distance} km</Text>
            )}
          </View>

          {job.salary_range && (
            <Text style={styles.calloutSalary}>{job.salary_range}</Text>
          )}

          <View style={styles.calloutAction}>
            <Text style={styles.calloutActionText}>Voir l'annonce</Text>
            <Icon name="chevronRight" size={14} color={theme.colors.primary} />
          </View>
        </View>
      </Callout>
    </Marker>
  );
};

export default JobMarker;

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  markerSelected: {
    transform: [{ scale: 1.2 }],
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: theme.colors.primary,
    marginTop: -2,
  },
  callout: {
    width: wp(70),
    maxWidth: 280,
    backgroundColor: 'white',
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  calloutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.8),
  },
  contractBadge: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  contractText: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.medium,
  },
  scoreBadge: {
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  scoreText: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.bold,
    color: theme.colors.success,
  },
  calloutTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  calloutLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginBottom: hp(0.5),
  },
  calloutCity: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  calloutDistance: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  calloutSalary: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary,
    marginBottom: hp(0.8),
  },
  calloutAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: wp(1),
    paddingTop: hp(0.8),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  calloutActionText: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary,
  },
});