import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const MONTHS = [
  { value: 1, label: 'Janvier', short: 'Jan' },
  { value: 2, label: 'Février', short: 'Fév' },
  { value: 3, label: 'Mars', short: 'Mars' },
  { value: 4, label: 'Avril', short: 'Avr' },
  { value: 5, label: 'Mai', short: 'Mai' },
  { value: 6, label: 'Juin', short: 'Juin' },
  { value: 7, label: 'Juillet', short: 'Juil' },
  { value: 8, label: 'Août', short: 'Août' },
  { value: 9, label: 'Septembre', short: 'Sept' },
  { value: 10, label: 'Octobre', short: 'Oct' },
  { value: 11, label: 'Novembre', short: 'Nov' },
  { value: 12, label: 'Décembre', short: 'Déc' },
];

// Années disponibles (de 1970 à année courante + 2)
const getAvailableYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 2; y >= 1970; y--) {
    years.push(y);
  }
  return years;
};

/**
 * Sélecteur de mois/année pour les CV
 * Format attendu : "YYYY-MM" (ex: "2023-06")
 */
const MonthYearPicker = ({ 
  value, 
  onChange, 
  placeholder = 'Sélectionner',
  label,
  maxDate = null, // Date max (pour end_date qui ne peut pas dépasser aujourd'hui)
  minDate = null, // Date min (pour end_date qui ne peut pas être avant start_date)
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Parser la valeur actuelle
  const parseValue = () => {
    if (!value) return { month: null, year: null };
    const [year, month] = value.split('-').map(Number);
    return { month, year };
  };

  // Affichage formaté
  const getDisplayValue = () => {
    const parsed = parseValue();
    if (!parsed.month || !parsed.year) return null;
    const monthLabel = MONTHS.find(m => m.value === parsed.month)?.label;
    return `${monthLabel} ${parsed.year}`;
  };

  // Ouvrir la modal
  const openModal = () => {
    const parsed = parseValue();
    if (parsed.year && parsed.month) {
      setSelectedYear(parsed.year);
      setSelectedMonth(parsed.month);
    } else {
      // Par défaut : année courante
      setSelectedYear(new Date().getFullYear());
      setSelectedMonth(null);
    }
    setModalVisible(true);
  };

  // Confirmer la sélection
  const confirmSelection = () => {
    if (selectedMonth && selectedYear) {
      const monthStr = selectedMonth.toString().padStart(2, '0');
      // Format complet YYYY-MM-DD pour la BDD
      onChange(`${selectedYear}-${monthStr}-01`);
    }
    setModalVisible(false);
  };

  // Effacer
  const clearSelection = () => {
    onChange(null);
  };

  // Vérifier si un mois est désactivé
  const isMonthDisabled = (month) => {
    if (!selectedYear) return false;
    
    const currentDate = new Date();
    const checkDate = new Date(selectedYear, month - 1);
    
    // Ne pas permettre les dates futures si maxDate n'est pas défini ou est "now"
    if (!maxDate || maxDate === 'now') {
      if (checkDate > currentDate) return true;
    }
    
    // Vérifier minDate
    if (minDate) {
      const [minYear, minMonth] = minDate.split('-').map(Number);
      const minDateTime = new Date(minYear, minMonth - 1);
      if (checkDate < minDateTime) return true;
    }
    
    return false;
  };

  const displayValue = getDisplayValue();
  const years = getAvailableYears();

  return (
    <View>
      {label && <Text style={commonStyles.label}>{label}</Text>}
      
      {/* Bouton principal */}
      <Pressable style={[commonStyles.input, commonStyles.rowBetween]} onPress={openModal}>
        <View style={commonStyles.rowGapSmall}>
          <Icon name="calendar" size={20} color={theme.colors.textLight} />
          <Text style={[styles.selectorText, !displayValue && { color: theme.colors.textLight }]}>
            {displayValue || placeholder}
          </Text>
        </View>
        {displayValue ? (
          <Pressable onPress={clearSelection} hitSlop={10}>
            <Icon name="x" size={18} color={theme.colors.textLight} />
          </Pressable>
        ) : (
          <Icon name="chevronDown" size={18} color={theme.colors.textLight} />
        )}
      </Pressable>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={commonStyles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={commonStyles.modalContainer} onStartShouldSetResponder={() => true}>
            {/* Header */}
            <View style={commonStyles.modalHeader}>
              <Text style={commonStyles.modalTitle}>{label || 'Sélectionner une date'}</Text>
              <Pressable style={commonStyles.modalCloseButton} onPress={() => setModalVisible(false)}>
                <Icon name="x" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            {/* Sélection année */}
            <Text style={commonStyles.label}>Année</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.yearScroll}
              contentContainerStyle={styles.yearContent}
            >
              {years.map(year => (
                <Pressable
                  key={year}
                  style={[styles.yearChip, selectedYear === year && styles.yearChipActive]}
                  onPress={() => {
                    setSelectedYear(year);
                    setSelectedMonth(null); // Reset mois quand on change d'année
                  }}
                >
                  <Text style={[styles.yearText, selectedYear === year && styles.yearTextActive]}>
                    {year}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Sélection mois */}
            <Text style={[commonStyles.label, { marginTop: hp(2) }]}>Mois</Text>
            <View style={styles.monthsGrid}>
              {MONTHS.map(month => {
                const disabled = isMonthDisabled(month.value);
                const isSelected = selectedMonth === month.value;
                
                return (
                  <Pressable
                    key={month.value}
                    style={[
                      styles.monthChip,
                      isSelected && styles.monthChipActive,
                      disabled && styles.monthChipDisabled,
                    ]}
                    onPress={() => !disabled && setSelectedMonth(month.value)}
                    disabled={disabled}
                  >
                    <Text style={[
                      styles.monthText,
                      isSelected && styles.monthTextActive,
                      disabled && styles.monthTextDisabled,
                    ]}>
                      {month.short}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Bouton confirmer */}
            <Pressable
              style={[commonStyles.buttonPrimary, { marginTop: hp(3) }, !selectedMonth && styles.buttonDisabled]}
              onPress={confirmSelection}
              disabled={!selectedMonth}
            >
              <Text style={commonStyles.buttonPrimaryText}>
                {selectedMonth && selectedYear
                  ? `Confirmer : ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                  : 'Sélectionner un mois'
                }
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default MonthYearPicker;

const styles = StyleSheet.create({
  selectorText: {
    fontSize: hp(1.6),
    color: theme.colors.text,
  },
  yearScroll: {
    marginTop: hp(1),
    maxHeight: hp(5),
  },
  yearContent: {
    gap: wp(2),
    paddingRight: wp(4),
  },
  yearChip: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  yearChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  yearText: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  yearTextActive: {
    color: 'white',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginTop: hp(1),
  },
  monthChip: {
    width: '23%',
    paddingVertical: hp(1.2),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  monthChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  monthChipDisabled: {
    opacity: 0.4,
  },
  monthText: {
    fontSize: hp(1.4),
    color: theme.colors.text,
  },
  monthTextActive: {
    color: 'white',
    fontFamily: theme.fonts.medium,
  },
  monthTextDisabled: {
    color: theme.colors.textLight,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.gray,
  },
});