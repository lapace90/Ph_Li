// components/common/DashboardComponents.jsx
// Composants réutilisables pour les dashboards

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

/**
 * Carte de statistiques
 */
export const StatsCard = ({ 
  icon, 
  value, 
  label, 
  color = theme.colors.primary,
  onPress,
  trend,
}) => {
  const Container = onPress ? Pressable : View;
  
  return (
    <Container 
      style={styles.statsCard}
      onPress={onPress}
    >
      <View style={[styles.statsIconContainer, { backgroundColor: color + '15' }]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsLabel}>{label}</Text>
      {trend !== undefined && (
        <View style={[styles.trendBadge, trend >= 0 ? styles.trendUp : styles.trendDown]}>
          <Icon 
            name={trend >= 0 ? 'trending-up' : 'trending-down'} 
            size={12} 
            color={trend >= 0 ? theme.colors.success : theme.colors.rose} 
          />
          <Text style={[styles.trendText, trend >= 0 ? styles.trendTextUp : styles.trendTextDown]}>
            {trend >= 0 ? '+' : ''}{trend}%
          </Text>
        </View>
      )}
    </Container>
  );
};

/**
 * Grande carte de statistique (pour mise en avant)
 */
export const StatsBigCard = ({ 
  icon, 
  value, 
  label, 
  subtitle,
  color = theme.colors.primary,
  onPress,
}) => {
  const Container = onPress ? Pressable : View;
  
  return (
    <Container 
      style={[styles.statsBigCard, { borderLeftColor: color }]}
      onPress={onPress}
    >
      <View style={styles.statsBigHeader}>
        <View style={[styles.statsBigIcon, { backgroundColor: color + '15' }]}>
          <Icon name={icon} size={24} color={color} />
        </View>
        <View style={styles.statsBigContent}>
          <Text style={styles.statsBigValue}>{value}</Text>
          <Text style={styles.statsBigLabel}>{label}</Text>
        </View>
      </View>
      {subtitle && (
        <Text style={styles.statsBigSubtitle}>{subtitle}</Text>
      )}
    </Container>
  );
};

/**
 * Grille de stats (2 colonnes)
 */
export const StatsGrid = ({ children }) => (
  <View style={styles.statsGrid}>
    {children}
  </View>
);

/**
 * État vide générique
 */
export const EmptyState = ({ 
  icon = 'inbox', 
  title, 
  subtitle,
  action,
  actionLabel,
}) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconContainer}>
      <Icon name={icon} size={48} color={theme.colors.gray} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    {action && actionLabel && (
      <Pressable style={styles.emptyAction} onPress={action}>
        <Text style={styles.emptyActionText}>{actionLabel}</Text>
        <Icon name="arrowRight" size={16} color={theme.colors.primary} />
      </Pressable>
    )}
  </View>
);

/**
 * Section avec titre et action
 */
export const DashboardSection = ({ 
  title, 
  subtitle,
  actionLabel, 
  onAction, 
  children,
  noPadding = false,
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {actionLabel && onAction && (
        <Pressable style={styles.sectionAction} onPress={onAction}>
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
          <Icon name="chevronRight" size={16} color={theme.colors.primary} />
        </Pressable>
      )}
    </View>
    <View style={[styles.sectionContent, noPadding && { paddingHorizontal: 0 }]}>
      {children}
    </View>
  </View>
);

/**
 * Carte d'action rapide
 */
export const QuickActionCard = ({ 
  icon, 
  title, 
  subtitle,
  color = theme.colors.primary,
  onPress,
  disabled = false,
}) => (
  <Pressable 
    style={[styles.quickAction, disabled && styles.quickActionDisabled]}
    onPress={onPress}
    disabled={disabled}
  >
    <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
      <Icon name={icon} size={24} color={disabled ? theme.colors.gray : color} />
    </View>
    <View style={styles.quickActionContent}>
      <Text style={[styles.quickActionTitle, disabled && styles.textDisabled]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      )}
    </View>
    <Icon name="chevronRight" size={20} color={disabled ? theme.colors.gray : theme.colors.textLight} />
  </Pressable>
);

/**
 * Bannière de limite atteinte
 */
