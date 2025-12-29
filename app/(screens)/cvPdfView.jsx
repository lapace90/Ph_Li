import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import Icon from '../../assets/icons/Icon';

export default function CVPdfView() {
  const { url, title } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

  return (
    <View style={[commonStyles.screenContainer, { paddingTop: insets.top }]}>
      <View style={commonStyles.header}>
        <Pressable style={commonStyles.headerButton} onPress={() => router.back()}>
          <Icon name="arrowLeft" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={commonStyles.headerTitle} numberOfLines={1}>{title || 'CV'}</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <WebView
        source={{ uri: viewerUrl }}
        style={commonStyles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={commonStyles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={commonStyles.loadingText}>Chargement...</Text>
          </View>
        )}
      />
    </View>
  );
}