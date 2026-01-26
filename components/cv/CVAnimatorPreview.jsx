// components/cv/CVAnimatorPreview.jsx

import { StyleSheet, Text, View, Image } from 'react-native';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { LANGUAGE_LEVELS, DIPLOMA_TYPES, DIPLOMA_MENTIONS } from '../../constants/cvOptions';
import { ANIMATION_SPECIALTIES } from '../../constants/profileOptions';
import {
  getMissionTypeLabel,
  getMissionTypeIcon,
  getPharmacyTypeLabel,
  getMissionCountLabel,
} from '../../constants/cvAnimatorOptions';
import Icon from '../../assets/icons/Icon';

const CVAnimatorPreview = ({
  structuredData,
  profile = {},
  ratingData = null,
  showToggle = true,
  style,
}) => {

  if (!structuredData) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Icon name="fileText" size={40} color={theme.colors.gray} />
        <Text style={styles.emptyText}>Aucune donnée CV</Text>
      </View>
    );
  }

  const showPhoto = structuredData.show_photo;
  const showRating = structuredData.show_rating;
  const showContact = structuredData.show_contact;

  const getDisplayName = () => {
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Animateur(trice)';
  };

  const getLocation = () => {
    const city = structuredData.current_city || profile.current_city;
    const region = structuredData.current_region || profile.current_region;
    return city ? `${city}, ${region}` : region || 'France';
  };

  const getSpecialtyLabel = (value) => {
    const spec = ANIMATION_SPECIALTIES.find(s => s.value === value);
    return spec?.label || value;
  };

  const getLevelLabel = (value) => {
    return LANGUAGE_LEVELS.find(l => l.value === value)?.label || value;
  };

  const getDiplomaLabel = (value) => {
    return DIPLOMA_TYPES.find(d => d.value === value)?.label || value;
  };

  const getMentionLabel = (value) => {
    return DIPLOMA_MENTIONS.find(m => m.value === value)?.label || value;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Vue recruteur */}
      {showToggle && (
        <View style={styles.toggleContainer}>
          <View style={[styles.toggleButton, styles.toggleActive]}>
            <Icon name="eye" size={14} color="white" />
            <Text style={[styles.toggleText, styles.toggleTextActive]}>Vue recruteur</Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.headerSection}>
        {showPhoto && profile.photo_url ? (
          <Image source={{ uri: profile.photo_url }} style={styles.avatarImage} />
        ) : null}
        <View style={commonStyles.flex1}>
          <Text style={styles.name}>{getDisplayName()}</Text>
          {structuredData.specialty_title && (
            <Text style={styles.specialty}>{structuredData.specialty_title}</Text>
          )}
          <View style={[commonStyles.rowGapSmall, { marginTop: hp(0.5) }]}>
            <Icon name="mapPin" size={14} color={theme.colors.textLight} />
            <Text style={styles.location}>{getLocation()}</Text>
          </View>
        </View>
      </View>

      {/* Rating PharmaLink */}
      {showRating && (
        <View style={styles.ratingSection}>
          <Icon name="star" size={16} color={'#F59E0B'} />
          <Text style={styles.ratingLabel}>Rating PharmaLink</Text>
          {ratingData ? (
            <Text style={styles.ratingValue}>
              {ratingData.averageRating?.toFixed(1) || '-'}/5 • {ratingData.missionsCompleted || 0} mission{(ratingData.missionsCompleted || 0) > 1 ? 's' : ''}
            </Text>
          ) : (
            <Text style={styles.ratingValue}>Visible sur le CV publié</Text>
          )}
        </View>
      )}

      {/* Résumé */}
      {structuredData.summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <Text style={styles.bodyText}>{structuredData.summary}</Text>
        </View>
      )}

      {/* Marques & Labos */}
      {structuredData.brands_experience?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marques & Laboratoires</Text>
          {structuredData.brands_experience.map((brand, index) => (
            <View key={brand.id || index} style={styles.brandCard}>
              <View style={commonStyles.rowBetween}>
                <Text style={styles.brandName}>
                  {brand.brand}
                </Text>
                {brand.years && (
                  <Text style={styles.brandYears}>
                    {brand.years >= 10 ? '10+' : brand.years < 1 ? '< 1' : brand.years} an{brand.years > 1 ? 's' : ''}
                  </Text>
                )}
              </View>
              {brand.mission_count && (
                <Text style={styles.missionCount}>{getMissionCountLabel(brand.mission_count)}</Text>
              )}
              {brand.specialties?.length > 0 && (
                <View style={styles.tagsRow}>
                  {brand.specialties.map((s) => (
                    <View key={s} style={styles.tag}>
                      <Text style={styles.tagText}>{getSpecialtyLabel(s)}</Text>
                    </View>
                  ))}
                </View>
              )}
              {brand.description && (
                <Text style={styles.bodyTextSmall}>{brand.description}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Missions marquantes */}
      {structuredData.key_missions?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Missions marquantes</Text>
          {structuredData.key_missions.map((mission, index) => (
            <View key={mission.id || index} style={styles.missionCard}>
              <View style={commonStyles.rowGapSmall}>
                <Icon name={getMissionTypeIcon(mission.mission_type)} size={16} color={theme.colors.primary} />
                <Text style={styles.missionType}>{getMissionTypeLabel(mission.mission_type)}</Text>
              </View>
              <Text style={styles.missionBrand}>
                {mission.brand}
              </Text>
              <View style={[commonStyles.rowGapSmall, { marginTop: hp(0.3) }]}>
                {mission.pharmacy_type && (
                  <Text style={styles.missionMeta}>{getPharmacyTypeLabel(mission.pharmacy_type)}</Text>
                )}
                {mission.city && (
                  <Text style={styles.missionMeta}> • {mission.city}</Text>
                )}
                {mission.date && (
                  <Text style={styles.missionMeta}> • {mission.date}</Text>
                )}
              </View>
              {mission.description && (
                <Text style={styles.bodyTextSmall}>{mission.description}</Text>
              )}
              {mission.results && (
                <View style={styles.resultsBox}>
                  <Icon name="target" size={14} color={theme.colors.success} />
                  <Text style={styles.resultsText}>{mission.results}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Formations */}
      {structuredData.formations?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Formations</Text>
          {structuredData.formations.map((form, index) => (
            <View key={form.id || index} style={styles.formationItem}>
              <Text style={styles.formationDiploma}>
                {form.diploma_type ? getDiplomaLabel(form.diploma_type) : form.diploma_name}
              </Text>
              {form.diploma_name && form.diploma_type && (
                <Text style={styles.bodyTextSmall}>{form.diploma_name}</Text>
              )}
              <View style={commonStyles.rowGapSmall}>
                {form.school_name && (
                  <Text style={styles.missionMeta}>{form.school_name}</Text>
                )}
                {form.year && <Text style={styles.missionMeta}>{form.school_name ? ' • ' : ''}{form.year}</Text>}
                {form.mention && <Text style={styles.missionMeta}> • {getMentionLabel(form.mention)}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Certifications marques */}
      {structuredData.brand_certifications?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications marques</Text>
          <View style={styles.tagsRow}>
            {structuredData.brand_certifications.map((cert, index) => (
              <View key={cert.id || index} style={styles.certTag}>
                <Icon name="award" size={12} color={theme.colors.secondary} />
                <Text style={styles.certTagText}>
                  {`${cert.brand} - ${cert.certification_name}`}
                  {cert.year ? ` (${cert.year})` : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Compétences */}
      {structuredData.animation_specialties?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spécialités d'animation</Text>
          <View style={styles.tagsRow}>
            {structuredData.animation_specialties.map((s) => (
              <View key={s} style={[styles.tag, { backgroundColor: theme.colors.primary + '15' }]}>
                <Text style={[styles.tagText, { color: theme.colors.primary }]}>{getSpecialtyLabel(s)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {structuredData.software?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logiciels</Text>
          <View style={styles.tagsRow}>
            {structuredData.software.map((s) => (
              <View key={s} style={styles.tag}>
                <Text style={styles.tagText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Langues */}
      {structuredData.languages?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Langues</Text>
          {structuredData.languages.map((lang, index) => (
            <View key={index} style={[commonStyles.rowBetween, { marginBottom: hp(0.5) }]}>
              <Text style={styles.bodyText}>{lang.language}</Text>
              <Text style={styles.missionMeta}>{getLevelLabel(lang.level)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Tarifs & Mobilité */}
      {(structuredData.daily_rate_min || structuredData.mobility_zones?.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tarifs & Mobilité</Text>
          {structuredData.daily_rate_min && (
            <View style={[commonStyles.rowGapSmall, { marginBottom: hp(0.8) }]}>
              <Icon name="briefcase" size={14} color={theme.colors.textLight} />
              <Text style={styles.bodyText}>
                {structuredData.daily_rate_min}€ - {structuredData.daily_rate_max || '?'}€ / jour
              </Text>
            </View>
          )}
          {structuredData.mobility_zones?.length > 0 && (
            <View style={[commonStyles.rowGapSmall, { marginBottom: hp(0.8) }]}>
              <Icon name="map" size={14} color={theme.colors.textLight} />
              <Text style={styles.bodyText}>{structuredData.mobility_zones.join(', ')}</Text>
            </View>
          )}
          {structuredData.has_vehicle && (
            <View style={commonStyles.rowGapSmall}>
              <Icon name="checkCircle" size={14} color={theme.colors.success} />
              <Text style={styles.bodyText}>Véhicule personnel</Text>
            </View>
          )}
        </View>
      )}

      {/* Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        {showContact ? (
          <>
            {structuredData.contact_email && (
              <View style={[commonStyles.rowGapSmall, { marginBottom: hp(0.5) }]}>
                <Icon name="mail" size={14} color={theme.colors.textLight} />
                <Text style={styles.bodyText}>{structuredData.contact_email}</Text>
              </View>
            )}
            {structuredData.contact_phone && (
              <View style={commonStyles.rowGapSmall}>
                <Icon name="phone" size={14} color={theme.colors.textLight} />
                <Text style={styles.bodyText}>{structuredData.contact_phone}</Text>
              </View>
            )}
          </>
        ) : (
          <View style={commonStyles.rowGapSmall}>
            <Icon name="lock" size={14} color={theme.colors.textLight} />
            <Text style={styles.bodyTextLight}>Disponible après match</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default CVAnimatorPreview;

const styles = StyleSheet.create({
  container: { backgroundColor: theme.colors.card, borderRadius: theme.radius.xl, overflow: 'hidden' },
  emptyContainer: { padding: hp(4), alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: hp(1.5), color: theme.colors.textLight, marginTop: hp(1) },
  toggleContainer: {
    flexDirection: 'row', backgroundColor: theme.colors.background, borderRadius: theme.radius.lg,
    padding: 3, margin: hp(1.5), marginBottom: 0,
  },
  toggleButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: wp(1.5),
    paddingVertical: hp(0.8), borderRadius: theme.radius.md,
  },
  toggleActive: { backgroundColor: theme.colors.primary },
  toggleText: { fontSize: hp(1.3), color: theme.colors.textLight, fontFamily: theme.fonts.medium },
  toggleTextActive: { color: 'white' },
  headerSection: {
    flexDirection: 'row', alignItems: 'center', gap: wp(3), padding: hp(2),
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  avatarImage: {
    width: 56, height: 56, borderRadius: 28,
  },
  name: { fontSize: hp(1.8), fontFamily: theme.fonts.bold, color: theme.colors.text },
  specialty: { fontSize: hp(1.4), color: theme.colors.primary, fontFamily: theme.fonts.medium, marginTop: hp(0.2) },
  location: { fontSize: hp(1.3), color: theme.colors.textLight },
  section: { padding: hp(2), borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  sectionTitle: {
    fontSize: hp(1.5), fontFamily: theme.fonts.semiBold, color: theme.colors.text,
    marginBottom: hp(1), textTransform: 'uppercase', letterSpacing: 0.5,
  },
  bodyText: { fontSize: hp(1.5), color: theme.colors.text, lineHeight: hp(2.2) },
  bodyTextSmall: { fontSize: hp(1.3), color: theme.colors.textLight, lineHeight: hp(2), marginTop: hp(0.5) },
  brandCard: {
    backgroundColor: theme.colors.background, borderRadius: theme.radius.lg,
    padding: hp(1.5), marginBottom: hp(1),
  },
  brandName: { fontSize: hp(1.6), fontFamily: theme.fonts.semiBold, color: theme.colors.text },
  brandYears: { fontSize: hp(1.3), color: theme.colors.primary, fontFamily: theme.fonts.medium },
  missionCount: { fontSize: hp(1.3), color: theme.colors.textLight, marginTop: hp(0.3) },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(1.5), marginTop: hp(0.5) },
  tag: {
    backgroundColor: theme.colors.background, paddingHorizontal: wp(2.5), paddingVertical: hp(0.4),
    borderRadius: theme.radius.full,
  },
  tagText: { fontSize: hp(1.2), color: theme.colors.text, fontFamily: theme.fonts.medium },
  missionCard: {
    backgroundColor: theme.colors.background, borderRadius: theme.radius.lg,
    padding: hp(1.5), marginBottom: hp(1), borderLeftWidth: 3, borderLeftColor: theme.colors.primary,
  },
  missionType: { fontSize: hp(1.4), fontFamily: theme.fonts.semiBold, color: theme.colors.primary },
  missionBrand: { fontSize: hp(1.5), fontFamily: theme.fonts.medium, color: theme.colors.text, marginTop: hp(0.3) },
  missionMeta: { fontSize: hp(1.2), color: theme.colors.textLight },
  resultsBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: wp(2), marginTop: hp(0.8),
    backgroundColor: theme.colors.success + '10', padding: hp(1), borderRadius: theme.radius.md,
  },
  resultsText: { flex: 1, fontSize: hp(1.3), color: theme.colors.success, fontFamily: theme.fonts.medium },
  formationItem: { marginBottom: hp(1.2) },
  formationDiploma: { fontSize: hp(1.5), fontFamily: theme.fonts.semiBold, color: theme.colors.text },
  certTag: {
    flexDirection: 'row', alignItems: 'center', gap: wp(1),
    backgroundColor: theme.colors.secondary + '15', paddingHorizontal: wp(2.5), paddingVertical: hp(0.5),
    borderRadius: theme.radius.full,
  },
  certTagText: { fontSize: hp(1.2), color: theme.colors.secondary, fontFamily: theme.fonts.medium },
  ratingSection: {
    flexDirection: 'row', alignItems: 'center', gap: wp(2),
    paddingHorizontal: hp(2), paddingVertical: hp(1.2),
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    backgroundColor: '#FEF3C7',
  },
  ratingLabel: {
    fontSize: hp(1.4), fontFamily: theme.fonts.semiBold, color: theme.colors.text,
  },
  ratingValue: {
    fontSize: hp(1.3), color: theme.colors.textLight, fontFamily: theme.fonts.medium,
  },
  bodyTextLight: {
    fontSize: hp(1.5), color: theme.colors.textLight, fontStyle: 'italic',
  },
});
