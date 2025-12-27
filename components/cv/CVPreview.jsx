import { StyleSheet, Text, View, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { anonymizeCV, calculateTotalExperience, getCVCompleteness } from '../../utils/cvAnonymizer';
import { LANGUAGE_LEVELS, DIPLOMA_TYPES } from '../../constants/cvOptions';
import Icon from '../../assets/icons/Icon';

/**
 * Preview du CV - affiche version anonyme ou complète
 */
const CVPreview = ({
  structuredData,
  profile = {},
  mode = 'anonymous', // 'anonymous' | 'full'
  showToggle = true,
  style,
}) => {
  const [viewMode, setViewMode] = useState(mode);
  const [exporting, setExporting] = useState(false);

  if (!structuredData) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Icon name="fileText" size={40} color={theme.colors.gray} />
        <Text style={styles.emptyText}>Aucune donnée CV</Text>
      </View>
    );
  }

  const displayData = viewMode === 'anonymous'
    ? anonymizeCV(structuredData, profile)
    : { ...structuredData, display_name: `${profile.first_name} ${profile.last_name}`, location: profile.current_city };

  const totalExp = calculateTotalExperience(structuredData.experiences);
  const completeness = getCVCompleteness(structuredData);

  const getLevelLabel = (levelValue) => {
    return LANGUAGE_LEVELS.find(l => l.value === levelValue)?.label || levelValue;
  };

  const getDiplomaLabel = (typeValue) => {
    return DIPLOMA_TYPES.find(d => d.value === typeValue)?.label || typeValue;
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const result = await shareCVPdf(
        structuredData,
        profile,
        viewMode === 'anonymous',
        `CV_${profile.first_name || 'Pharma_Link'}`
      );

      if (!result.success) {
        Alert.alert('Erreur', result.error || 'Impossible de générer le PDF');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Toggle Anonyme/Complet */}
      {showToggle && (
        <View style={styles.toggleContainer}>
          <Pressable
            style={[styles.toggleButton, viewMode === 'anonymous' && styles.toggleButtonActive]}
            onPress={() => setViewMode('anonymous')}
          >
            <Icon
              name="eyeOff"
              size={16}
              color={viewMode === 'anonymous' ? 'white' : theme.colors.textLight}
            />
            <Text style={[styles.toggleText, viewMode === 'anonymous' && styles.toggleTextActive]}>
              Anonyme
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, viewMode === 'full' && styles.toggleButtonActive]}
            onPress={() => setViewMode('full')}
          >
            <Icon
              name="eye"
              size={16}
              color={viewMode === 'full' ? 'white' : theme.colors.textLight}
            />
            <Text style={[styles.toggleText, viewMode === 'full' && styles.toggleTextActive]}>
              Complet
            </Text>
          </Pressable>
        </View>
      )}

      {/* Bouton Export PDF */}
      <Pressable
        style={styles.exportButton}
        onPress={handleExportPdf}
        disabled={exporting}
      >
        {exporting ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <Icon name="download" size={18} color={theme.colors.primary} />
            <Text style={styles.exportButtonText}>Exporter PDF</Text>
          </>
        )}
      </Pressable>

      {/* Indicateur mode anonyme */}
      {viewMode === 'anonymous' && (
        <View style={styles.anonymeBanner}>
          <Icon name="shield" size={14} color={theme.colors.primary} />
          <Text style={styles.anonymeText}>
            Vue recruteur avant match - Infos masquées
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Icon name="user" size={32} color={theme.colors.primary} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{displayData.display_name}</Text>
            <View style={styles.locationRow}>
              <Icon name="mapPin" size={14} color={theme.colors.textLight} />
              <Text style={styles.location}>{displayData.location}</Text>
            </View>
            <Text style={styles.experience}>{totalExp.formatted} d'expérience</Text>
          </View>
          <View style={styles.completenessCircle}>
            <Text style={styles.completenessPercent}>{completeness.percent}%</Text>
          </View>
        </View>

        {/* Résumé */}
        {displayData.summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>À propos</Text>
            <Text style={styles.summaryText}>{displayData.summary}</Text>
          </View>
        ) : null}

        {/* Expériences */}
        {displayData.experiences?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expériences</Text>
            {displayData.experiences.map((exp, index) => (
              <View key={index} style={styles.experienceCard}>
                <View style={styles.expHeader}>
                  <Text style={styles.expTitle}>{exp.job_title}</Text>
                  {exp.is_current && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Actuel</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.expCompany}>
                  {viewMode === 'anonymous' ? exp.company_display : exp.company_name}
                </Text>
                <View style={styles.expMeta}>
                  <Icon name="mapPin" size={12} color={theme.colors.textLight} />
                  <Text style={styles.expMetaText}>
                    {viewMode === 'anonymous' ? exp.location_display : `${exp.city}, ${exp.region}`}
                  </Text>
                  <Text style={styles.expMetaDot}>•</Text>
                  <Icon name="calendar" size={12} color={theme.colors.textLight} />
                  <Text style={styles.expMetaText}>
                    {exp.period || `${exp.start_date} - ${exp.end_date || 'Présent'}`}
                  </Text>
                </View>
                {exp.duration && (
                  <Text style={styles.expDuration}>{exp.duration}</Text>
                )}
                {exp.description ? (
                  <Text style={styles.expDescription}>{exp.description}</Text>
                ) : null}
                {exp.skills?.length > 0 && (
                  <View style={styles.skillsRow}>
                    {exp.skills.slice(0, 4).map((skill, i) => (
                      <View key={i} style={styles.skillChip}>
                        <Text style={styles.skillChipText}>{skill}</Text>
                      </View>
                    ))}
                    {exp.skills.length > 4 && (
                      <Text style={styles.moreSkills}>+{exp.skills.length - 4}</Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Formations */}
        {displayData.formations?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Formations</Text>
            {displayData.formations.map((form, index) => (
              <View key={index} style={styles.formationCard}>
                <Text style={styles.diplomaName}>
                  {form.diploma_name || getDiplomaLabel(form.diploma_type)}
                </Text>
                <Text style={styles.schoolName}>
                  {viewMode === 'anonymous' ? 'Formation pharmaceutique' : form.school_name}
                </Text>
                <View style={styles.formMeta}>
                  <Icon name="mapPin" size={12} color={theme.colors.textLight} />
                  <Text style={styles.expMetaText}>
                    {viewMode === 'anonymous' ? form.region : form.school_city}
                  </Text>
                  <Text style={styles.expMetaDot}>•</Text>
                  <Text style={styles.expMetaText}>{form.year}</Text>
                  {form.mention && (
                    <>
                      <Text style={styles.expMetaDot}>•</Text>
                      <Text style={styles.expMetaText}>{form.mention}</Text>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Compétences */}
        {displayData.skills?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compétences</Text>
            <View style={styles.skillsContainer}>
              {displayData.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillTagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Logiciels */}
        {displayData.software?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Logiciels</Text>
            <View style={styles.skillsContainer}>
              {displayData.software.map((soft, index) => (
                <View key={index} style={[styles.skillTag, styles.softwareTag]}>
                  <Icon name="monitor" size={12} color={theme.colors.secondary} />
                  <Text style={[styles.skillTagText, styles.softwareTagText]}>{soft}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Certifications */}
        {displayData.certifications?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {displayData.certifications.map((cert, index) => (
              <View key={index} style={styles.certRow}>
                <Icon name="checkCircle" size={16} color={theme.colors.success} />
                <Text style={styles.certText}>{cert.name}</Text>
                {cert.year && <Text style={styles.certYear}>{cert.year}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Langues */}
        {displayData.languages?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Langues</Text>
            {displayData.languages.map((lang, index) => (
              <View key={index} style={styles.langRow}>
                <Text style={styles.langName}>
                  {lang.language.charAt(0).toUpperCase() + lang.language.slice(1)}
                </Text>
                <View style={styles.langLevel}>
                  <Text style={styles.langLevelText}>{getLevelLabel(lang.level)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default CVPreview;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(1),
  },
  emptyText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 4,
    marginHorizontal: wp(4),
    marginBottom: hp(1),
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1),
    borderRadius: theme.radius.md,
    gap: wp(1.5),
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.textLight,
  },
  toggleTextActive: {
    color: 'white',
  },
  anonymeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '10',
    paddingVertical: hp(0.8),
    marginHorizontal: wp(4),
    marginBottom: hp(1),
    borderRadius: theme.radius.md,
    gap: wp(1.5),
  },
  anonymeText: {
    fontSize: hp(1.3),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(4),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: hp(2),
    borderRadius: theme.radius.xl,
    marginBottom: hp(2),
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: wp(3),
  },
  name: {
    fontSize: hp(2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginTop: hp(0.3),
  },
  location: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  experience: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    marginTop: hp(0.3),
  },
  completenessCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completenessPercent: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary,
  },
  section: {
    marginBottom: hp(2),
  },
  sectionTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(1),
  },
  summaryText: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    lineHeight: hp(2.2),
  },
  experienceCard: {
    backgroundColor: theme.colors.card,
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    marginBottom: hp(1),
  },
  expHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    flex: 1,
  },
  currentBadge: {
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  currentBadgeText: {
    fontSize: hp(1.1),
    color: theme.colors.success,
    fontFamily: theme.fonts.medium,
  },
  expCompany: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    marginTop: hp(0.3),
  },
  expMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.5),
    flexWrap: 'wrap',
  },
  expMetaText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginLeft: wp(1),
  },
  expMetaDot: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginHorizontal: wp(1.5),
  },
  expDuration: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    fontStyle: 'italic',
    marginTop: hp(0.3),
  },
  expDescription: {
    fontSize: hp(1.4),
    color: theme.colors.text,
    marginTop: hp(0.8),
    lineHeight: hp(2),
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: hp(1),
    gap: wp(1.5),
  },
  skillChip: {
    backgroundColor: theme.colors.primary + '12',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  skillChipText: {
    fontSize: hp(1.2),
    color: theme.colors.primary,
  },
  moreSkills: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    alignSelf: 'center',
  },
  formationCard: {
    backgroundColor: theme.colors.card,
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    marginBottom: hp(1),
  },
  diplomaName: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  schoolName: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    marginTop: hp(0.2),
  },
  formMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  skillTag: {
    backgroundColor: theme.colors.primary + '12',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: theme.radius.full,
  },
  skillTagText: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  softwareTag: {
    backgroundColor: theme.colors.secondary + '12',
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  softwareTagText: {
    color: theme.colors.secondary,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    paddingVertical: hp(0.6),
  },
  certText: {
    flex: 1,
    fontSize: hp(1.4),
    color: theme.colors.text,
  },
  certYear: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(0.6),
  },
  langName: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  langLevel: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.4),
    borderRadius: theme.radius.sm,
  },
  langLevelText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    backgroundColor: theme.colors.primary + '15',
    marginHorizontal: wp(4),
    marginBottom: hp(1),
    paddingVertical: hp(1.2),
    borderRadius: theme.radius.lg,
  },
  exportButtonText: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary,
  },
});