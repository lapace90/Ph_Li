// components/cv/CVAnimatorFormBrands.jsx

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
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { KNOWN_BRANDS, ANIMATION_SPECIALTIES } from '../../constants/profileOptions';
import { MISSION_COUNT_RANGES, EMPTY_BRAND_EXPERIENCE, generateId } from '../../constants/cvAnimatorOptions';
import Icon from '../../assets/icons/Icon';

const YEARS_OPTIONS = [
  { value: 1, label: '< 1 an' },
  { value: 2, label: '1-2 ans' },
  { value: 3, label: '3-5 ans' },
  { value: 5, label: '5-10 ans' },
  { value: 10, label: '10+ ans' },
];

const CVAnimatorFormBrands = ({
  brandExperience = null,
  onSave,
  onCancel,
  onDelete,
}) => {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState(brandExperience || {
    ...EMPTY_BRAND_EXPERIENCE,
    id: generateId(),
  });
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [customBrand, setCustomBrand] = useState('');

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSpecialty = (value) => {
    const current = formData.specialties || [];
    const updated = current.includes(value)
      ? current.filter(s => s !== value)
      : [...current, value];
    updateField('specialties', updated);
  };

  const handleSave = () => {
    if (!formData.brand?.trim()) {
      Alert.alert('Erreur', 'Le nom de la marque est obligatoire');
      return;
    }
    onSave(formData);
  };

  const selectBrand = (brand) => {
    updateField('brand', brand);
    setShowBrandPicker(false);
  };

  const addCustomBrand = () => {
    if (customBrand.trim()) {
      updateField('brand', customBrand.trim());
      setCustomBrand('');
      setShowBrandPicker(false);
    }
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
          {brandExperience ? 'Modifier la marque' : 'Ajouter une marque'}
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
        {/* Marque/Labo */}
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
            <Pressable
              style={styles.brandSelector}
              onPress={() => setShowBrandPicker(!showBrandPicker)}
            >
              <Icon name="search" size={18} color={theme.colors.textLight} />
              <Text style={styles.brandSelectorText}>Sélectionner une marque</Text>
            </Pressable>
          )}

          {showBrandPicker && (
            <View style={styles.brandPicker}>
              <View style={styles.customBrandRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Saisir un nom..."
                  placeholderTextColor={theme.colors.textLight}
                  value={customBrand}
                  onChangeText={setCustomBrand}
                />
                {customBrand.trim() ? (
                  <Pressable style={styles.addCustomButton} onPress={addCustomBrand}>
                    <Icon name="plus" size={18} color="white" />
                  </Pressable>
                ) : null}
              </View>
              <ScrollView style={styles.brandList} nestedScrollEnabled>
                {KNOWN_BRANDS.filter(b => b !== 'Autre').map((brand) => (
                  <Pressable
                    key={brand}
                    style={styles.brandOption}
                    onPress={() => selectBrand(brand)}
                  >
                    <Text style={styles.brandOptionText}>{brand}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Années d'expérience */}
        <View style={styles.field}>
          <Text style={styles.label}>Années d'expérience avec cette marque</Text>
          <View style={styles.chipsContainer}>
            {YEARS_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.chip, formData.years === option.value && styles.chipActive]}
                onPress={() => updateField('years', formData.years === option.value ? null : option.value)}
              >
                <Text style={[styles.chipText, formData.years === option.value && styles.chipTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Nombre de missions */}
        <View style={styles.field}>
          <Text style={styles.label}>Nombre approximatif de missions</Text>
          <View style={styles.chipsContainer}>
            {MISSION_COUNT_RANGES.map((range) => (
              <Pressable
                key={range.value}
                style={[styles.chip, formData.mission_count === range.value && styles.chipActive]}
                onPress={() => updateField('mission_count', formData.mission_count === range.value ? null : range.value)}
              >
                <Text style={[styles.chipText, formData.mission_count === range.value && styles.chipTextActive]}>
                  {range.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Spécialités animées */}
        <View style={styles.field}>
          <Text style={styles.label}>Spécialités animées pour cette marque</Text>
          <View style={styles.chipsContainer}>
            {ANIMATION_SPECIALTIES.map((spec) => (
              <Pressable
                key={spec.value}
                style={[styles.chip, formData.specialties?.includes(spec.value) && styles.chipActive]}
                onPress={() => toggleSpecialty(spec.value)}
              >
                <Text style={[styles.chipText, formData.specialties?.includes(spec.value) && styles.chipTextActive]}>
                  {spec.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Types d'animations réalisées, résultats obtenus..."
            placeholderTextColor={theme.colors.textLight}
            value={formData.description}
            onChangeText={(v) => updateField('description', v)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Bouton supprimer */}
        {brandExperience && onDelete && (
          <Pressable
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                'Supprimer',
                'Supprimer cette expérience marque ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(brandExperience.id) },
                ]
              );
            }}
          >
            <Icon name="trash" size={18} color={theme.colors.rose} />
            <Text style={styles.deleteButtonText}>Supprimer cette marque</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CVAnimatorFormBrands;

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
  input: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, borderWidth: 1,
    borderColor: theme.colors.border, paddingHorizontal: wp(4), paddingVertical: hp(1.5),
    fontSize: hp(1.6), color: theme.colors.text,
  },
  textArea: { minHeight: hp(10), textAlignVertical: 'top' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(2) },
  chip: {
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
  customBrandRow: { flexDirection: 'row', gap: wp(2), marginBottom: hp(1) },
  addCustomButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  brandList: { maxHeight: hp(25) },
  brandOption: {
    paddingVertical: hp(1.2), paddingHorizontal: wp(3),
    borderBottomWidth: 1, borderBottomColor: theme.colors.border + '50',
  },
  brandOptionText: { fontSize: hp(1.5), color: theme.colors.text },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: wp(2),
    paddingVertical: hp(1.5), marginTop: hp(2),
  },
  deleteButtonText: { fontSize: hp(1.5), color: theme.colors.rose, fontFamily: theme.fonts.medium },
});
