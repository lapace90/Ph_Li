import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import ScreenWrapper from '../../components/common/ScreenWrapper';

export default function Home() {
  const { profile } = useAuth();

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Bonjour {profile?.first_name} 👋
          </Text>
          <Text style={styles.subtitle}>
            Bienvenue sur PharmaLink
          </Text>
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Dashboard à venir...
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
  greeting: {
    fontSize: hp(3),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    marginTop: hp(0.5),
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: hp(2),
    color: theme.colors.textLight,
  },
});