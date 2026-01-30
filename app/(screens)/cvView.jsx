import { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { cvService } from '../../services/cvService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import CVPreview from '../../components/cv/CVPreview';

export default function CVView() {
  const router = useRouter();
  const { cvId, matchId, viewMode } = useLocalSearchParams();
  const { user, profile } = useAuth();

  const [cv, setCv] = useState(null);
  const [cvProfile, setCvProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSharedView, setIsSharedView] = useState(false);

  useEffect(() => {
    if (viewMode === 'shared' && matchId) {
      loadSharedCV();
    } else if (cvId) {
      loadCV();
    }
  }, [cvId, matchId, viewMode]);

  const loadCV = async () => {
    try {
      const { data, error } = await supabase
        .from('cvs')
        .select('*')
        .eq('id', cvId)
        .single();

      if (error) throw error;
      setCv(data);
      setCvProfile(profile);
    } catch (error) {
      console.error('Error loading CV:', error);
      Alert.alert('Erreur', 'Impossible de charger le CV');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadSharedCV = async () => {
    try {
      // Utiliser le service pour récupérer le CV partagé
      const sharedCv = await cvService.getSharedCvForEmployer(matchId, user.id);

      if (!sharedCv) {
        Alert.alert('CV non disponible', 'Le candidat n\'a pas partagé son CV.');
        router.back();
        return;
      }

      setCv(sharedCv);
      setIsSharedView(true);

      // Charger le profil du candidat
      const { data: match } = await supabase
        .from('matches')
        .select('candidate_id')
        .eq('id', matchId)
        .single();

      if (match) {
        const { data: candidateProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', match.candidate_id)
          .single();

        setCvProfile(candidateProfile);
      }
    } catch (error) {
      console.error('Error loading shared CV:', error);
      Alert.alert('Erreur', error.message || 'Impossible de charger le CV partagé');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: '/(screens)/cvEdit',
      params: { cvId: cv.id }
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le CV',
      `Voulez-vous vraiment supprimer "${cv.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('cvs')
                .delete()
                .eq('id', cvId);

              if (error) throw error;
              router.back();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le CV');
            }
          },
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

  if (!cv) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={commonStyles.emptyContainer}>
          <Icon name="fileText" size={48} color={theme.colors.gray} />
          <Text style={commonStyles.emptyTitle}>CV introuvable</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Mode vue partagée (employeur consulte le CV d'un candidat)
  if (isSharedView) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        {/* Header */}
        <View style={commonStyles.header}>
          <Pressable style={commonStyles.headerButton} onPress={() => router.back()}>
            <Icon name="arrowLeft" size={24} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={commonStyles.headerTitle} numberOfLines={1}>
              CV de {cvProfile?.first_name || 'Candidat'}
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Shared banner */}
        <View style={styles.sharedBanner}>
          <Icon name="unlock" size={16} color={theme.colors.primary} />
          <Text style={styles.sharedBannerText}>
            Ce candidat vous a donné accès à son CV complet
          </Text>
        </View>

        {/* CV Preview */}
        {cv.has_structured_cv && cv.structured_data ? (
          <CVPreview
            structuredData={cv.structured_data}
            profile={cvProfile}
            mode="full"
            showToggle={false}
            style={commonStyles.flex1}
          />
        ) : cv.file_url ? (
          <View style={commonStyles.emptyContainer}>
            <Icon name="fileText" size={48} color={theme.colors.primary} />
            <Text style={commonStyles.emptyTitle}>CV PDF disponible</Text>
            <Pressable
              style={[commonStyles.buttonPrimary, { marginTop: hp(2) }]}
              onPress={() => router.push({
                pathname: '/(screens)/cvPdfView',
                params: { url: cv.file_url, title: `CV de ${cvProfile?.first_name || 'Candidat'}` }
              })}
            >
              <Icon name="download" size={18} color="white" />
              <Text style={commonStyles.buttonPrimaryText}>Voir le PDF</Text>
            </Pressable>
          </View>
        ) : (
          <View style={commonStyles.emptyContainer}>
            <Icon name="fileText" size={48} color={theme.colors.gray} />
            <Text style={commonStyles.emptyTitle}>CV non disponible</Text>
          </View>
        )}
      </ScreenWrapper>
    );
  }

  // Mode normal (candidat consulte son propre CV)
  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={commonStyles.header}>
        <Pressable style={commonStyles.headerButton} onPress={() => router.back()}>
          <Icon name="arrowLeft" size={24} color={theme.colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={commonStyles.headerTitle} numberOfLines={1}>{cv.title}</Text>
          {cv.is_default && (
            <View style={[commonStyles.badge, commonStyles.badgeSuccess, { marginLeft: wp(2) }]}>
              <Text style={[commonStyles.badgeText, commonStyles.badgeTextSuccess]}>Par défaut</Text>
            </View>
          )}
        </View>
        <View style={commonStyles.rowGapSmall}>
          <Pressable style={commonStyles.headerButton} onPress={handleEdit}>
            <Icon name="edit" size={20} color={theme.colors.text} />
          </Pressable>
          <Pressable style={commonStyles.headerButton} onPress={handleDelete}>
            <Icon name="trash" size={20} color={theme.colors.rose} />
          </Pressable>
        </View>
      </View>

      {/* CV Preview */}
      {cv.has_structured_cv && cv.structured_data ? (
        <CVPreview
          structuredData={cv.structured_data}
          profile={profile}
          mode={cv.visibility || 'anonymous'}
          showToggle={true}
          style={commonStyles.flex1}
        />
      ) : (
        <View style={commonStyles.emptyContainer}>
          <Icon name="fileText" size={48} color={theme.colors.gray} />
          <Text style={commonStyles.emptyTitle}>CV non structuré</Text>
          <Text style={commonStyles.emptyText}>
            Ce CV est un PDF importé sans données structurées.
          </Text>
          {cv.file_url && (
            <Pressable
              style={[commonStyles.buttonPrimary, { marginTop: hp(2) }]}
              onPress={() => router.push({
                pathname: '/(screens)/cvPdfView',
                params: { url: cv.file_url, title: cv.title }
              })}
            >
              <Text style={commonStyles.buttonPrimaryText}>Voir le PDF</Text>
            </Pressable>
          )}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: wp(2),
  },
  sharedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    gap: wp(2),
  },
  sharedBannerText: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
    fontWeight: '500',
  },
});
