import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { useCVs } from '../../hooks/useCVs';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';

export default function CVList() {
  const router = useRouter();
  const { session } = useAuth();
  const { cvs, loading, deleteCV, refresh } = useCVs(session?.user?.id);
  const [showTypeChoice, setShowTypeChoice] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  const handleViewCV = (cv) => {
    if (cv.has_structured_cv) {
      router.push({
        pathname: '/(screens)/cvView',
        params: { cvId: cv.id }
      });
    } else if (cv.file_url) {
      router.push({
        pathname: '/(screens)/cvPdfView',
        params: { url: cv.file_url, title: cv.title }
      });
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
            if (error) Alert.alert('Erreur', error.message);
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={commonStyles.headerNoBorder}>
        <Pressable style={commonStyles.headerButton} onPress={() => router.back()}>
          <Icon name="arrowLeft" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={commonStyles.headerTitleLarge}>Mes CV</Text>
        {cvs.length > 0 && cvs.length < 5 ? (
          <Pressable 
            style={[commonStyles.headerButton, commonStyles.buttonIconPrimary]} 
            onPress={() => setShowTypeChoice(true)}
          >
            <Icon name="plus" size={22} color={theme.colors.primary} />
          </Pressable>
        ) : (
          <View style={commonStyles.headerSpacer} />
        )}
      </View>

      {cvs.length === 0 ? (
        <View style={commonStyles.emptyContainer}>
          <View style={commonStyles.emptyIcon}>
            <Icon name="fileText" size={40} color={theme.colors.primary} />
          </View>
          <Text style={commonStyles.emptyTitle}>Aucun CV</Text>
          <Text style={commonStyles.emptyText}>
            Créez votre premier CV pour postuler aux offres
          </Text>
          <Pressable 
            style={[commonStyles.buttonPrimary, { marginTop: hp(3) }]}
            onPress={() => setShowTypeChoice(true)}
          >
            <Text style={commonStyles.buttonPrimaryText}>Créer un CV</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={commonStyles.listContainer}>
          {cvs.map((cv) => (
            <Pressable 
              key={cv.id} 
              style={commonStyles.listItem}
              onPress={() => handleViewCV(cv)}
            >
              <View style={[commonStyles.emptyIcon, { width: wp(12), height: wp(12), marginBottom: 0 }]}>
                <Icon 
                  name={cv.has_structured_cv ? 'edit' : 'fileText'} 
                  size={24} 
                  color={theme.colors.primary} 
                />
              </View>
              <View style={commonStyles.listItemContent}>
                <Text style={commonStyles.listItemTitle}>{cv.title}</Text>
                <View style={[commonStyles.rowGapSmall, { marginTop: hp(0.5) }]}>
                  {cv.has_structured_cv && (
                    <View style={[commonStyles.badge, commonStyles.badgeSecondary]}>
                      <Text style={[commonStyles.badgeText, commonStyles.badgeTextSecondary]}>
                        Formulaire
                      </Text>
                    </View>
                  )}
                  {cv.has_pdf && (
                    <View style={[commonStyles.badge, commonStyles.badgePrimary]}>
                      <Text style={[commonStyles.badgeText, commonStyles.badgeTextPrimary]}>
                        PDF
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Pressable 
                style={commonStyles.modalCloseButton}
                onPress={() => handleDelete(cv)}
              >
                <Icon name="trash" size={20} color={theme.colors.rose} />
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* FAB si entre 1 et 4 CVs */}
      {cvs.length > 0 && cvs.length < 5 && (
        <Pressable style={commonStyles.fab} onPress={() => setShowTypeChoice(true)}>
          <Icon name="plus" size={28} color="white" />
        </Pressable>
      )}

      {/* Modal choix type CV */}
      <Modal
        visible={showTypeChoice}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypeChoice(false)}
      >
        <Pressable 
          style={commonStyles.modalOverlay}
          onPress={() => setShowTypeChoice(false)}
        >
          <View style={commonStyles.modalContainer}>
            <View style={commonStyles.modalHeader}>
              <Text style={commonStyles.modalTitle}>Ajouter un CV</Text>
              <Pressable 
                style={commonStyles.modalCloseButton}
                onPress={() => setShowTypeChoice(false)}
              >
                <Icon name="x" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            <Pressable 
              style={[commonStyles.card, { marginBottom: hp(1.5) }]}
              onPress={() => {
                setShowTypeChoice(false);
                router.push('/(screens)/cvCreate');
              }}
            >
              <View style={commonStyles.rowGap}>
                <View style={[commonStyles.emptyIcon, { marginBottom: 0, width: wp(12), height: wp(12) }]}>
                  <Icon name="edit" size={24} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={commonStyles.rowGapSmall}>
                    <Text style={commonStyles.listItemTitle}>Créer via formulaire</Text>
                    <View style={[commonStyles.badge, commonStyles.badgeSuccess]}>
                      <Text style={[commonStyles.badgeText, commonStyles.badgeTextSuccess]}>
                        Recommandé
                      </Text>
                    </View>
                  </View>
                  <Text style={commonStyles.hint}>
                    CV structuré, optimisé pour le matching
                  </Text>
                </View>
              </View>
            </Pressable>

            <Pressable 
              style={commonStyles.card}
              onPress={() => {
                setShowTypeChoice(false);
                router.push('/(screens)/cvAdd');
              }}
            >
              <View style={commonStyles.rowGap}>
                <View style={[commonStyles.emptyIcon, { marginBottom: 0, width: wp(12), height: wp(12) }]}>
                  <Icon name="fileText" size={24} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={commonStyles.listItemTitle}>Importer un PDF</Text>
                  <Text style={commonStyles.hint}>
                    Téléchargez un CV existant
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}