import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const AvailabilityPicker = ({ value, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState(null); // 'immediate' | 'date'

  const isImmediate = value === 'immediate';
  const dateValue = !isImmediate && value ? new Date(value) : new Date();

  const handleSelectImmediate = () => {
    setMode('immediate');
    onChange('immediate');
  };

  const handleSelectDate = () => {
    setMode('date');
    setShowPicker(true);
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      onChange(selectedDate.toISOString().split('T')[0]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'immediate') return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Disponibilité</Text>
      
      <View style={styles.options}>
        <Pressable
          style={[
            styles.option,
            isImmediate && styles.optionSelected,
          ]}
          onPress={handleSelectImmediate}
        >
          <Icon 
            name="check" 
            size={20} 
            color={isImmediate ? 'white' : theme.colors.primary} 
          />
          <Text style={[
            styles.optionText,
            isImmediate && styles.optionTextSelected,
          ]}>
            Immédiatement
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.option,
            !isImmediate && value && styles.optionSelected,
          ]}
          onPress={handleSelectDate}
        >
          <Icon 
            name="calendar" 
            size={20} 
            color={!isImmediate && value ? 'white' : theme.colors.primary} 
          />
          <Text style={[
            styles.optionText,
            !isImmediate && value && styles.optionTextSelected,
          ]}>
            {!isImmediate && value ? formatDate(value) : 'Choisir une date'}
          </Text>
        </Pressable>
      </View>

      {showPicker && (
        Platform.OS === 'ios' ? (
          <Modal
            transparent
            animationType="slide"
            visible={showPicker}
            onRequestClose={() => setShowPicker(false)}
          >
            <Pressable 
              style={styles.modalOverlay}
              onPress={() => setShowPicker(false)}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Date de disponibilité</Text>
                  <Pressable onPress={() => setShowPicker(false)}>
                    <Text style={styles.modalDone}>OK</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={dateValue}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  locale="fr-FR"
                />
              </View>
            </Pressable>
          </Modal>
        ) : (
          <DateTimePicker
            value={dateValue}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )
      )}
    </View>
  );
};

export default AvailabilityPicker;

const styles = StyleSheet.create({
  container: {
    gap: hp(1.5),
  },
  label: {
    fontSize: hp(1.7),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  options: {
    flexDirection: 'row',
    gap: wp(3),
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: hp(2),
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  optionText: {
    fontSize: hp(1.5),
    color: theme.colors.text,
  },
  optionTextSelected: {
    color: 'white',
    fontFamily: theme.fonts.medium,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingBottom: hp(4),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  modalDone: {
    fontSize: hp(1.8),
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
  },
});