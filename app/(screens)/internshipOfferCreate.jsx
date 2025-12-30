import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { useInternshipOffers } from '../../hooks/useInternshipOffers';
import {
  INTERNSHIP_TYPES,
  STAGE_DURATIONS,
  ALTERNANCE_DURATIONS,
  STAGE_REMUNERATIONS,
  ALTERNANCE_REMUNERATIONS,
  STUDY_LEVELS,
  BENEFITS,
  EMPTY_INTERNSHIP_OFFER,
  getInternshipTypeLabel,
  getStudyLevelLabel,
  getInternshipColor,
  getBenefitLabel,
  getRemunerationLabel,
  isRemunerationRequired,
  formatStartDate,
} from '../../constants/jobOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import CityAutocomplete from '../../components/common/CityAutocomplete';
import StartDatePicker from '../../components/common/StartDatePicker';

// TODO: Passer à false en production
const DEV_BYPASS_RPPS_CHECK = true;

const STEPS = [
  { key: 'type', title: 'Type', subtitle: 'Stage ou alternance' },
  { key: 'details', title: 'Détails', subtitle: 'Description' },
  { key: 'location', title: 'Lieu', subtitle: 'Adresse' },
  { key: 'preview', title: 'Aperçu', subtitle: 'Vérification' },
];

export default function InternshipOfferCreate() {
  const router = useRouter();
  const { session, user, profile } = useAuth();
  const { createOffer } = useInternshipOffers(session?.user?.id);
  
  // Vérification RPPS requise
  const canPublish = DEV_BYPASS_RPPS_CHECK || (user?.user_type === 'titulaire' && user?.rpps_verified);
  
  useEffect(() => {
    if (!canPublish) {
      Alert.alert(
        'Accès refusé',
        'Seuls les titulaires avec un badge RPPS vérifié peuvent publier des annonces.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [canPublish]);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ...EMPTY_INTERNSHIP_OFFER,
    city: profile?.current_city || '',
    postal_code: profile?.current_postal_code || '',
    region: profile?.current_region || '',
    department: profile?.current_department || '',
    latitude: profile?.current_latitude || null,
    longitude: profile?.current_longitude || null,
  });

  const updateField = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Réinitialiser si changement de type
      if (field === 'type') {
        // Réinitialiser la durée si elle n'est pas valide pour le nouveau type
        const validDurations = value === 'stage' 
          ? STAGE_DURATIONS.map(d => d.value)
          : ALTERNANCE_DURATIONS.map(d => d.value);
        
        if (!validDurations.includes(prev.duration_months)) {
          newData.duration_months = null;
        }
        
        // Réinitialiser remuneration si "gratuit" et alternance
        if (value === 'alternance' && prev.remuneration === 'gratuit') {
          newData.remuneration = 'legal_minimum';
        }
      }
      
      if (field === 'duration_months') {
        // Si durée > 2 mois et "gratuit" est sélectionné pour un stage
        if (value > 2 && prev.type === 'stage' && prev.remuneration === 'gratuit') {
          newData.remuneration = 'legal_minimum';
        }
      }
      
      return newData;
    });
  };

  const handleCitySelect = (city) => {
    setFormData(prev => ({
      ...prev,
      city: city.city,
      postal_code: city.postcode,
      region: city.region,
      department: city.department,
      latitude: city.latitude,
      longitude: city.longitude,
    }));
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 0: return formData.type && formData.duration_months;
      case 1: return formData.title && formData.description?.length >= 30;
      case 2: return formData.city && formData.latitude;
      case 3: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handlePublish();
    }
  };

  const handleBack = () => {
    currentStep > 0 ? setCurrentStep(prev => prev - 1) : router.back();
  };

  const handleCancel = () => {
    Alert.alert(
      'Annuler',
      'Voulez-vous vraiment quitter ? Les informations saisies seront perdues.',
      [
        { text: 'Non', style: 'cancel' },
        { text: 'Oui, quitter', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      const { error } = await createOffer({ ...formData, status: 'active' });
      if (error) throw error;
      Alert.alert('Annonce publiée !', `Votre offre de ${formData.type} est maintenant visible.`, [
        { text: 'OK', onPress: () => router.replace('/(screens)/recruiterDashboard') }
      ]);
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de publier');
    } finally {
      setLoading(false);
    }
  };

  const getDurationLabel = (months) => {
    const allDurations = [...STAGE_DURATIONS, ...ALTERNANCE_DURATIONS];
    return allDurations.find(d => d.value === months)?.label || `${months} mois`;
  };

  const toggleBenefit = (value) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits?.includes(value)
        ? prev.benefits.filter(v => v !== value)
        : [...(prev.benefits || []), value],
    }));
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <KeyboardAvoidingView style={commonStyles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={commonStyles.headerNoBorder}>
          <Pressable style={commonStyles.headerButton} onPress={handleBack}>
            <Icon name={currentStep === 0 ? "x" : "arrowLeft"} size={24} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={commonStyles.headerTitle}>{STEPS[currentStep].title}</Text>
            <Text style={commonStyles.hint}>{STEPS[currentStep].subtitle}</Text>
          </View>
          <Pressable style={commonStyles.headerButton} onPress={handleCancel}>
            <Icon name="x" size={24} color={theme.colors.textLight} />
          </Pressable>
        </View>

        {/* Progress */}
        <ProgressSteps steps={STEPS} currentStep={currentStep} />

        {/* Content */}
        <ScrollView 
          style={commonStyles.flex1} 
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 0 && <StepType formData={formData} updateField={updateField} toggleBenefit={toggleBenefit} />}
          {currentStep === 1 && <StepDetails formData={formData} updateField={updateField} />}
          {currentStep === 2 && <StepLocation formData={formData} onCitySelect={handleCitySelect} profile={profile} />}
          {currentStep === 3 && <StepPreview formData={formData} getDurationLabel={getDurationLabel} />}
        </ScrollView>

        {/* Footer */}
        <View style={commonStyles.footer}>
          <Button
            title={currentStep === STEPS.length - 1 ? 'Publier l\'annonce' : 'Continuer'}
            onPress={handleNext}
            loading={loading}
            disabled={!canGoNext()}
            buttonStyle={!canGoNext() && { opacity: 0.5 }}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

