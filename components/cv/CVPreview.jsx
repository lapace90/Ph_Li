import { StyleSheet, Text, View, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { anonymizeCV, calculateTotalExperience, getCVCompleteness } from '../../utils/cvAnonymizer';
import { shareCVPdf } from '../../utils/cvPdfExport';
import { LANGUAGE_LEVELS, DIPLOMA_TYPES, DIPLOMA_MENTIONS } from '../../constants/cvOptions';
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

  // Préparer les données selon le mode
  // Récupérer la localisation depuis les données du CV
  const getLocationFromCV = () => {
    // Priorité 1: données du CV lui-même (saisies dans le formulaire)
    if (structuredData.current_city) {
      if (viewMode === 'anonymous') return structuredData.current_region || 'France';
      return `${structuredData.current_city}, ${structuredData.current_region}`;
    }
    // Priorité 2: fallback sur le profil
    if (viewMode === 'anonymous') return profile.current_region || 'France';
    return profile.current_city 
      ? `${profile.current_city}, ${profile.current_region}` 
      : profile.current_region || 'France';
  };

  // Titre de profession (depuis le CV ou la première expérience)
  const getProfessionTitle = () => {
    // Priorité 1: titre saisi dans le CV
    if (structuredData.profession_title) return structuredData.profession_title;
    // Priorité 2: première expérience
    const firstExp = structuredData.experiences?.[0];
    return firstExp?.job_title || 'Professionnel de santé';
  };

  const displayData = viewMode === 'anonymous'
    ? anonymizeCV(structuredData, profile)
    : { 
        ...structuredData, 
        display_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Candidat', 
        location: getLocationFromCV()
      };

  const totalExp = calculateTotalExperience(structuredData.experiences);
  const completeness = getCVCompleteness(structuredData);

  const getLevelLabel = (levelValue) => {
    return LANGUAGE_LEVELS.find(l => l.value === levelValue)?.label || levelValue;
  };

  const getDiplomaLabel = (typeValue) => {
    return DIPLOMA_TYPES.find(d => d.value === typeValue)?.label || typeValue;
  };

  const getMentionLabel = (mentionValue) => {
    return DIPLOMA_MENTIONS.find(m => m.value === mentionValue)?.label || mentionValue;
  };

  const formatPeriod = (startDate, endDate, isCurrent) => {
    if (!startDate) return '';
    const formatMonth = (dateStr) => {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length < 2) return dateStr;
      const date = new Date(parts[0], parseInt(parts[1]) - 1);
      return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    };
    const start = formatMonth(startDate);
    if (isCurrent || !endDate) return `${start} - Présent`;
    return `${start} - ${formatMonth(endDate)}`;
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
            <Text style={styles.professionTitle}>{getProfessionTitle()}</Text>
            <View style={styles.locationRow}>
              <Icon name="mapPin" size={14} color={theme.colors.textLight} />
              <Text style={styles.location}>{displayData.location || getLocationFromCV()}</Text>
            </View>
            {totalExp.formatted && (
              <Text style={styles.experience}>{totalExp.formatted} d'expérience</Text>
            )}
          </View>
          {completeness && (
            <View style={styles.completenessCircle}>
              <Text style={styles.completenessPercent}>{completeness.percent}%</Text>
            </View>
          )}
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
                  {viewMode === 'anonymous' ? exp.company_display : (exp.company_name || exp.company_display)}
                </Text>
                <View style={styles.expMeta}>
                  <Icon name="mapPin" size={12} color={theme.colors.textLight} />
                  <Text style={styles.expMetaText}>
                    {viewMode === 'anonymous' 
                      ? (exp.location_display || exp.region) 
                      : (exp.city ? `${exp.city}, ${exp.region}` : exp.region)}
                  </Text>
                  <Text style={styles.expMetaDot}>•</Text>
                  <Icon name="calendar" size={12} color={theme.colors.textLight} />
                  <Text style={styles.expMetaText}>
                    {exp.period || formatPeriod(exp.start_date, exp.end_date, exp.is_current)}
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
                    {viewMode === 'anonymous' ? (form.region || 'France') : (form.school_city || form.school_region)}
                  </Text>
                  <Text style={styles.expMetaDot}>•</Text>
                  <Text style={styles.expMetaText}>{form.year}</Text>
                  {form.mention && (
                    <>
                      <Text style={styles.expMetaDot}>•</Text>
                      <Text style={styles.expMetaText}>{getMentionLabel(form.mention)}</Text>
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
                <Icon name="check" size={16} color={theme.colors.success} />
                <Text style={styles.certText}>
                  {typeof cert === 'string' ? cert : cert.name}
                  {cert.year ? ` (${cert.year})` : ''}
                </Text>
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
                  {lang.language?.charAt(0).toUpperCase() + lang.language?.slice(1)}
                </Text>
                <Text style={styles.langLevel}>{getLevelLabel(lang.level)}</Text>
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: hp(4),
  },
  emptyText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    marginTop: hp(1),
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
    gap: wp(1.5),
    paddingVertical: hp(1),
    borderRadius: theme.radius.md,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  toggleTextActive: {
    color: 'white',
    fontFamily: theme.fonts.medium,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: hp(1),
    marginHorizontal: wp(4),
    marginBottom: hp(1),
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.radius.md,
  },
  exportButtonText: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  anonymeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: hp(0.8),
    marginHorizontal: wp(4),
    marginBottom: hp(1),
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.radius.sm,
  },
  anonymeText: {
    fontSize: hp(1.2),
    color: theme.colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(4),
    paddingBottom: hp(4),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    marginBottom: hp(2),
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: wp(3),
  },
  name: {
    fontSize: hp(2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  professionTitle: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginTop: 2,
  },
  location: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  experience: {
    fontSize: hp(1.3),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    marginTop: 4,
  },
  completenessCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completenessPercent: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.bold,
    color: theme.colors.success,
  },
  section: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    marginBottom: hp(1.5),
  },
  sectionTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(1.5),
  },
  summaryText: {
    fontSize: hp(1.4),
    color: theme.colors.text,
    lineHeight: hp(2.2),
  },
  experienceCard: {
    paddingBottom: hp(1.5),
    marginBottom: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  expHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  expTitle: {
    fontSize: hp(1.5),
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
    color: theme.colors.textLight,
    marginTop: 2,
  },
  expMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: wp(1),
    marginTop: hp(0.5),
  },
  expMetaText: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },
  expMetaDot: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },
  expDuration: {
    fontSize: hp(1.2),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    marginTop: hp(0.5),
  },
  expDescription: {
    fontSize: hp(1.3),
    color: theme.colors.text,
    marginTop: hp(1),
    lineHeight: hp(2),
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(1.5),
    marginTop: hp(1),
  },
  skillChip: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  skillChipText: {
    fontSize: hp(1.1),
    color: theme.colors.primary,
  },
  moreSkills: {
    fontSize: hp(1.1),
    color: theme.colors.textLight,
    alignSelf: 'center',
  },
  formationCard: {
    paddingBottom: hp(1.5),
    marginBottom: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  diplomaName: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  schoolName: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: 2,
  },
  formMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginTop: hp(0.5),
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  skillTag: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.md,
  },
  skillTagText: {
    fontSize: hp(1.3),
    color: theme.colors.primary,
  },
  softwareTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    backgroundColor: theme.colors.secondary + '15',
  },
  softwareTagText: {
    color: theme.colors.secondary,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    paddingVertical: hp(0.5),
  },
  certText: {
    fontSize: hp(1.4),
    color: theme.colors.text,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(0.8),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  langName: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  langLevel: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
});