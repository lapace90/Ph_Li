// components/cv/CVAnimatorFormMission.jsx

import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { KNOWN_BRANDS } from '../../constants/profileOptions';
import {
  ANIMATOR_MISSION_TYPES,
  PHARMACY_TYPES_FOR_MISSIONS,
  MISSION_DURATIONS,
  EMPTY_KEY_MISSION,
  generateId,
} from '../../constants/cvAnimatorOptions';
import Icon from '../../assets/icons/Icon';
import CityAutocomplete from '../common/CityAutocomplete';
import MonthYearPicker from '../common/MonthYearPicker';

const CVAnimatorFormMission = ({
  mission = null,
  onSave,
  onCancel,
  onDelete,
}) => {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState(mission || {
    ...EMPTY_KEY_MISSION,
    id: generateId(),
  });
  const [showBrandPicker, setShowBrandPicker] = useState(false);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCitySelect = (cityData) => {
    setFormData(prev => ({
      ...prev,
      city: cityData.city,
      region: cityData.region,
    }));
  };

  const handleSave = () => {
    if (!formData.brand?.trim()) {
      Alert.alert('Erreur', 'La marque est obligatoire');
      return;
    }
    if (!formData.mission_type) {
      Alert.alert('Erreur', 'Le type de mission est obligatoire');
      return;
    }
    onSave(formData);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={onCancel}>
          <Icon name="x" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {mission ? 'Modifier la mission' : 'Ajouter une mission'}
        </Text>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Icon name="check" size={24} color={theme.colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Marque */}
        <View style={styles.field}>
          <Text style={styles.label}>Marque / Laboratoire *</Text>
          {formData.brand ? (
            <View style={styles.selectedBrand}>
              <Text style={styles.selectedBrandText}>{formData.brand}</Text>
              <Pressable onPress={() => updateField('brand', '')}>
                <Icon name="x" size={18} color={theme.colors.textLight} />
              </Pressable>
            </View>
          ) : (
            <>
              <Pressable
                style={styles.brandSelector}
                onPress={() => setShowBrandPicker(!showBrandPicker)}
              >
                <Icon name="search" size={18} color={theme.colors.textLight} />
                <Text style={styles.brandSelectorText}>Sélectionner une marque</Text>
              </Pressable>
              {showBrandPicker && (
                <View style={styles.brandPicker}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ou saisir un nom..."
                    placeholderTextColor={theme.colors.textLight}
                    onSubmitEditing={(e) => {
                      if (e.nativeEvent.text.trim()) {
                        updateField('brand', e.nativeEvent.text.trim());
                        setShowBrandPicker(false);
                      }
                    }}
                  />
                  <ScrollView style={styles.brandList} nestedScrollEnabled>
                    {KNOWN_BRANDS.filter(b => b !== 'Autre').map((brand) => (
                      <Pressable
                        key={brand}
                        style={styles.brandOption}
                        onPress={() => {
                          updateField('brand', brand);
                          setShowBrandPicker(false);
                        }}
                      >
                        <Text style={styles.brandOptionText}>{brand}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </View>

        {/* Type de mission */}
        <View style={styles.field}>
          <Text style={styles.label}>Type de mission *</Text>
          <View style={styles.chipsContainer}>
            {ANIMATOR_MISSION_TYPES.map((type) => (
              <Pressable
                key={type.value}
                style={[styles.chip, formData.mission_type === type.value && styles.chipActive]}
                onPress={() => updateField('mission_type', type.value)}
              >
                <Icon
                  name={type.icon}
                  size={14}
                  color={formData.mission_type === type.value ? 'white' : theme.colors.textLight}
                />
                <Text style={[styles.chipText, formData.mission_type === type.value && styles.chipTextActive]}>
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Type de pharmacie */}
        <View style={styles.field}>
          <Text style={styles.label}>Type de pharmacie</Text>
          <View style={styles.chipsContainer}>
            {PHARMACY_TYPES_FOR_MISSIONS.map((type) => (
              <Pressable
                key={type.value}
                style={[styles.chip, formData.pharmacy_type === type.value && styles.chipActive]}
                onPress={() => updateField('pharmacy_type', formData.pharmacy_type === type.value ? null : type.value)}
              >
                <Text style={[styles.chipText, formData.pharmacy_type === type.value && styles.chipTextActive]}>
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Ville */}
        <View style={styles.field}>
          <Text style={styles.label}>Ville</Text>
          <CityAutocomplete
            placeholder="Rechercher une ville..."
            onSelect={handleCitySelect}
            initialValue={formData.city}
          />
          {formData.region && (
            <Text style={styles.regionText}>Région : {formData.region}</Text>
          )}
        </View>

        {/* Date et durée */}
        <View style={styles.datesRow}>
          <View style={[styles.field, { flex: 1 }]}>
            <MonthYearPicker
              label="Date"
              value={formData.date}
              onChange={(v) => updateField('date', v)}
              placeholder="Sélectionner"
              maxDate="now"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Durée</Text>
            <View style={[styles.chipsContainer, { flexDirection: 'column', gap: hp(0.5) }]}>
              {MISSION_DURATIONS.slice(0, 4).map((dur) => (
                <Pressable
                  key={dur.value}
                  style={[styles.chip, formData.duration_days === dur.value && styles.chipActive, { alignSelf: 'flex-start' }]}
                  onPress={() => updateField('duration_days', formData.duration_days === dur.value ? null : dur.value)}
                >
                  <Text style={[styles.chipText, formData.duration_days === dur.value && styles.chipTextActive]}>
                    {dur.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description de la mission</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Objectifs, déroulement, public ciblé..."
            placeholderTextColor={theme.colors.textLight}
            value={formData.description}
            onChangeText={(v) => updateField('description', v)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Résultats */}
        <View style={styles.field}>
          <Text style={styles.label}>Résultats obtenus (optionnel)</Text>
          <Text style={styles.hint}>Chiffres, retours clients, impact mesurable...</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ex: +35% de ventes sur la gamme, 50 clientes conseillées..."
            placeholderTextColor={theme.colors.textLight}
            value={formData.results}
            onChangeText={(v) => updateField('results', v)}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>

        {/* Bouton supprimer */}
        {mission && onDelete && (
          <Pressable
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                'Supprimer',
                'Supprimer cette mission ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(mission.id) },
                ]
              );
            }}
          >
            <Icon name="trash" size={18} color={theme.colors.rose} />
            <Text style={styles.deleteButtonText}>Supprimer cette mission</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CVAnimatorFormMission;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: wp(4), paddingVertical: hp(1.5),
    borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.card,
  },
  closeButton: { padding: wp(2) },
  headerTitle: { fontSize: hp(1.8), fontFamily: theme.fonts.semiBold, color: theme.colors.text },
  saveButton: { padding: wp(2) },
  scrollView: { flex: 1 },
  content: { padding: wp(5), paddingBottom: hp(10) },
  field: { marginBottom: hp(2.5) },
  label: { fontSize: hp(1.5), fontFamily: theme.fonts.medium, color: theme.colors.text, marginBottom: hp(0.5) },
  hint: { fontSize: hp(1.25), color: theme.colors.textLight, marginBottom: hp(0.8) },
  input: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, borderWidth: 1,
    borderColor: theme.colors.border, paddingHorizontal: wp(4), paddingVertical: hp(1.5),
    fontSize: hp(1.6), color: theme.colors.text,
  },
  textArea: { minHeight: hp(8), textAlignVertical: 'top' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(2) },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: wp(1.5),
    paddingHorizontal: wp(3), paddingVertical: hp(0.8), borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: hp(1.4), color: theme.colors.text },
  chipTextActive: { color: 'white', fontFamily: theme.fonts.medium },
  selectedBrand: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.colors.primary + '15', padding: hp(1.5), borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: theme.colors.primary + '30',
  },
  selectedBrandText: { fontSize: hp(1.6), fontFamily: theme.fonts.semiBold, color: theme.colors.primary },
  brandSelector: {
    flexDirection: 'row', alignItems: 'center', gap: wp(2),
    backgroundColor: theme.colors.card, padding: hp(1.5), borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  brandSelectorText: { fontSize: hp(1.5), color: theme.colors.textLight },
  brandPicker: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.lg,
    padding: hp(1.5), marginTop: hp(1), borderWidth: 1, borderColor: theme.colors.border,
  },
  brandList: { maxHeight: hp(20), marginTop: hp(1) },
  brandOption: {
    paddingVertical: hp(1.2), paddingHorizontal: wp(3),
    borderBottomWidth: 1, borderBottomColor: theme.colors.border + '50',
  },
  brandOptionText: { fontSize: hp(1.5), color: theme.colors.text },
  regionText: { marginTop: hp(0.8), fontSize: hp(1.3), color: theme.colors.primary, fontFamily: theme.fonts.medium },
  datesRow: { flexDirection: 'row', gap: wp(3) },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: wp(2),
    paddingVertical: hp(1.5), marginTop: hp(2),
  },
  deleteButtonText: { fontSize: hp(1.5), color: theme.colors.rose, fontFamily: theme.fonts.medium },
});
