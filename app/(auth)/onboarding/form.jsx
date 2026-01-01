import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../../../helpers/common';
import { theme } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { profileService } from '../../../services/profileService';
import { userService } from '../../../services/userService';
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
import { SPECIALIZATIONS } from '../../../constants/profileOptions';

const GENDERS = [
  { value: 'male', label: 'Homme' },
  { value: 'female', label: 'Femme' },
  { value: 'other', label: 'Autre' },
];

const STUDY_LEVELS = [
  '1ère année',
  '2ème année',
  '3ème année',
  '4ème année',
  '5ème année',
  '6ème année',
];

export default function OnboardingForm() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const { session } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: null,
    phone: '',
    // Location
    city: null, // Objet complet de CityAutocomplete
    // Experience
    experienceYears: '',
    specializations: [],
    rppsNumber: '',
    // Student
    studyLevel: '',
    school: '',
    // Availability
    availability: null, // 'immediate' ou date ISO
    searchRadius: 50,
    contractTypes: [],
    willingToRelocate: false,
  });

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

  const isCandidate = role !== 'titulaire';
  const isStudent = role === 'etudiant';
  const canHaveRPPS = role === 'preparateur' || role === 'titulaire';

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
        availability_date: formData.availability === 'immediate' ? new Date().toISOString().split('T')[0] : formData.availability,
        search_radius_km: formData.searchRadius === -1 ? null : formData.searchRadius,
        preferred_contract_types: formData.contractTypes.length > 0 ? formData.contractTypes : null,
        willing_to_relocate: formData.willingToRelocate,
      });

      // Passer à l'étape confidentialité
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
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BackButton router={router} />

        <View style={styles.header}>
          <Text style={styles.step}>Étape 2/3</Text>
          <Text style={styles.title}>Vos informations</Text>
          <Text style={styles.subtitle}>
            Ces informations nous aident à personnaliser votre expérience
          </Text>
        </View>

        {/* Identité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identité</Text>

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

          <Text style={styles.label}>Genre (pour votre avatar) *</Text>
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

        {/* Localisation */}
        <View style={[styles.section, { zIndex: 100 }]}>
          <Text style={styles.sectionTitle}>Localisation</Text>

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

        {/* Expérience (pas pour étudiants) */}
        {!isStudent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expérience</Text>

            <Input
              icon={<Icon name="briefcase" size={22} color={theme.colors.textLight} />}
              placeholder="Années d'expérience"
              keyboardType="numeric"
              value={formData.experienceYears}
              onChangeText={(v) => updateField('experienceYears', v)}
            />

            <Text style={styles.label}>Spécialisations</Text>
            <View style={styles.tagsContainer}>
              {SPECIALIZATIONS.map((spec) => (
                <Pressable
                  key={spec}
                  style={[
                    styles.tag,
                    formData.specializations.includes(spec) && styles.tagSelected,
                  ]}
                  onPress={() => toggleSpecialization(spec)}
                >
                  <Text style={[
                    styles.tagText,
                    formData.specializations.includes(spec) && styles.tagTextSelected,
                  ]}>
                    {spec}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Études (étudiants seulement) */}
        {isStudent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Formation</Text>

            <Text style={styles.label}>Niveau d'études *</Text>
            <View style={styles.tagsContainer}>
              {STUDY_LEVELS.map((level) => (
                <Pressable
                  key={level}
                  style={[
                    styles.tag,
                    formData.studyLevel === level && styles.tagSelected,
                  ]}
                  onPress={() => updateField('studyLevel', level)}
                >
                  <Text style={[
                    styles.tagText,
                    formData.studyLevel === level && styles.tagTextSelected,
                  ]}>
                    {level}
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
        )}

        {/* RPPS (préparateurs et titulaires) */}
        {canHaveRPPS && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vérification professionnelle</Text>
            <Text style={styles.hint}>
              Optionnel : ajoutez votre numéro RPPS pour obtenir le badge vérifié
            </Text>

            <Input
              icon={<Icon name="checkCircle" size={22} color={theme.colors.textLight} />}
              placeholder="Numéro RPPS (optionnel)"
              keyboardType="numeric"
              value={formData.rppsNumber}
              onChangeText={(v) => updateField('rppsNumber', v)}
            />
          </View>
        )}

        {/* Recherche (candidats) */}
        {isCandidate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recherche</Text>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(4),
    gap: hp(3),
  },
  header: {
    marginTop: hp(2),
  },
  step: {
    fontSize: hp(1.6),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    marginBottom: hp(1),
  },
  title: {
    fontSize: hp(3),
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
  },
  subtitle: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    marginTop: hp(0.5),
  },
  section: {
    gap: hp(1.5),
  },
  sectionTitle: {
    fontSize: hp(2),
    color: theme.colors.text,
    fontFamily: theme.fonts.semiBold,
  },
  label: {
    fontSize: hp(1.7),
    color: theme.colors.textLight,
    marginTop: hp(0.5),
  },
  hint: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    fontStyle: 'italic',
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hp(1),
  },
  tag: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  tagSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '15',
  },
  tagText: {
    fontSize: hp(1.5),
    color: theme.colors.text,
  },
  tagTextSelected: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  submitButton: {
    marginTop: hp(2),
  },
});