import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import Icon from '../../assets/icons/Icon';
import { getAnimationSpecialtyLabel } from '../../constants/profileOptions';

/**
 * Carte animateur pour le swipe (côté labo)
 */
export const AnimatorSwipeCard = ({ animator, mission, matchScore, isFavorite, onToggleFavorite, onDetailPress }) => {
  const profile = animator.profile || animator;
  const fullName = `${profile.first_name || ''} ${profile.last_name?.[0] || ''}.`;
  
  return (
    <Pressable style={styles.swipeCard} onPress={onDetailPress}>
      {/* Header avec photo et infos principales */}
      <View style={styles.cardHeader}>
        {profile.photo_url ? (
          <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, commonStyles.centered, { backgroundColor: theme.colors.primary + '15' }]}>
            <Icon name="user" size={40} color={theme.colors.primary} />
          </View>
        )}
        
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{fullName}</Text>
          
          {animator.average_rating > 0 && (
            <View style={commonStyles.rowGapSmall}>
              <Icon name="star" size={14} color={theme.colors.warning} />
              <Text style={styles.rating}>{animator.average_rating.toFixed(1)}</Text>
              <Text style={commonStyles.hint}>({animator.missions_completed || 0} missions)</Text>
            </View>
          )}

          {animator.available_now && (
            <View style={[commonStyles.badge, commonStyles.badgeSuccess, { alignSelf: 'flex-start', marginTop: hp(0.5) }]}>
              <Text style={[commonStyles.badgeText, commonStyles.badgeTextSuccess]}>🟢 Disponible</Text>
            </View>
          )}
        </View>

        {/* Score de compatibilité */}
        {matchScore > 0 && (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreValue}>{matchScore}%</Text>
            <Text style={styles.scoreLabel}>match</Text>
          </View>
        )}
      </View>

      {/* Bouton favori */}
      <Pressable style={styles.favoriteBtn} onPress={onToggleFavorite}>
        <Icon name={isFavorite ? 'star-filled' : 'star'} size={22} color={isFavorite ? theme.colors.warning : theme.colors.gray} />
      </Pressable>

      {/* Spécialités */}
      {animator.animation_specialties?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spécialités</Text>
          <View style={commonStyles.chipsContainer}>
            {animator.animation_specialties.slice(0, 4).map((spec, i) => (
              <View key={i} style={commonStyles.chipSmall}>
                <Text style={commonStyles.chipTextSmall}>{getAnimationSpecialtyLabel(spec)}</Text>
              </View>
            ))}
            {animator.animation_specialties.length > 4 && (
              <View style={commonStyles.chipSmall}>
                <Text style={commonStyles.chipTextSmall}>+{animator.animation_specialties.length - 4}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Tarif */}
      <View style={styles.section}>
        <View style={commonStyles.rowBetween}>
          <View style={commonStyles.rowGapSmall}>
            <Icon name="briefcase" size={16} color={theme.colors.textLight} />
            <Text style={commonStyles.hint}>Tarif journalier</Text>
          </View>
          <Text style={styles.rate}>
            {animator.daily_rate_min && animator.daily_rate_max
              ? `${animator.daily_rate_min}€ - ${animator.daily_rate_max}€`
              : animator.daily_rate_min
                ? `À partir de ${animator.daily_rate_min}€`
                : 'Non renseigné'
            }
          </Text>
        </View>
      </View>

      {/* Mobilité */}
      {animator.mobility_zones?.length > 0 && (
        <View style={styles.section}>
          <View style={commonStyles.rowGapSmall}>
            <Icon name="mapPin" size={16} color={theme.colors.textLight} />
            <Text style={commonStyles.hint}>
              {animator.mobility_zones.length === 1 
                ? animator.mobility_zones[0]
                : `${animator.mobility_zones.length} régions`
              }
            </Text>
            {animator.has_vehicle && (
              <>
                <Text style={commonStyles.hint}>•</Text>
                <Icon name="car" size={14} color={theme.colors.success} />
              </>
            )}
          </View>
        </View>
      )}

      {/* Expérience marques */}
      {animator.brands_experience?.length > 0 && (
        <View style={styles.section}>
          <Text style={[commonStyles.hint, { marginBottom: hp(0.5) }]}>Expérience marques</Text>
          <Text style={styles.brands} numberOfLines={2}>
            {animator.brands_experience.slice(0, 5).join(' • ')}
            {animator.brands_experience.length > 5 && ` +${animator.brands_experience.length - 5}`}
          </Text>
        </View>
      )}

      {/* Indication pour voir plus */}
      <View style={styles.seeMore}>
        <Text style={styles.seeMoreText}>Appuyer pour voir le profil complet</Text>
        <Icon name="chevronRight" size={14} color={theme.colors.textLight} />
      </View>
    </Pressable>
  );
};

/**
 * Modal détail animateur
 */
