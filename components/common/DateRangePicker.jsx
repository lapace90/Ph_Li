// components/common/DateRangePicker.jsx
import { useState } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  Modal, 
  StyleSheet 
} from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

/**
 * DateRangePicker - Sélecteur de plage de dates
 * @param {Date} startDate - Date de début
 * @param {Date} endDate - Date de fin
 * @param {function} onChangeStart - Callback changement date début
 * @param {function} onChangeEnd - Callback changement date fin
 * @param {function} onChange - Callback avec {startDate, endDate}
 * @param {Date} minDate - Date minimum sélectionnable
 * @param {string} placeholder - Texte placeholder
 */
const DateRangePicker = ({
  startDate,
  endDate,
  onChangeStart,
  onChangeEnd,
  onChange,
  minDate = new Date(),
  placeholder = 'Sélectionner les dates',
  label,
}) => {
  const [visible, setVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selecting, setSelecting] = useState('start'); // 'start' | 'end'
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  const openPicker = () => {
    setTempStart(startDate);
    setTempEnd(endDate);
    setSelecting('start');
    setVisible(true);
  };

  const closePicker = () => {
    setVisible(false);
  };

  const confirmSelection = () => {
    if (onChange) {
      onChange({ startDate: tempStart, endDate: tempEnd });
    } else {
      onChangeStart?.(tempStart);
      onChangeEnd?.(tempEnd);
    }
    setVisible(false);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + direction);
      return newMonth;
    });
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Jours vides au début
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Jours du mois
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      
      const isDisabled = minDate && date < new Date(minDate.toDateString());
      const isStart = tempStart && dateStr === tempStart.toISOString().split('T')[0];
      const isEnd = tempEnd && dateStr === tempEnd.toISOString().split('T')[0];
      const isInRange = tempStart && tempEnd && date > tempStart && date < tempEnd;

      days.push({
        day: d,
        date,
        dateStr,
        isDisabled,
        isStart,
        isEnd,
        isInRange,
      });
    }

    return days;
  };

  const handleDayPress = (item) => {
    if (item.isDisabled) return;

    if (selecting === 'start') {
      setTempStart(item.date);
      setTempEnd(null);
      setSelecting('end');
    } else {
      if (item.date < tempStart) {
        // Si date sélectionnée avant le début, inverser
        setTempEnd(tempStart);
        setTempStart(item.date);
      } else {
        setTempEnd(item.date);
      }
      setSelecting('start');
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDisplayText = () => {
    if (!startDate && !endDate) return placeholder;
    if (startDate && !endDate) return `À partir du ${formatDate(startDate)}`;
    if (startDate && endDate) return `${formatDate(startDate)} → ${formatDate(endDate)}`;
    return placeholder;
  };

  const days = getDaysInMonth();

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Pressable style={styles.trigger} onPress={openPicker}>
        <Icon name="calendar" size={20} color={theme.colors.textLight} />
        <Text style={[
          styles.triggerText,
          (!startDate && !endDate) && styles.triggerPlaceholder
        ]}>
          {formatDisplayText()}
        </Text>
        <Icon name="chevronDown" size={18} color={theme.colors.textLight} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <Pressable style={styles.overlay} onPress={closePicker}>
          <Pressable style={styles.modal} onPress={e => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner les dates</Text>
              <Pressable onPress={closePicker}>
                <Icon name="x" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            {/* Selection info */}
            <View style={styles.selectionInfo}>
              <Pressable 
                style={[
                  styles.dateBox, 
                  selecting === 'start' && styles.dateBoxActive
                ]}
                onPress={() => setSelecting('start')}
              >
                <Text style={styles.dateBoxLabel}>Début</Text>
                <Text style={styles.dateBoxValue}>
                  {tempStart ? formatDate(tempStart) : '—'}
                </Text>
              </Pressable>
              <Icon name="arrowRight" size={20} color={theme.colors.textLight} />
              <Pressable 
                style={[
                  styles.dateBox, 
                  selecting === 'end' && styles.dateBoxActive
                ]}
                onPress={() => setSelecting('end')}
              >
                <Text style={styles.dateBoxLabel}>Fin</Text>
                <Text style={styles.dateBoxValue}>
                  {tempEnd ? formatDate(tempEnd) : '—'}
                </Text>
              </Pressable>
            </View>

            {/* Month navigation */}
            <View style={styles.monthNav}>
              <Pressable style={styles.monthArrow} onPress={() => navigateMonth(-1)}>
                <Icon name="chevronLeft" size={24} color={theme.colors.text} />
              </Pressable>
              <Text style={styles.monthTitle}>
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <Pressable style={styles.monthArrow} onPress={() => navigateMonth(1)}>
                <Icon name="chevronRight" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            {/* Week days header */}
            <View style={styles.weekDays}>
              {DAYS.map(day => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.calendarGrid}>
              {days.map((item, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.dayCell,
                    !item && styles.dayCellEmpty,
                    item?.isDisabled && styles.dayCellDisabled,
                    item?.isInRange && styles.dayCellInRange,
                    item?.isStart && styles.dayCellStart,
                    item?.isEnd && styles.dayCellEnd,
                  ]}
                  onPress={() => item && handleDayPress(item)}
                  disabled={!item || item.isDisabled}
                >
                  {item && (
                    <Text style={[
                      styles.dayText,
                      item.isDisabled && styles.dayTextDisabled,
                      (item.isStart || item.isEnd) && styles.dayTextActive,
                    ]}>
                      {item.day}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <Pressable style={styles.cancelButton} onPress={closePicker}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </Pressable>
              <Pressable 
                style={[
                  styles.confirmButton,
                  (!tempStart || !tempEnd) && styles.confirmButtonDisabled
                ]} 
                onPress={confirmSelection}
                disabled={!tempStart || !tempEnd}
              >
                <Text style={styles.confirmButtonText}>Confirmer</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default DateRangePicker;

const styles = StyleSheet.create({
  container: {
    marginBottom: hp(2),
  },
  label: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: hp(0.8),
  },

  // Trigger
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    gap: wp(3),
  },
  triggerText: {
    flex: 1,
    fontSize: hp(1.5),
    color: theme.colors.text,
  },
  triggerPlaceholder: {
    color: theme.colors.textLight,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  modal: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xl,
    padding: wp(5),
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: hp(2),
    fontWeight: '700',
    color: theme.colors.text,
  },

  // Selection info
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(3),
    marginBottom: hp(2),
    paddingBottom: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dateBox: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: hp(1.2),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateBoxActive: {
    borderColor: theme.colors.primary,
  },
  dateBoxLabel: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    marginBottom: hp(0.3),
  },
  dateBoxValue: {
    fontSize: hp(1.4),
    fontWeight: '600',
    color: theme.colors.text,
  },

  // Month nav
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  monthArrow: {
    padding: wp(2),
  },
  monthTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.text,
  },

  // Week days
  weekDays: {
    flexDirection: 'row',
    marginBottom: hp(1),
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    fontWeight: '600',
  },

  // Calendar grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellEmpty: {
    backgroundColor: 'transparent',
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayCellInRange: {
    backgroundColor: theme.colors.primary + '20',
  },
  dayCellStart: {
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: theme.radius.full,
    borderBottomLeftRadius: theme.radius.full,
  },
  dayCellEnd: {
    backgroundColor: theme.colors.primary,
    borderTopRightRadius: theme.radius.full,
    borderBottomRightRadius: theme.radius.full,
  },
  dayText: {
    fontSize: hp(1.5),
    color: theme.colors.text,
  },
  dayTextDisabled: {
    color: theme.colors.gray,
  },
  dayTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // Footer
  modalFooter: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: hp(2),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: hp(1.5),
    color: '#fff',
    fontWeight: '600',
  },
});