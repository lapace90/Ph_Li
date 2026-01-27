import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../../../helpers/common';
import { theme } from '../../../constants/theme';
import { commonStyles } from '../../../constants/styles';
import { useAuth } from '../../../contexts/AuthContext';
import { profileService } from '../../../services/profileService';
import { userService } from '../../../services/userService';
import { rppsService } from '../../../services/rppsService';
import ScreenWrapper from '../../../components/common/ScreenWrapper';
import BackButton from '../../../components/common/BackButton';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import Icon from '../../../assets/icons/Icon';
import CityAutocomplete from '../../../components/common/CityAutocomplete';
import RadiusSlider from '../../../components/common/RadiusSlider';
import AvailabilityPicker from '../../../components/common/AvailabilityPicker';
import ContractTypePicker from '../../../components/common/ContractTypePicker.jsx';
import RelocationToggle from '../../../components/common/RelocationToggle';
import { SPECIALIZATIONS, GENDERS, STUDY_LEVELS } from '../../../constants/profileOptions';

// ============================================
// COMPOSANTS DE SECTION
// ============================================

const SectionIdentity = ({ formData, updateField }) => (
  <View style={commonStyles.section}>
    <Text style={commonStyles.sectionTitle}>Identité</Text>

    <Input
      icon={<Icon name="user" size={22} color={theme.colors.textLight} />}
      placeholder="Prénom *"
      value={formData.firstName}
      onChangeText={(v) => updateField('firstName', v)}
    />

    <Input
      icon={<Icon name="user" size={22} color={theme.colors.textLight} />}
      placeholder="Nom *"
      value={formData.lastName}
      onChangeText={(v) => updateField('lastName', v)}
    />

    <Input
      icon={<Icon name="atSign" size={22} color={theme.colors.textLight} />}
      placeholder="Pseudo (optionnel)"
      value={formData.nickname}
      onChangeText={(v) => updateField('nickname', v.replace(/[^a-zA-Z0-9_-]/g, ''))}
      maxLength={20}
    />
    <Text style={commonStyles.hint}>
      Affiché à la place de votre prénom en mode anonyme (3-20 caractères)
    </Text>

    <Text style={commonStyles.label}>Genre (pour votre avatar) *</Text>
    <View style={styles.genderRow}>
      {GENDERS.map((g) => (
        <Pressable
          key={g.value}
          style={[
            styles.genderOption,
            formData.gender === g.value && styles.genderOptionSelected,
          ]}
          onPress={() => updateField('gender', g.value)}
        >
          <Text style={[
            styles.genderLabel,
            formData.gender === g.value && styles.genderLabelSelected,
          ]}>
            {g.label}
          </Text>
        </Pressable>
      ))}
    </View>

    <Input
      icon={<Icon name="phone" size={22} color={theme.colors.textLight} />}
      placeholder="Téléphone"
      keyboardType="phone-pad"
      value={formData.phone}
      onChangeText={(v) => updateField('phone', v)}
    />
  </View>
);

const SectionLocation = ({ formData, updateField, handleCitySelect, isCandidate }) => (
  <View style={[commonStyles.section, { zIndex: 100 }]}>
    <Text style={commonStyles.sectionTitle}>Localisation</Text>

    <CityAutocomplete
      value={formData.city?.label}
      onSelect={handleCitySelect}
      placeholder="Rechercher votre ville *"
    />

    {isCandidate && (
      <RadiusSlider
        value={formData.searchRadius}
        onChange={(v) => updateField('searchRadius', v)}
      />
    )}
  </View>
);

const SectionExperience = ({ formData, updateField, toggleSpecialization }) => (
  <View style={commonStyles.section}>
    <Text style={commonStyles.sectionTitle}>Expérience</Text>

    <Input
      icon={<Icon name="briefcase" size={22} color={theme.colors.textLight} />}
      placeholder="Années d'expérience"
      keyboardType="numeric"
      value={formData.experienceYears}
      onChangeText={(v) => updateField('experienceYears', v)}
    />

    <Text style={commonStyles.label}>Spécialisations</Text>
    <View style={commonStyles.chipsContainer}>
      {SPECIALIZATIONS.map((spec) => (
        <Pressable
          key={spec}
          style={[
            commonStyles.chip,
            formData.specializations.includes(spec) && commonStyles.chipActive,
          ]}
          onPress={() => toggleSpecialization(spec)}
        >
          <Text style={[
            commonStyles.chipText,
            formData.specializations.includes(spec) && commonStyles.chipTextActive,
          ]}>
            {spec}
          </Text>
        </Pressable>
      ))}
    </View>
  </View>
);

