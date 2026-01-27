// components/laboratories/LaboratoryCard.jsx
// Carte et fiche laboratoire pour les animateurs

import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { Image } from 'expo-image';
import { useState } from 'react';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';
import Button from '../common/Button';
import { StarFavoriteButton } from '../common/FavoriteButton';

/**
 * Carte labo compacte (dans liste favoris)
 */
export const LaboratoryCompactCard = ({ 
  laboratory, 
  onPress,
  onRemove,
  missionsCount = 0,
  showRemove = true,
}) => {
  return (
    <Pressable style={styles.compactCard} onPress={onPress}>
      {/* Logo */}
      {laboratory?.logo_url ? (
        <Image source={{ uri: laboratory.logo_url }} style={styles.compactLogo} />
      ) : (
        <View style={styles.compactLogoPlaceholder}>
          <Icon name="laboratory" size={24} color={theme.colors.primary} />
        </View>
      )}

      {/* Contenu */}
      <View style={styles.compactContent}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactName} numberOfLines={1}>
            {laboratory?.brand_name || laboratory?.company_name}
          </Text>
          {laboratory?.siret_verified && (
            <Icon name="checkCircle" size={14} color={theme.colors.success} />
          )}
        </View>
        
        <View style={styles.compactMeta}>
          {laboratory?.product_categories?.length > 0 && (
            <Text style={styles.compactCategories} numberOfLines={1}>
              {laboratory.product_categories.slice(0, 2).join(' • ')}
            </Text>
          )}
          {missionsCount > 0 && (
            <Text style={styles.compactMissions}>
              {missionsCount} mission{missionsCount > 1 ? 's' : ''} en cours
            </Text>
          )}
        </View>
      </View>

      {/* Bouton supprimer ou chevron */}
      {showRemove ? (
        <Pressable style={styles.removeButton} onPress={onRemove}>
          <Icon name="star-filled" size={18} color={theme.colors.primary} />
        </Pressable>
      ) : (
        <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
      )}
    </Pressable>
  );
};

/**
 * Modal fiche labo complète
 */
