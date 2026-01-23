// Affiche les stats sur le profil (favoris, matchs, missions, note)

import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { useFavoriteCount, FAVORITE_TYPES } from '../../hooks/useFavorites';
import Icon from '../../assets/icons/Icon';

/**
 * Stats pour un profil CANDIDAT
 * Affiche : Favoris • Matchs
 */
export const CandidateStats = ({ userId, matchCount = 0 }) => {
  const { count: favCount, loading } = useFavoriteCount(FAVORITE_TYPES.CANDIDATE, userId);

  return (
    <View style={styles.container}>
      <StatItem
        icon="heart"
        value={loading ? '-' : favCount}
        label={favCount === 1 ? 'recruteur vous a remarqué' : 'recruteurs vous ont remarqué'}
      />
      <StatDivider />
      <StatItem
        icon="users"
        value={matchCount}
        label={matchCount === 1 ? 'match' : 'matchs'}
      />
    </View>
  );
};

/**
 * Stats pour un profil ANIMATEUR
 * Affiche : Favoris • Missions • Note
 */
export const AnimatorStats = ({ userId, missionsCount = 0, averageRating = null }) => {
  const { count: favCount, loading } = useFavoriteCount(FAVORITE_TYPES.ANIMATOR, userId);

  return (
    <View style={styles.container}>
      <StatItem
        icon="heart"
        value={loading ? '-' : favCount}
        label={favCount === 1 ? 'labo vous suit' : 'labos vous suivent'}
      />
      <StatDivider />
      <StatItem
        icon="briefcase"
        value={missionsCount}
        label={missionsCount === 1 ? 'mission' : 'missions'}
      />
      {averageRating !== null && (
        <>
          <StatDivider />
          <StatItem
            icon="star"
            value={averageRating.toFixed(1)}
            label="/ 5"
            highlight
          />
        </>
      )}
    </View>
  );
};

/**
 * Stats pour un profil LABORATOIRE (vu par les animateurs)
 * Affiche : Missions publiées • Note moyenne
 */
export const LaboratoryStats = ({ missionsCount = 0, averageRating = null }) => {
  return (
    <View style={styles.container}>
      <StatItem
        icon="briefcase"
        value={missionsCount}
        label={missionsCount === 1 ? 'mission publiée' : 'missions publiées'}
      />
      {averageRating !== null && (
        <>
          <StatDivider />
          <StatItem
            icon="star"
            value={averageRating.toFixed(1)}
            label="/ 5"
            highlight
          />
        </>
      )}
    </View>
  );
};

/**
 * Composant stat individuel
 */
const StatItem = ({ icon, value, label, highlight = false }) => (
  <View style={styles.statItem}>
    <View style={styles.statValueRow}>
      <Icon 
        name={icon} 
        size={16} 
        color={highlight ? theme.colors.primary : theme.colors.textLight} 
      />
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>
        {value}
      </Text>
    </View>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/**
 * Séparateur entre stats
 */
const StatDivider = () => <View style={styles.divider} />;

/**
 * Version compacte pour affichage inline
 */
export const CompactStats = ({ items }) => (
  <View style={styles.compactContainer}>
    {items.map((item, index) => (
      <View key={index} style={styles.compactItem}>
        {index > 0 && <Text style={styles.compactDot}>•</Text>}
        <Icon name={item.icon} size={12} color={theme.colors.textLight} />
        <Text style={styles.compactText}>{item.value} {item.label}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(2),
    gap: wp(4),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  statValue: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  statValueHighlight: {
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginTop: hp(0.3),
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: hp(4),
    backgroundColor: theme.colors.border,
  },
  // Compact
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  compactDot: {
    color: theme.colors.textLight,
    marginHorizontal: wp(1),
  },
  compactText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
});

export default {
  CandidateStats,
  AnimatorStats,
  LaboratoryStats,
  CompactStats,
};