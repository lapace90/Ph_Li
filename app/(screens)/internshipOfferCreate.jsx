import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform, StyleSheet, Modal, ActivityIndicator, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { useInternshipOffers, useInternshipOffer } from '../../hooks/useInternshipOffers';
import { usePharmacyDetails } from '../../hooks/usePharmacyDetails';
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
import SiretBadge from '../../components/common/SiretBadge';

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
  const { id } = useLocalSearchParams();
  const isEditMode = !!id;

  const { session, user, profile } = useAuth();
  const { createOffer, updateOffer } = useInternshipOffers(session?.user?.id);
  const { offer: existingOffer, loading: offerLoading } = useInternshipOffer(id);
  const { pharmacies, loading: pharmaciesLoading } = usePharmacyDetails(session?.user?.id);

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
  const [publishAsActive, setPublishAsActive] = useState(true);
  const [showPharmacySelector, setShowPharmacySelector] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [discreteMode, setDiscreteMode] = useState(false);
  const [formData, setFormData] = useState({
    ...EMPTY_INTERNSHIP_OFFER,
    city: profile?.current_city || '',
    postal_code: profile?.current_postal_code || '',
    region: profile?.current_region || '',
    department: profile?.current_department || '',
    latitude: profile?.current_latitude || null,
    longitude: profile?.current_longitude || null,
  });

  // Load existing offer data in edit mode
  useEffect(() => {
    if (isEditMode && existingOffer && !offerLoading) {
      setFormData({
        title: existingOffer.title || '',
        description: existingOffer.description || '',
        type: existingOffer.type || null,
        duration_months: existingOffer.duration_months || null,
        remuneration: existingOffer.remuneration || null,
        benefits: existingOffer.benefits || [],
        required_level: existingOffer.required_level || null,
        start_date: existingOffer.start_date || null,
        latitude: existingOffer.latitude || null,
        longitude: existingOffer.longitude || null,
        city: existingOffer.city || '',
        postal_code: existingOffer.postal_code || '',
        region: existingOffer.region || '',
        department: existingOffer.department || '',
        status: existingOffer.status || 'active',
        pharmacy_name: existingOffer.pharmacy_name || '',
        pharmacy_siret: existingOffer.pharmacy_siret || '',
        pharmacy_siret_verified: existingOffer.pharmacy_siret_verified || false,
      });
      setDiscreteMode(existingOffer.discrete_mode || false);
      setPublishAsActive(existingOffer.status === 'active');
    }
  }, [isEditMode, existingOffer, offerLoading]);

  // Load pharmacy when available
  useEffect(() => {
    if (isEditMode && existingOffer?.pharmacy_id && pharmacies?.length > 0 && !selectedPharmacy) {
      const pharmacy = pharmacies.find(p => p.id === existingOffer.pharmacy_id);
      if (pharmacy) {
        setSelectedPharmacy(pharmacy);
      }
    }
  }, [isEditMode, existingOffer?.pharmacy_id, pharmacies, selectedPharmacy]);

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

  const handlePharmacySelect = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setFormData(prev => ({
      ...prev,
      city: pharmacy.city || prev.city,
      postal_code: pharmacy.postal_code || prev.postal_code,
      region: pharmacy.region || prev.region,
      department: pharmacy.department || prev.department,
      latitude: pharmacy.latitude || prev.latitude,
      longitude: pharmacy.longitude || prev.longitude,
      pharmacy_name: pharmacy.name,
      pharmacy_siret: pharmacy.siret,
      pharmacy_siret_verified: pharmacy.siret_verified,
    }));
    setShowPharmacySelector(false);
    Alert.alert(
      'Pharmacie sélectionnée',
      'Les informations de la pharmacie ont été pré-remplies.',
      [{ text: 'OK' }]
    );
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
      const status = publishAsActive ? 'active' : 'draft';
      const dataToSave = {
        ...formData,
        pharmacy_id: selectedPharmacy?.id || null,
        pharmacy_name: discreteMode ? null : (formData.pharmacy_name || null),
        pharmacy_siret: formData.pharmacy_siret || null,
        pharmacy_siret_verified: formData.pharmacy_siret_verified || false,
        discrete_mode: discreteMode,
        status,
      };

      let error;
      if (isEditMode) {
        ({ error } = await updateOffer(id, dataToSave));
      } else {
        ({ error } = await createOffer(dataToSave));
      }

      if (error) throw error;
      Alert.alert(
        isEditMode ? 'Modifications enregistrées' : (publishAsActive ? 'Annonce publiée !' : 'Brouillon enregistré'),
        publishAsActive
          ? `Votre offre de ${formData.type} est maintenant visible.`
          : 'Vous pourrez la publier plus tard.',
        [{ text: 'OK', onPress: () => router.replace('/(screens)/recruiterDashboard') }]
      );
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

  // Show loading while fetching existing offer in edit mode
  if (isEditMode && offerLoading) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={[commonStyles.flex1, commonStyles.centered]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[commonStyles.hint, { marginTop: hp(2) }]}>Chargement de l'annonce...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <KeyboardAvoidingView style={commonStyles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={commonStyles.headerNoBorder}>
          <Pressable style={commonStyles.headerButton} onPress={handleBack}>
            <Icon name={(isEditMode || currentStep > 0) ? "arrowLeft" : "x"} size={24} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={commonStyles.headerTitle}>
              {isEditMode ? 'Modifier' : STEPS[currentStep].title}
            </Text>
            <Text style={commonStyles.hint}>
              {isEditMode ? (existingOffer ? `✅ ${existingOffer.title}` : '⏳ Chargement...') : STEPS[currentStep].subtitle}
            </Text>
          </View>
          {!isEditMode && (
            <Pressable style={commonStyles.headerButton} onPress={handleCancel}>
              <Icon name="x" size={24} color={theme.colors.textLight} />
            </Pressable>
          )}
          {isEditMode && <View style={commonStyles.headerButton} />}
        </View>

        {/* Pharmacy Selector Modal */}
        <PharmacySelectorModal
          visible={showPharmacySelector}
          onClose={() => setShowPharmacySelector(false)}
          pharmacies={pharmacies}
          loading={pharmaciesLoading}
          onSelect={handlePharmacySelect}
        />

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
          {currentStep === 2 && (
            <StepLocation
              formData={formData}
              onCitySelect={handleCitySelect}
              profile={profile}
              pharmacies={pharmacies}
              selectedPharmacy={selectedPharmacy}
              onSelectPharmacy={() => setShowPharmacySelector(true)}
            />
          )}
          {currentStep === 3 && (
            <StepPreview
              formData={formData}
              getDurationLabel={getDurationLabel}
              publishAsActive={publishAsActive}
              setPublishAsActive={setPublishAsActive}
              selectedPharmacy={selectedPharmacy}
              discreteMode={discreteMode}
              setDiscreteMode={setDiscreteMode}
            />
          )}
        </ScrollView>

        {/* Footer */}
        <View style={commonStyles.footer}>
          <Button
            title={currentStep === STEPS.length - 1 ? (publishAsActive ? 'Publier l\'annonce' : 'Enregistrer le brouillon') : 'Continuer'}
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

