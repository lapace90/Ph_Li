import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { useJobOffers } from '../../hooks/useJobOffers';
import {
  POSITION_TYPES,
  EMPLOYEE_CONTRACT_TYPES,
  SALARY_RANGES,
  EXPERIENCE_LEVELS,
  DIPLOMA_OPTIONS,
  BENEFITS,
  EMPTY_JOB_OFFER,
  getPositionTypeLabel,
  getContractTypeLabel,
  getSalaryRangeLabel,
  getExperienceLabel,
  getDiplomaLabel,
  getBenefitLabel,
  getContractColor,
} from '../../constants/jobOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import CityAutocomplete from '../../components/common/CityAutocomplete';

// TODO: Passer à false en production
const DEV_BYPASS_RPPS_CHECK = true;

const STEPS = [
  { key: 'basics', title: 'Poste', subtitle: 'Type et contrat' },
  { key: 'location', title: 'Lieu', subtitle: 'Adresse' },
  { key: 'criteria', title: 'Critères', subtitle: 'Exigences' },
  { key: 'preview', title: 'Aperçu', subtitle: 'Vérification' },
];

export default function JobOfferCreate() {
  const router = useRouter();
  const { session, user, profile } = useAuth();
  const { createOffer } = useJobOffers(session?.user?.id);
  
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
    ...EMPTY_JOB_OFFER,
    city: profile?.current_city || '',
    postal_code: profile?.current_postal_code || '',
    region: profile?.current_region || '',
    department: profile?.current_department || '',
    latitude: profile?.current_latitude || null,
    longitude: profile?.current_longitude || null,
  });

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const toggleDiploma = (value) => {
    setFormData(prev => ({
      ...prev,
      required_diplomas: prev.required_diplomas?.includes(value)
        ? prev.required_diplomas.filter(v => v !== value)
        : [...(prev.required_diplomas || []), value],
    }));
  };

  const toggleBenefit = (value) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits?.includes(value)
        ? prev.benefits.filter(v => v !== value)
        : [...(prev.benefits || []), value],
    }));
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
      case 0: return formData.title && formData.position_type && formData.contract_type && formData.description?.length >= 30;
      case 1: return formData.city; // Ville suffit, adresse optionnelle
      case 2: return true;
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
      const { error } = await createOffer({
        ...formData,
        required_diplomas: formData.required_diplomas?.length > 0 ? formData.required_diplomas : null,
        status: 'active',
      });
      if (error) throw error;
      Alert.alert('Annonce publiée !', 'Votre annonce est maintenant visible.', [
        { text: 'OK', onPress: () => router.replace('/(screens)/recruiterDashboard') }
      ]);
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de publier');
    } finally {
      setLoading(false);
    }
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
          {currentStep === 0 && <StepBasics formData={formData} updateField={updateField} />}
          {currentStep === 1 && <StepLocation formData={formData} updateField={updateField} onCitySelect={handleCitySelect} profile={profile} />}
          {currentStep === 2 && <StepCriteria formData={formData} updateField={updateField} toggleDiploma={toggleDiploma} toggleBenefit={toggleBenefit} />}
          {currentStep === 3 && <StepPreview formData={formData} />}
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

