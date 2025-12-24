import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

const MainLayout = () => {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';

    if (!user && !inAuth) {
      // Pas connecté → Login
      router.replace('/(auth)/login');
    } else if (user && !profile?.first_name && !segments.includes('onboarding')) {
      // Connecté mais pas de profil complet → Onboarding
      router.replace('/(auth)/onboarding');
    } else if (user && profile?.first_name && inAuth) {
      // Connecté avec profil → App principale
      router.replace('/(tabs)/home');
    }
  }, [user, profile, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="index" />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}