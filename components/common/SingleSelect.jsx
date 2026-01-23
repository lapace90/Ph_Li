/**
 * Composant de sélection simple (un seul choix)
 */
import { View, Text, Pressable } from 'react-native';
import { commonStyles } from '../../constants/styles';
import { hp } from '../../helpers/common';

const SingleSelect = ({ 
  label, 
  options, 
  selected, 
  onChange, 
  hint,
  error,
  disabled = false,
  size = 'medium', // 'small' | 'medium'
}) => {
  const chipStyle = size === 'small' ? commonStyles.chipSmall : commonStyles.chip;
  const chipTextStyle = size === 'small' ? commonStyles.chipTextSmall : commonStyles.chipText;

  return (
    <View style={commonStyles.formGroup}>
      {label && <Text style={commonStyles.label}>{label}</Text>}
      {hint && <Text style={commonStyles.hint}>{hint}</Text>}
      
      <View style={[commonStyles.chipsContainer, hint && { marginTop: hp(1) }]}>
        {options.map((option) => {
          const value = typeof option === 'object' ? option.value : option;
          const optionLabel = typeof option === 'object' ? option.label : option;
          const isSelected = selected === value;
          
          return (
            <Pressable
              key={value}
              style={[
                chipStyle,
                isSelected && commonStyles.chipActive,
                disabled && commonStyles.disabled,
              ]}
              onPress={() => !disabled && onChange(value)}
              disabled={disabled}
            >
              <Text style={[
                chipTextStyle,
                isSelected && commonStyles.chipTextActive,
              ]}>
                {optionLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
      
      {error && <Text style={commonStyles.error}>{error}</Text>}
    </View>
  );
};

export default SingleSelect;