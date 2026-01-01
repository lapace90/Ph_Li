import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, ScrollView } from 'react-native';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { CONTRACT_TYPES, POSITION_TYPES, EXPERIENCE_LEVELS } from '../../constants/jobOptions';
import Icon from '../../assets/icons/Icon';

const RADIUS_OPTIONS = [
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
  { value: 200, label: '200 km' },
];

/**
 * Modal de filtres pour la recherche d'emploi
 */
const FilterModal = ({ visible, onClose, filters, onApply, onReset }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  // Sync avec les filtres externes quand le modal s'ouvre
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      contract_type: null,
      position_type: null,
      experience_required: null,
      radius: 50,
      sortBy: 'distance',
    };
    setLocalFilters(resetFilters);
    onReset?.();
  };

  const toggleFilter = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  };

  const activeFiltersCount = Object.entries(localFilters).filter(
    ([key, value]) => value !== null && key !== 'radius' && key !== 'sortBy'
  ).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filtres</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Icon name="x" size={22} color={theme.colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Rayon de recherche */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rayon de recherche</Text>
              <View style={styles.radiusButtons}>
                {RADIUS_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.radiusButton,
                      localFilters.radius === option.value && styles.radiusButtonActive
                    ]}
                    onPress={() => setLocalFilters(prev => ({ ...prev, radius: option.value }))}
                  >
                    <Text style={[
                      styles.radiusButtonText,
                      localFilters.radius === option.value && styles.radiusButtonTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Type de contrat */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Type de contrat</Text>
              <View style={commonStyles.chipsContainer}>
                {CONTRACT_TYPES.map((type) => (
                  <Pressable
                    key={type.value}
                    style={[
                      commonStyles.chip,
                      localFilters.contract_type === type.value && commonStyles.chipActive
                    ]}
                    onPress={() => toggleFilter('contract_type', type.value)}
                  >
                    <Text style={[
                      commonStyles.chipText,
                      localFilters.contract_type === type.value && commonStyles.chipTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Type de poste */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Type de poste</Text>
              <View style={commonStyles.chipsContainer}>
                {POSITION_TYPES.map((type) => (
                  <Pressable
                    key={type.value}
                    style={[
                      commonStyles.chip,
                      localFilters.position_type === type.value && commonStyles.chipActive
                    ]}
                    onPress={() => toggleFilter('position_type', type.value)}
                  >
                    <Text style={[
                      commonStyles.chipText,
                      localFilters.position_type === type.value && commonStyles.chipTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Expérience */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Expérience requise</Text>
              <View style={commonStyles.chipsContainer}>
                {EXPERIENCE_LEVELS.map((exp) => (
                  <Pressable
                    key={exp.value}
                    style={[
                      commonStyles.chip,
                      localFilters.experience_required === exp.value && commonStyles.chipActive
                    ]}
                    onPress={() => toggleFilter('experience_required', exp.value)}
                  >
                    <Text style={[
                      commonStyles.chipText,
                      localFilters.experience_required === exp.value && commonStyles.chipTextActive
                    ]}>
                      {exp.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Tri */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trier par</Text>
              <View style={styles.sortOptions}>
                {[
                  { key: 'distance', label: 'Distance', icon: 'mapPin' },
                  { key: 'date', label: 'Date', icon: 'calendar' },
                  { key: 'match', label: 'Matching', icon: 'heart' },
                ].map((option) => (
                  <Pressable
                    key={option.key}
                    style={[
                      styles.sortOption,
                      localFilters.sortBy === option.key && styles.sortOptionActive
                    ]}
                    onPress={() => setLocalFilters(prev => ({ ...prev, sortBy: option.key }))}
                  >
                    <Icon 
                      name={option.icon} 
                      size={18} 
                      color={localFilters.sortBy === option.key ? theme.colors.primary : theme.colors.textLight} 
                    />
                    <Text style={[
                      styles.sortOptionText,
                      localFilters.sortBy === option.key && styles.sortOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetText}>Réinitialiser</Text>
            </Pressable>
            <Pressable style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyText}>
                Appliquer{activeFiltersCount > 0 && ` (${activeFiltersCount})`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Bouton compact pour ouvrir les filtres
 */
export const FilterButton = ({ onPress, activeCount }) => (
  <Pressable style={styles.filterButton} onPress={onPress}>
    <Icon name="filter" size={18} color={activeCount > 0 ? 'white' : theme.colors.text} />
    {activeCount > 0 && (
      <View style={styles.filterBadge}>
        <Text style={styles.filterBadgeText}>{activeCount}</Text>
      </View>
    )}
  </Pressable>
);

export default FilterModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.gray + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: wp(5),
    paddingBottom: hp(2),
  },
  section: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(1.2),
  },
  radiusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  radiusButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  radiusButtonActive: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  radiusButtonText: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.textLight,
  },
  radiusButtonTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: wp(2),
  },
  sortOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.5),
    paddingVertical: hp(1.2),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sortOptionActive: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  sortOptionText: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.medium,
    color: theme.colors.textLight,
  },
  sortOptionTextActive: {
    color: theme.colors.primary,
  },
  footer: {
    flexDirection: 'row',
    gap: wp(3),
    padding: wp(5),
    paddingBottom: hp(4),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  resetButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  resetText: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.medium,
    color: theme.colors.textLight,
  },
  applyButton: {
    flex: 2,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  applyText: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: 'white',
  },
  // FilterButton styles
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  filterBadgeText: {
    fontSize: hp(1.1),
    fontFamily: theme.fonts.bold,
    color: 'white',
  },
});