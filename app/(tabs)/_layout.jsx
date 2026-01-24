// app/(tabs)/_layout.jsx
import { Tabs } from 'expo-router';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../assets/icons/Icon';

export default function TabsLayout() {
  const { user } = useAuth();
  const userType = user?.user_type;

  // Déterminer quels tabs sont visibles selon le user_type
  const isAnimator = userType === 'animateur';
  const isLaboratory = userType === 'laboratoire';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
      }}
    >
      {/* HOME - différent selon user_type */}
      <Tabs.Screen
        name="home"
        options={{
          href: isAnimator || isLaboratory ? null : '/(tabs)/home',
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="homeAnimator"
        options={{
          href: isAnimator ? '/(tabs)/homeAnimator' : null,
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="homeLaboratory"
        options={{
          href: isLaboratory ? '/(tabs)/homeLaboratory' : null,
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />

      {/* SEARCH - candidats/titulaires seulement */}
      <Tabs.Screen
        name="search"
        options={{
          href: isAnimator || isLaboratory ? null : '/(tabs)/search',
          title: 'Recherche',
          tabBarIcon: ({ color, size }) => (
            <Icon name="search" size={size} color={color} />
          ),
        }}
      />

      {/* MISSIONS - animateurs seulement */}
      <Tabs.Screen
        name="missions"
        options={{
          href: isAnimator ? '/(tabs)/missions' : null,
          title: 'Missions',
          tabBarIcon: ({ color, size }) => (
            <Icon name="briefcase" size={size} color={color} />
          ),
        }}
      />

      {/* MATCHING - tous */}
      <Tabs.Screen
        name="matching"
        options={{
          title: 'Matching',
          tabBarIcon: ({ color, size }) => (
            <Icon name="heart" size={size} color={color} />
          ),
        }}
      />

      {/* MARKETPLACE - candidats/titulaires seulement */}
      <Tabs.Screen
        name="marketplace"
        options={{
          href: isAnimator || isLaboratory ? null : '/(tabs)/marketplace',
          title: 'Pharmacies',
          tabBarIcon: ({ color, size }) => (
            <Icon name="building" size={size} color={color} />
          ),
        }}
      />

      {/* PROFILE - tous */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="user" size={size} color={color} />
          ),
        }}
      />

      {/* MESSAGES - caché des tabs (accessible via header) */}
      <Tabs.Screen
        name="messages"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}