export const LaboratoryDetailModal = ({ 
  visible, 
  onClose, 
  laboratory,
  missions = [],
  isFavorite = false,
  onToggleFavorite,
  onMissionPress,
}) => {
  if (!laboratory) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Icon name="x" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.modalTitle}>Profil Laboratoire</Text>
          <StarFavoriteButton 
            isFavorite={isFavorite} 
            onToggle={onToggleFavorite}
            size="medium"
          />
        </View>

        <ScrollView 
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Identité labo */}
          <View style={styles.labIdentity}>
            {laboratory.logo_url ? (
              <Image source={{ uri: laboratory.logo_url }} style={styles.labLogo} />
            ) : (
              <View style={styles.labLogoPlaceholder}>
                <Icon name="laboratory" size={40} color={theme.colors.primary} />
              </View>
            )}
            
            <View style={styles.labNameRow}>
              <Text style={styles.labName}>
                {laboratory.brand_name || laboratory.company_name}
              </Text>
              {laboratory.siret_verified && (
                <View style={styles.verifiedBadge}>
                  <Icon name="checkCircle" size={16} color={theme.colors.success} />
                  <Text style={styles.verifiedText}>Vérifié</Text>
                </View>
              )}
            </View>

            {laboratory.brand_name && laboratory.company_name !== laboratory.brand_name && (
              <Text style={styles.companyName}>{laboratory.company_name}</Text>
            )}
          </View>

          {/* Description */}
          {laboratory.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>À propos</Text>
              <Text style={styles.description}>{laboratory.description}</Text>
            </View>
          )}

          {/* Catégories produits */}
          {laboratory.product_categories?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Catégories de produits</Text>
              <View style={styles.categoriesContainer}>
                {laboratory.product_categories.map((cat, index) => (
                  <View key={index} style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{cat}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Site web */}
          {laboratory.website_url && (
            <View style={styles.section}>
              <View style={styles.websiteRow}>
                <Icon name="globe" size={18} color={theme.colors.primary} />
                <Text style={styles.websiteUrl}>{laboratory.website_url}</Text>
              </View>
            </View>
          )}

          {/* Missions du labo */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Missions disponibles ({missions.length})
              </Text>
            </View>
            
            {missions.length > 0 ? (
              <View style={styles.missionsList}>
                {missions.map((mission) => (
                  <Pressable 
                    key={mission.id} 
                    style={styles.missionItem}
                    onPress={() => onMissionPress?.(mission)}
                  >
                    <View style={styles.missionInfo}>
                      <Text style={styles.missionTitle} numberOfLines={1}>
                        {mission.title}
                      </Text>
                      <View style={styles.missionMeta}>
                        <Text style={styles.missionDate}>
                          {mission.start_date 
                            ? new Date(mission.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                            : 'Date flexible'
                          }
                        </Text>
                        <Text style={styles.missionCity}>{mission.city || 'N/C'}</Text>
                        <Text style={styles.missionRate}>{mission.daily_rate_min}€/j</Text>
                      </View>
                    </View>
                    <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.emptyMissions}>
                <Icon name="briefcase" size={32} color={theme.colors.gray} />
                <Text style={styles.emptyText}>Aucune mission disponible</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.modalFooter}>
          <Button
            title={isFavorite ? "Ne plus suivre" : "Suivre ce labo"}
            onPress={onToggleFavorite}
            variant={isFavorite ? "outline" : "primary"}
            icon={isFavorite ? "star-filled" : "star"}
          />
        </View>
      </View>
    </Modal>
  );
};

/**
 * Badge d'abonnement labo
 */
export const SubscriptionBadge = ({ tier }) => {
  const configs = {
    free: { label: 'Gratuit', color: theme.colors.gray, bg: theme.colors.gray + '20' },
    starter: { label: 'Starter', color: theme.colors.warning, bg: theme.colors.warning + '15' },
    pro: { label: 'Pro', color: theme.colors.primary, bg: theme.colors.primary + '15' },
    business: { label: 'Business', color: theme.colors.secondary, bg: theme.colors.secondary + '15' },
  };

  const config = configs[tier] || configs.free;

  return (
    <View style={[styles.subscriptionBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.subscriptionText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // ==========================================
  // COMPACT CARD
  // ==========================================
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  compactLogo: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  compactLogoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactContent: {
    flex: 1,
    marginLeft: wp(3),
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  compactName: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  compactMeta: {
    marginTop: hp(0.3),
  },
  compactCategories: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  compactMissions: {
    fontSize: hp(1.3),
    color: theme.colors.primary,
    marginTop: hp(0.2),
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ==========================================
  // MODAL
  // ==========================================
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: wp(5),
  },
  modalFooter: {
    padding: wp(5),
    paddingBottom: hp(4),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },

  // ==========================================
  // LAB IDENTITY
  // ==========================================
  labIdentity: {
    alignItems: 'center',
    paddingVertical: hp(3),
  },
  labLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  labLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginTop: hp(1.5),
  },
  labName: {
    fontSize: hp(2.4),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    backgroundColor: theme.colors.success + '15',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.md,
  },
  verifiedText: {
    fontSize: hp(1.2),
    color: theme.colors.success,
    fontFamily: theme.fonts.medium,
  },
  companyName: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    marginTop: hp(0.5),
  },

  // ==========================================
  // SECTIONS
  // ==========================================
  section: {
    marginBottom: hp(2.5),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(1),
  },
  description: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    lineHeight: hp(2.2),
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  categoryTag: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: theme.radius.md,
  },
  categoryText: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: theme.colors.card,
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
  },
  websiteUrl: {
    fontSize: hp(1.5),
    color: theme.colors.primary,
    flex: 1,
  },

  // ==========================================
  // MISSIONS LIST
  // ==========================================
  missionsList: {
    gap: hp(1),
  },
  missionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  missionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginTop: hp(0.3),
  },
  missionDate: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  missionCity: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  missionRate: {
    fontSize: hp(1.3),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.success,
  },
  emptyMissions: {
    alignItems: 'center',
    paddingVertical: hp(4),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
  },
  emptyText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: hp(1),
  },

  // ==========================================
  // SUBSCRIPTION BADGE
  // ==========================================
  subscriptionBadge: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.md,
  },
  subscriptionText: {
    fontSize: hp(1.2),
    fontFamily: theme.fonts.semiBold,
  },
});

export default {
  LaboratoryCompactCard,
  LaboratoryDetailModal,
  SubscriptionBadge,
};