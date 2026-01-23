/**
 * Prévisualisation de ma carte
 * Gère candidats (préparateur, conseiller, étudiant) ET animateurs
 */
import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { usePrivacy } from '../../hooks/usePrivacy';
import { useCVs } from '../../hooks/useCVs';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import { getDisplayName } from '../../helpers/displayName';
import { getRoleLabel, isFreelance } from '../../helpers/roleLabel';
import { getAnimationSpecialtyLabel } from '../../constants/profileOptions';

export default function PreviewMyCard() {
  const router = useRouter();
  const { user, profile, session, animatorProfile } = useAuth();
  const { privacy } = usePrivacy(session?.user?.id);
  const { cvs } = useCVs(session?.user?.id);
  const [viewMode, setViewMode] = useState('card');

  // Détection du rôle
  const userType = user?.user_type;
  const isAnimator = isFreelance(userType);

  // ============================================
  // DONNÉES CANDIDAT
  // ============================================
  const isSearchable = privacy?.searchable_by_recruiters;
  const defaultCV = cvs?.find(cv => cv.is_default) || cvs?.[0];
  const hasStandardCV = defaultCV?.type === 'standard';
  const showFullName = privacy?.show_full_name;
  const showPhoto = privacy?.show_photo;
  const showExactLocation = privacy?.show_exact_location;
  const displayName = getDisplayName(profile, !showFullName);
  const displayLocation = showExactLocation
    ? `${profile?.current_city || ''}, ${profile?.current_department || ''}`
    : profile?.current_region || 'France';

  // ============================================
  // DONNÉES ANIMATEUR
  // ============================================
  const hasSpecialties = animatorProfile?.animation_specialties?.length > 0;
  const hasBrands = animatorProfile?.brands_experience?.length > 0;
  const hasMobility = animatorProfile?.mobility_zones?.length > 0;
  const hasRate = animatorProfile?.daily_rate_min || animatorProfile?.daily_rate_max;

  // Score de complétude animateur
  const animatorCompletionItems = [
    { label: 'Photo', done: !!profile?.photo_url, icon: 'camera' },
    { label: 'Spécialités', done: hasSpecialties, icon: 'star' },
    { label: 'Tarif', done: hasRate, icon: 'briefcase' },
    { label: 'Zones', done: hasMobility, icon: 'mapPin' },
    { label: 'Marques', done: hasBrands, icon: 'award' },
    { label: 'Bio', done: !!profile?.bio, icon: 'fileText' },
  ];
  const animatorCompletionScore = Math.round(
    (animatorCompletionItems.filter(i => i.done).length / animatorCompletionItems.length) * 100
  );

  // ============================================
  // VISIBILITÉ & NAVIGATION
  // ============================================
  const isVisible = isAnimator ? animatorProfile?.available_now : isSearchable;
  const visibilityText = isAnimator
    ? (animatorProfile?.available_now ? 'Visible par les laboratoires' : 'Non visible (indisponible)')
    : (isSearchable ? 'Visible par les recruteurs' : 'Profil masqué');
  const settingsRoute = isAnimator ? '/editAnimatorProfile' : '/(screens)/privacySettings';
  const editRoute = isAnimator ? '/editAnimatorProfile' : '/(screens)/editProfile';

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Ma carte</Text>
        <Pressable style={commonStyles.headerButton} onPress={() => router.push(settingsRoute)}>
          <Icon name="settings" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      <ScrollView style={commonStyles.flex1} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statut de visibilité */}
        <View style={[styles.statusBanner, isVisible ? styles.statusVisible : styles.statusHidden]}>
          <Icon name={isVisible ? 'checkCircle' : 'alertCircle'} size={18} color={isVisible ? theme.colors.success : theme.colors.warning} />
          <Text style={[styles.statusText, { color: isVisible ? theme.colors.success : theme.colors.warning }]}>
            {visibilityText}
          </Text>
        </View>

        {/* Toggle vue (candidat avec CV ou animateur) */}
        {((!isAnimator && hasStandardCV) || isAnimator) && (
          <View style={styles.toggleContainer}>
            <Pressable style={[styles.toggleButton, viewMode === 'card' && styles.toggleActive]} onPress={() => setViewMode('card')}>
              <Icon name="creditCard" size={16} color={viewMode === 'card' ? '#fff' : theme.colors.textLight} />
              <Text style={[styles.toggleText, viewMode === 'card' && styles.toggleTextActive]}>Carte</Text>
            </Pressable>
            <Pressable style={[styles.toggleButton, viewMode === 'detail' && styles.toggleActive]} onPress={() => setViewMode('detail')}>
              <Icon name={isAnimator ? 'user' : 'file'} size={16} color={viewMode === 'detail' ? '#fff' : theme.colors.textLight} />
              <Text style={[styles.toggleText, viewMode === 'detail' && styles.toggleTextActive]}>
                {isAnimator ? 'Détaillé' : 'CV'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* ============================================ */}
        {/* CARTE ANIMATEUR */}
        {/* ============================================ */}
        {isAnimator && viewMode === 'card' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              {profile?.photo_url ? (
                <Image source={{ uri: profile.photo_url }} style={styles.photoSmall} />
              ) : (
                <View style={[styles.photoPlaceholderSmall, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Icon name="user" size={28} color={theme.colors.primary} />
                </View>
              )}
              <View style={styles.headerInfo}>
                <Text style={styles.cardName}>{profile?.first_name} {profile?.last_name?.[0]}.</Text>
                {animatorProfile?.average_rating > 0 && (
                  <View style={commonStyles.rowGapSmall}>
                    <Icon name="star" size={14} color={theme.colors.warning} />
                    <Text style={styles.ratingText}>{animatorProfile.average_rating.toFixed(1)}</Text>
                    <Text style={commonStyles.hint}>({animatorProfile.missions_completed || 0} missions)</Text>
                  </View>
                )}
                {animatorProfile?.available_now && (
                  <View style={[commonStyles.badge, commonStyles.badgeSuccess, { alignSelf: 'flex-start', marginTop: hp(0.5) }]}>
                    <Text style={[commonStyles.badgeText, commonStyles.badgeTextSuccess]}>🟢 Disponible</Text>
                  </View>
                )}
              </View>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreValue}>85%</Text>
                <Text style={styles.scoreLabel}>match</Text>
              </View>
            </View>

            {/* Spécialités */}
            {hasSpecialties ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Spécialités</Text>
                <View style={commonStyles.chipsContainer}>
                  {animatorProfile.animation_specialties.slice(0, 4).map((spec, i) => (
                    <View key={i} style={commonStyles.chipSmall}>
                      <Text style={commonStyles.chipTextSmall}>{getAnimationSpecialtyLabel(spec)}</Text>
                    </View>
                  ))}
                  {animatorProfile.animation_specialties.length > 4 && (
                    <View style={commonStyles.chipSmall}>
                      <Text style={commonStyles.chipTextSmall}>+{animatorProfile.animation_specialties.length - 4}</Text>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View style={[styles.section, styles.missingSection]}>
                <Icon name="alertCircle" size={16} color={theme.colors.warning} />
                <Text style={styles.missingText}>Ajoutez vos spécialités</Text>
              </View>
            )}

            {/* Tarif */}
            <View style={styles.section}>
              <View style={commonStyles.rowBetween}>
                <View style={commonStyles.rowGapSmall}>
                  <Icon name="briefcase" size={16} color={theme.colors.textLight} />
                  <Text style={commonStyles.hint}>Tarif journalier</Text>
                </View>
                <Text style={styles.rateText}>
                  {hasRate
                    ? animatorProfile.daily_rate_min && animatorProfile.daily_rate_max
                      ? `${animatorProfile.daily_rate_min}€ - ${animatorProfile.daily_rate_max}€`
                      : `À partir de ${animatorProfile.daily_rate_min || animatorProfile.daily_rate_max}€`
                    : <Text style={{ color: theme.colors.warning }}>Non renseigné</Text>
                  }
                </Text>
              </View>
            </View>

            {/* Mobilité */}
            <View style={styles.section}>
              <View style={commonStyles.rowGapSmall}>
                <Icon name="mapPin" size={16} color={theme.colors.textLight} />
                <Text style={commonStyles.hint}>
                  {hasMobility
                    ? animatorProfile.mobility_zones.length === 1
                      ? animatorProfile.mobility_zones[0]
                      : `${animatorProfile.mobility_zones.length} régions`
                    : <Text style={{ color: theme.colors.warning }}>Non renseigné</Text>
                  }
                </Text>
                {animatorProfile?.has_vehicle && (
                  <>
                    <Text style={commonStyles.hint}>•</Text>
                    <Icon name="car" size={14} color={theme.colors.success} />
                  </>
                )}
              </View>
            </View>

            <View style={styles.seeMore}>
              <Text style={styles.seeMoreText}>Appuyer pour voir le profil complet</Text>
              <Icon name="chevronRight" size={14} color={theme.colors.textLight} />
            </View>
          </View>
        )}

        {/* ============================================ */}
        {/* CARTE CANDIDAT */}
        {/* ============================================ */}
        {!isAnimator && viewMode === 'card' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              {showPhoto && profile?.photo_url ? (
                <Image source={{ uri: profile.photo_url }} style={styles.photoSmall} />
              ) : (
                <View style={styles.photoPlaceholderSmall}>
                  <Icon name="user" size={28} color={theme.colors.textLight} />
                </View>
              )}
              <View style={styles.headerInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.cardName}>{displayName}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{getRoleLabel(userType)}</Text>
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <Icon name="mapPin" size={12} color={theme.colors.textLight} />
                  <Text style={styles.metaText}>{displayLocation}</Text>
                  {profile?.experience_years > 0 && (
                    <>
                      <Text style={styles.metaDot}>•</Text>
                      <Text style={styles.metaText}>{profile.experience_years} ans exp.</Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* Disponibilité & Contrats */}
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Icon name="calendar" size={16} color={theme.colors.primary} />
                <View>
                  <Text style={styles.infoLabel}>Disponibilité</Text>
                  <Text style={styles.infoValue}>
                    {profile?.availability_date
                      ? new Date(profile.availability_date) <= new Date() ? 'Immédiate' : new Date(profile.availability_date).toLocaleDateString('fr-FR')
                      : 'Non renseignée'}
                  </Text>
                </View>
              </View>
              {profile?.preferred_contract_types?.length > 0 && (
                <View style={styles.infoItem}>
                  <Icon name="briefcase" size={16} color={theme.colors.primary} />
                  <View>
                    <Text style={styles.infoLabel}>Contrats</Text>
                    <Text style={styles.infoValue}>{profile.preferred_contract_types.slice(0, 2).join(', ')}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Spécialisations */}
            {profile?.specializations?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Spécialisations</Text>
                <View style={styles.tagsRow}>
                  {profile.specializations.slice(0, 3).map((spec, i) => (
                    <View key={i} style={commonStyles.chipSmall}>
                      <Text style={commonStyles.chipTextSmall}>{spec}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Bio */}
            {profile?.bio && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>À propos</Text>
                <Text style={styles.bioText} numberOfLines={3}>{profile.bio}</Text>
              </View>
            )}
          </View>
        )}

        {/* ============================================ */}
        {/* VUE DÉTAILLÉE ANIMATEUR */}
        {/* ============================================ */}
        {isAnimator && viewMode === 'detail' && (
          <View style={styles.card}>
            <View style={styles.profileHeader}>
              {profile?.photo_url ? (
                <Image source={{ uri: profile.photo_url }} style={styles.profileAvatar} />
              ) : (
                <View style={[styles.profileAvatar, commonStyles.centered, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Icon name="user" size={50} color={theme.colors.primary} />
                </View>
              )}
              <Text style={styles.profileName}>{profile?.first_name} {profile?.last_name}</Text>
              {animatorProfile?.available_now && (
                <View style={[commonStyles.badge, commonStyles.badgeSuccess]}>
                  <Text style={[commonStyles.badgeText, commonStyles.badgeTextSuccess]}>🟢 Disponible</Text>
                </View>
              )}
            </View>

            <View style={styles.statsRow}>
              <StatItem icon="briefcase" value={animatorProfile?.missions_completed || 0} label="Missions" />
              <StatItem icon="star" value={animatorProfile?.average_rating?.toFixed(1) || '-'} label="Note" />
              <StatItem icon="calendar" value={animatorProfile?.experience_years || '-'} label="Ans" />
            </View>

            {hasSpecialties && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Spécialités</Text>
                <View style={commonStyles.chipsContainer}>
                  {animatorProfile.animation_specialties.map((spec, i) => (
                    <View key={i} style={[commonStyles.chip, commonStyles.chipActive]}>
                      <Text style={[commonStyles.chipText, commonStyles.chipTextActive]}>{getAnimationSpecialtyLabel(spec)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {profile?.bio && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Présentation</Text>
                <Text style={styles.bioTextFull}>{profile.bio}</Text>
              </View>
            )}
          </View>
        )}

        {/* ============================================ */}
        {/* VUE CV CANDIDAT */}
        {/* ============================================ */}
        {!isAnimator && viewMode === 'detail' && hasStandardCV && (
          <View style={styles.card}>
            <View style={styles.cvHeader}>
              <Text style={styles.cvTitle}>CV Standardisé</Text>
              <View style={styles.cvBadge}>
                <Icon name="checkCircle" size={12} color={theme.colors.success} />
                <Text style={styles.cvBadgeText}>Complet</Text>
              </View>
            </View>

            {defaultCV?.structured_data?.experiences?.length > 0 && (
              <View style={styles.cvSection}>
                <View style={styles.cvSectionHeader}>
                  <Icon name="briefcase" size={16} color={theme.colors.primary} />
                  <Text style={styles.cvSectionTitle}>Expériences</Text>
                </View>
                {defaultCV.structured_data.experiences.slice(0, 3).map((exp, i) => (
                  <View key={i} style={styles.cvItem}>
                    <Text style={styles.cvItemTitle}>{exp.title}</Text>
                    <Text style={styles.cvItemSubtitle}>{exp.company}</Text>
                  </View>
                ))}
              </View>
            )}

            {defaultCV?.structured_data?.formations?.length > 0 && (
              <View style={styles.cvSection}>
                <View style={styles.cvSectionHeader}>
                  <Icon name="book" size={16} color={theme.colors.primary} />
                  <Text style={styles.cvSectionTitle}>Formations</Text>
                </View>
                {defaultCV.structured_data.formations.slice(0, 2).map((form, i) => (
                  <View key={i} style={styles.cvItem}>
                    <Text style={styles.cvItemTitle}>{form.diploma}</Text>
                    <Text style={styles.cvItemSubtitle}>{form.school}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ============================================ */}
        {/* COMPLÉTUDE / CONSEILS */}
        {/* ============================================ */}
        {isAnimator ? (
          <CompletionCard score={animatorCompletionScore} items={animatorCompletionItems} editRoute={editRoute} router={router} />
        ) : (
          <TipsCard profile={profile} hasStandardCV={hasStandardCV} router={router} />
        )}

        {/* Action */}
        <Pressable style={commonStyles.buttonPrimary} onPress={() => router.push(editRoute)}>
          <Icon name="edit" size={18} color="#fff" />
          <Text style={commonStyles.buttonPrimaryText}>Modifier mon profil</Text>
        </Pressable>

        <View style={commonStyles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

// ============================================
// SOUS-COMPOSANTS
// ============================================

const StatItem = ({ icon, value, label }) => (
  <View style={styles.statItem}>
    <Icon name={icon} size={20} color={theme.colors.primary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={commonStyles.hint}>{label}</Text>
  </View>
);

const CompletionCard = ({ score, items, editRoute, router }) => (
  <View style={styles.completionCard}>
    <View style={commonStyles.rowBetween}>
      <Text style={styles.completionTitle}>Complétude du profil</Text>
      <Text style={[styles.completionScore, score === 100 && { color: theme.colors.success }]}>{score}%</Text>
    </View>
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${score}%` }]} />
    </View>
    <View style={styles.completionItems}>
      {items.map((item, i) => (
        <View key={i} style={styles.completionItem}>
          <Icon name={item.done ? 'checkCircle' : 'circle'} size={14} color={item.done ? theme.colors.success : theme.colors.gray} />
          <Text style={[styles.completionLabel, item.done && { color: theme.colors.success }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  </View>
);

const TipsCard = ({ profile, hasStandardCV, router }) => (
  <View style={styles.tipsCard}>
    <Text style={styles.tipsTitle}>💡 Améliorer mon profil</Text>
    {!profile?.photo_url && <TipItem icon="camera" text="Ajouter une photo" onPress={() => router.push('/(screens)/editProfile')} />}
    {!profile?.bio && <TipItem icon="edit" text="Rédiger une bio" onPress={() => router.push('/(screens)/editProfile')} />}
    {!hasStandardCV && <TipItem icon="file" text="Créer un CV standardisé" onPress={() => router.push('/(screens)/cvList')} />}
    {profile?.photo_url && profile?.bio && hasStandardCV && (
      <View style={styles.tipItem}>
        <Icon name="checkCircle" size={14} color={theme.colors.success} />
        <Text style={[styles.tipText, { color: theme.colors.success }]}>Profil complet !</Text>
      </View>
    )}
  </View>
);

const TipItem = ({ icon, text, onPress }) => (
  <Pressable style={styles.tipItem} onPress={onPress}>
    <Icon name={icon} size={14} color={theme.colors.warning} />
    <Text style={styles.tipText}>{text}</Text>
    <Icon name="chevronRight" size={14} color={theme.colors.textLight} />
  </Pressable>
);

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  content: { padding: wp(4), paddingBottom: hp(10) },

  // Status
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: wp(2), padding: wp(3), borderRadius: theme.radius.md, marginBottom: hp(2) },
  statusVisible: { backgroundColor: theme.colors.success + '15' },
  statusHidden: { backgroundColor: theme.colors.warning + '15' },
  statusText: { fontSize: hp(1.4), fontWeight: '500' },

  // Toggle
  toggleContainer: { flexDirection: 'row', backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: 4, marginBottom: hp(2) },
  toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: wp(2), paddingVertical: hp(1), borderRadius: theme.radius.md },
  toggleActive: { backgroundColor: theme.colors.primary },
  toggleText: { fontSize: hp(1.4), color: theme.colors.textLight },
  toggleTextActive: { color: '#fff', fontWeight: '600' },

  // Card
  card: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: wp(4), marginBottom: hp(2) },
  cardHeader: { flexDirection: 'row', gap: wp(3), marginBottom: hp(2), paddingBottom: hp(2), borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  photoSmall: { width: 56, height: 56, borderRadius: 28 },
  photoPlaceholderSmall: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: wp(2), marginBottom: hp(0.5) },
  cardName: { fontSize: hp(1.8), fontWeight: '700', color: theme.colors.text },
  typeBadge: { backgroundColor: theme.colors.primary + '20', paddingHorizontal: wp(2), paddingVertical: hp(0.2), borderRadius: theme.radius.sm },
  typeBadgeText: { fontSize: hp(1.1), color: theme.colors.primary, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: wp(1) },
  metaText: { fontSize: hp(1.3), color: theme.colors.textLight },
  metaDot: { color: theme.colors.textLight },
  ratingText: { fontSize: hp(1.5), fontWeight: '600', color: theme.colors.warning },
  rateText: { fontSize: hp(1.5), fontWeight: '600', color: theme.colors.text },

  // Score (animateur)
  scoreContainer: { alignItems: 'center', backgroundColor: theme.colors.primary + '15', paddingHorizontal: wp(3), paddingVertical: hp(0.8), borderRadius: theme.radius.lg },
  scoreValue: { fontSize: hp(2), fontWeight: '700', color: theme.colors.primary },
  scoreLabel: { fontSize: hp(1.1), color: theme.colors.primary },

  // Info Grid
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: hp(1.5) },
  infoItem: { width: '50%', flexDirection: 'row', alignItems: 'flex-start', gap: wp(2), paddingVertical: hp(1) },
  infoLabel: { fontSize: hp(1.1), color: theme.colors.textLight },
  infoValue: { fontSize: hp(1.3), color: theme.colors.text, fontWeight: '500' },

  // Sections
  section: { paddingTop: hp(1.5), borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: hp(0.5) },
  sectionLabel: { fontSize: hp(1.2), color: theme.colors.textLight, marginBottom: hp(0.8), textTransform: 'uppercase', letterSpacing: 0.5 },
  missingSection: { flexDirection: 'row', alignItems: 'center', gap: wp(2), backgroundColor: theme.colors.warning + '10', marginHorizontal: -wp(4), paddingHorizontal: wp(4), paddingVertical: hp(1) },
  missingText: { fontSize: hp(1.3), color: theme.colors.warning },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(2) },
  bioText: { fontSize: hp(1.4), color: theme.colors.text, lineHeight: hp(2) },
  seeMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: wp(1), marginTop: hp(1.5), paddingTop: hp(1.5), borderTopWidth: 1, borderTopColor: theme.colors.border },
  seeMoreText: { fontSize: hp(1.3), color: theme.colors.textLight },

  // Profile Detail
  profileHeader: { alignItems: 'center', paddingBottom: hp(2), borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, marginBottom: hp(1) },
  profileName: { fontSize: hp(2), fontWeight: '700', color: theme.colors.text, marginBottom: hp(0.5) },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: hp(2), borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  statItem: { alignItems: 'center', gap: hp(0.5) },
  statValue: { fontSize: hp(2), fontWeight: '700', color: theme.colors.text },
  detailSection: { paddingTop: hp(2) },
  detailSectionTitle: { fontSize: hp(1.4), fontWeight: '600', color: theme.colors.text, marginBottom: hp(1) },
  bioTextFull: { fontSize: hp(1.5), color: theme.colors.text, lineHeight: hp(2.3) },

  // CV
  cvHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(2) },
  cvTitle: { fontSize: hp(1.8), fontWeight: '700', color: theme.colors.text },
  cvBadge: { flexDirection: 'row', alignItems: 'center', gap: wp(1), backgroundColor: theme.colors.success + '15', paddingHorizontal: wp(2), paddingVertical: hp(0.3), borderRadius: theme.radius.sm },
  cvBadgeText: { fontSize: hp(1.1), color: theme.colors.success, fontWeight: '500' },
  cvSection: { marginBottom: hp(2) },
  cvSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: wp(2), marginBottom: hp(1) },
  cvSectionTitle: { fontSize: hp(1.5), fontWeight: '600', color: theme.colors.text },
  cvItem: { paddingLeft: wp(6), marginBottom: hp(1) },
  cvItemTitle: { fontSize: hp(1.4), fontWeight: '600', color: theme.colors.text },
  cvItemSubtitle: { fontSize: hp(1.2), color: theme.colors.textLight },

  // Completion
  completionCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: wp(4), marginBottom: hp(2) },
  completionTitle: { fontSize: hp(1.5), fontWeight: '600', color: theme.colors.text },
  completionScore: { fontSize: hp(1.8), fontWeight: '700', color: theme.colors.primary },
  progressBar: { height: 6, backgroundColor: theme.colors.gray + '30', borderRadius: 3, marginVertical: hp(1.5), overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 3 },
  completionItems: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(3) },
  completionItem: { flexDirection: 'row', alignItems: 'center', gap: wp(1.5), width: '45%' },
  completionLabel: { fontSize: hp(1.3), color: theme.colors.textLight },

  // Tips
  tipsCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: wp(4), marginBottom: hp(2) },
  tipsTitle: { fontSize: hp(1.5), fontWeight: '600', color: theme.colors.text, marginBottom: hp(1) },
  tipItem: { flexDirection: 'row', alignItems: 'center', gap: wp(2), paddingVertical: hp(0.8) },
  tipText: { fontSize: hp(1.3), color: theme.colors.text, flex: 1 },
});