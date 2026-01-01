import { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import CVPreview from '../../components/cv/CVPreview';

export default function CVView() {
  const router = useRouter();
  const { cvId } = useLocalSearchParams();
  const { profile } = useAuth();
  
  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cvId) loadCV();
  }, [cvId]);

  const loadCV = async () => {
    try {
      const { data, error } = await supabase
        .from('cvs')
        .select('*')
        .eq('id', cvId)
        .single();

      if (error) throw error;
      setCv(data);
    } catch (error) {
      console.error('Error loading CV:', error);
      Alert.alert('Erreur', 'Impossible de charger le CV');
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
});