const StepLocation = ({ formData, onCitySelect, profile, pharmacies = [], selectedPharmacy, onSelectPharmacy }) => {
  const hasPharmacies = pharmacies && pharmacies.length > 0;
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
      {/* Pharmacy Selector */}
      {hasPharmacies && (
        <View style={[commonStyles.formGroup, { marginBottom: hp(2) }]}>
          {selectedPharmacy ? (
            <View style={styles.selectedPharmacyCard}>
              <View style={styles.selectedPharmacyIcon}>
                <Icon name="building" size={20} color={theme.colors.success} />
              </View>
              <View style={commonStyles.flex1}>
                <View style={commonStyles.rowGapSmall}>
                  <Text style={styles.selectedPharmacyTitle}>{selectedPharmacy.name}</Text>
                  {selectedPharmacy.siret_verified && (
                    <View style={styles.verifiedBadgeInline}>
                      <Icon name="checkCircle" size={12} color={theme.colors.success} />
                    </View>
                  )}
                </View>
                <Text style={commonStyles.hint} numberOfLines={1}>
                  {selectedPharmacy.city}
                </Text>
              </View>
              <Pressable onPress={onSelectPharmacy} style={styles.changeButton}>
                <Text style={styles.changeButtonText}>Changer</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.pharmacySelectorButton} onPress={onSelectPharmacy}>
              <View style={styles.pharmacySelectorIcon}>
                <Icon name="building" size={24} color={theme.colors.primary} />
              </View>
              <View style={commonStyles.flex1}>
                <Text style={styles.pharmacySelectorTitle}>Choisir une pharmacie</Text>
                <Text style={commonStyles.hint}>
                  Pré-remplir avec une de vos pharmacies ({pharmacies.length})
                </Text>
              </View>
              <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
            </Pressable>
          )}
        </View>
      )}

      {/* Option rapide : utiliser l'adresse du profil */}
      {hasProfileAddress && !selectedPharmacy && (
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

const StepPreview = ({ formData, getDurationLabel, publishAsActive, setPublishAsActive, selectedPharmacy, discreteMode, setDiscreteMode }) => (
  <View>
    {/* Mode discret si pharmacie sélectionnée */}
    {selectedPharmacy && (
      <View style={commonStyles.card}>
        <View style={commonStyles.rowBetween}>
          <View style={commonStyles.flex1}>
            <Text style={commonStyles.sectionTitleSmall}>Mode discret</Text>
            <Text style={commonStyles.hint}>
              {discreteMode
                ? 'Nom de la pharmacie masqué. Le badge vérifié reste visible.'
                : 'Le nom de la pharmacie sera affiché sur l\'annonce.'}
            </Text>
          </View>
          <Switch
            value={discreteMode}
            onValueChange={setDiscreteMode}
            trackColor={{ false: theme.colors.gray, true: theme.colors.primary + '50' }}
            thumbColor={discreteMode ? theme.colors.primary : '#f4f3f4'}
          />
        </View>
      </View>
    )}

    <View style={commonStyles.card}>
      <View style={[commonStyles.badge, { backgroundColor: getInternshipColor(formData.type) + '15', alignSelf: 'flex-start', marginBottom: hp(1) }]}>
        <Text style={[commonStyles.badgeText, { color: getInternshipColor(formData.type) }]}>
          {getInternshipTypeLabel(formData.type)}
        </Text>
      </View>

      <Text style={commonStyles.sectionTitle}>{formData.title || 'Titre'}</Text>

      <View style={[commonStyles.section, { marginTop: hp(1.5), marginBottom: 0 }]}>
        {selectedPharmacy && (
          <View style={commonStyles.rowGapSmall}>
            <Icon name="building" size={16} color={theme.colors.textLight} />
            <Text style={commonStyles.hint}>
              {discreteMode ? `Pharmacie à ${formData.city}` : selectedPharmacy.name}
            </Text>
            {selectedPharmacy.siret_verified && <SiretBadge verified={true} size="small" />}
          </View>
        )}
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

    {/* Option publication */}
    <View style={[commonStyles.card, { marginTop: hp(2) }]}>
      <Text style={commonStyles.sectionTitleSmall}>Statut de publication</Text>
      <View style={[commonStyles.rowGapSmall, { marginTop: hp(1.5) }]}>
        <Pressable
          style={[styles.statusOption, publishAsActive && styles.statusOptionActive]}
          onPress={() => setPublishAsActive(true)}
        >
          <Icon name="eye" size={20} color={publishAsActive ? theme.colors.primary : theme.colors.textLight} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusOptionTitle, publishAsActive && { color: theme.colors.primary }]}>
              Publier maintenant
            </Text>
            <Text style={commonStyles.hint}>Visible immédiatement</Text>
          </View>
          {publishAsActive && <Icon name="check" size={20} color={theme.colors.primary} />}
        </Pressable>

        <Pressable
          style={[styles.statusOption, !publishAsActive && styles.statusOptionActive]}
          onPress={() => setPublishAsActive(false)}
        >
          <Icon name="edit" size={20} color={!publishAsActive ? theme.colors.secondary : theme.colors.textLight} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusOptionTitle, !publishAsActive && { color: theme.colors.secondary }]}>
              Brouillon
            </Text>
            <Text style={commonStyles.hint}>Enregistrer sans publier</Text>
          </View>
          {!publishAsActive && <Icon name="check" size={20} color={theme.colors.secondary} />}
        </Pressable>
      </View>
    </View>
  </View>
);

