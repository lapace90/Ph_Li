import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Text, TextInput } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

// Force Montserrat sur tous les Text et TextInput
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
    if (loading) return;

    const inAuth = segments[0] === '(auth)';
    const isWelcome = segments[0] === 'welcome';

    if (!session && !inAuth && !isWelcome) {
      router.replace('/welcome');
    } else if (session && !profile?.first_name && !segments.includes('onboarding')) {
      router.replace('/(auth)/onboarding');
    } else if (session && profile?.first_name && (inAuth || isWelcome)) {
      router.replace('/(tabs)/home');
    }
  }, [user, profile, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name = "(screen)" />
    </Stack>
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

  useEffect(() => {
    if (fontsLoaded) {
      setDefaultFont();
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}