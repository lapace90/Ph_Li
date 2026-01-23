// app/(screens)/createMission.jsx
// Création de mission pour les labos et titulaires - VERSION CORRIGÉE

import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useClientMissions } from '../../hooks/useMissions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Icon from '../../assets/icons/Icon';
import CityAutocomplete from '../../components/common/CityAutocomplete';
import DateRangePicker from '../../components/common/DateRangePicker';
import { 
  ANIMATION_SPECIALTIES, 
  MISSION_TYPES,
  PHARMACY_ENVIRONMENTS,
} from '../../constants/profileOptions';

// Composant pour sélection multiple
const MultiSelect = ({ label, options, selected, onChange, hint }) => {
  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      <View style={styles.chipsContainer}>
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          const isSelected = selected.includes(value);
          
          return (
            <Pressable
              key={value}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggle(value)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {optionLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

// Composant pour sélection simple
const SingleSelect = ({ label, options, selected, onChange, hint }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>{label}</Text>
    {hint && <Text style={styles.hint}>{hint}</Text>}
    <View style={styles.chipsContainer}>
      {options.map((option) => {
        const value = typeof option === 'string' ? option : option.value;
        const optionLabel = typeof option === 'string' ? option : option.label;
        const isSelected = selected === value;
        
        return (
          <Pressable
            key={value}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onChange(value)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {optionLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </View>
);

export default function CreateMission() {
  const router = useRouter();
  const { session, profile } = useAuth();
  
  // Déterminer le type de client
  const clientType = profile?.user_type === 'laboratoire' ? 'laboratory' : 'pharmacy';

  // Hook pour créer la mission - BONNE PRATIQUE
  const { createMission, loading: submitting } = useClientMissions(
    session?.user?.id,
    clientType
  );

  // État du formulaire
  const [form, setForm] = useState({
    title: '',
    description: '',
    missionType: '',
    specialties: [],
    pharmacyEnvironment: '', // ✅ Renommé pour cohérence
    startDate: null,
    endDate: null,
    dailyRate: '',
    city: '',
    department: '',
    region: '',
    latitude: null,
    longitude: null,
  });

  const [errors, setErrors] = useState({});

  // Mise à jour du formulaire
  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    // Effacer l'erreur du champ
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  // Gestion de la sélection de ville
  const handleCitySelect = (cityData) => {
    setForm(prev => ({
      ...prev,
      city: cityData.city,
      department: cityData.department,
      region: cityData.region,
      latitude: cityData.latitude,
      longitude: cityData.longitude,
    }));
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!form.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }
    if (!form.missionType) {
      newErrors.missionType = 'Le type de mission est requis';
    }
    if (form.specialties.length === 0) {
      newErrors.specialties = 'Sélectionnez au moins une spécialité';
    }
    if (!form.startDate) {
      newErrors.startDate = 'La date de début est requise';
    }
    if (!form.endDate) {
      newErrors.endDate = 'La date de fin est requise';
    }
    if (!form.dailyRate || parseFloat(form.dailyRate) <= 0) {
      newErrors.dailyRate = 'Le tarif journalier est requis';
    }
    if (!form.city) {
      newErrors.city = 'La ville est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (publish = false) => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs du formulaire');
      return;
    }

    const missionData = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      missionType: form.missionType,
      specialties: form.specialties,
      pharmacyEnvironment: form.pharmacyEnvironment || null,
      startDate: form.startDate,
      endDate: form.endDate,
      dailyRate: parseFloat(form.dailyRate),
      city: form.city,
      department: form.department,
      region: form.region,
      latitude: form.latitude,
      longitude: form.longitude,
    };

    const result = await createMission(missionData);

    if (result.success) {
      // Publier directement si demandé
      if (publish && result.mission) {
        // TODO: appeler publishMission si on veut publier directement
      }

      Alert.alert(
        'Succès',
        publish 
          ? 'Votre mission a été publiée !'
          : 'Votre mission a été enregistrée en brouillon.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      Alert.alert('Erreur', result.error || 'Une erreur est survenue');
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <BackButton router={router} />
        <Text style={styles.headerTitle}>Nouvelle mission</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Titre */}
        <View style={styles.fieldContainer}>
          <Input
            label="Titre de la mission *"
            placeholder="Ex: Animation dermocosmétique"
            value={form.title}
            onChangeText={(v) => updateForm('title', v)}
            error={errors.title}
          />
        </View>

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Input
            label="Description"
            placeholder="Décrivez la mission, les attentes..."
            value={form.description}
            onChangeText={(v) => updateForm('description', v)}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Type de mission */}
        <SingleSelect
          label="Type de mission *"
          options={MISSION_TYPES}
          selected={form.missionType}
          onChange={(v) => updateForm('missionType', v)}
          hint={errors.missionType}
        />

        {/* Spécialités requises */}
        <MultiSelect
          label="Spécialités requises *"
          options={ANIMATION_SPECIALTIES}
          selected={form.specialties}
          onChange={(v) => updateForm('specialties', v)}
          hint={errors.specialties || 'Sélectionnez une ou plusieurs spécialités'}
        />

        {/* Type d'environnement (optionnel) */}
        <SingleSelect
          label="Type de pharmacie"
          options={PHARMACY_ENVIRONMENTS}  
          selected={form.pharmacyEnvironment}
          onChange={(v) => updateForm('pharmacyEnvironment', v)}
          hint="Optionnel - aide les animateurs à se projeter"
        />

        {/* Dates */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Dates de la mission *</Text>
          <DateRangePicker
            startDate={form.startDate}
            endDate={form.endDate}
            onStartDateChange={(d) => updateForm('startDate', d)}
            onEndDateChange={(d) => updateForm('endDate', d)}
            minDate={new Date()}
          />
          {(errors.startDate || errors.endDate) && (
            <Text style={styles.errorText}>
              {errors.startDate || errors.endDate}
            </Text>
          )}
        </View>

        {/* Tarif journalier */}
        <View style={styles.fieldContainer}>
          <Input
            label="Tarif journalier (€) *"
            placeholder="250"
            value={form.dailyRate}
            onChangeText={(v) => updateForm('dailyRate', v)}
            keyboardType="numeric"
            error={errors.dailyRate}
            rightIcon={<Text style={styles.euroSymbol}>€/jour</Text>}
          />
          <Text style={styles.hint}>
            Tarif indicatif du marché : 200-300€/jour
          </Text>
        </View>

        {/* Localisation */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Lieu de la mission *</Text>
          <CityAutocomplete
            value={form.city}
            onSelect={handleCitySelect}
            placeholder="Rechercher une ville..."
            error={errors.city}
          />
        </View>

        {/* Boutons d'action */}
        <View style={styles.actions}>
          <Button
            title="Enregistrer brouillon"
            onPress={() => handleSubmit(false)}
            loading={submitting}
            buttonStyle={styles.draftButton}
            textStyle={styles.draftButtonText}
          />
          <Button
            title="Publier la mission"
            onPress={() => handleSubmit(true)}
            loading={submitting}
            buttonStyle={styles.publishButton}
          />
        </View>

        {/* Espace en bas */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray,
  },
  headerTitle: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.textDark,
  },
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
  },
  fieldContainer: {
    marginBottom: hp(2.5),
  },
  label: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    color: theme.colors.textDark,
    marginBottom: hp(1),
  },
  hint: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    marginTop: hp(0.5),
  },
  errorText: {
    fontSize: hp(1.5),
    color: theme.colors.rose,
    marginTop: hp(0.5),
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  chip: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.gray,
    borderWidth: 1,
    borderColor: theme.colors.gray,
  },
  chipSelected: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  chipTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.medium,
  },
  euroSymbol: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  actions: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: hp(2),
  },
  draftButton: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  draftButtonText: {
    color: theme.colors.primary,
  },
  publishButton: {
    flex: 1,
  },
  bottomSpacer: {
    height: hp(10),
  },
});