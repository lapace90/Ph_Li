// app/(screens)/cvList.jsx

import { Alert, StyleSheet, Text, View, Pressable, FlatList, ActivityIndicator, Modal } from 'react-native';
import { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useCVs } from '../../hooks/useCVs';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';

export default function CVList() {
  const router = useRouter();
  const { session } = useAuth();
  const { cvs, loading, refresh, deleteCV, setDefaultCV } = useCVs(session?.user?.id);
  
  // Modal de choix
  const [showTypeChoice, setShowTypeChoice] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  const handleSetDefault = async (cvId) => {
    const { error } = await setDefaultCV(cvId);
    if (error) {
      Alert.alert('Erreur', 'Impossible de définir ce CV par défaut');
    }
  };

  const handleDelete = (cv) => {
    Alert.alert(
      'Supprimer le CV',
      `Voulez-vous vraiment supprimer "${cv.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteCV(cv.id);
            if (error) {
              Alert.alert('Erreur', 'Impossible de supprimer ce CV');
            }
          },
        },
      ]
    );
  };

  const handleViewCV = (cv) => {
    if (cv.has_structured_cv) {
      // CV formulaire → aller vers l'écran de visualisation/édition
      router.push({ pathname: '/(screens)/cvView', params: { id: cv.id } });
    } else if (cv.file_url) {
      // CV PDF → ouvrir le PDF (ou afficher un message)
      Alert.alert('CV PDF', 'Aperçu PDF à implémenter');
    }
  };

  const renderCV = ({ item }) => (
    <Pressable 
      style={styles.cvCard}
      onPress={() => handleViewCV(item)}
    >
      <View style={styles.cvContent}>
        <View style={[
          styles.cvIcon,
          item.has_structured_cv && { backgroundColor: theme.colors.secondary + '15' }
        ]}>
          <Icon 
            name={item.has_structured_cv ? 'edit' : 'fileText'} 
            size={24} 
            color={item.has_structured_cv ? theme.colors.secondary : theme.colors.primary} 
          />
        </View>
        <View style={styles.cvInfo}>
          <View style={styles.cvTitleRow}>
            <Text style={styles.cvTitle} numberOfLines={1}>{item.title}</Text>
            {item.is_default && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Par défaut</Text>
              </View>
            )}
          </View>
          
          {/* Type de CV */}
          <View style={styles.cvTypeRow}>
            {item.has_structured_cv && (
              <View style={[styles.typeBadge, { backgroundColor: theme.colors.secondary + '15' }]}>
                <Text style={[styles.typeBadgeText, { color: theme.colors.secondary }]}>Formulaire</Text>
              </View>
            )}
            {item.has_pdf && (
              <View style={[styles.typeBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                <Text style={[styles.typeBadgeText, { color: theme.colors.primary }]}>PDF</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.cvDate}>
            {new Date(item.created_at).toLocaleDateString('fr-FR')}
          </Text>
          <Text style={styles.cvVisibility}>
            {item.visibility === 'public' ? '🌐 Public' : '🔒 Anonyme'}
          </Text>
        </View>
      </View>
      
      <View style={styles.cvActions}>
        {!item.is_default && (
          <Pressable 
            style={styles.actionButton}
            onPress={() => handleSetDefault(item.id)}
          >
            <Icon name="star" size={18} color={theme.colors.warning} />
          </Pressable>
        )}
        <Pressable 
          style={styles.actionButton}
          onPress={() => handleDelete(item)}
        >
          <Icon name="trash" size={18} color={theme.colors.rose} />
        </Pressable>
      </View>
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="fileText" size={60} color={theme.colors.gray} />
      <Text style={styles.emptyTitle}>Aucun CV</Text>
      <Text style={styles.emptyText}>
        Ajoutez votre premier CV pour postuler aux offres
      </Text>
      <Pressable 
        style={styles.emptyButton}
        onPress={() => setShowTypeChoice(true)}
      >
        <Icon name="plus" size={20} color="white" />
        <Text style={styles.emptyButtonText}>Créer un CV</Text>
      </Pressable>
    </View>
  );

  // Modal de choix du type de CV
  const renderTypeChoiceModal = () => (
    <Modal
      visible={showTypeChoice}
      transparent
      animationType="fade"
      onRequestClose={() => setShowTypeChoice(false)}
    >
      <Pressable 
        style={styles.modalOverlay} 
        onPress={() => setShowTypeChoice(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ajouter un CV</Text>
            <Pressable 
              style={styles.modalClose}
              onPress={() => setShowTypeChoice(false)}
            >
              <Icon name="x" size={22} color={theme.colors.text} />
            </Pressable>
          </View>

          <Text style={styles.modalSubtitle}>
            Comment souhaitez-vous créer votre CV ?
          </Text>

          {/* Option Formulaire */}
          <Pressable 
            style={styles.optionCard}
            onPress={() => {
              setShowTypeChoice(false);
              router.push('/(screens)/cvCreate');
            }}
          >
            <View style={[styles.optionIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
              <Icon name="edit" size={28} color={theme.colors.secondary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Créer via formulaire</Text>
              <Text style={styles.optionDescription}>
                CV structuré avec version anonyme automatique
              </Text>
            </View>
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>Recommandé</Text>
            </View>
          </Pressable>

          {/* Option PDF */}
          <Pressable 
            style={styles.optionCard}
            onPress={() => {
              setShowTypeChoice(false);
              router.push('/(screens)/cvAdd');
            }}
          >
            <View style={[styles.optionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
              <Icon name="file" size={28} color={theme.colors.primary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Importer un PDF</Text>
              <Text style={styles.optionDescription}>
                Uploadez votre CV existant
              </Text>
            </View>
          </Pressable>

          {/* Info */}
          <View style={styles.infoBox}>
            <Icon name="info" size={16} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Le CV formulaire permet un meilleur matching et une version anonyme automatique.
            </Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton router={router} />
          <Text style={styles.title}>Mes CV</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowTypeChoice(true)}
          >
            <Icon name="plus" size={22} color="white" />
          </Pressable>
        </View>

        <Text style={styles.subtitle}>
          Maximum 5 CV • {cvs.length}/5 utilisés
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={cvs}
            keyExtractor={(item) => item.id}
            renderItem={renderCV}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={cvs.length === 0 ? styles.emptyList : styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        {cvs.length < 5 && cvs.length > 0 && (
          <Pressable
            style={styles.floatingButton}
            onPress={() => setShowTypeChoice(true)}
          >
            <Icon name="plus" size={24} color="white" />
            <Text style={styles.floatingButtonText}>Ajouter un CV</Text>
          </Pressable>
        )}
      </View>

      {renderTypeChoiceModal()}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  title: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    marginBottom: hp(2),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    gap: hp(1.5),
    paddingBottom: hp(12),
  },
  emptyList: {
    flex: 1,
  },
  cvCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cvContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cvIcon: {
    width: wp(12),
    height: wp(12),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cvInfo: {
    flex: 1,
    marginLeft: wp(3),
  },
  cvTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  cvTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  defaultBadgeText: {
    fontSize: hp(1.1),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  cvTypeRow: {
    flexDirection: 'row',
    gap: wp(1.5),
    marginTop: hp(0.4),
  },
  typeBadge: {
    paddingHorizontal: wp(1.5),
    paddingVertical: hp(0.2),
    borderRadius: theme.radius.xs,
  },
  typeBadgeText: {
    fontSize: hp(1.1),
    fontFamily: theme.fonts.medium,
  },
  cvDate: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginTop: hp(0.3),
  },
  cvVisibility: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    marginTop: hp(0.2),
  },
  cvActions: {
    flexDirection: 'row',
    gap: wp(2),
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: wp(10),
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.xl,
    marginTop: hp(2),
  },
  emptyButtonText: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: 'white',
  },
  floatingButton: {
    position: 'absolute',
    bottom: hp(3),
    left: wp(5),
    right: wp(5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(2),
    borderRadius: theme.radius.xl,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  floatingButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: 'white',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    padding: wp(5),
    paddingBottom: hp(4),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  modalTitle: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  modalClose: {
    padding: hp(0.5),
  },
  modalSubtitle: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    marginBottom: hp(2),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
    marginLeft: wp(3),
  },
  optionTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  optionDescription: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginTop: hp(0.3),
  },
  recommendedBadge: {
    position: 'absolute',
    top: hp(1),
    right: hp(1),
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  recommendedText: {
    fontSize: hp(1),
    color: 'white',
    fontFamily: theme.fonts.medium,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    marginTop: hp(1),
    gap: wp(2),
  },
  infoText: {
    flex: 1,
    fontSize: hp(1.3),
    color: theme.colors.primary,
    lineHeight: hp(1.9),
  },
});