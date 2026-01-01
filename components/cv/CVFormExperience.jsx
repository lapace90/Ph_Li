// components/cv/CVFormExperience.jsx

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
import { 
  COMPANY_TYPES, 
  COMPANY_SIZES, 
  SKILLS_BY_CATEGORY, 
  EMPTY_EXPERIENCE,
  generateId 
} from '../../constants/cvOptions';
import Icon from '../../assets/icons/Icon';
import CityAutocomplete from '../common/CityAutocomplete';
import MonthYearPicker from '../common/MonthYearPicker';

const CVFormExperience = ({ 
  experience = null, 
  onSave, 
  onCancel,
  onDelete,
}) => {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState(experience || {
    ...EMPTY_EXPERIENCE,
    id: generateId(),
  });
  const [showSkillsPicker, setShowSkillsPicker] = useState(false);

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

  const toggleSkill = (skill) => {
    const current = formData.skills || [];
    const updated = current.includes(skill)
      ? current.filter(s => s !== skill)
      : [...current, skill];
    updateField('skills', updated);
  };

  const handleSave = () => {
    if (!formData.job_title?.trim()) {
      Alert.alert('Erreur', 'L\'intitulé du poste est obligatoire');
      return;
    }
    if (!formData.company_type) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type de structure');
      return;
    }
    if (!formData.start_date) {
      Alert.alert('Erreur', 'La date de début est obligatoire');
      return;
    }

    onSave(formData);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header fixe */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={onCancel}>
          <Icon name="x" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {experience ? 'Modifier l\'expérience' : 'Ajouter une expérience'}
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
        {/* Intitulé du poste */}
        <View style={styles.field}>
          <Text style={styles.label}>Intitulé du poste *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Préparateur en pharmacie"
            placeholderTextColor={theme.colors.textLight}
            value={formData.job_title}
            onChangeText={(v) => updateField('job_title', v)}
          />
        </View>

        {/* Type de structure */}
        <View style={styles.field}>
          <Text style={styles.label}>Type de structure *</Text>
          <Text style={styles.hint}>Cette information sera affichée en mode anonyme</Text>
          <View style={styles.chipsContainer}>
            {COMPANY_TYPES.map((type) => (
              <Pressable
                key={type.value}
                style={[
                  styles.chip,
                  formData.company_type === type.value && styles.chipActive,
                ]}
                onPress={() => updateField('company_type', type.value)}
              >
                <Text style={[
                  styles.chipText,
                  formData.company_type === type.value && styles.chipTextActive,
                ]}>
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Nom de la structure (optionnel) */}
        <View style={styles.field}>
          <Text style={styles.label}>Nom de l'établissement (optionnel)</Text>
          <Text style={styles.hint}>Non affiché en mode anonyme</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Pharmacie du Centre"
            placeholderTextColor={theme.colors.textLight}
            value={formData.company_name}
            onChangeText={(v) => updateField('company_name', v)}
          />
        </View>

        {/* Taille de la structure */}
        <View style={styles.field}>
          <Text style={styles.label}>Taille de la structure</Text>
          <View style={styles.chipsContainer}>
            {COMPANY_SIZES.map((size) => (
              <Pressable
                key={size.value}
                style={[
                  styles.chip,
                  formData.company_size === size.value && styles.chipActive,
                ]}
                onPress={() => updateField('company_size', 
                  formData.company_size === size.value ? null : size.value
                )}
              >
                <Text style={[
                  styles.chipText,
                  formData.company_size === size.value && styles.chipTextActive,
                ]}>
                  {size.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Ville */}
        <View style={styles.field}>
          <Text style={styles.label}>Ville</Text>
          <Text style={styles.hint}>Seule la région sera affichée en mode anonyme</Text>
          <CityAutocomplete
            placeholder="Rechercher une ville..."
            onSelect={handleCitySelect}
            initialValue={formData.city}
          />
          {formData.region && (
            <Text style={styles.regionText}>Région : {formData.region}</Text>
          )}
        </View>

        {/* Dates avec MonthYearPicker */}
        <View style={styles.datesRow}>
          <View style={[styles.field, { flex: 1 }]}>
            <MonthYearPicker
              label="Date début *"
              value={formData.start_date}
              onChange={(v) => updateField('start_date', v)}
              placeholder="Sélectionner"
              maxDate="now"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            {!formData.is_current ? (
              <MonthYearPicker
                label="Date fin"
                value={formData.end_date}
                onChange={(v) => updateField('end_date', v)}
                placeholder="Sélectionner"
                maxDate="now"
                minDate={formData.start_date}
              />
            ) : (
              <View>
                <Text style={styles.label}>Date fin</Text>
                <View style={[styles.input, styles.inputDisabled, commonStyles.rowGapSmall]}>
                  <Icon name="calendar" size={20} color={theme.colors.textLight} />
                  <Text style={{ color: theme.colors.textLight, fontSize: hp(1.6) }}>Poste actuel</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Poste actuel */}
        <Pressable
          style={styles.checkboxRow}
          onPress={() => {
            updateField('is_current', !formData.is_current);
            if (!formData.is_current) {
              updateField('end_date', null);
            }
          }}
        >
          <View style={[styles.checkbox, formData.is_current && styles.checkboxChecked]}>
            {formData.is_current && <Icon name="check" size={14} color="white" />}
          </View>
          <Text style={styles.checkboxLabel}>Poste actuel</Text>
        </Pressable>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description des missions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Décrivez vos principales responsabilités et réalisations..."
            placeholderTextColor={theme.colors.textLight}
            value={formData.description}
            onChangeText={(v) => updateField('description', v)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Compétences utilisées */}
        <View style={styles.field}>
          <View style={styles.skillsHeader}>
            <Text style={styles.label}>Compétences utilisées</Text>
            <Pressable
              style={styles.addSkillButton}
              onPress={() => setShowSkillsPicker(!showSkillsPicker)}
            >
              <Icon name={showSkillsPicker ? 'chevronUp' : 'plus'} size={18} color={theme.colors.primary} />
              <Text style={styles.addSkillText}>
                {showSkillsPicker ? 'Masquer' : 'Ajouter'}
              </Text>
            </Pressable>
          </View>

          {formData.skills?.length > 0 && (
            <View style={styles.selectedSkills}>
              {formData.skills.map((skill) => (
                <Pressable
                  key={skill}
                  style={styles.selectedSkillChip}
                  onPress={() => toggleSkill(skill)}
                >
                  <Text style={styles.selectedSkillText}>{skill}</Text>
                  <Icon name="x" size={14} color={theme.colors.primary} />
                </Pressable>
              ))}
            </View>
          )}

          {showSkillsPicker && (
            <View style={styles.skillsPicker}>
              {Object.entries(SKILLS_BY_CATEGORY).map(([category, skills]) => (
                <View key={category} style={styles.skillCategory}>
                  <Text style={styles.skillCategoryTitle}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  <View style={styles.skillsGrid}>
                    {skills.map((skill) => (
                      <Pressable
                        key={skill}
                        style={[
                          styles.skillOption,
                          formData.skills?.includes(skill) && styles.skillOptionActive,
                        ]}
                        onPress={() => toggleSkill(skill)}
                      >
                        <Text style={[
                          styles.skillOptionText,
                          formData.skills?.includes(skill) && styles.skillOptionTextActive,
                        ]}>
                          {skill}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bouton supprimer (si édition) */}
        {experience && onDelete && (
          <Pressable
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                'Supprimer l\'expérience',
                'Êtes-vous sûr de vouloir supprimer cette expérience ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(experience.id) },
                ]
              );
            }}
          >
            <Icon name="trash" size={18} color={theme.colors.rose} />
            <Text style={styles.deleteButtonText}>Supprimer cette expérience</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CVFormExperience;

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
    padding: wp(2),
  },
  headerTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  saveButton: {
    padding: wp(2),
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: wp(5),
    paddingBottom: hp(10),
  },
  field: {
    marginBottom: hp(2.5),
  },
  label: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  hint: {
    fontSize: hp(1.25),
    color: theme.colors.textLight,
    marginBottom: hp(0.8),
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    fontSize: hp(1.6),
    color: theme.colors.text,
  },
  inputDisabled: {
    backgroundColor: theme.colors.gray + '20',
  },
  textArea: {
    minHeight: hp(12),
    textAlignVertical: 'top',
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
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: hp(1.4),
    color: theme.colors.text,
  },
  chipTextActive: {
    color: 'white',
    fontFamily: theme.fonts.medium,
  },
  regionText: {
    marginTop: hp(0.8),
    fontSize: hp(1.3),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  datesRow: {
    flexDirection: 'row',
    gap: wp(3),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginBottom: hp(2.5),
    marginTop: -hp(1),
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.sm,
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
  },
  skillsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  addSkillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  addSkillText: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  selectedSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginBottom: hp(1),
  },
  selectedSkillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.full,
  },
  selectedSkillText: {
    fontSize: hp(1.3),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  skillsPicker: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    marginTop: hp(1),
  },
  skillCategory: {
    marginBottom: hp(1.5),
  },
  skillCategoryTitle: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.textLight,
    marginBottom: hp(0.8),
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(1.5),
  },
  skillOption: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background,
  },
  skillOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  skillOptionText: {
    fontSize: hp(1.2),
    color: theme.colors.text,
  },
  skillOptionTextActive: {
    color: 'white',
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
})