export const AnimatorDetailModal = ({ visible, animator, isFavorite, onClose, onToggleFavorite }) => {
  if (!animator) return null;
  
  const profile = animator.profile || animator;
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={commonStyles.header}>
          <Pressable style={commonStyles.headerButton} onPress={onClose}>
            <Icon name="x" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={commonStyles.headerTitle}>Profil animateur</Text>
          <Pressable style={commonStyles.headerButton} onPress={onToggleFavorite}>
            <Icon name={isFavorite ? 'star-filled' : 'star'} size={22} color={isFavorite ? theme.colors.warning : theme.colors.textLight} />
          </Pressable>
        </View>

        <ScrollView style={commonStyles.flex1} contentContainerStyle={commonStyles.scrollContent}>
          {/* Photo et nom */}
          <View style={styles.profileHeader}>
            {profile.photo_url ? (
              <Image source={{ uri: profile.photo_url }} style={styles.profileAvatar} />
            ) : (
              <View style={[styles.profileAvatar, commonStyles.centered, { backgroundColor: theme.colors.primary + '15' }]}>
                <Icon name="user" size={50} color={theme.colors.primary} />
              </View>
            )}
            <Text style={styles.profileName}>{fullName}</Text>
            
            {animator.available_now && (
              <View style={[commonStyles.badge, commonStyles.badgeSuccess]}>
                <Text style={[commonStyles.badgeText, commonStyles.badgeTextSuccess]}>🟢 Disponible immédiatement</Text>
              </View>
            )}

            {animator.average_rating > 0 && (
              <View style={[commonStyles.rowGapSmall, { marginTop: hp(1) }]}>
                <Icon name="star" size={18} color={theme.colors.warning} />
                <Text style={styles.ratingLarge}>{animator.average_rating.toFixed(1)}</Text>
                <Text style={commonStyles.hint}>({animator.missions_completed || 0} missions)</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatItem icon="briefcase" value={animator.missions_completed || 0} label="Missions" />
            <StatItem icon="star" value={animator.average_rating?.toFixed(1) || '-'} label="Note" />
            <StatItem icon="calendar" value={animator.experience_years || '-'} label="Ans exp." />
          </View>

          {/* Tarif */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Tarif journalier</Text>
            <View style={commonStyles.card}>
              <Text style={styles.rateLarge}>
                {animator.daily_rate_min && animator.daily_rate_max
                  ? `${animator.daily_rate_min}€ - ${animator.daily_rate_max}€ / jour`
                  : animator.daily_rate_min
                    ? `À partir de ${animator.daily_rate_min}€ / jour`
                    : 'Non renseigné'
                }
              </Text>
            </View>
          </View>

          {/* Spécialités */}
          {animator.animation_specialties?.length > 0 && (
            <View style={commonStyles.section}>
              <Text style={commonStyles.sectionTitle}>Spécialités</Text>
              <View style={commonStyles.chipsContainer}>
                {animator.animation_specialties.map((spec, i) => (
                  <View key={i} style={[commonStyles.chip, commonStyles.chipActive]}>
                    <Text style={[commonStyles.chipText, commonStyles.chipTextActive]}>{getAnimationSpecialtyLabel(spec)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Marques */}
          {animator.brands_experience?.length > 0 && (
            <View style={commonStyles.section}>
              <Text style={commonStyles.sectionTitle}>Expérience marques</Text>
              <View style={commonStyles.chipsContainer}>
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
                <View style={commonStyles.chipsContainer}>
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
                <View style={[commonStyles.rowGapSmall, { marginTop: hp(1) }]}>
                  <Icon name="car" size={16} color={theme.colors.success} />
                  <Text style={[commonStyles.hint, { color: theme.colors.success }]}>Véhicule personnel</Text>
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

          <View style={commonStyles.bottomSpacer} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const StatItem = ({ icon, value, label }) => (
  <View style={styles.statItem}>
    <Icon name={icon} size={20} color={theme.colors.primary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={commonStyles.hint}>{label}</Text>
  </View>
);

/**
 * Carte compacte pour liste
 */
export const AnimatorCompactCard = ({ animator, onPress, onRemove }) => {
  const profile = animator.profile || animator;
  
  return (
    <Pressable style={commonStyles.card} onPress={onPress}>
      <View style={commonStyles.rowGap}>
        {profile.photo_url ? (
          <Image source={{ uri: profile.photo_url }} style={styles.compactAvatar} />
        ) : (
          <View style={[styles.compactAvatar, commonStyles.centered, { backgroundColor: theme.colors.primary + '15' }]}>
            <Icon name="user" size={24} color={theme.colors.primary} />
          </View>
        )}
        
        <View style={commonStyles.flex1}>
          <Text style={commonStyles.listItemTitle}>{profile.first_name} {profile.last_name?.[0]}.</Text>
          <Text style={commonStyles.hint} numberOfLines={1}>
            {animator.animation_specialties?.slice(0, 2).map(s => getAnimationSpecialtyLabel(s)).join(', ')}
          </Text>
          {animator.average_rating > 0 && (
            <View style={[commonStyles.rowGapSmall, { marginTop: 4 }]}>
              <Icon name="star" size={12} color={theme.colors.warning} />
              <Text style={[commonStyles.hint, { color: theme.colors.warning }]}>{animator.average_rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {onRemove && (
          <Pressable style={commonStyles.headerButtonSmall} onPress={onRemove}>
            <Icon name="x" size={18} color={theme.colors.rose} />
          </Pressable>
        )}

        <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // Swipe Card
  swipeCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xxl,
    padding: hp(2.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginBottom: hp(2),
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  rating: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.warning,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.lg,
  },
  scoreValue: {
    fontSize: hp(2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary,
  },
  scoreLabel: {
    fontSize: hp(1.1),
    color: theme.colors.primary,
  },
  favoriteBtn: {
    position: 'absolute',
    top: hp(2),
    right: wp(4),
  },
  section: {
    paddingVertical: hp(1),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.textLight,
    marginBottom: hp(0.8),
  },
  rate: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  brands: {
    fontSize: hp(1.4),
    color: theme.colors.text,
    lineHeight: hp(2),
  },
  seeMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1),
    marginTop: hp(1.5),
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  seeMoreText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: hp(2),
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: hp(1.5),
  },
  profileName: {
    fontSize: hp(2.4),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  ratingLarge: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.bold,
    color: theme.colors.warning,
  },
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
    fontSize: hp(2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  rateLarge: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary,
  },
  bio: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    lineHeight: hp(2.3),
  },

  // Compact Card
  compactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});