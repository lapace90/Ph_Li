import { StyleSheet, Text, View, ScrollView, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { usePrivacy } from '../../hooks/usePrivacy';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import StatsCard from '../../components/home/StatsCard';
import JobCard from '../../components/home/JobCard';
import ActivityItem from '../../components/home/ActivityItem';

// Mock data - à remplacer par les vraies données
const MOCK_STATS = {
  matches: 3,
  applications: 7,
  messages: 2,
};

const MOCK_JOBS = [
  {
    id: '1',
    title: 'Préparateur(trice) en pharmacie',
    pharmacy_name: 'Pharmacie du Centre',
    city: 'Lyon',
    contract_type: 'CDI',
    distance: 5,
    match_score: 92,
  },
  {
    id: '2',
    title: 'Pharmacien adjoint H/F',
    pharmacy_name: 'Pharmacie des Halles',
    city: 'Villeurbanne',
    contract_type: 'CDD',
    distance: 8,
    match_score: 85,
  },
  {
    id: '3',
    title: 'Préparateur - Temps partiel',
    pharmacy_name: 'Grande Pharmacie',
    city: 'Bron',
    contract_type: 'vacation',
    distance: 12,
    match_score: 78,
  },
];

const MOCK_ACTIVITIES = [
  {
    id: '1',
    type: 'match',
    title: 'Pharmacie du Parc - CDI Préparateur',
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: '2',
    type: 'message',
    title: 'Pharmacie des Halles vous a envoyé un message',
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: '3',
    type: 'application_viewed',
    title: 'Grande Pharmacie - Votre candidature a été consultée',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

export default function Home() {
  const router = useRouter();
  const { session, profile } = useAuth();
  const { privacy } = usePrivacy(session?.user?.id);

  const isSearchActive = privacy?.searchable_by_recruiters;

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Bonjour {profile?.first_name} !
            </Text>
            <Pressable 
              style={styles.statusRow}
              onPress={() => router.push('/(screens)/privacySettings')}
            >
              <View style={[
                styles.statusDot,
                { backgroundColor: isSearchActive ? theme.colors.success : theme.colors.gray }
              ]} />
              <Text style={styles.statusText}>
                {isSearchActive ? 'Recherche active' : 'Recherche inactive'}
              </Text>
              <Icon name="chevronRight" size={14} color={theme.colors.textLight} />
            </Pressable>
          </View>
          <Pressable 
            style={styles.notifButton}
            onPress={() => {}}
          >
            <Icon name="bell" size={24} color={theme.colors.text} />
            {/* Badge notifications */}
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>2</Text>
            </View>
          </Pressable>
        </View>

        {/* Stats */}
        <StatsCard stats={MOCK_STATS} />

        {/* Offres recommandées */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Offres pour vous</Text>
            <Pressable 
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Text style={styles.seeAllText}>Voir tout</Text>
              <Icon name="chevronRight" size={16} color={theme.colors.primary} />
            </Pressable>
          </View>
          
          <FlatList
            data={MOCK_JOBS}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.jobsList}
            renderItem={({ item }) => (
              <JobCard 
                job={item} 
                onPress={() => {}} 
              />
            )}
          />
        </View>

        {/* Activité récente */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activité récente</Text>
          </View>
          
          <View style={styles.activitiesList}>
            {MOCK_ACTIVITIES.map((activity) => (
              <ActivityItem 
                key={activity.id}
                activity={activity}
                onPress={() => {}}
              />
            ))}
          </View>

          {MOCK_ACTIVITIES.length === 0 && (
            <View style={styles.emptyActivity}>
              <Icon name="clock" size={40} color={theme.colors.gray} />
              <Text style={styles.emptyText}>Aucune activité récente</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: wp(5),
    paddingTop: hp(6),
    paddingBottom: hp(4),
    gap: hp(2.5),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: hp(2.8),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.5),
    gap: wp(1.5),
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.rose,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadgeText: {
    fontSize: 10,
    fontFamily: theme.fonts.bold,
    color: 'white',
  },
  section: {
    gap: hp(1.5),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: hp(2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  seeAllText: {
    fontSize: hp(1.5),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  jobsList: {
    paddingRight: wp(5),
  },
  activitiesList: {
    gap: hp(1),
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: hp(4),
    gap: hp(1),
  },
  emptyText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
});