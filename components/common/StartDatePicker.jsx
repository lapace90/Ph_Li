// components/common/StartDatePicker.jsx

import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

const getAvailableYears = () => {
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear + 1, currentYear + 2];
};

const StartDatePicker = ({ value, onChange, placeholder = 'Sélectionner une date' }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(getAvailableYears()[0]);

  const parseValue = () => {
    if (!value) return { type: null, month: null, year: null };
    if (value === 'asap') return { type: 'asap', month: null, year: null };
    
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return { type: 'date', month: date.getMonth() + 1, year: date.getFullYear() };
      }
    } catch (e) {}
    
    return { type: null, month: null, year: null };
  };

  const getDisplayValue = () => {
    const parsed = parseValue();
    if (parsed.type === 'asap') return 'Dès que possible';
    if (parsed.type === 'date') {
      const monthLabel = MONTHS.find(m => m.value === parsed.month)?.label;
      return `${monthLabel} ${parsed.year}`;
    }
    return null;
  };

  const openModal = () => {
    const parsed = parseValue();
    if (parsed.type === 'date') {
      setSelectedMonth(parsed.month);
      setSelectedYear(parsed.year);
    } else {
      const now = new Date();
      const nextMonth = now.getMonth() + 2;
      if (nextMonth > 12) {
        setSelectedMonth(nextMonth - 12);
        setSelectedYear(now.getFullYear() + 1);
      } else {
        setSelectedMonth(nextMonth);
        setSelectedYear(now.getFullYear());
      }
    }
    setModalVisible(true);
  };

  const selectAsap = () => {
    onChange('asap');
    setModalVisible(false);
  };

  const confirmSelection = () => {
    if (selectedMonth && selectedYear) {
      const monthStr = selectedMonth.toString().padStart(2, '0');
      onChange(`${selectedYear}-${monthStr}-01`);
    }
    setModalVisible(false);
  };

  const clearSelection = () => onChange(null);

  const displayValue = getDisplayValue();
  const years = getAvailableYears();

  return (
    <View>
      {/* Bouton principal */}
      <Pressable style={[commonStyles.input, commonStyles.rowGapSmall]} onPress={openModal}>
        <Icon name="calendar" size={20} color={theme.colors.textLight} />
        <Text style={[styles.selectorText, !displayValue && { color: theme.colors.textLight }]}>
          {displayValue || placeholder}
        </Text>
        {displayValue ? (
          <Pressable onPress={clearSelection} hitSlop={10}>
            <Icon name="x" size={18} color={theme.colors.textLight} />
          </Pressable>
        ) : (
          <Icon name="chevronDown" size={18} color={theme.colors.textLight} />
        )}
      </Pressable>

      {/* Modal de sélection */}
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
              <Text style={commonStyles.modalTitle}>Date de début</Text>
              <Pressable style={commonStyles.modalCloseButton} onPress={() => setModalVisible(false)}>
                <Icon name="x" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            {/* Option "Dès que possible" */}
            <Pressable 
              style={[commonStyles.card, value === 'asap' && styles.cardActive]} 
              onPress={selectAsap}
            >
              <View style={commonStyles.rowBetween}>
                <View style={commonStyles.rowGapSmall}>
                  <Icon 
                    name="clock" 
                    size={20} 
                    color={value === 'asap' ? theme.colors.primary : theme.colors.textLight} 
                  />
                  <Text style={[styles.asapText, value === 'asap' && commonStyles.textPrimary]}>
                    Dès que possible
                  </Text>
                </View>
                {value === 'asap' && (
                  <Icon name="check" size={20} color={theme.colors.primary} />
                )}
              </View>
            </Pressable>

            <View style={styles.dividerWithText}>
              <View style={styles.dividerLine} />
              <Text style={commonStyles.hint}>ou choisir une date</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sélection année */}
            <Text style={commonStyles.label}>Année</Text>
            <View style={[commonStyles.rowGapSmall, { marginBottom: hp(2) }]}>
              {years.map(year => (
                <Pressable
                  key={year}
                  style={[commonStyles.chip, { flex: 1 }, selectedYear === year && commonStyles.chipActive]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text style={[commonStyles.chipText, selectedYear === year && commonStyles.chipTextActive]}>
                    {year}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Sélection mois */}
            <Text style={commonStyles.label}>Mois</Text>
            <ScrollView style={styles.monthsScroll} showsVerticalScrollIndicator={false}>
              <View style={commonStyles.chipsContainer}>
                {MONTHS.map(month => {
                  const now = new Date();
                  const isPast = selectedYear === now.getFullYear() && month.value < now.getMonth() + 1;
                  
                  return (
                    <Pressable
                      key={month.value}
                      style={[
                        commonStyles.chip,
                        styles.monthChip,
                        selectedMonth === month.value && commonStyles.chipActive,
                        isPast && styles.chipDisabled,
                      ]}
                      onPress={() => !isPast && setSelectedMonth(month.value)}
                      disabled={isPast}
                    >
                      <Text style={[
                        commonStyles.chipText,
                        selectedMonth === month.value && commonStyles.chipTextActive,
                        isPast && commonStyles.textLight,
                      ]}>
                        {month.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* Bouton confirmer */}
            <Pressable
              style={[commonStyles.buttonPrimary, !selectedMonth && styles.buttonDisabled]}
              onPress={confirmSelection}
              disabled={!selectedMonth}
            >
              <Text style={commonStyles.buttonPrimaryText}>
                {selectedMonth 
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

export default StartDatePicker;

const styles = StyleSheet.create({
  selectorText: {
    flex: 1,
    fontSize: hp(1.6),
    color: theme.colors.text,
  },
  cardActive: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  asapText: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  dividerWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp(2),
    gap: wp(3),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  monthsScroll: {
    maxHeight: hp(22),
  },
  monthChip: {
    width: '31%',
  },
  chipDisabled: {
    opacity: 0.4,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.gray,
  },
});