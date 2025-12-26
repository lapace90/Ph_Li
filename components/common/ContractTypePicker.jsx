import { StyleSheet, Text, View, Pressable } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';

const CONTRACT_TYPES = {
  employee: [
    { value: 'CDI', label: 'CDI' },
    { value: 'CDD', label: 'CDD' },
    { value: 'vacation', label: 'Vacation' },
    { value: 'remplacement', label: 'Remplacement' },
  ],
  student: [
    { value: 'stage', label: 'Stage' },
    { value: 'alternance', label: 'Alternance' },
  ],
};

const ContractTypePicker = ({ value = [], onChange, userType }) => {
  const isStudent = userType === 'etudiant';
  const options = isStudent ? CONTRACT_TYPES.student : CONTRACT_TYPES.employee;

  const toggleType = (type) => {
    if (value.includes(type)) {
      onChange(value.filter(v => v !== type));
    } else {
      onChange([...value, type]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Type(s) de contrat recherché(s)</Text>
      <View style={styles.options}>
        {options.map((contract) => (
          <Pressable
            key={contract.value}
            style={[
              styles.option,
              value.includes(contract.value) && styles.optionSelected,
            ]}
            onPress={() => toggleType(contract.value)}
          >
            <Text style={[
              styles.optionText,
              value.includes(contract.value) && styles.optionTextSelected,
            ]}>
              {contract.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.hint}>Sélectionnez un ou plusieurs types</Text>
    </View>
  );
};

export default ContractTypePicker;

export { CONTRACT_TYPES };

const styles = StyleSheet.create({
  container: {
    gap: hp(1),
  },
  label: {
    fontSize: hp(1.7),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hp(1),
  },
  option: {
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
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
  hint: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
});