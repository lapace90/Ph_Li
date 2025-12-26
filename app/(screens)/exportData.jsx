import { Alert, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
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

      setProgress('Préparation du fichier...');
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          email: session.user.email,
          createdAt: session.user.created_at,
        },
        profile: profile,
        privacySettings: privacy,
        cvs: cvs?.map(cv => ({
          title: cv.title,
          visibility: cv.visibility,
          isDefault: cv.is_default,
          createdAt: cv.created_at,
        })),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `pharmalink_export_${Date.now()}.json`;
      const filePath = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(filePath, jsonString);

      setProgress('');

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Exporter mes données',
        });
      } else {
        Alert.alert('Succès', 'Fichier exporté : ' + fileName);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter les données');
      console.error(error);
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
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon name="clipboard" size={60} color={theme.colors.primary} />
          </View>

          <Text style={styles.description}>
            Conformément au RGPD, vous pouvez télécharger une copie de toutes les données que nous détenons sur vous.
          </Text>

          <View style={styles.dataList}>
            <Text style={styles.dataListTitle}>Données incluses :</Text>
            <DataItem icon="user" text="Informations de profil" />
            <DataItem icon="lock" text="Paramètres de confidentialité" />
            <DataItem icon="fileText" text="Liste des CV (métadonnées)" />
            <DataItem icon="briefcase" text="Préférences de recherche" />
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