const SectionStudent = ({ formData, updateField }) => (
  <View style={commonStyles.section}>
    <Text style={commonStyles.sectionTitle}>Formation</Text>

    <Text style={commonStyles.label}>Niveau d'études *</Text>
    <View style={commonStyles.chipsContainer}>
      {STUDY_LEVELS.map((level) => (
        <Pressable
          key={level.value}
          style={[
            commonStyles.chip,
            formData.studyLevel === level.value && commonStyles.chipActive,
          ]}
          onPress={() => updateField('studyLevel', level.value)}
        >
          <Text style={[
            commonStyles.chipText,
            formData.studyLevel === level.value && commonStyles.chipTextActive,
          ]}>
            {level.label}
          </Text>
        </Pressable>
      ))}
    </View>

    <Input
      icon={<Icon name="book" size={22} color={theme.colors.textLight} />}
      placeholder="École / Université"
      value={formData.school}
      onChangeText={(v) => updateField('school', v)}
    />
  </View>
);

const SectionRPPS = ({ formData, updateField }) => (
  <View style={commonStyles.section}>
    <Text style={commonStyles.sectionTitle}>Vérification professionnelle</Text>
    <Text style={commonStyles.hint}>
      Entrez votre numéro RPPS pour obtenir le badge vérifié{'\n'}
      Votre nom et prénom seront comparés avec l'Annuaire Santé.
    </Text>

    <Input
      icon={<Icon name="checkCircle" size={22} color={theme.colors.textLight} />}
      placeholder="Numéro RPPS (11 chiffres)"
      keyboardType="numeric"
      maxLength={11}
      value={formData.rppsNumber}
      onChangeText={(v) => updateField('rppsNumber', v.replace(/\D/g, ''))}
    />

    {formData.rppsNumber?.length > 0 && formData.rppsNumber.length !== 11 && (
      <Text style={styles.errorHint}>
        Le numéro RPPS doit contenir 11 chiffres ({formData.rppsNumber.length}/11)
      </Text>
    )}
  </View>
);

