import { View, Text, StyleSheet } from 'react-native';
import Icon from '../assets/icons/Icon';
import { theme } from '../constants/theme';

export default function Index() {
  return (
    <View style={styles.container}>
      <Icon name="mail" size={50} color={theme.colors.primary} />
      <Text style={styles.text}>✅ Setup complet !</Text>
      <View style={styles.iconRow}>
        <Icon name="lock" size={30} color={theme.colors.textLight} />
        <Icon name="user" size={30} color={theme.colors.textLight} />
        <Icon name="arrowLeft" size={30} color={theme.colors.textLight} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    gap: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconRow: {
    flexDirection: 'row',
    gap: 20,
  },
});