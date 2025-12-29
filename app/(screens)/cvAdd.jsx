import { Alert, StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
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
      console.error('DocumentPicker error:', error);
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
      const fileName = `${session.user.id}/${Date.now()}.pdf`;

      // Vérifier que le fichier existe
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      if (!fileInfo.exists) {
        throw new Error('Le fichier n\'existe pas');
      }

      // Lire le fichier en base64
      const base64Data = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64Data) {
        throw new Error('Impossible de lire le fichier');
      }

      // Convertir en ArrayBuffer pour Supabase
      const { decode } = await import('base64-arraybuffer');
      const arrayBuffer = decode(base64Data);

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(fileName, arrayBuffer, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('cvs')
        .getPublicUrl(fileName);

      // Créer l'entrée CV en BDD
      const { error } = await createCV({
        title: title.trim(),
        file_url: publicUrl,
        visibility,
        has_pdf: true,
      });

      if (error) throw error;

      Alert.alert('Succès', 'CV ajouté avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
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
          <Text style={styles.title}>Importer un PDF</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.form}>
            <Input
              icon={<Icon name="fileText" size={22} color={theme.colors.textLight} />}
              placeholder="Titre du CV (ex: CV Officine)"
              value={title}
              onChangeText={setTitle}
            />

            <Pressable style={styles.filePicker} onPress={handlePickDocument}>
              <View style={[
                styles.fileIcon,
                file && { backgroundColor: theme.colors.success + '15' }
              ]}>
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
                <Text style={styles.fileName} numberOfLines={1}>
                  {file ? file.name : 'Maximum 5 Mo'}
                </Text>
              </View>
              {file && (
                <Pressable
                  style={styles.removeFile}
                  onPress={() => setFile(null)}
                >
                  <Icon name="x" size={20} color={theme.colors.textLight} />
                </Pressable>
              )}
            </Pressable>

            <View style={styles.visibilitySection}>
              <Text style={styles.visibilityLabel}>Visibilité du PDF</Text>
              <View style={styles.visibilityOptions}>
                <Pressable
                  style={[
                    styles.visibilityOption,
                    visibility === 'anonymous' && styles.visibilityOptionSelected,
                  ]}
                  onPress={() => setVisibility('anonymous')}
                >
                  <Icon
                    name="eyeOff"
                    size={18}
                    color={visibility === 'anonymous' ? 'white' : theme.colors.text}
                  />
                  <Text style={[
                    styles.visibilityText,
                    visibility === 'anonymous' && styles.visibilityTextSelected,
                  ]}>
                    Après match
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
                    name="eye"
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
                  ? 'Le PDF ne sera visible qu\'après un match mutuel'
                  : 'Le PDF sera visible par tous les recruteurs'}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Enregistrer le CV"
            loading={loading}
            onPress={handleSubmit}
            disabled={!file || !title.trim()}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(2),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    marginBottom: hp(2),
  },
  title: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
  },
  form: {
    gap: hp(2),
  },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: wp(3),
  },
  fileLabel: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  fileName: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: hp(0.3),
  },
  removeFile: {
    padding: hp(0.5),
  },
  visibilitySection: {
    marginTop: hp(1),
  },
  visibilityLabel: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: hp(1),
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
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  visibilityOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  visibilityText: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  visibilityTextSelected: {
    color: 'white',
  },
  visibilityHint: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginTop: hp(1),
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});