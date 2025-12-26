import { Alert, StyleSheet, Text, View, Pressable } from 'react-native';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useCVs } from '../../hooks/useCVs';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Icon from '../../assets/icons/Icon';

export default function CVAdd() {
  const router = useRouter();
  const { session } = useAuth();
  const { createCV, cvs } = useCVs(session?.user?.id);

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [visibility, setVisibility] = useState('anonymous');

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        if (asset.size > 5 * 1024 * 1024) {
          Alert.alert('Erreur', 'Le fichier ne doit pas dépasser 5 Mo');
          return;
        }
        setFile(asset);
        if (!title) {
          setTitle(asset.name.replace('.pdf', ''));
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez donner un titre à votre CV');
      return;
    }
    if (!file) {
      Alert.alert('Erreur', 'Veuillez sélectionner un fichier PDF');
      return;
    }
    if (cvs.length >= 5) {
      Alert.alert('Erreur', 'Vous avez atteint le maximum de 5 CV');
      return;
    }

    setLoading(true);
    try {
      // Upload du fichier
      const fileExt = 'pdf';
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
      
      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(fileName, blob, { contentType: 'application/pdf' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cvs')
        .getPublicUrl(fileName);

      // Créer l'entrée CV
      const { error } = await createCV({
        title: title.trim(),
        file_url: publicUrl,
        visibility,
      });

      if (error) throw error;

      Alert.alert('Succès', 'CV ajouté avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton router={router} />
          <Text style={styles.title}>Ajouter un CV</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.form}>
          <Input
            icon={<Icon name="fileText" size={22} color={theme.colors.textLight} />}
            placeholder="Titre du CV (ex: CV Officine)"
            value={title}
            onChangeText={setTitle}
          />

          <Pressable style={styles.filePicker} onPress={handlePickDocument}>
            <View style={styles.fileIcon}>
              <Icon 
                name={file ? 'check' : 'plus'} 
                size={24} 
                color={file ? theme.colors.success : theme.colors.primary} 
              />
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileLabel}>
                {file ? 'Fichier sélectionné' : 'Sélectionner un PDF'}
              </Text>
              <Text style={styles.fileName}>
                {file ? file.name : 'Maximum 5 Mo'}
              </Text>
            </View>
            {file && (
              <Pressable onPress={() => setFile(null)}>
                <Icon name="x" size={20} color={theme.colors.textLight} />
              </Pressable>
            )}
          </Pressable>

          <View style={styles.visibilitySection}>
            <Text style={styles.visibilityLabel}>Visibilité par défaut</Text>
            <View style={styles.visibilityOptions}>
              <Pressable
                style={[
                  styles.visibilityOption,
                  visibility === 'anonymous' && styles.visibilityOptionSelected,
                ]}
                onPress={() => setVisibility('anonymous')}
              >
                <Icon 
                  name="lock" 
                  size={18} 
                  color={visibility === 'anonymous' ? 'white' : theme.colors.text} 
                />
                <Text style={[
                  styles.visibilityText,
                  visibility === 'anonymous' && styles.visibilityTextSelected,
                ]}>
                  Anonyme
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.visibilityOption,
                  visibility === 'public' && styles.visibilityOptionSelected,
                ]}
                onPress={() => setVisibility('public')}
              >
                <Icon 
                  name="globe" 
                  size={18} 
                  color={visibility === 'public' ? 'white' : theme.colors.text} 
                />
                <Text style={[
                  styles.visibilityText,
                  visibility === 'public' && styles.visibilityTextSelected,
                ]}>
                  Public
                </Text>
              </Pressable>
            </View>
            <Text style={styles.visibilityHint}>
              {visibility === 'anonymous' 
                ? 'Vos informations personnelles seront masquées' 
                : 'Votre CV sera visible en intégralité'}
            </Text>
          </View>
        </View>

        <Button
          title="Ajouter le CV"
          loading={loading}
          onPress={handleSubmit}
        />
      </View>
    </ScreenWrapper>
  );
}

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
    fontSize: hp(2.2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  form: {
    flex: 1,
    gap: hp(2),
  },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  fileIcon: {
    width: wp(12),
    height: wp(12),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: wp(3),
  },
  fileLabel: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  fileName: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: hp(0.3),
  },
  visibilitySection: {
    gap: hp(1),
  },
  visibilityLabel: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: wp(3),
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  visibilityOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  visibilityText: {
    fontSize: hp(1.6),
    color: theme.colors.text,
  },
  visibilityTextSelected: {
    color: 'white',
    fontFamily: theme.fonts.medium,
  },
  visibilityHint: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
});