// ============================================
// COMPONENTS
// ============================================

const ProgressSteps = ({ steps, currentStep }) => (
  <View style={styles.progressContainer}>
    {steps.map((step, index) => (
      <View key={step.key} style={commonStyles.row}>
        <View style={[
          styles.progressDot,
          index <= currentStep && styles.progressDotActive,
          index < currentStep && styles.progressDotCompleted,
        ]}>
          {index < currentStep ? (
            <Icon name="check" size={12} color="white" />
          ) : (
            <Text style={[styles.progressNumber, index <= currentStep && styles.progressNumberActive]}>
              {index + 1}
            </Text>
          )}
        </View>
        {index < steps.length - 1 && (
          <View style={[styles.progressLine, index < currentStep && styles.progressLineActive]} />
        )}
      </View>
    ))}
  </View>
);

const StepType = ({ formData, updateField, toggleBenefit }) => (
  <View style={commonStyles.section}>
    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Type d'offre *</Text>
      <View style={styles.typeCards}>
        {INTERNSHIP_TYPES.map((type) => (
          <Pressable
            key={type.value}
            style={[
              styles.typeCard,
              formData.type === type.value && { borderColor: getInternshipColor(type.value) }
            ]}
            onPress={() => updateField('type', type.value)}
          >
            <Icon 
              name={type.value === 'stage' ? 'book' : 'briefcase'} 
              size={28} 
              color={formData.type === type.value ? getInternshipColor(type.value) : theme.colors.textLight} 
            />
            <Text style={[styles.typeCardTitle, formData.type === type.value && { color: getInternshipColor(type.value) }]}>
              {type.label}
            </Text>
            <Text style={commonStyles.hint}>
              {type.value === 'stage' ? 'Période de formation' : 'Contrat travail-études'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Durée *</Text>
      {!formData.type && (
        <Text style={commonStyles.hint}>Sélectionnez d'abord le type d'offre</Text>
      )}
      <View style={commonStyles.chipsContainer}>
        {(formData.type === 'stage' ? STAGE_DURATIONS : formData.type === 'alternance' ? ALTERNANCE_DURATIONS : []).map((duration) => (
          <Pressable
            key={duration.value}
            style={[commonStyles.chip, formData.duration_months === duration.value && commonStyles.chipActive]}
            onPress={() => updateField('duration_months', duration.value)}
          >
            <Text style={[commonStyles.chipText, formData.duration_months === duration.value && commonStyles.chipTextActive]}>
              {duration.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Niveau d'études requis</Text>
      <View style={commonStyles.chipsContainer}>
        {STUDY_LEVELS.map((level) => (
          <Pressable
            key={level.value}
            style={[commonStyles.chip, formData.required_level === level.value && commonStyles.chipActive]}
            onPress={() => updateField('required_level', level.value)}
          >
            <Text style={[commonStyles.chipText, formData.required_level === level.value && commonStyles.chipTextActive]}>
              {level.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Rémunération</Text>
      {formData.type === 'alternance' ? (
        <Text style={commonStyles.hint}>
          La rémunération est fixée par l'État selon l'âge de l'alternant
        </Text>
      ) : formData.duration_months > 2 ? (
        <Text style={commonStyles.hint}>
          Gratification obligatoire pour les stages de plus de 2 mois
        </Text>
      ) : (
        <Text style={commonStyles.hint}>
          Les stages de 2 mois ou moins peuvent être non rémunérés
        </Text>
      )}
      <View style={[commonStyles.chipsContainer, { marginTop: hp(1) }]}>
        {(formData.type === 'stage' ? STAGE_REMUNERATIONS : ALTERNANCE_REMUNERATIONS)
          .filter(rem => {
            // Masquer "gratuit" si stage > 2 mois
            if (rem.value === 'gratuit' && formData.duration_months > 2) return false;
            return true;
          })
          .map((rem) => (
            <Pressable
              key={rem.value}
              style={[commonStyles.chip, formData.remuneration === rem.value && commonStyles.chipActive]}
              onPress={() => updateField('remuneration', rem.value)}
            >
              <Text style={[commonStyles.chipText, formData.remuneration === rem.value && commonStyles.chipTextActive]}>
                {rem.label}
              </Text>
            </Pressable>
          ))}
      </View>
      {/* Avertissement si stage > 2 mois et gratuit sélectionné */}
      {formData.type === 'stage' && formData.duration_months > 2 && formData.remuneration === 'gratuit' && (
        <View style={[commonStyles.row, { marginTop: hp(1), gap: wp(2) }]}>
          <Icon name="alertCircle" size={16} color={theme.colors.rose} />
          <Text style={{ color: theme.colors.rose, fontSize: hp(1.4), flex: 1 }}>
            La gratification est obligatoire pour les stages de plus de 2 mois
          </Text>
        </View>
      )}
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Avantages proposés</Text>
      <Text style={commonStyles.hint}>Rendez votre offre plus attractive</Text>
      <View style={[commonStyles.chipsContainer, { marginTop: hp(1) }]}>
        {BENEFITS.map((benefit) => (
          <Pressable
            key={benefit.value}
            style={[commonStyles.chip, formData.benefits?.includes(benefit.value) && commonStyles.chipActive]}
            onPress={() => toggleBenefit(benefit.value)}
          >
            <Text style={[commonStyles.chipText, formData.benefits?.includes(benefit.value) && commonStyles.chipTextActive]}>
              {benefit.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  </View>
);

const StepDetails = ({ formData, updateField }) => (
  <View style={commonStyles.section}>
    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Titre de l'annonce *</Text>
      <Input
        placeholder={`Ex: ${formData.type === 'alternance' ? 'Alternant(e)' : 'Stagiaire'} préparateur en pharmacie`}
        value={formData.title}
        onChangeText={(v) => updateField('title', v)}
      />
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Description *</Text>
      <Input
        placeholder="Décrivez les missions, l'environnement, ce que l'étudiant apprendra..."
        value={formData.description}
        onChangeText={(v) => updateField('description', v)}
        multiline
        numberOfLines={6}
        inputStyle={commonStyles.textArea}
      />
      <Text style={commonStyles.hint}>{formData.description?.length || 0} caractères (min. 30)</Text>
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Date de début souhaitée</Text>
      <StartDatePicker
        value={formData.start_date}
        onChange={(v) => updateField('start_date', v)}
        placeholder="Sélectionner une date..."
      />
    </View>
  </View>
);

const StepLocation = ({ formData, onCitySelect, profile }) => {
  const hasProfileAddress = profile?.current_city;
  const isUsingProfileAddress = formData.city === profile?.current_city;

  const useProfileAddress = () => {
    onCitySelect({
      city: profile.current_city,
      postcode: profile.current_postal_code,
      region: profile.current_region,
      department: profile.current_department,
      latitude: profile.current_latitude,
      longitude: profile.current_longitude,
    });
  };

  return (
    <View style={commonStyles.section}>
      {/* Option rapide : utiliser l'adresse du profil */}
      {hasProfileAddress && (
        <View style={commonStyles.formGroup}>
          <Text style={commonStyles.label}>Adresse de votre pharmacie</Text>
          <Pressable
            style={[
              commonStyles.card,
              isUsingProfileAddress && { borderColor: theme.colors.primary, borderWidth: 2 },
            ]}
            onPress={useProfileAddress}
          >
            <View style={commonStyles.rowBetween}>
              <View style={commonStyles.flex1}>
                <View style={commonStyles.rowGapSmall}>
                  <Icon name="mapPin" size={16} color={theme.colors.primary} />
                  <Text style={{ fontFamily: theme.fonts.medium, color: theme.colors.text }}>
                    {profile.current_city}, {profile.current_postal_code}
                  </Text>
                </View>
                <Text style={[commonStyles.hint, { marginTop: hp(0.5), marginLeft: wp(6) }]}>
                  {profile.current_department}, {profile.current_region}
                </Text>
              </View>
              {isUsingProfileAddress ? (
                <Icon name="checkCircle" size={22} color={theme.colors.primary} />
              ) : (
                <Text style={{ color: theme.colors.primary, fontSize: hp(1.4) }}>Utiliser</Text>
              )}
            </View>
          </Pressable>
        </View>
      )}

      {/* Ou choisir une autre adresse */}
      <View style={commonStyles.formGroup}>
        <Text style={commonStyles.label}>
          {hasProfileAddress ? 'Ou choisir une autre ville' : 'Ville *'}
        </Text>
        <CityAutocomplete
          value={!isUsingProfileAddress && formData.city ? { city: formData.city, postcode: formData.postal_code } : null}
          onSelect={onCitySelect}
          placeholder="Rechercher une ville..."
        />
      </View>

      {/* Résumé si autre ville sélectionnée */}
      {formData.city && !isUsingProfileAddress && (
        <View style={commonStyles.card}>
          <View style={commonStyles.rowGapSmall}>
            <Icon name="mapPin" size={16} color={theme.colors.primary} />
            <Text style={[commonStyles.chipText, { fontFamily: theme.fonts.medium }]}>{formData.city}, {formData.postal_code}</Text>
          </View>
          <View style={[commonStyles.rowGapSmall, { marginTop: hp(0.8) }]}>
            <Icon name="map" size={16} color={theme.colors.textLight} />
            <Text style={commonStyles.hint}>{formData.department}, {formData.region}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const StepPreview = ({ formData, getDurationLabel }) => (
  <View style={commonStyles.card}>
    <View style={[commonStyles.badge, { backgroundColor: getInternshipColor(formData.type) + '15', alignSelf: 'flex-start', marginBottom: hp(1) }]}>
      <Text style={[commonStyles.badgeText, { color: getInternshipColor(formData.type) }]}>
        {getInternshipTypeLabel(formData.type)}
      </Text>
    </View>

    <Text style={commonStyles.sectionTitle}>{formData.title || 'Titre'}</Text>

    <View style={[commonStyles.section, { marginTop: hp(1.5), marginBottom: 0 }]}>
      <InfoRow icon="clock" text={getDurationLabel(formData.duration_months)} />
      <InfoRow icon="mapPin" text={`${formData.city}, ${formData.region}`} />
      {formData.start_date && <InfoRow icon="calendar" text={formatStartDate(formData.start_date)} />}
      {formData.required_level && <InfoRow icon="book" text={getStudyLevelLabel(formData.required_level)} />}
      {formData.remuneration && <InfoRow icon="briefcase" text={getRemunerationLabel(formData.remuneration, formData.type)} />}
    </View>

    <View style={commonStyles.divider} />

    <Text style={commonStyles.sectionTitleSmall}>Description</Text>
    <Text style={[commonStyles.hint, { lineHeight: hp(2.2) }]}>{formData.description}</Text>

    {formData.benefits?.length > 0 && (
      <>
        <Text style={[commonStyles.sectionTitleSmall, { marginTop: hp(2) }]}>Avantages</Text>
        <View style={commonStyles.chipsContainerCompact}>
          {formData.benefits.map((b, i) => (
            <View key={i} style={[commonStyles.badge, { backgroundColor: theme.colors.success + '15' }]}>
              <Text style={[commonStyles.badgeText, { color: theme.colors.success }]}>{getBenefitLabel(b)}</Text>
            </View>
          ))}
        </View>
      </>
    )}
  </View>
);

const InfoRow = ({ icon, text }) => (
  <View style={commonStyles.rowGapSmall}>
    <Icon name={icon} size={16} color={theme.colors.textLight} />
    <Text style={commonStyles.hint}>{text}</Text>
  </View>
);

// ============================================
// STYLES LOCAUX
// ============================================

const styles = StyleSheet.create({
  headerCenter: {
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(2),
    paddingHorizontal: wp(5),
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary,
  },
  progressDotCompleted: {
    backgroundColor: theme.colors.success,
  },
  progressNumber: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.textLight,
  },
  progressNumberActive: {
    color: 'white',
  },
  progressLine: {
    width: wp(8),
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: wp(1),
  },
  progressLineActive: {
    backgroundColor: theme.colors.success,
  },
  typeCards: {
    flexDirection: 'row',
    gap: wp(3),
  },
  typeCard: {
    flex: 1,
    padding: hp(2),
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    gap: hp(1),
  },
  typeCardTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
});