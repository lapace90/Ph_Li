import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';

export default function Messages() {
  return (
    <ScreenWrapper bg={theme.colors.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
        </View>

        <View style={styles.placeholder}>
          <Icon name="messageCircle" size={60} color={theme.colors.gray} />
          <Text style={styles.placeholderText}>
            Aucune conversation pour l'instant
          </Text>
          <Text style={styles.placeholderSubtext}>
            Vos échanges apparaîtront ici après un match
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
    gap: hp(1),
  },
  placeholderText: {
    fontSize: hp(2),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  placeholderSubtext: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});