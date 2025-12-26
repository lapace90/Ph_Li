import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const StatsCard = ({ stats, isSearchActive }) => {
  return (
    <View style={styles.container}>
      <StatItem 
        icon="heart" 
        value={stats.matches} 
        label="Matchs" 
        color={theme.colors.rose}
      />
      <View style={styles.divider} />
      <StatItem 
        icon="send" 
        value={stats.applications} 
        label="Candidatures" 
        color={theme.colors.primary}
      />
      <View style={styles.divider} />
      <StatItem 
        icon="eye" 
        value={isSearchActive ? stats.profileViews : '-'} 
        label="Vues profil" 
        color={theme.colors.secondary}
        disabled={!isSearchActive}
      />
    </View>
  );
};

const StatItem = ({ icon, value, label, color, disabled = false }) => (
  <View style={[styles.statItem, disabled && styles.statItemDisabled]}>
    <View style={styles.valueRow}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Icon name={icon} size={16} color={disabled ? theme.colors.gray : color} />
      </View>
      <Text style={[styles.statValue, disabled && styles.statValueDisabled]}>
        {value}
      </Text>
    </View>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default StatsCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: hp(0.5),
  },
  statItemDisabled: {
    opacity: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: hp(2.4),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  statValueDisabled: {
    color: theme.colors.textLight,
  },
  statLabel: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginVertical: hp(0.5),
  },
});