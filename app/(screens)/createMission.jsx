// Création de mission pour les labos et titulaires

import { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useClientMissions } from '../../hooks/useMissions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import SingleSelect from '../../components/common/SingleSelect';
import MultiSelect from '../../components/common/MultiSelect';
import CityAutocomplete from '../../components/common/CityAutocomplete';
import DateRangePicker from '../../components/common/DateRangePicker';
import { 
  ANIMATION_SPECIALTIES, 
  MISSION_TYPES,
  PHARMACY_ENVIRONMENTS,
} from '../../constants/profileOptions';

export default function CreateMission() {
  const router = useRouter();
  const { session, profile } = useAuth();
  
  const clientType = profile?.user_type === 'laboratoire' ? 'laboratory' : 'pharmacy';
  const { createMission, loading: submitting } = useClientMissions(session?.user?.id, clientType);

  const [form, setForm] = useState({
    title: '',
    description: '',
    missionType: '',
    specialties: [],
    pharmacyEnvironment: '',
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

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

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

  const handleDateChange = ({ startDate, endDate }) => {
    setForm(prev => ({ ...prev, startDate, endDate }));
    if (errors.startDate || errors.endDate) {
      setErrors(prev => ({ ...prev, startDate: null, endDate: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Le titre est requis';
    if (!form.missionType) newErrors.missionType = 'Le type de mission est requis';
    if (form.specialties.length === 0) newErrors.specialties = 'Sélectionnez au moins une spécialité';
    if (!form.startDate) newErrors.startDate = 'La date de début est requise';
    if (!form.endDate) newErrors.endDate = 'La date de fin est requise';
    if (!form.dailyRate || parseFloat(form.dailyRate) <= 0) newErrors.dailyRate = 'Le tarif journalier est requis';
    if (!form.city) newErrors.city = 'La ville est requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      Alert.alert(
        'Succès',
        publish ? 'Votre mission a été publiée !' : 'Votre mission a été enregistrée en brouillon.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Erreur', result.error || 'Une erreur est survenue');
    }
  };

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Nouvelle mission</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <ScrollView
        style={commonStyles.flex1}
        contentContainerStyle={commonStyles.containerPadded}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Titre de la mission *"
          placeholder="Ex: Animation dermocosmétique"
          value={form.title}
          onChangeText={(v) => updateForm('title', v)}
          error={errors.title}
        />

        <Input
          label="Description"
          placeholder="Décrivez la mission, les attentes..."
          value={form.description}
          onChangeText={(v) => updateForm('description', v)}
          multiline
          numberOfLines={4}
          inputStyle={commonStyles.textArea}
        />

        <SingleSelect
          label="Type de mission *"
          options={MISSION_TYPES}
          selected={form.missionType}
          onChange={(v) => updateForm('missionType', v)}
          error={errors.missionType}
        />

        <MultiSelect
          label="Spécialités requises *"
          options={ANIMATION_SPECIALTIES}
          selected={form.specialties}
          onChange={(v) => updateForm('specialties', v)}
          error={errors.specialties}
          hint="Sélectionnez une ou plusieurs spécialités"
          showCount
        />

        <SingleSelect
          label="Type de pharmacie"
          options={PHARMACY_ENVIRONMENTS}  
          selected={form.pharmacyEnvironment}
          onChange={(v) => updateForm('pharmacyEnvironment', v)}
          hint="Optionnel - aide les animateurs à se projeter"
        />

        <View style={commonStyles.formGroup}>
          <Text style={commonStyles.label}>Dates de la mission *</Text>
          <DateRangePicker
            startDate={form.startDate}
            endDate={form.endDate}
            onChange={handleDateChange}
            minDate={new Date()}
            placeholder="Sélectionner les dates"
          />
          {(errors.startDate || errors.endDate) && (
            <Text style={commonStyles.error}>{errors.startDate || errors.endDate}</Text>
          )}
        </View>

        <Input
          label="Tarif journalier (€) *"
          placeholder="250"
          value={form.dailyRate}
          onChangeText={(v) => updateForm('dailyRate', v)}
          keyboardType="numeric"
          error={errors.dailyRate}
        />
        <Text style={[commonStyles.hint, { marginTop: -hp(1), marginBottom: hp(2) }]}>
          Tarif indicatif du marché : 200-300€/jour
        </Text>

        <View style={commonStyles.formGroup}>
          <Text style={commonStyles.label}>Lieu de la mission *</Text>
          <CityAutocomplete
            value={form.city}
            onSelect={handleCitySelect}
            placeholder="Rechercher une ville..."
            error={errors.city}
          />
        </View>

        <View style={[commonStyles.rowGap, { marginTop: hp(2) }]}>
          <Button
            title="Brouillon"
            onPress={() => handleSubmit(false)}
            loading={submitting}
            buttonStyle={commonStyles.buttonOutline}
            textStyle={commonStyles.buttonOutlineText}
            hasShadow={false}
          />
          <Button
            title="Publier"
            onPress={() => handleSubmit(true)}
            loading={submitting}
          />
        </View>

        <View style={{ height: hp(10) }} />
      </ScrollView>
    </ScreenWrapper>
  );
}