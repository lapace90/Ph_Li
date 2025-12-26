import { StyleSheet, Text, View, Pressable } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const RelocationToggle = ({ value, onChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Prêt(e) à déménager ?</Text>
      <View style={styles.options}>
        <Pressable
          style={[
            styles.option,
            value === true && styles.optionSelectedYes,
          ]}
          onPress={() => onChange(true)}
        >
          <Icon 
            name="check" 
            size={18} 
            color={value === true ? 'white' : theme.colors.success} 
          />
          <Text style={[
            styles.optionText,
            value === true && styles.optionTextSelected,
          ]}>
            Oui
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.option,
            value === false && styles.optionSelectedNo,
          ]}
          onPress={() => onChange(false)}
        >
          <Icon 
            name="x" 
            size={18} 
            color={value === false ? 'white' : theme.colors.rose} 
          />
          <Text style={[
            styles.optionText,
            value === false && styles.optionTextSelected,
          ]}>
            Non
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default RelocationToggle;

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
    gap: wp(3),
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: hp(1.8),
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  optionSelectedYes: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success,
  },
  optionSelectedNo: {
    borderColor: theme.colors.rose,
    backgroundColor: theme.colors.rose,
  },
  optionText: {
    fontSize: hp(1.7),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  optionTextSelected: {
    color: 'white',
  },
});