/**
 * Vue du profil d'un animateur (pour les labos)
 * Accessible après un match ou depuis les favoris
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { animatorService } from '../../services/animatorService';
import { useFavorites } from '../../hooks/useFavorites';
import { FAVORITE_TYPES } from '../../services/favoritesService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import { ANIMATION_SPECIALTIES } from '../../constants/profileOptions';

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
];

// Helper local
const getSpecialtyLabel = (value) => {
  const spec = ANIMATION_SPECIALTIES.find(s => s.value === value);
  return spec?.label || value;
};

export default function ViewAnimatorProfile() {
  const router = useRouter();
  const { animatorId, matchId } = useLocalSearchParams();
  const { session } = useAuth();

  const [animator, setAnimator] = useState(null);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { isFavorite, toggleFavorite } = useFavorites(
    session?.user?.id, 
    FAVORITE_TYPES.ANIMATOR
  );

  // ============================================
  // CHARGEMENT
  // ============================================

  const loadAnimator = useCallback(async () => {
    if (!animatorId) return;
    
    setLoading(true);
    try {
      const data = await animatorService.getProfile(animatorId);
      setAnimator(data);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  }, [animatorId]);

  const loadAvailability = useCallback(async () => {
    if (!animatorId) return;

    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 2, 0).toISOString().split('T')[0];

      const data = await animatorService.getAvailability(
        animatorId, 
        startDate, 
        endDate
      );
      
      const availMap = {};
      data.forEach(item => {
        availMap[item.date] = item.status;
      });
      setAvailability(availMap);
    } catch (error) {
      console.error('Erreur chargement disponibilités:', error);
    }
  }, [animatorId, currentMonth]);

  useEffect(() => {
    loadAnimator();
  }, [loadAnimator]);

  useEffect(() => {
    if (animator) loadAvailability();
  }, [animator, loadAvailability]);

  // ============================================
  // CALENDRIER
  // ============================================

  const getDaysInMonth = (monthOffset = 0) => {
    const date = new Date(currentMonth);
    date.setMonth(date.getMonth() + monthOffset);
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        date: dateStr,
        status: availability[dateStr] || null,
        isPast: new Date(dateStr) < new Date(new Date().toDateString()),
      });
    }

    return { days, month, year };
  };

  // ============================================
  // ACTIONS
  // ============================================

  const handleContact = () => {
    if (matchId) {
      router.push({ pathname: '/animatorConversation', params: { matchId } });
    } else {
      router.push('/createMission');
    }
  };

  // ============================================
  // RENDER - LOADING / ERROR
  // ============================================

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={commonStyles.header}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Profil animateur</Text>
          <View style={commonStyles.headerSpacer} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!animator) {
    return (
      <ScreenWrapper>
        <View style={commonStyles.header}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Profil animateur</Text>
          <View style={commonStyles.headerSpacer} />
        </View>
        <View style={commonStyles.emptyContainer}>
          <Icon name="userX" size={48} color={theme.colors.gray} />
          <Text style={commonStyles.emptyTitle}>Profil introuvable</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // ============================================
  // RENDER - CONTENT
  // ============================================

  const profile = animator.profile || {};
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Profil animateur</Text>
        <Pressable 
          style={commonStyles.headerButton} 
          onPress={() => toggleFavorite(animatorId)}
        >
          <Icon 
            name="star" 
            size={22} 
            color={isFavorite(animatorId) ? theme.colors.warning : theme.colors.textLight} 
          />
        </Pressable>
      </View>

      <ScrollView 
        style={commonStyles.flex1} 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header profil */}
        <View style={styles.profileHeader}>
          {profile.photo_url ? (
            <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="user" size={50} color={theme.colors.primary} />
            </View>
          )}

          <Text style={styles.name}>{fullName}</Text>

          {animator.available_now && (
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>🟢 Disponible maintenant</Text>
            </View>
          )}

          {animator.average_rating > 0 && (
            <View style={styles.ratingRow}>
              <Icon name="star" size={20} color={theme.colors.warning} />
              <Text style={styles.rating}>
                {animator.average_rating.toFixed(1)}
              </Text>
              <Text style={commonStyles.hint}>
                ({animator.missions_completed || 0} missions)
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatItem 
            icon="briefcase" 
            value={animator.missions_completed || 0} 
            label="Missions" 
          />
          <StatItem 
            icon="star" 
            value={animator.average_rating?.toFixed(1) || '-'} 
            label="Note" 
          />
          <StatItem 
            icon="calendar" 
            value={animator.experience_years || profile.experience_years || '-'} 
            label="Ans exp." 
          />
        </View>

        {/* Tarif */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Tarif journalier</Text>
          <View style={commonStyles.card}>
            <View style={commonStyles.rowBetween}>
              <Text style={styles.rateLabel}>Fourchette</Text>
              <Text style={styles.rateValue}>
                {animator.daily_rate_min && animator.daily_rate_max
                  ? `${animator.daily_rate_min}€ - ${animator.daily_rate_max}€ / jour`
                  : animator.daily_rate_min
                    ? `À partir de ${animator.daily_rate_min}€ / jour`
                    : 'Non renseigné'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Spécialités */}
        {animator.animation_specialties?.length > 0 && (
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Spécialités</Text>
            <View style={styles.chipsContainer}>
              {animator.animation_specialties.map((spec, i) => (
                <View key={i} style={[commonStyles.chip, commonStyles.chipActive]}>
                  <Text style={[commonStyles.chipText, commonStyles.chipTextActive]}>
                    {getSpecialtyLabel(spec)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Marques */}
        {animator.brands_experience?.length > 0 && (
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Expérience marques</Text>
            <View style={styles.chipsContainer}>
              {animator.brands_experience.map((brand, i) => (
                <View key={i} style={commonStyles.chip}>
                  <Text style={commonStyles.chipText}>{brand}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mobilité */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Mobilité</Text>
          <View style={commonStyles.card}>
            {animator.mobility_zones?.length > 0 ? (
              <View style={styles.chipsContainer}>
                {animator.mobility_zones.map((zone, i) => (
                  <View key={i} style={commonStyles.chipSmall}>
                    <Text style={commonStyles.chipTextSmall}>{zone}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={commonStyles.hint}>Non renseigné</Text>
            )}
            
            {animator.has_vehicle && (
              <View style={styles.vehicleRow}>
                <Icon name="car" size={16} color={theme.colors.success} />
                <Text style={styles.vehicleText}>Véhicule personnel</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bio */}
        {profile.bio && (
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Présentation</Text>
            <View style={commonStyles.card}>
              <Text style={styles.bio}>{profile.bio}</Text>
            </View>
          </View>
        )}

        {/* Calendrier */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Disponibilités</Text>
          
          {/* Légende */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotAvailable]} />
              <Text style={commonStyles.hint}>Disponible</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotUnavailable]} />
              <Text style={commonStyles.hint}>Indisponible</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotBooked]} />
              <Text style={commonStyles.hint}>Réservé</Text>
            </View>
          </View>

          {/* Mini calendriers (2 mois) */}
          {[0, 1].map(offset => {
            const { days, month, year } = getDaysInMonth(offset);
            return (
              <View key={offset} style={styles.miniCalendar}>
                <Text style={styles.miniCalendarTitle}>
                  {MONTHS[month]} {year}
                </Text>
                <View style={styles.miniWeekDays}>
                  {DAYS.map((d, i) => (
                    <Text key={i} style={styles.miniWeekDay}>{d}</Text>
                  ))}
                </View>
                <View style={styles.miniGrid}>
                  {days.map((item, i) => (
                    <View key={i} style={styles.miniDay}>
                      {item && (
                        <>
                          <Text style={[
                            styles.miniDayNumber, 
                            item.isPast && styles.miniDayNumberPast
                          ]}>
                            {item.day}
                          </Text>
                          {item.status && (
                            <View style={[
                              styles.miniDayDot,
                              item.status === 'available' && styles.miniDayDotAvailable,
                              item.status === 'unavailable' && styles.miniDayDotUnavailable,
                              item.status === 'booked' && styles.miniDayDotBooked,
                            ]} />
                          )}
                        </>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: hp(12) }} />
      </ScrollView>

      {/* Footer */}
      <View style={commonStyles.footer}>
        <Pressable style={commonStyles.buttonPrimary} onPress={handleContact}>
          <Icon name="messageCircle" size={20} color="#fff" />
          <Text style={commonStyles.buttonPrimaryText}>
            {matchId ? 'Envoyer un message' : 'Proposer une mission'}
          </Text>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}

// ============================================
// SOUS-COMPOSANTS
// ============================================

const StatItem = ({ icon, value, label }) => (
  <View style={styles.statItem}>
    <Icon name={icon} size={22} color={theme.colors.primary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={commonStyles.hint}>{label}</Text>
  </View>
);

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  content: {
    padding: wp(5),
  },
  
  // Header
  profileHeader: {
    alignItems: 'center',
    paddingBottom: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: hp(2),
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: hp(1.5),
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: hp(1.5),
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: hp(2.4),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  availableBadge: {
    backgroundColor: theme.colors.success + '15',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.full,
    marginTop: hp(0.5),
  },
  availableBadgeText: {
    color: theme.colors.success,
    fontSize: hp(1.3),
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    marginTop: hp(1),
  },
  rating: {
    fontSize: hp(2),
    fontWeight: '700',
    color: theme.colors.warning,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    marginBottom: hp(2),
  },
  statItem: {
    alignItems: 'center',
    gap: hp(0.5),
  },
  statValue: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: theme.colors.text,
  },

  // Rate
  rateLabel: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
  },
  rateValue: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.primary,
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },

  // Vehicle
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginTop: hp(1),
  },
  vehicleText: {
    color: theme.colors.success,
    fontSize: hp(1.4),
  },

  // Bio
  bio: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    lineHeight: hp(2.3),
  },

  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(4),
    marginBottom: hp(2),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendDotAvailable: {
    backgroundColor: theme.colors.success,
  },
  legendDotUnavailable: {
    backgroundColor: theme.colors.rose,
  },
  legendDotBooked: {
    backgroundColor: theme.colors.warning,
  },

  // Mini Calendar
  miniCalendar: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    marginBottom: hp(2),
  },
  miniCalendarTitle: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: hp(1),
  },
  miniWeekDays: {
    flexDirection: 'row',
    marginBottom: hp(0.5),
  },
  miniWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: hp(1.1),
    color: theme.colors.textLight,
  },
  miniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  miniDay: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: hp(0.5),
  },
  miniDayNumber: {
    fontSize: hp(1.2),
    color: theme.colors.text,
  },
  miniDayNumberPast: {
    color: theme.colors.gray,
  },
  miniDayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 1,
  },
  miniDayDotAvailable: {
    backgroundColor: theme.colors.success,
  },
  miniDayDotUnavailable: {
    backgroundColor: theme.colors.rose,
  },
  miniDayDotBooked: {
    backgroundColor: theme.colors.warning,
  },
});