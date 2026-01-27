/**
 * Vue du profil d'un laboratoire (pour les animateurs)
 * Accessible après un match ou depuis une mission
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  ActivityIndicator, 
  Linking 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { laboratoryService } from '../../services/laboratoryService';
import { useFavorites } from '../../hooks/useFavorites';
import { FAVORITE_TYPES } from '../../services/favoritesService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import { PRODUCT_CATEGORIES } from '../../constants/profileOptions';

// Helper local
const getCategoryLabel = (value) => {
  const cat = PRODUCT_CATEGORIES.find(c => c.value === value);
  return cat?.label || value;
};

export default function ViewLaboratoryProfile() {
  const router = useRouter();
  const { laboratoryId, matchId, missionId } = useLocalSearchParams();
  const { session } = useAuth();

  const [laboratory, setLaboratory] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { isFavorite, toggleFavorite } = useFavorites(
    session?.user?.id, 
    FAVORITE_TYPES.LABORATORY
  );

  // ============================================
  // CHARGEMENT
  // ============================================

  const loadLaboratory = useCallback(async () => {
    if (!laboratoryId) return;
    
    setLoading(true);
    try {
      const data = await laboratoryService.getProfile(laboratoryId);
      setLaboratory(data);

      // Charger les missions actives
      if (laboratoryService.getMissions) {
        const missionsData = await laboratoryService.getMissions(
          laboratoryId, 
          { status: 'open' }
        );
        setMissions(missionsData || []);
      }
    } catch (error) {
      console.error('Erreur chargement profil labo:', error);
    } finally {
      setLoading(false);
    }
  }, [laboratoryId]);

  useEffect(() => {
    loadLaboratory();
  }, [loadLaboratory]);

  // ============================================
  // ACTIONS
  // ============================================

  const handleContact = () => {
    if (matchId) {
      router.push({ pathname: '/animatorConversation', params: { matchId } });
    } else if (missionId) {
      router.push({ pathname: '/(screens)/missionDetail', params: { missionId } });
    }
  };

  const openWebsite = () => {
    if (laboratory?.website_url) {
      Linking.openURL(laboratory.website_url);
    }
  };

  // ============================================
  // RENDER - LOADING / ERROR
  // ============================================

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={commonStyles.header}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Profil laboratoire</Text>
          <View style={commonStyles.headerSpacer} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!laboratory) {
    return (
      <ScreenWrapper>
        <View style={commonStyles.header}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Profil laboratoire</Text>
          <View style={commonStyles.headerSpacer} />
        </View>
        <View style={commonStyles.emptyContainer}>
          <Icon name="building" size={48} color={theme.colors.gray} />
          <Text style={commonStyles.emptyTitle}>Profil introuvable</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // ============================================
  // RENDER - CONTENT
  // ============================================

  const displayName = laboratory.brand_name || laboratory.company_name;

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Laboratoire</Text>
        <Pressable 
          style={commonStyles.headerButton} 
          onPress={() => toggleFavorite(laboratoryId)}
        >
          <Icon 
            name="star" 
            size={22} 
            color={isFavorite(laboratoryId) ? theme.colors.warning : theme.colors.textLight} 
          />
        </Pressable>
      </View>

      <ScrollView 
        style={commonStyles.flex1} 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.profileHeader}>
          {laboratory.logo_url ? (
            <Image 
              source={{ uri: laboratory.logo_url }} 
              style={styles.logo} 
              contentFit="contain" 
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Icon name="building" size={50} color={theme.colors.primary} />
            </View>
          )}

          <Text style={styles.name}>{displayName}</Text>
          
          {laboratory.company_name !== laboratory.brand_name && laboratory.company_name && (
            <Text style={commonStyles.hint}>{laboratory.company_name}</Text>
          )}

          {/* Badge tier */}
          <View style={[
            styles.tierBadge,
            laboratory.subscription_tier === 'premium' && styles.tierBadgePremium,
            laboratory.subscription_tier === 'business' && styles.tierBadgeBusiness,
          ]}>
            <Icon 
              name={
                laboratory.subscription_tier === 'business' ? 'zap' : 
                laboratory.subscription_tier === 'premium' ? 'star' : 'user'
              } 
              size={14} 
              color={laboratory.subscription_tier !== 'free' ? '#fff' : theme.colors.textLight} 
            />
            <Text style={[
              styles.tierBadgeText,
              laboratory.subscription_tier !== 'free' && styles.tierBadgeTextActive
            ]}>
              {laboratory.subscription_tier === 'business' ? 'Business' : 
               laboratory.subscription_tier === 'premium' ? 'Premium' : 'Standard'}
            </Text>
          </View>

          {/* SIRET vérifié */}
          {laboratory.siret && (
            <View style={styles.verifiedRow}>
              <Icon name="checkCircle" size={16} color={theme.colors.success} />
              <Text style={styles.verifiedText}>Entreprise vérifiée</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatItem 
            icon="briefcase" 
            value={laboratory.stats?.totalMissions || 0} 
            label="Missions" 
          />
          <StatItem 
            icon="star" 
            value={laboratory.stats?.averageRating?.toFixed(1) || '-'} 
            label="Note" 
          />
          <StatItem 
            icon="users" 
            value={laboratory.stats?.favoritesCount || 0} 
            label="Favoris" 
          />
        </View>

        {/* Description */}
        {laboratory.description && (
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>À propos</Text>
            <View style={commonStyles.card}>
              <Text style={styles.description}>{laboratory.description}</Text>
            </View>
          </View>
        )}

        {/* Catégories */}
        {laboratory.product_categories?.length > 0 && (
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Domaines d'activité</Text>
            <View style={styles.chipsContainer}>
              {laboratory.product_categories.map((cat, i) => (
                <View key={i} style={[commonStyles.chip, commonStyles.chipActive]}>
                  <Text style={[commonStyles.chipText, commonStyles.chipTextActive]}>
                    {getCategoryLabel(cat)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Contact */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Contact</Text>
          <View style={commonStyles.card}>
            {laboratory.contact_email && (
              <Pressable 
                style={styles.contactRow} 
                onPress={() => Linking.openURL(`mailto:${laboratory.contact_email}`)}
              >
                <Icon name="mail" size={18} color={theme.colors.primary} />
                <Text style={styles.contactText}>{laboratory.contact_email}</Text>
              </Pressable>
            )}
            
            {laboratory.contact_phone && (
              <Pressable 
                style={styles.contactRow} 
                onPress={() => Linking.openURL(`tel:${laboratory.contact_phone}`)}
              >
                <Icon name="phone" size={18} color={theme.colors.primary} />
                <Text style={styles.contactText}>{laboratory.contact_phone}</Text>
              </Pressable>
            )}
            
            {laboratory.website_url && (
              <Pressable style={styles.contactRow} onPress={openWebsite}>
                <Icon name="globe" size={18} color={theme.colors.primary} />
                <Text style={styles.contactTextLink}>{laboratory.website_url}</Text>
              </Pressable>
            )}
            
            {!laboratory.contact_email && !laboratory.contact_phone && !laboratory.website_url && (
              <Text style={commonStyles.hint}>Aucune information de contact</Text>
            )}
          </View>
        </View>

        {/* Missions */}
        {missions.length > 0 && (
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>
              Missions en cours ({missions.length})
            </Text>
            
            {missions.slice(0, 3).map((mission) => (
              <Pressable 
                key={mission.id} 
                style={styles.missionCard}
                onPress={() => router.push({
                  pathname: '/(screens)/missionDetail',
                  params: { missionId: mission.id }
                })}
              >
                <View style={commonStyles.flex1}>
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                  <View style={styles.missionInfo}>
                    <Icon name="mapPin" size={12} color={theme.colors.textLight} />
                    <Text style={commonStyles.hint}>
                      {mission.city}, {mission.region}
                    </Text>
                  </View>
                  <View style={styles.missionInfo}>
                    <Icon name="calendar" size={12} color={theme.colors.textLight} />
                    <Text style={commonStyles.hint}>
                      {new Date(mission.start_date).toLocaleDateString('fr-FR')} - {new Date(mission.end_date).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </View>
                <View style={styles.missionRate}>
                  <Text style={styles.missionRateValue}>{mission.daily_rate_min || mission.daily_rate_max}€</Text>
                  <Text style={commonStyles.hint}>/jour</Text>
                </View>
                <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
              </Pressable>
            ))}
            
            {missions.length > 3 && (
              <Pressable style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>
                  Voir toutes les missions ({missions.length})
                </Text>
                <Icon name="chevronRight" size={16} color={theme.colors.primary} />
              </Pressable>
            )}
          </View>
        )}

        <View style={{ height: hp(12) }} />
      </ScrollView>

      {/* Footer */}
      {(matchId || missionId) && (
        <View style={commonStyles.footer}>
          <Pressable style={commonStyles.buttonPrimary} onPress={handleContact}>
            <Icon name="messageCircle" size={20} color="#fff" />
            <Text style={commonStyles.buttonPrimaryText}>
              {matchId ? 'Envoyer un message' : 'Voir la mission'}
            </Text>
          </Pressable>
        </View>
      )}
    </ScreenWrapper>
  );
}

// ============================================
// SOUS-COMPOSANTS
// ============================================

const StatItem = ({ icon, value, label }) => (
  <View style={styles.statItem}>
    <Icon name={icon} size={22} color={theme.colors.primary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={commonStyles.hint}>{label}</Text>
  </View>
);

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  content: {
    padding: wp(5),
  },
  
  // Header
  profileHeader: {
    alignItems: 'center',
    paddingBottom: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: hp(2),
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: hp(1.5),
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: hp(1.5),
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: hp(2.4),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: hp(0.3),
  },
  
  // Tier
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.gray + '30',
    marginTop: hp(1),
  },
  tierBadgePremium: {
    backgroundColor: theme.colors.warning,
  },
  tierBadgeBusiness: {
    backgroundColor: theme.colors.primary,
  },
  tierBadgeText: {
    fontSize: hp(1.3),
    fontWeight: '600',
    color: theme.colors.textLight,
  },
  tierBadgeTextActive: {
    color: '#fff',
  },

  // Verified
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    marginTop: hp(1),
  },
  verifiedText: {
    color: theme.colors.success,
    fontSize: hp(1.3),
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    marginBottom: hp(2),
  },
  statItem: {
    alignItems: 'center',
    gap: hp(0.5),
  },
  statValue: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: theme.colors.text,
  },

  // Description
  description: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    lineHeight: hp(2.3),
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },

  // Contact
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  contactText: {
    fontSize: hp(1.5),
    color: theme.colors.text,
  },
  contactTextLink: {
    fontSize: hp(1.5),
    color: theme.colors.primary,
  },

  // Missions
  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  missionTitle: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(0.3),
  },
  missionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  missionRate: {
    alignItems: 'flex-end',
    marginRight: wp(2),
  },
  missionRateValue: {
    fontSize: hp(1.8),
    fontWeight: '700',
    color: theme.colors.primary,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1),
    paddingVertical: hp(1.5),
  },
  seeAllText: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    fontWeight: '500',
  },
});