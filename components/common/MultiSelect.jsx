// components/common/MultiSelect.jsx
/**
 * Composant de sélection multiple
 */
import { View, Text, Pressable } from 'react-native';
import { commonStyles } from '../../constants/styles';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const MultiSelect = ({ 
  label, 
  options, 
  selected = [], 
  onChange, 
  hint,
  error,
  disabled = false,
  size = 'medium', // 'small' | 'medium'
  maxSelection,
  showCount = false,
}) => {
  const toggle = (value) => {
    if (disabled) return;
    
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      if (maxSelection && selected.length >= maxSelection) return;
      onChange([...selected, value]);
    }
  };

  const chipStyle = size === 'small' ? commonStyles.chipSmall : commonStyles.chip;
  const chipTextStyle = size === 'small' ? commonStyles.chipTextSmall : commonStyles.chipText;
  const isAtLimit = maxSelection && selected.length >= maxSelection;

  return (
    <View style={commonStyles.formGroup}>
      {label && (
        <View style={commonStyles.rowBetween}>
          <Text style={commonStyles.label}>{label}</Text>
          {showCount && (
            <Text style={[commonStyles.hint, { color: theme.colors.primary }]}>
              {selected.length}{maxSelection ? `/${maxSelection}` : ''}
            </Text>
          )}
        </View>
      )}
      {hint && <Text style={commonStyles.hint}>{hint}</Text>}
      
      <View style={[commonStyles.chipsContainer, hint && { marginTop: hp(1) }]}>
        {options.map((option) => {
          const value = typeof option === 'object' ? option.value : option;
          const optionLabel = typeof option === 'object' ? option.label : option;
          const isSelected = selected.includes(value);
          const isDisabledByLimit = !isSelected && isAtLimit;
          
          return (
            <Pressable
              key={value}
              style={[
                chipStyle,
                isSelected && commonStyles.chipActive,
                (disabled || isDisabledByLimit) && commonStyles.disabled,
              ]}
              onPress={() => toggle(value)}
              disabled={disabled || isDisabledByLimit}
            >
              <View style={commonStyles.rowGapSmall}>
                <Text style={[
                  chipTextStyle,
                  isSelected && commonStyles.chipTextActive,
                ]}>
                  {optionLabel}
                </Text>
                {isSelected && (
                  <Icon name="check" size={12} color="white" />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
      
      {error && <Text style={commonStyles.error}>{error}</Text>}
    </View>
  );
};

export default MultiSelect;