// app/(auth)/onboarding/animator.jsx
// Onboarding spécifique pour les animateurs freelance

import { Alert, Pressable, ScrollView, StyleSheet, Text, View, Switch } from 'react-native';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../../../helpers/common';
import { theme } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import ScreenWrapper from '../../../components/common/ScreenWrapper';
import BackButton from '../../../components/common/BackButton';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import Icon from '../../../assets/icons/Icon';
import CityAutocomplete from '../../../components/common/CityAutocomplete';
import { 
  ANIMATION_SPECIALTIES, 
  KNOWN_BRANDS, 
  GENDERS,
  DAILY_RATE_RANGES,
} from '../../../constants/profileOptions';
import { REGIONS } from '../../../constants/cvOptions';

export default function AnimatorOnboarding() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const { session, refreshUserData } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Infos perso, 2: Spécialités, 3: Tarifs & Mobilité
  
  // Step 1: Infos personnelles
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState(null);
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(null);
  
  // Step 2: Spécialités & Expérience
  const [specialties, setSpecialties] = useState([]);
  const [brands, setBrands] = useState([]);
  const [experienceYears, setExperienceYears] = useState('');
  
  // Step 3: Tarifs & Mobilité
  const [dailyRateMin, setDailyRateMin] = useState('200');
  const [dailyRateMax, setDailyRateMax] = useState('300');
  const [mobilityZones, setMobilityZones] = useState([]);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [siret, setSiret] = useState('');

  const toggleSpecialty = (value) => {
    setSpecialties((prev) =>
      prev.includes(value)
        ? prev.filter((s) => s !== value)
        : [...prev, value]
    );
  };

  const toggleBrand = (value) => {
    setBrands((prev) =>
      prev.includes(value)
        ? prev.filter((b) => b !== value)
        : [...prev, value]
    );
  };

  const toggleZone = (region) => {
    setMobilityZones((prev) =>
      prev.includes(region)
        ? prev.filter((z) => z !== region)
        : [...prev, region]
    );
  };

  const validateStep1 = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner votre nom et prénom');
      return false;
    }
    if (!gender) {
      Alert.alert('Erreur', 'Veuillez sélectionner votre genre');
      return false;
    }
    if (!city) {
      Alert.alert('Erreur', 'Veuillez sélectionner votre ville');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (specialties.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une spécialité');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (mobilityZones.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une zone de mobilité');
      return false;
    }
    const min = parseInt(dailyRateMin, 10);
    const max = parseInt(dailyRateMax, 10);
    if (isNaN(min) || isNaN(max) || min > max) {
      Alert.alert('Erreur', 'Veuillez renseigner des tarifs valides');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    try {
      const userId = session.user.id;

      // 1. Mettre à jour users avec le type
      const { error: userError } = await supabase
        .from('users')
        .update({ user_type: 'animateur' })
        .eq('id', userId);
      if (userError) throw userError;

      // 2. Créer/mettre à jour le profil de base
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          gender,
          phone: phone.trim() || null,
          current_city: city.nom,
          current_postal_code: city.codesPostaux?.[0] || null,
          current_department: city.departement?.nom || null,
          current_region: city.region?.nom || null,
          current_latitude: city.centre?.coordinates?.[1] || null,
          current_longitude: city.centre?.coordinates?.[0] || null,
          experience_years: parseInt(experienceYears, 10) || null,
        });
      if (profileError) throw profileError;

      // 3. Créer le profil animateur
      const { error: animatorError } = await supabase
        .from('animator_profiles')
        .upsert({
          id: userId,
          animation_specialties: specialties,
          brands_experience: brands,
          daily_rate_min: parseInt(dailyRateMin, 10),
          daily_rate_max: parseInt(dailyRateMax, 10),
          mobility_zones: mobilityZones,
          has_vehicle: hasVehicle,
          siret_number: siret.replace(/\s/g, '') || null,
        });
      if (animatorError) throw animatorError;

      // 4. Créer les privacy settings par défaut
      const { error: privacyError } = await supabase
        .from('privacy_settings')
        .upsert({
          user_id: userId,
          profile_visibility: 'public',
          show_full_name: true,
          show_photo: true,
          show_exact_location: false,
          searchable_by_recruiters: true,
        });
      if (privacyError) throw privacyError;

      // 5. Marquer le profil comme complet
      await supabase
        .from('users')
        .update({ profile_completed: true })
        .eq('id', userId);

      // 6. Rafraîchir et rediriger
      await refreshUserData();
      router.replace('/(tabs)/home');

    } catch (error) {
      console.error('Erreur onboarding animateur:', error);
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Composant chip sélectionnable
  const SelectableChip = ({ label, selected, onPress }) => (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
      {selected && (
        <Icon name="check" size={14} color="#fff" style={{ marginLeft: 4 }} />
      )}
    </Pressable>
  );

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={handleBack} />
          <Text style={styles.step}>Étape {step}/3</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 1: Infos personnelles */}
          {step === 1 && (
            <>
              <Text style={styles.title}>Vos informations</Text>
              <Text style={styles.subtitle}>
                Ces informations seront visibles par les recruteurs
              </Text>

              <View style={styles.form}>
                <Input
                  label="Prénom"
                  placeholder="Votre prénom"
                  value={firstName}
                  onChangeText={setFirstName}
                />

                <Input
                  label="Nom"
                  placeholder="Votre nom"
                  value={lastName}
                  onChangeText={setLastName}
                />

                <Text style={styles.label}>Genre</Text>
                <View style={styles.genderRow}>
                  {GENDERS.map((g) => (
                    <Pressable
                      key={g.value}
                      style={[
                        styles.genderOption,
                        gender === g.value && styles.genderOptionSelected,
                      ]}
                      onPress={() => setGender(g.value)}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          gender === g.value && styles.genderTextSelected,
                        ]}
                      >
                        {g.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Input
                  label="Téléphone (optionnel)"
                  placeholder="06 12 34 56 78"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />

                <Text style={styles.label}>Ville</Text>
                <CityAutocomplete
                  value={city?.nom || ''}
                  onSelect={setCity}
                  placeholder="Rechercher votre ville"
                />
              </View>
            </>
          )}

          {/* STEP 2: Spécialités */}
          {step === 2 && (
            <>
              <Text style={styles.title}>Vos spécialités</Text>
              <Text style={styles.subtitle}>
                Sélectionnez les domaines dans lesquels vous intervenez
              </Text>

              <View style={styles.form}>
                <Text style={styles.label}>Spécialités d'animation *</Text>
                <View style={styles.chipContainer}>
                  {ANIMATION_SPECIALTIES.map((spec) => (
                    <SelectableChip
                      key={spec.value}
                      label={spec.label}
                      selected={specialties.includes(spec.value)}
                      onPress={() => toggleSpecialty(spec.value)}
                    />
                  ))}
                </View>

                <Text style={[styles.label, { marginTop: hp(2) }]}>
                  Marques / Labos représentés (optionnel)
                </Text>
                <View style={styles.chipContainer}>
                  {KNOWN_BRANDS.slice(0, 15).map((brand) => (
                    <SelectableChip
                      key={brand}
                      label={brand}
                      selected={brands.includes(brand)}
                      onPress={() => toggleBrand(brand)}
                    />
                  ))}
                </View>

                <Input
                  label="Années d'expérience en animation"
                  placeholder="Ex: 5"
                  value={experienceYears}
                  onChangeText={setExperienceYears}
                  keyboardType="number-pad"
                  containerStyle={{ marginTop: hp(2) }}
                />
              </View>
            </>
          )}

          {/* STEP 3: Tarifs & Mobilité */}
          {step === 3 && (
            <>
              <Text style={styles.title}>Tarifs & Mobilité</Text>
              <Text style={styles.subtitle}>
                Définissez vos conditions d'intervention
              </Text>

              <View style={styles.form}>
                <Text style={styles.label}>Tarif journalier (€)</Text>
                <View style={styles.rateRow}>
                  <Input
                    placeholder="Min"
                    value={dailyRateMin}
                    onChangeText={setDailyRateMin}
                    keyboardType="number-pad"
                    containerStyle={styles.rateInput}
                  />
                  <Text style={styles.rateSeparator}>à</Text>
                  <Input
                    placeholder="Max"
                    value={dailyRateMax}
                    onChangeText={setDailyRateMax}
                    keyboardType="number-pad"
                    containerStyle={styles.rateInput}
                  />
                  <Text style={styles.rateUnit}>€/jour</Text>
                </View>

                <Text style={[styles.label, { marginTop: hp(2) }]}>
                  Zones de mobilité *
                </Text>
                <Text style={styles.hint}>
                  Sélectionnez les régions où vous pouvez vous déplacer
                </Text>
                <View style={styles.chipContainer}>
                  {REGIONS.slice(0, 13).map((region) => (
                    <SelectableChip
                      key={region}
                      label={region}
                      selected={mobilityZones.includes(region)}
                      onPress={() => toggleZone(region)}
                    />
                  ))}
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchContent}>
                    <Icon name="car" size={20} color={theme.colors.primary} />
                    <Text style={styles.switchLabel}>Je dispose d'un véhicule</Text>
                  </View>
                  <Switch
                    value={hasVehicle}
                    onValueChange={setHasVehicle}
                    trackColor={{ false: theme.colors.gray, true: theme.colors.primary + '50' }}
                    thumbColor={hasVehicle ? theme.colors.primary : theme.colors.darkLight}
                  />
                </View>

                <Input
                  label="Numéro SIRET (optionnel)"
                  placeholder="123 456 789 00012"
                  value={siret}
                  onChangeText={setSiret}
                  keyboardType="number-pad"
                  containerStyle={{ marginTop: hp(2) }}
                />
                <Text style={styles.hint}>
                  Votre SIRET sera vérifié pour obtenir le badge "Animateur Vérifié"
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {step < 3 ? (
            <Button title="Continuer" onPress={handleNext} />
          ) : (
            <Button
              title="Terminer l'inscription"
              onPress={handleSubmit}
              loading={loading}
            />
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(5),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(2),
  },
  step: {
    fontSize: hp(1.6),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: hp(4),
  },
  title: {
    fontSize: hp(2.8),
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: hp(1.7),
    color: theme.colors.textLight,
    marginBottom: hp(3),
  },
  form: {
    gap: hp(1.5),
  },
  label: {
    fontSize: hp(1.7),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    marginBottom: hp(0.5),
  },
  hint: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: hp(0.5),
  },
  genderRow: {
    flexDirection: 'row',
    gap: wp(3),
    marginBottom: hp(1),
  },
  genderOption: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  genderOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  genderText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  genderTextSelected: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  chipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    fontSize: hp(1.5),
    color: theme.colors.text,
  },
  chipTextSelected: {
    color: '#fff',
    fontFamily: theme.fonts.medium,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateInput: {
    flex: 1,
  },
  rateSeparator: {
    marginHorizontal: wp(2),
    color: theme.colors.textLight,
  },
  rateUnit: {
    marginLeft: wp(2),
    color: theme.colors.textLight,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    padding: hp(2),
    borderRadius: theme.radius.lg,
    marginTop: hp(2),
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  switchLabel: {
    fontSize: hp(1.7),
    color: theme.colors.text,
  },
  footer: {
    paddingVertical: hp(2),
  },
});