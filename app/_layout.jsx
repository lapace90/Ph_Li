import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/common/LoadingScreen';
import NotificationToast from '../components/common/NotificationToast';
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import * as SplashScreen from 'expo-splash-screen';

// DÉSACTIVÉ: Laisser le splash se cacher automatiquement
// SplashScreen.preventAutoHideAsync();

const setDefaultFont = () => {
  const defaultFont = 'Montserrat_400Regular';
  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = { fontFamily: defaultFont };
  TextInput.defaultProps = TextInput.defaultProps || {};
  TextInput.defaultProps.style = { fontFamily: defaultFont };
};

const MainLayout = () => {
  const { session, user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('🟢 Navigation:', { loading, session: !!session, profile: !!profile, segments });

    if (loading) return;

    const inAuth = segments[0] === '(auth)';
    const isWelcome = segments[0] === 'welcome';

    console.log('🟢 Navigation check:', { inAuth, isWelcome, hasSession: !!session, hasProfile: !!profile });

    if (!session && !inAuth && !isWelcome) {
      console.log('🟢 Navigating to /welcome (no session)');
      router.replace('/welcome');
    } else if (session && !profile?.first_name && !segments.includes('onboarding')) {
      console.log('🟢 Navigating to /(auth)/onboarding (session without profile)');
      router.replace('/(auth)/onboarding');
    } else if (user && profile?.first_name && (inAuth || isWelcome)) {
      // Connecté avec profil → App principale selon user_type
      if (user.user_type === 'animateur') {
        console.log('🟢 Navigating to /(tabs)/homeAnimator');
        router.replace('/(tabs)/homeAnimator');
      } else if (user.user_type === 'laboratoire') {
        console.log('🟢 Navigating to /(tabs)/homeLaboratory');
        router.replace('/(tabs)/homeLaboratory');
      } else {
        console.log('🟢 Navigating to /(tabs)/home');
        router.replace('/(tabs)/home');
      }
    }
  }, [session, profile, loading, segments]);

  // Afficher le LoadingScreen pendant le chargement
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(screens)" />
      </Stack>
      {session && <NotificationToast />}
    </View>
  );
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
  });

  // Appliquer les fonts quand elles sont chargées
  useEffect(() => {
    if (fontsLoaded) {
      setDefaultFont();
    }
  }, [fontsLoaded]);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </SafeAreaProvider>
  );
}