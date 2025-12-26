import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';

export default function Search() {
  return (
    <ScreenWrapper bg={theme.colors.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Recherche</Text>
        </View>

        <View style={styles.placeholder}>
          <Icon name="map" size={60} color={theme.colors.gray} />
          <Text style={styles.placeholderText}>
            Carte et annonces à venir...
          </Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(5),
    paddingTop: hp(6),
  },
  header: {
    marginBottom: hp(4),
  },
  title: {
    fontSize: hp(3),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(2),
  },
  placeholderText: {
    fontSize: hp(2),
    color: theme.colors.textLight,
  },
});