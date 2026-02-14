import { useState } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { usePharmacyListings } from '../../hooks/usePharmacyListings';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import ListingCard from '../../components/marketplace/ListingCard';

const FILTERS = [
  { value: null, label: 'Tout' },
  { value: 'vente', label: 'Vente' },
  { value: 'location-gerance', label: 'Location' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'association', label: 'Association' },
];

export default function Marketplace() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState(null);
  
  const { listings, loading, refresh } = usePharmacyListings(
    activeFilter ? { type: activeFilter } : {}
  );

  const isTitulaire = user?.user_type === 'titulaire';

  const renderItem = ({ item }) => (
    <ListingCard
      listing={item}
      onPress={() => router.push({ 
        pathname: '/(screens)/listingDetail', 
        params: { id: item.id } 
      })}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="briefcase" size={60} color={theme.colors.gray} />
      <Text style={styles.emptyTitle}>Aucune annonce</Text>
      <Text style={styles.emptyText}>
        {activeFilter 
          ? 'Aucune annonce pour ce filtre'
          : 'Les annonces de pharmacies apparaîtront ici'}
      </Text>
    </View>
  );

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Pharmacies</Text>
          {isTitulaire && (
            <Pressable
              style={styles.addButton}
              onPress={() => router.push('/(screens)/listingCreate')}
            >
              <Icon name="plus" size={20} color="white" />
            </Pressable>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          <FlatList
            data={FILTERS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.label}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.filterChip,
                  activeFilter === item.value && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(item.value)}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === item.value && styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            )}
            contentContainerStyle={styles.filtersContent}
          />
        </View>

        {/* Listings */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={listings}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={listings.length === 0 ? styles.emptyList : styles.list}
            showsVerticalScrollIndicator={false}
            onRefresh={refresh}
            refreshing={loading}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(6),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    marginBottom: hp(2),
  },
  title: {
    fontSize: hp(3),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filters: {
    marginBottom: hp(2),
  },
  filtersContent: {
    paddingHorizontal: wp(5),
    gap: wp(2),
  },
  filterChip: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: wp(2),
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  filterTextActive: {
    color: 'white',
    fontFamily: theme.fonts.semiBold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
    gap: hp(2),
  },
  emptyList: {
    flex: 1,
    paddingHorizontal: wp(5),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(1),
  },
  emptyTitle: {
    fontSize: hp(2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});