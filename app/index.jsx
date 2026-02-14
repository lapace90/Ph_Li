import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/common/LoadingScreen';

export default function Index() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Pas de session → welcome
  if (!session) {
    return <Redirect href="/welcome" />;
  }

  // Session sans profil complet → onboarding
  if (!profile?.first_name) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  // Session avec profil → app principale
  return <Redirect href="/(tabs)/home" />;
}