const InfoRow = ({ icon, text }) => (
  <View style={commonStyles.rowGapSmall}>
    <Icon name={icon} size={16} color={theme.colors.textLight} />
    <Text style={commonStyles.hint}>{text}</Text>
  </View>
);

const PharmacySelectorModal = ({ visible, onClose, pharmacies = [], loading, onSelect }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Sélectionner une pharmacie</Text>
          <Pressable onPress={onClose} style={styles.modalCloseButton}>
            <Icon name="x" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        {loading ? (
          <View style={[commonStyles.centered, { padding: hp(4) }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[commonStyles.hint, { marginTop: hp(2) }]}>Chargement...</Text>
          </View>
        ) : pharmacies.length === 0 ? (
          <View style={[commonStyles.centered, { padding: hp(4) }]}>
            <Icon name="building" size={48} color={theme.colors.textLight} />
            <Text style={[commonStyles.hint, { marginTop: hp(2), textAlign: 'center' }]}>
              Aucune pharmacie enregistrée
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            {pharmacies.map((pharmacy) => (
              <Pressable
                key={pharmacy.id}
                style={styles.pharmacyOption}
                onPress={() => onSelect(pharmacy)}
              >
                <View style={styles.pharmacyOptionIcon}>
                  <Icon name="building" size={20} color={theme.colors.primary} />
                </View>
                <View style={commonStyles.flex1}>
                  <View style={commonStyles.rowGapSmall}>
                    <Text style={styles.pharmacyOptionName}>{pharmacy.name}</Text>
                    {pharmacy.siret_verified && (
                      <View style={styles.verifiedBadge}>
                        <Icon name="checkCircle" size={12} color={theme.colors.success} />
                      </View>
                    )}
                  </View>
                  <Text style={commonStyles.hint} numberOfLines={1}>
                    {pharmacy.address}, {pharmacy.city}
                  </Text>
                  {pharmacy.siret && (
                    <Text style={[commonStyles.hint, { fontSize: hp(1.2), marginTop: hp(0.2) }]}>
                      SIRET: {pharmacy.siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')}
                    </Text>
                  )}
                </View>
                <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.modalFooter}>
          <Button title="Annuler" onPress={onClose} buttonStyle={styles.cancelButton} />
        </View>
      </View>
    </View>
  </Modal>
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
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  statusOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '08',
  },
  statusOptionTitle: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  // Pharmacy Selector
  pharmacySelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: theme.colors.card,
    padding: hp(2),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  pharmacySelectorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pharmacySelectorTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  selectedPharmacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: theme.colors.success + '10',
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.success + '30',
  },
  selectedPharmacyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPharmacyTitle: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.success,
  },
  changeButton: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.success + '40',
  },
  changeButtonText: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.medium,
    color: theme.colors.success,
  },
  verifiedBadgeInline: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: hp(2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  modalCloseButton: {
    padding: hp(0.5),
  },
  modalList: {
    flex: 1,
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
  },
  modalFooter: {
    padding: hp(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelButton: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pharmacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: theme.colors.card,
    padding: hp(1.8),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: hp(1.5),
  },
  pharmacyOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pharmacyOptionName: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
});