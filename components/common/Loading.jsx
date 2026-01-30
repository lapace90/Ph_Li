import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { theme } from '../../constants/theme';

const Loading = ({ size = 'large', color = theme.colors.primary, style }) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

export default Loading;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