const SectionSearch = ({ formData, updateField, role }) => (
  <View style={commonStyles.section}>
    <Text style={commonStyles.sectionTitle}>Recherche</Text>

    <ContractTypePicker
      value={formData.contractTypes}
      onChange={(v) => updateField('contractTypes', v)}
      userType={role}
    />

    <AvailabilityPicker
      value={formData.availability}
      onChange={(v) => updateField('availability', v)}
    />

    <RelocationToggle
      value={formData.willingToRelocate}
      onChange={(v) => updateField('willingToRelocate', v)}
    />
  </View>
);

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function OnboardingForm() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const { session } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    gender: null,
    phone: '',
    city: null,
    experienceYears: '',
    specializations: [],
    rppsNumber: '',
    studyLevel: '',
    school: '',
    availability: null,
    searchRadius: 50,
    contractTypes: [],
    willingToRelocate: false,
  });

  // Helpers
  const isCandidate = role !== 'titulaire';
  const isStudent = role === 'etudiant';
  const canHaveRPPS = role === 'preparateur' || role === 'titulaire';

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSpecialization = (spec) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  const handleCitySelect = (city) => {
    updateField('city', city);
  };

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner votre nom et prénom');
      return false;
    }
    if (!formData.gender) {
      Alert.alert('Erreur', 'Veuillez sélectionner votre genre');
      return false;
    }
    if (!formData.city) {
      Alert.alert('Erreur', 'Veuillez sélectionner votre ville');
      return false;
    }
    if (isStudent && !formData.studyLevel) {
      Alert.alert('Erreur', 'Veuillez sélectionner votre niveau d\'études');
      return false;
    }
    // Validation RPPS si renseigné
    if (canHaveRPPS && formData.rppsNumber && formData.rppsNumber.length !== 11) {
      Alert.alert('Erreur', 'Le numéro RPPS doit contenir exactement 11 chiffres');
      return false;
    }
    return true;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 1. Créer l'entrée users avec le rôle
      await userService.create(session.user.id, session.user.email, role);

      // 2. Créer le profil
      await profileService.upsert(session.user.id, {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        nickname: formData.nickname?.trim() || null,
        gender: formData.gender,
        phone: formData.phone.trim() || null,
        current_city: formData.city.city,
        current_postal_code: formData.city.postcode,
        current_region: formData.city.region,
        current_department: formData.city.department,
        current_latitude: formData.city.latitude,
        current_longitude: formData.city.longitude,
        experience_years: formData.experienceYears ? parseInt(formData.experienceYears) : null,
        specializations: formData.specializations.length > 0 ? formData.specializations : null,
        availability_date: formData.availability === 'immediate'
          ? new Date().toISOString().split('T')[0]
          : formData.availability,
        search_radius_km: formData.searchRadius === -1 ? null : formData.searchRadius,
        preferred_contract_types: formData.contractTypes.length > 0
          ? formData.contractTypes
          : null,
        willing_to_relocate: formData.willingToRelocate,
        // Étudiants
        study_level: formData.studyLevel || null,
        school: formData.school?.trim() || null,
      });

      // 3. Vérifier le RPPS si renseigné (préparateurs et titulaires)
      if (canHaveRPPS && formData.rppsNumber?.trim()) {
        const rppsResult = await rppsService.submitVerification(
          session.user.id,
          formData.rppsNumber.trim(),
          formData.firstName.trim(),
          formData.lastName.trim()
        );

        if (!rppsResult.verified) {
          Alert.alert(
            'Vérification RPPS',
            rppsResult.message || 'Le numéro RPPS n\'a pas pu être vérifié. Vous pourrez le modifier dans votre profil.',
            [{ text: 'Compris' }]
          );
        }
      }

      // 4. Passer à l'étape confidentialité
      router.push({
        pathname: '/(auth)/onboarding/privacy',
        params: { role, gender: formData.gender },
      });
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <ScrollView
        style={commonStyles.flex1}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BackButton router={router} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Étape 2/3</Text>
          <Text style={styles.title}>Vos informations</Text>
          <Text style={commonStyles.hint}>
            Ces informations nous aident à personnaliser votre expérience
          </Text>
        </View>

        {/* Sections */}
        <SectionIdentity formData={formData} updateField={updateField} />

        <SectionLocation
          formData={formData}
          updateField={updateField}
          handleCitySelect={handleCitySelect}
          isCandidate={isCandidate}
        />

        {/* Expérience (pas pour étudiants) */}
        {!isStudent && (
          <SectionExperience
            formData={formData}
            updateField={updateField}
            toggleSpecialization={toggleSpecialization}
          />
        )}

        {/* Études (étudiants uniquement) */}
        {isStudent && (
          <SectionStudent formData={formData} updateField={updateField} />
        )}

        {/* RPPS (préparateurs et titulaires) */}
        {canHaveRPPS && (
          <SectionRPPS formData={formData} updateField={updateField} />
        )}

        {/* Recherche (candidats) */}
        {isCandidate && (
          <SectionSearch formData={formData} updateField={updateField} role={role} />
        )}

        <Button
          title="Continuer"
          loading={loading}
          onPress={handleContinue}
          buttonStyle={styles.submitButton}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

// ============================================
// STYLES LOCAUX (non factorisables)
// ============================================

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(4),
    gap: hp(3),
  },
  header: {
    marginTop: hp(2),
    gap: hp(0.5),
  },
  step: {
    fontSize: hp(1.6),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  title: {
    fontSize: hp(3),
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
  },
  genderRow: {
    flexDirection: 'row',
    gap: wp(3),
  },
  genderOption: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
  },
  genderOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  genderLabel: {
    fontSize: hp(1.7),
    color: theme.colors.text,
  },
  genderLabelSelected: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
  },
  errorHint: {
    fontSize: hp(1.3),
    color: theme.colors.rose,
    marginTop: hp(0.5),
  },
  submitButton: {
    marginTop: hp(2),
  },
});