const StepBasics = ({ formData, updateField }) => (
  <View style={commonStyles.section}>
    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Titre de l'annonce *</Text>
      <Input placeholder="Ex: Préparateur(trice) en pharmacie" value={formData.title} onChangeText={(v) => updateField('title', v)} />
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Type de poste *</Text>
      <View style={commonStyles.chipsContainer}>
        {POSITION_TYPES.map((type) => (
          <Pressable
            key={type.value}
            style={[commonStyles.chip, formData.position_type === type.value && commonStyles.chipActive]}
            onPress={() => updateField('position_type', type.value)}
          >
            <Text style={[commonStyles.chipText, formData.position_type === type.value && commonStyles.chipTextActive]}>
              {type.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Type de contrat *</Text>
      <View style={commonStyles.chipsContainer}>
        {EMPLOYEE_CONTRACT_TYPES.map((type) => (
          <Pressable
            key={type.value}
            style={[commonStyles.chip, formData.contract_type === type.value && commonStyles.chipActive]}
            onPress={() => updateField('contract_type', type.value)}
          >
            <Text style={[commonStyles.chipText, formData.contract_type === type.value && commonStyles.chipTextActive]}>
              {type.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Description *</Text>
      <Input
        placeholder="Décrivez le poste, les missions..."
        value={formData.description}
        onChangeText={(v) => updateField('description', v)}
        multiline
        numberOfLines={5}
        inputStyle={commonStyles.textArea}
      />
      <Text style={commonStyles.hint}>{formData.description?.length || 0} caractères (min. 30)</Text>
    </View>
  </View>
);

const StepLocation = ({ formData, updateField, onCitySelect, profile }) => {
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

      {/* Adresse exacte (optionnelle) */}
      <View style={commonStyles.formGroup}>
        <Text style={commonStyles.label}>Adresse exacte (optionnel)</Text>
        <Input 
          placeholder="Ex: 15 rue de la République" 
          value={formData.address} 
          onChangeText={(v) => updateField('address', v)} 
        />
        <Text style={commonStyles.hint}>L'adresse exacte ne sera visible qu'après un match</Text>
      </View>

      {/* Résumé */}
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

const StepCriteria = ({ formData, updateField, toggleDiploma, toggleBenefit }) => (
  <View style={commonStyles.section}>
    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Expérience requise</Text>
      <View style={commonStyles.chipsContainer}>
        {EXPERIENCE_LEVELS.map((level) => (
          <Pressable
            key={level.value}
            style={[commonStyles.chip, formData.required_experience === level.value && commonStyles.chipActive]}
            onPress={() => updateField('required_experience', level.value)}
          >
            <Text style={[commonStyles.chipText, formData.required_experience === level.value && commonStyles.chipTextActive]}>
              {level.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Diplômes requis</Text>
      <View style={commonStyles.chipsContainer}>
        {DIPLOMA_OPTIONS.slice(0, 4).map((diploma) => (
          <Pressable
            key={diploma.value}
            style={[commonStyles.chip, formData.required_diplomas?.includes(diploma.value) && commonStyles.chipActive]}
            onPress={() => toggleDiploma(diploma.value)}
          >
            <Text style={[commonStyles.chipText, formData.required_diplomas?.includes(diploma.value) && commonStyles.chipTextActive]}>
              {diploma.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Salaire (brut mensuel)</Text>
      <View style={commonStyles.chipsContainer}>
        {SALARY_RANGES.map((range) => (
          <Pressable
            key={range.value}
            style={[commonStyles.chipSmall, formData.salary_range === range.value && commonStyles.chipActive]}
            onPress={() => updateField('salary_range', range.value)}
          >
            <Text style={[commonStyles.chipTextSmall, formData.salary_range === range.value && commonStyles.chipTextActive]}>
              {range.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Avantages proposés</Text>
      <Text style={commonStyles.hint}>Sélectionnez les avantages pour rendre votre offre attractive</Text>
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

const StepPreview = ({ formData }) => (
  <View style={commonStyles.card}>
    <View style={[commonStyles.badge, { backgroundColor: getContractColor(formData.contract_type) + '15', alignSelf: 'flex-start', marginBottom: hp(1) }]}>
      <Text style={[commonStyles.badgeText, { color: getContractColor(formData.contract_type) }]}>
        {getContractTypeLabel(formData.contract_type)}
      </Text>
    </View>

    <Text style={commonStyles.sectionTitle}>{formData.title || 'Titre'}</Text>
    <Text style={commonStyles.hint}>{getPositionTypeLabel(formData.position_type)}</Text>

    <View style={[commonStyles.section, { marginTop: hp(2), marginBottom: 0 }]}>
      <InfoRow icon="mapPin" text={`${formData.city}, ${formData.region}`} />
      {formData.salary_range && <InfoRow icon="briefcase" text={getSalaryRangeLabel(formData.salary_range)} />}
      <InfoRow icon="award" text={getExperienceLabel(formData.required_experience)} />
    </View>

    <View style={commonStyles.divider} />

    <Text style={commonStyles.sectionTitleSmall}>Description</Text>
    <Text style={[commonStyles.hint, { lineHeight: hp(2.2) }]}>{formData.description}</Text>

    {formData.required_diplomas?.length > 0 && (
      <>
        <Text style={[commonStyles.sectionTitleSmall, { marginTop: hp(2) }]}>Diplômes requis</Text>
        <View style={commonStyles.chipsContainerCompact}>
          {formData.required_diplomas.map((d, i) => (
            <View key={i} style={[commonStyles.badge, commonStyles.badgePrimary]}>
              <Text style={[commonStyles.badgeText, commonStyles.badgeTextPrimary]}>{getDiplomaLabel(d)}</Text>
            </View>
          ))}
        </View>
      </>
    )}

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
});