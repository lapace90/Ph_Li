import { Alert, StyleSheet, Text, View, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useCallback } from 'react';
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

  const renderCV = ({ item }) => (
    <View style={styles.cvCard}>
      <View style={styles.cvContent}>
        <View style={styles.cvIcon}>
          <Icon name="fileText" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.cvInfo}>
          <View style={styles.cvTitleRow}>
            <Text style={styles.cvTitle}>{item.title}</Text>
            {item.is_default && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Par défaut</Text>
              </View>
            )}
          </View>
          <Text style={styles.cvDate}>
            Ajouté le {new Date(item.created_at).toLocaleDateString('fr-FR')}
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
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="fileText" size={60} color={theme.colors.gray} />
      <Text style={styles.emptyTitle}>Aucun CV</Text>
      <Text style={styles.emptyText}>
        Ajoutez votre premier CV pour postuler aux offres
      </Text>
    </View>
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
            onPress={() => router.push('/(screens)/cvAdd')}
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
            onPress={() => router.push('/(screens)/cvAdd')}
          >
            <Icon name="plus" size={24} color="white" />
            <Text style={styles.floatingButtonText}>Ajouter un CV</Text>
          </Pressable>
        )}
      </View>
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
    paddingBottom: hp(10),
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
  },
  defaultBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  defaultBadgeText: {
    fontSize: hp(1.2),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  cvDate: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: hp(0.3),
  },
  cvVisibility: {
    fontSize: hp(1.3),
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
});