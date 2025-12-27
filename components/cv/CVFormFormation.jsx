// components/cv/CVFormFormation.jsx

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
import { 
  DIPLOMA_TYPES, 
  DIPLOMA_MENTIONS,
  EMPTY_FORMATION,
  generateId 
} from '../../constants/cvOptions';
import Icon from '../../assets/icons/Icon';
import CityAutocomplete from '../common/CityAutocomplete';

const CVFormFormation = ({ 
  formation = null, 
  onSave, 
  onCancel,
  onDelete,
}) => {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState(formation || {
    ...EMPTY_FORMATION,
    id: generateId(),
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCitySelect = (cityData) => {
    setFormData(prev => ({
      ...prev,
      school_city: cityData.city,
      school_region: cityData.region,
    }));
  };

  const handleSave = () => {
    if (!formData.diploma_type && !formData.diploma_name?.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner le diplôme');
      return;
    }
    if (!formData.year) {
      Alert.alert('Erreur', 'L\'année d\'obtention est obligatoire');
      return;
    }
    onSave(formData);
  };

  const diplomasByCategory = DIPLOMA_TYPES.reduce((acc, diploma) => {
    if (!acc[diploma.category]) acc[diploma.category] = [];
    acc[diploma.category].push(diploma);
    return acc;
  }, {});

  const categoryLabels = {
    preparateur: 'Préparateur',
    pharmacien: 'Pharmacien',
    formation: 'Formations complémentaires',
    conseiller: 'Conseiller',
    general: 'Général',
    autre: 'Autre',
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={onCancel}>
          <Icon name="x" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {formation ? 'Modifier' : 'Nouvelle formation'}
        </Text>
        <Pressable style={styles.saveHeaderButton} onPress={handleSave}>
          <Text style={styles.saveHeaderText}>OK</Text>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>Type de diplôme *</Text>
          {Object.entries(diplomasByCategory).map(([category, diplomas]) => (
            <View key={category} style={styles.diplomaCategory}>
              <Text style={styles.categoryTitle}>{categoryLabels[category]}</Text>
              <View style={styles.diplomaGrid}>
                {diplomas.map((diploma) => (
                  <Pressable
                    key={diploma.value}
                    style={[
                      styles.diplomaChip,
                      formData.diploma_type === diploma.value && styles.diplomaChipActive,
                    ]}
                    onPress={() => {
                      updateField('diploma_type', diploma.value);
                      if (!formData.diploma_name) {
                        updateField('diploma_name', diploma.label);
                      }
                    }}
                  >
                    <Text style={[
                      styles.diplomaChipText,
                      formData.diploma_type === diploma.value && styles.diplomaChipTextActive,
                    ]}>
                      {diploma.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Intitulé exact du diplôme</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: BP Préparateur en Pharmacie"
            placeholderTextColor={theme.colors.textLight}
            value={formData.diploma_name}
            onChangeText={(v) => updateField('diploma_name', v)}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Établissement</Text>
          <Text style={styles.hint}>Masqué en mode anonyme</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: CFA Pharmacie Paris"
            placeholderTextColor={theme.colors.textLight}
            value={formData.school_name}
            onChangeText={(v) => updateField('school_name', v)}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Ville</Text>
          <Text style={styles.hint}>Seule la région sera affichée en mode anonyme</Text>
          <CityAutocomplete
            placeholder="Rechercher une ville..."
            onSelect={handleCitySelect}
            initialValue={formData.school_city}
          />
          {formData.school_region && (
            <Text style={styles.regionText}>Région : {formData.school_region}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Année d'obtention *</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.yearsRow}
          >
            {years.slice(0, 20).map((year) => (
              <Pressable
                key={year}
                style={[
                  styles.yearChip,
                  formData.year === year && styles.yearChipActive,
                ]}
                onPress={() => updateField('year', year)}
              >
                <Text style={[
                  styles.yearChipText,
                  formData.year === year && styles.yearChipTextActive,
                ]}>
                  {year}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.manualYearRow}>
            <Text style={styles.orText}>ou</Text>
            <TextInput
              style={styles.yearInput}
              placeholder="Année"
              placeholderTextColor={theme.colors.textLight}
              value={formData.year?.toString() || ''}
              onChangeText={(v) => {
                const num = parseInt(v);
                if (!isNaN(num) && num > 1950 && num <= currentYear) {
                  updateField('year', num);
                } else if (v === '') {
                  updateField('year', null);
                }
              }}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mention (optionnel)</Text>
          <View style={styles.mentionsRow}>
            {DIPLOMA_MENTIONS.map((mention) => (
              <Pressable
                key={mention.value}
                style={[
                  styles.mentionChip,
                  formData.mention === mention.value && styles.mentionChipActive,
                ]}
                onPress={() => updateField('mention', 
                  formData.mention === mention.value ? null : mention.value
                )}
              >
                <Text style={[
                  styles.mentionChipText,
                  formData.mention === mention.value && styles.mentionChipTextActive,
                ]}>
                  {mention.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {formation && onDelete && (
          <Pressable 
            style={styles.deleteButton}
            onPress={() => onDelete(formation.id)}
          >
            <Icon name="trash" size={18} color={theme.colors.rose} />
            <Text style={styles.deleteButtonText}>Supprimer cette formation</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CVFormFormation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  saveHeaderButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
  },
  saveHeaderText: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: wp(5),
    paddingBottom: hp(4),
  },
  field: {
    marginBottom: hp(2),
  },
  label: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  hint: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginBottom: hp(0.5),
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    fontSize: hp(1.6),
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
  },
  diplomaCategory: {
    marginBottom: hp(1.5),
  },
  categoryTitle: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.textLight,
    marginBottom: hp(0.5),
  },
  diplomaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  diplomaChip: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  diplomaChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  diplomaChipText: {
    fontSize: hp(1.3),
    color: theme.colors.text,
  },
  diplomaChipTextActive: {
    color: 'white',
    fontFamily: theme.fonts.medium,
  },
  regionText: {
    fontSize: hp(1.3),
    color: theme.colors.primary,
    marginTop: hp(0.5),
  },
  yearsRow: {
    flexDirection: 'row',
    gap: wp(2),
    paddingVertical: hp(0.5),
  },
  yearChip: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  yearChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  yearChipText: {
    fontSize: hp(1.4),
    color: theme.colors.text,
  },
  yearChipTextActive: {
    color: 'white',
    fontFamily: theme.fonts.medium,
  },
  manualYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1),
    gap: wp(2),
  },
  orText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  yearInput: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    fontSize: hp(1.5),
    color: theme.colors.text,
    width: wp(20),
    textAlign: 'center',
  },
  mentionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  mentionChip: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mentionChipActive: {
    backgroundColor: theme.colors.success + '20',
    borderColor: theme.colors.success,
  },
  mentionChipText: {
    fontSize: hp(1.3),
    color: theme.colors.text,
  },
  mentionChipTextActive: {
    color: theme.colors.success,
    fontFamily: theme.fonts.medium,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: hp(1.5),
    marginTop: hp(2),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.rose + '10',
  },
  deleteButtonText: {
    fontSize: hp(1.5),
    color: theme.colors.rose,
    fontFamily: theme.fonts.medium,
  },
});