export const LimitBanner = ({ 
  title, 
  subtitle,
  actionLabel,
  onAction,
  variant = 'warning', // 'warning' | 'error' | 'info'
}) => {
  const colors = {
    warning: { bg: theme.colors.warning + '15', text: theme.colors.warning, icon: 'alertCircle' },
    error: { bg: theme.colors.rose + '15', text: theme.colors.rose, icon: 'alertCircle' },
    info: { bg: theme.colors.primary + '15', text: theme.colors.primary, icon: 'info' },
  };
  
  const config = colors[variant];

  return (
    <View style={[styles.limitBanner, { backgroundColor: config.bg }]}>
      <Icon name={config.icon} size={20} color={config.text} />
      <View style={styles.limitContent}>
        <Text style={[styles.limitTitle, { color: config.text }]}>{title}</Text>
        {subtitle && <Text style={styles.limitSubtitle}>{subtitle}</Text>}
      </View>
      {actionLabel && onAction && (
        <Pressable style={styles.limitAction} onPress={onAction}>
          <Text style={[styles.limitActionText, { color: config.text }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
};

/**
 * Badge de notification
 */
export const NotificationBadge = ({ count }) => {
  if (!count || count <= 0) return null;
  
  return (
    <View style={styles.notificationBadge}>
      <Text style={styles.notificationText}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
};

/**
 * Loader de section
 */
export const SectionLoader = () => (
  <View style={styles.sectionLoader}>
    <View style={styles.loaderDot} />
    <View style={[styles.loaderDot, styles.loaderDotDelay1]} />
    <View style={[styles.loaderDot, styles.loaderDotDelay2]} />
  </View>
);

const styles = StyleSheet.create({
  // ==========================================
  // STATS CARD
  // ==========================================
  statsCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  statsValue: {
    fontSize: hp(2.4),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  statsLabel: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: hp(0.3),
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginTop: hp(0.5),
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.2),
    borderRadius: theme.radius.sm,
  },
  trendUp: {
    backgroundColor: theme.colors.success + '15',
  },
  trendDown: {
    backgroundColor: theme.colors.rose + '15',
  },
  trendText: {
    fontSize: hp(1.1),
    fontFamily: theme.fonts.medium,
  },
  trendTextUp: {
    color: theme.colors.success,
  },
  trendTextDown: {
    color: theme.colors.rose,
  },

  // ==========================================
  // STATS BIG CARD
  // ==========================================
  statsBigCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
  },
  statsBigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsBigIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBigContent: {
    marginLeft: wp(3),
  },
  statsBigValue: {
    fontSize: hp(2.8),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  statsBigLabel: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  statsBigSubtitle: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginTop: hp(1),
  },

  // ==========================================
  // STATS GRID
  // ==========================================
  statsGrid: {
    flexDirection: 'row',
    gap: wp(3),
  },

  // ==========================================
  // EMPTY STATE
  // ==========================================
  emptyState: {
    alignItems: 'center',
    paddingVertical: hp(6),
    paddingHorizontal: wp(5),
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.gray + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  emptyTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: hp(0.5),
    maxWidth: '80%',
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginTop: hp(2),
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.radius.lg,
  },
  emptyActionText: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary,
  },

  // ==========================================
  // SECTION
  // ==========================================
  section: {
    marginBottom: hp(2.5),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.5),
    paddingHorizontal: wp(5),
  },
  sectionTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  sectionSubtitle: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginTop: hp(0.2),
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionActionText: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  sectionContent: {
    paddingHorizontal: wp(5),
  },

  // ==========================================
  // QUICK ACTION
  // ==========================================
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickActionDisabled: {
    opacity: 0.6,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionContent: {
    flex: 1,
    marginLeft: wp(3),
  },
  quickActionTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  quickActionSubtitle: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginTop: hp(0.2),
  },
  textDisabled: {
    color: theme.colors.gray,
  },

  // ==========================================
  // LIMIT BANNER
  // ==========================================
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    gap: wp(3),
  },
  limitContent: {
    flex: 1,
  },
  limitTitle: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
  },
  limitSubtitle: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    marginTop: hp(0.2),
  },
  limitAction: {
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(3),
  },
  limitActionText: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.semiBold,
  },

  // ==========================================
  // NOTIFICATION BADGE
  // ==========================================
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.rose,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationText: {
    fontSize: 10,
    fontFamily: theme.fonts.bold,
    color: '#fff',
  },

  // ==========================================
  // SECTION LOADER
  // ==========================================
  sectionLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(4),
    gap: wp(2),
  },
  loaderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    opacity: 0.3,
  },
  loaderDotDelay1: {
    opacity: 0.6,
  },
  loaderDotDelay2: {
    opacity: 1,
  },
});

export default {
  StatsCard,
  StatsBigCard,
  StatsGrid,
  EmptyState,
  DashboardSection,
  QuickActionCard,
  LimitBanner,
  NotificationBadge,
  SectionLoader,
};