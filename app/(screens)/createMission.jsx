// Création de mission pour les labos et titulaires

import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { missionService } from '../../services/missionService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Icon from '../../assets/icons/Icon';
import CityAutocomplete from '../../components/common/CityAutocomplete';
import { ANIMATION_SPECIALTIES, MISSION_TYPES, PHARMACY_TYPES } from '../../constants/profileOptions';

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
    <View style={styles.multiSelectContainer}>
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
const SingleSelect = ({ label, options, selected, onChange }) => (
  <View style={styles.multiSelectContainer}>
    <Text style={styles.label}>{label}</Text>
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
  const { session, user, laboratoryProfile, refreshLaboratoryProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Infos, 2: Lieu/Dates, 3: Tarif/Exigences
  
  const [formData, setFormData] = useState({
    // Step 1 - Infos de base
    title: '',
    description: '',
    missionType: 'animation',
    
    // Step 2 - Lieu et dates
    city: null,
    address: '',
    pharmacyType: '',
    startDate: null,
    endDate: null,
    flexibleDates: false,
    
    // Step 3 - Tarif et exigences
    dailyRateMin: '',
    dailyRateMax: '',
    requiredSpecialties: [],
    requiresExperience: false,
    additionalInfo: '',
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        if (!formData.title.trim()) {
          Alert.alert('Erreur', 'Le titre de la mission est requis');
          return false;
        }
        if (!formData.missionType) {
          Alert.alert('Erreur', 'Le type de mission est requis');
          return false;
        }
        return true;
      
      case 2:
        if (!formData.city) {
          Alert.alert('Erreur', 'La ville est requise');
          return false;
        }
        return true;
      
      case 3:
        if (!formData.dailyRateMin) {
          Alert.alert('Erreur', 'Le tarif journalier minimum est requis');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      // Déterminer le type de client
      const clientType = user.user_type === 'laboratoire' ? 'laboratory' : 'pharmacy';

      const missionData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        missionType: formData.missionType,
        clientId: session.user.id,
        clientType,
        
        // Lieu
        city: formData.city?.city || formData.city?.label,
        postalCode: formData.city?.postalCode,
        region: formData.city?.region,
        department: formData.city?.department,
        latitude: formData.city?.latitude,
        longitude: formData.city?.longitude,
        address: formData.address.trim() || null,
        pharmacyType: formData.pharmacyType || null,
        
        // Dates
        startDate: formData.startDate,
        endDate: formData.endDate,
        flexibleDates: formData.flexibleDates,
        
        // Tarif et exigences
        dailyRateMin: parseInt(formData.dailyRateMin, 10),
        dailyRateMax: formData.dailyRateMax ? parseInt(formData.dailyRateMax, 10) : null,
        requiredSpecialties: formData.requiredSpecialties,
        requiresExperience: formData.requiresExperience,
        additionalInfo: formData.additionalInfo.trim() || null,
      };

      await missionService.create(missionData);

      // Rafraîchir le profil labo (pour mettre à jour les compteurs)
      if (refreshLaboratoryProfile) {
        await refreshLaboratoryProfile();
      }

      Alert.alert(
        'Mission créée !',
        'Votre mission est maintenant visible par les animateurs.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error creating mission:', error);
      Alert.alert('Erreur', error.message || 'Impossible de créer la mission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Nouvelle mission</Text>
        <Text style={styles.stepIndicator}>{step}/3</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
      </View>

      <ScrollView 
        style={commonStyles.flex1}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Informations de base */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Informations de base</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Titre de la mission *</Text>
              <Input
                placeholder="Ex: Animation gamme solaire"
                value={formData.title}
                onChangeText={(v) => updateField('title', v)}
              />
            </View>

            <SingleSelect
              label="Type de mission *"
              options={MISSION_TYPES}
              selected={formData.missionType}
              onChange={(v) => updateField('missionType', v)}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <Input
                placeholder="Décrivez la mission, les objectifs..."
                value={formData.description}
                onChangeText={(v) => updateField('description', v)}
                multiline
                numberOfLines={4}
                style={styles.textArea}
              />
            </View>
          </View>
        )}

        {/* Step 2: Lieu et dates */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Lieu et dates</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ville *</Text>
              <CityAutocomplete
                value={formData.city}
                onChange={(v) => updateField('city', v)}
                placeholder="Rechercher une ville"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse exacte</Text>
              <Input
                placeholder="Adresse de la pharmacie (optionnel)"
                value={formData.address}
                onChangeText={(v) => updateField('address', v)}
              />
            </View>

            <SingleSelect
              label="Type de pharmacie"
              options={PHARMACY_TYPES}
              selected={formData.pharmacyType}
              onChange={(v) => updateField('pharmacyType', v)}
            />

            {/* TODO: DatePicker pour startDate et endDate */}
            <View style={styles.inputGroup}>
              <Pressable
                style={styles.checkboxRow}
                onPress={() => updateField('flexibleDates', !formData.flexibleDates)}
              >
                <View style={[styles.checkbox, formData.flexibleDates && styles.checkboxChecked]}>
                  {formData.flexibleDates && <Icon name="check" size={14} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>Dates flexibles (à définir avec l'animateur)</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Step 3: Tarif et exigences */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Tarif et exigences</Text>
            
            <View style={styles.rateRow}>
              <View style={styles.rateInput}>
                <Text style={styles.label}>Tarif min/jour (€) *</Text>
                <Input
                  placeholder="200"
                  value={formData.dailyRateMin}
                  onChangeText={(v) => updateField('dailyRateMin', v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.rateInput}>
                <Text style={styles.label}>Tarif max/jour (€)</Text>
                <Input
                  placeholder="300"
                  value={formData.dailyRateMax}
                  onChangeText={(v) => updateField('dailyRateMax', v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <MultiSelect
              label="Spécialités recherchées"
              hint="Sélectionnez les spécialités souhaitées"
              options={ANIMATION_SPECIALTIES}
              selected={formData.requiredSpecialties}
              onChange={(v) => updateField('requiredSpecialties', v)}
            />

            <Pressable
              style={styles.checkboxRow}
              onPress={() => updateField('requiresExperience', !formData.requiresExperience)}
            >
              <View style={[styles.checkbox, formData.requiresExperience && styles.checkboxChecked]}>
                {formData.requiresExperience && <Icon name="check" size={14} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Expérience en animation requise</Text>
            </Pressable>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Informations complémentaires</Text>
              <Input
                placeholder="Autres précisions..."
                value={formData.additionalInfo}
                onChangeText={(v) => updateField('additionalInfo', v)}
                multiline
                numberOfLines={3}
                style={styles.textArea}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer avec boutons */}
      <View style={styles.footer}>
        {step > 1 && (
          <Button
            title="Retour"
            onPress={prevStep}
            variant="outline"
            style={styles.footerButton}
          />
        )}
        {step < 3 ? (
          <Button
            title="Continuer"
            onPress={nextStep}
            style={[styles.footerButton, step === 1 && styles.footerButtonFull]}
          />
        ) : (
          <Button
            title="Publier la mission"
            onPress={handleSubmit}
            loading={loading}
            style={styles.footerButton}
          />
        )}
      </View>
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
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  stepIndicator: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    width: 40,
    textAlign: 'right',
  },
  progressContainer: {
    height: 4,
    backgroundColor: theme.colors.border,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  content: {
    padding: wp(5),
    paddingBottom: hp(4),
  },
  stepContainer: {
    gap: hp(2),
  },
  stepTitle: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: hp(1),
  },
  inputGroup: {
    gap: hp(0.5),
  },
  label: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  hint: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginBottom: hp(0.5),
  },
  textArea: {
    minHeight: hp(12),
    textAlignVertical: 'top',
  },
  multiSelectContainer: {
    gap: hp(1),
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  chip: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: hp(1.4),
    color: theme.colors.text,
  },
  chipTextSelected: {
    color: '#fff',
    fontFamily: theme.fonts.medium,
  },
  rateRow: {
    flexDirection: 'row',
    gap: wp(4),
  },
  rateInput: {
    flex: 1,
    gap: hp(0.5),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    paddingVertical: hp(1),
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxLabel: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: wp(3),
    padding: wp(5),
    paddingBottom: hp(4),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  footerButton: {
    flex: 1,
  },
  footerButtonFull: {
    flex: 1,
  },
});