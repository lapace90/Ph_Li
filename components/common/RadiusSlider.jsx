import { StyleSheet, Text, View, Pressable } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const RADIUS_OPTIONS = [10, 25, 50, 75, 100, 150, 200];

const RadiusSlider = ({ value, onChange }) => {
  const isFranceSelected = value === -1;

  const handleSelectFrance = () => {
    onChange(-1); // -1 = France entière
  };

  const getDisplayText = () => {
    if (isFranceSelected) {
      return 'France métropolitaine';
    }
    return `${value} km`;
  };

  const getHintText = () => {
    if (isFranceSelected) {
      return 'Toutes les offres en France métropolitaine seront affichées';
    }
    return `Les offres dans un rayon de ${value} km autour de votre ville seront affichées`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="map" size={20} color={theme.colors.primary} />
        <Text style={styles.label}>Rayon de recherche</Text>
        <Text style={styles.value}>{getDisplayText()}</Text>
      </View>

      {/* Option France entière */}
      <Pressable
        style={[
          styles.franceOption,
          isFranceSelected && styles.franceOptionSelected,
        ]}
        onPress={handleSelectFrance}
      >
        <Icon 
          name={isFranceSelected ? "check" : "globe"} 
          size={18} 
          color={isFranceSelected ? 'white' : theme.colors.primary} 
        />
        <Text style={[
          styles.franceText,
          isFranceSelected && styles.franceTextSelected,
        ]}>
          Toute la France métropolitaine
        </Text>
      </Pressable>
      
      {/* Options de rayon */}
      <View style={styles.options}>
        {RADIUS_OPTIONS.map((radius) => (
          <Pressable
            key={radius}
            style={[
              styles.option,
              value === radius && styles.optionSelected,
            ]}
            onPress={() => onChange(radius)}
          >
            <Text style={[
              styles.optionText,
              value === radius && styles.optionTextSelected,
            ]}>
              {radius}
            </Text>
          </Pressable>
        ))}
      </View>
      
      <View style={styles.hint}>
        <Text style={styles.hintText}>{getHintText()}</Text>
      </View>
    </View>
  );
};

export default RadiusSlider;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
    gap: wp(2),
  },
  label: {
    flex: 1,
    fontSize: hp(1.7),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  value: {
    fontSize: hp(1.8),
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
  },
  franceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  franceOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  franceText: {
    fontSize: hp(1.6),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  franceTextSelected: {
    color: 'white',
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp(1),
  },
  option: {
    flex: 1,
    paddingVertical: hp(1.2),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: theme.colors.primary,
  },
  optionText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  optionTextSelected: {
    color: 'white',
    fontFamily: theme.fonts.semiBold,
  },
  hint: {
    marginTop: hp(1.5),
  },
  hintText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});