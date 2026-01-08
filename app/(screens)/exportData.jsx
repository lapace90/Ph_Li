import { Alert, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Button from '../../components/common/Button';
import Icon from '../../assets/icons/Icon';

export default function ExportData() {
  const router = useRouter();
  const { session } = useAuth();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  const handleExport = async () => {
    setLoading(true);
    try {
      setProgress('Récupération du profil...');
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setProgress('Récupération des paramètres...');
      const { data: privacy } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      setProgress('Récupération des CV...');
      const { data: cvs } = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', session.user.id);

      setProgress('Récupération des vérifications RPPS...');
      const { data: rppsVerification } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('verification_type', 'rpps')
        .maybeSingle();

      setProgress('Récupération des candidatures...');
      const { data: matches } = await supabase
        .from('matches')
        .select('id, status, created_at, job_offer_id, internship_offer_id')
        .eq('candidate_id', session.user.id);

      setProgress('Préparation du fichier...');
      const exportData = {
        exportDate: new Date().toISOString(),
        exportVersion: '2.0',
        user: {
          email: session.user.email,
          createdAt: session.user.created_at,
        },
        profile: profile ? {
          firstName: profile.first_name,
          lastName: profile.last_name,
          phone: profile.phone,
          gender: profile.gender,
          bio: profile.bio,
          experienceYears: profile.experience_years,
          specializations: profile.specializations,
          availabilityDate: profile.availability_date,
          searchRadiusKm: profile.search_radius_km,
          preferredContractTypes: profile.preferred_contract_types,
          willingToRelocate: profile.willing_to_relocate,
          studyLevel: profile.study_level,
          school: profile.school,
          location: {
            city: profile.current_city,
            postalCode: profile.current_postal_code,
            region: profile.current_region,
            department: profile.current_department,
          },
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        } : null,
        privacySettings: privacy ? {
          profileVisibility: privacy.profile_visibility,
          showRealName: privacy.show_real_name,
          showPhoto: privacy.show_photo,
          showExactLocation: privacy.show_exact_location,
          allowMessaging: privacy.allow_messaging,
          showAvailability: privacy.show_availability,
          createdAt: privacy.created_at,
        } : null,
        rppsVerification: rppsVerification ? {
          rppsNumber: rppsVerification.document_reference,
          status: rppsVerification.status,
          verificationData: rppsVerification.verification_data,
          submittedAt: rppsVerification.submitted_at,
          verifiedAt: rppsVerification.verified_at,
          rejectionReason: rppsVerification.rejection_reason,
        } : null,
        cvs: cvs?.map(cv => ({
          title: cv.title,
          visibility: cv.visibility,
          isDefault: cv.is_default,
          createdAt: cv.created_at,
        })) || [],
        candidatures: matches?.map(m => ({
          status: m.status,
          type: m.job_offer_id ? 'emploi' : 'stage',
          createdAt: m.created_at,
        })) || [],
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `pharmalink_export_${Date.now()}.json`;
      const filePath = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(filePath, jsonString);

      setProgress('Ouverture du partage...');
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Exporter mes données PharmaLink',
        });
      } else {
        Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil.');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'export de vos données.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton router={router} />
          <Text style={styles.title}>Exporter mes données</Text>
          <View style={commonStyles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon name="clipboard" size={60} color={theme.colors.primary} />
          </View>

          <Text style={styles.description}>
            Conformément au RGPD, vous pouvez télécharger une copie de toutes vos données personnelles au format JSON.
          </Text>

          <View style={styles.dataList}>
            <Text style={styles.dataListTitle}>Données incluses :</Text>
            <DataItem icon="user" text="Informations de profil" />
            <DataItem icon="lock" text="Paramètres de confidentialité" />
            <DataItem icon="checkCircle" text="Vérification RPPS" />
            <DataItem icon="fileText" text="Liste des CV (métadonnées)" />
            <DataItem icon="briefcase" text="Historique des candidatures" />
          </View>

          {loading && (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.progressText}>{progress}</Text>
            </View>
          )}
        </View>

        <Button
          title="Télécharger mes données"
          loading={loading}
          onPress={handleExport}
        />
      </View>
    </ScreenWrapper>
  );
}

const DataItem = ({ icon, text }) => (
  <View style={styles.dataItem}>
    <Icon name={icon} size={16} color={theme.colors.textLight} />
    <Text style={styles.dataItemText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(4),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(3),
  },
  title: {
    fontSize: hp(2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: wp(30),
    height: wp(30),
    borderRadius: wp(15),
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  description: {
    fontSize: hp(1.7),
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: hp(2.5),
    paddingHorizontal: wp(5),
    marginBottom: hp(3),
  },
  dataList: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dataListTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
    marginBottom: hp(1.5),
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    paddingVertical: hp(0.8),
  },
  dataItemText: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginTop: hp(3),
  },
  progressText: {
    fontSize: hp(1.5),
    color: theme.colors.primary,
  },
});