import { useState, useEffect } from 'react';
import { Alert, StyleSheet, Text, View, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { pharmacyListingService } from '../../services/pharmacyListingService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Icon from '../../assets/icons/Icon';
import CityAutocomplete from '../../components/common/CityAutocomplete';
import ImagePickerBox from '../../components/common/ImagePickerBox';
import { storageService } from '../../services/storageService';

const LISTING_TYPES = {
  vente: 'Vente',
  'location-gerance': 'Location-gérance',
  collaboration: 'Collaboration',
  association: 'Association',
};

const NEARBY_OPTIONS = [
  'Centre médical', 'Hôpital', 'EHPAD', 'Centre commercial',
  'Parking', 'Transport en commun', 'École', 'Zone piétonne',
];

export default function ListingEdit() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { session } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  const [formData, setFormData] = useState({
    type: null,
    title: '',
    description: '',
    price: '',
    negotiable: false,
    city: null,
    characteristics: {
      surface_m2: '',
      staff_count: '',
      annual_revenue: '',
      annual_profit: '',
      opening_hours: '',
      parking: false,
      has_robot: false,
      has_lab: false,
      has_drive: false,
      nearby: [],
    },
    anonymized: true,
    photos: [],
  });

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const data = await pharmacyListingService.getById(id);

      if (data.user_id !== session?.user?.id) {
        Alert.alert('Erreur', 'Vous ne pouvez pas modifier cette annonce');
        router.back();
        return;
      }

      const chars = data.characteristics || {};

      setFormData({
        type: data.type,
        title: data.title || '',
        description: data.description || '',
        price: data.price ? String(data.price) : '',
        negotiable: data.negotiable || false,
        city: data.city ? {
          city: data.city,
          postcode: data.postal_code,
          region: data.region,
          department: data.department,
          latitude: data.latitude,
          longitude: data.longitude,
          label: `${data.city} - ${data.region}`,
        } : null,
        characteristics: {
          surface_m2: chars.surface_m2 ? String(chars.surface_m2) : '',
          staff_count: chars.staff_count ? String(chars.staff_count) : '',
          annual_revenue: chars.annual_revenue ? String(chars.annual_revenue) : '',
          annual_profit: chars.annual_profit ? String(chars.annual_profit) : '',
          opening_hours: chars.opening_hours || '',
          parking: chars.parking || false,
          has_robot: chars.has_robot || false,
          has_lab: chars.has_lab || false,
          has_drive: chars.has_drive || false,
          nearby: chars.nearby || [],
        },
        anonymized: data.anonymized ?? true,
        photos: data.photos || [],
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger l\'annonce');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateCharacteristic = (field, value) => {
    setFormData(prev => ({
      ...prev,
      characteristics: { ...prev.characteristics, [field]: value },
    }));
  };

  const toggleNearby = (item) => {
    const current = formData.characteristics.nearby || [];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    updateCharacteristic('nearby', updated);
  };

  const handleAddPhoto = async (asset) => {
    if (formData.photos.length >= 10) {
      Alert.alert('Limite atteinte', 'Maximum 10 photos par annonce');
      return;
    }

    setPhotoLoading(true);
    try {
      const url = await storageService.uploadImage('listings', session.user.id, asset);
      updateField('photos', [...formData.photos, url]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger la photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleRemovePhoto = (index) => {
    const updated = formData.photos.filter((_, i) => i !== index);
    updateField('photos', updated);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return;
    }

    setSaving(true);
    try {
      const updates = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        negotiable: formData.negotiable,
        city: formData.city?.city || null,
        postal_code: formData.city?.postcode || null,
        region: formData.city?.region || null,
        department: formData.city?.department || null,
        latitude: formData.city?.latitude || null,
        longitude: formData.city?.longitude || null,
        characteristics: {
          surface_m2: formData.characteristics.surface_m2 ? parseInt(formData.characteristics.surface_m2) : null,
          staff_count: formData.characteristics.staff_count ? parseInt(formData.characteristics.staff_count) : null,
          annual_revenue: formData.characteristics.annual_revenue ? parseFloat(formData.characteristics.annual_revenue) : null,
          annual_profit: formData.characteristics.annual_profit ? parseFloat(formData.characteristics.annual_profit) : null,
          opening_hours: formData.characteristics.opening_hours || null,
          parking: formData.characteristics.parking,
          has_robot: formData.characteristics.has_robot,
          has_lab: formData.characteristics.has_lab,
          has_drive: formData.characteristics.has_drive,
          nearby: formData.characteristics.nearby,
        },
        anonymized: formData.anonymized,
        photos: formData.photos,
      };

      await pharmacyListingService.update(id, updates);

      Alert.alert('Succès', 'Annonce mise à jour', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Clôturer l\'annonce',
      'L\'annonce ne sera plus visible. Vous pourrez la réactiver plus tard.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Clôturer',
          onPress: async () => {
            try {
              await pharmacyListingService.close(id);
              Alert.alert('Succès', 'Annonce clôturée', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/marketplace') },
              ]);
            } catch (error) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer l\'annonce',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await pharmacyListingService.delete(id);
              Alert.alert('Succès', 'Annonce supprimée', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/marketplace') },
              ]);
            } catch (error) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Icon name="arrowLeft" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Modifier l'annonce</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type (read-only) */}
          <View style={styles.typeDisplay}>
            <Text style={styles.typeLabel}>Type d'annonce</Text>
            <Text style={styles.typeValue}>{LISTING_TYPES[formData.type]}</Text>
          </View>

          {/* General Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations générales</Text>

            <Input
              icon={<Icon name="fileText" size={22} color={theme.colors.textLight} />}
              placeholder="Titre de l'annonce *"
              value={formData.title}
              onChangeText={(v) => updateField('title', v)}
            />

            <View style={{ zIndex: 100 }}>
              <CityAutocomplete
                value={formData.city?.label}
                onSelect={(city) => updateField('city', city)}
                placeholder="Ville"
              />
            </View>

            <Input
              icon={<Icon name="briefcase" size={22} color={theme.colors.textLight} />}
              placeholder="Prix (€)"
              keyboardType="numeric"
              value={formData.price}
              onChangeText={(v) => updateField('price', v)}
            />

            <Pressable
              style={styles.toggleRow}
              onPress={() => updateField('negotiable', !formData.negotiable)}
            >
              <Text style={styles.toggleLabel}>Prix négociable</Text>
              <View style={[styles.toggle, formData.negotiable && styles.toggleActive]}>
                {formData.negotiable && <Icon name="check" size={14} color="white" />}
              </View>
            </Pressable>

            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Description"
                placeholderTextColor={theme.colors.textLight}
                multiline
                numberOfLines={4}
                value={formData.description}
                onChangeText={(v) => updateField('description', v)}
              />
            </View>
          </View>

          {/* Characteristics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caractéristiques</Text>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  icon={<Icon name="home" size={22} color={theme.colors.textLight} />}
                  placeholder="Surface (m²)"
                  keyboardType="numeric"
                  value={formData.characteristics.surface_m2}
                  onChangeText={(v) => updateCharacteristic('surface_m2', v)}
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  icon={<Icon name="users" size={22} color={theme.colors.textLight} />}
                  placeholder="Effectif"
                  keyboardType="numeric"
                  value={formData.characteristics.staff_count}
                  onChangeText={(v) => updateCharacteristic('staff_count', v)}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  icon={<Icon name="briefcase" size={22} color={theme.colors.textLight} />}
                  placeholder="CA annuel (€)"
                  keyboardType="numeric"
                  value={formData.characteristics.annual_revenue}
                  onChangeText={(v) => updateCharacteristic('annual_revenue', v)}
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  icon={<Icon name="star" size={22} color={theme.colors.textLight} />}
                  placeholder="Bénéfice (€)"
                  keyboardType="numeric"
                  value={formData.characteristics.annual_profit}
                  onChangeText={(v) => updateCharacteristic('annual_profit', v)}
                />
              </View>
            </View>

            <Input
              icon={<Icon name="clock" size={22} color={theme.colors.textLight} />}
              placeholder="Horaires (ex: 9h-19h)"
              value={formData.characteristics.opening_hours}
              onChangeText={(v) => updateCharacteristic('opening_hours', v)}
            />

            <Text style={styles.subsectionTitle}>Équipements</Text>
            <View style={styles.equipmentRow}>
              {[
                { key: 'parking', label: '🅿️ Parking' },
                { key: 'has_robot', label: '🤖 Robot' },
                { key: 'has_lab', label: '🔬 Labo' },
                { key: 'has_drive', label: '🚗 Drive' },
              ].map((item) => (
                <Pressable
                  key={item.key}
                  style={[
                    styles.equipmentChip,
                    formData.characteristics[item.key] && styles.equipmentChipSelected,
                  ]}
                  onPress={() => updateCharacteristic(item.key, !formData.characteristics[item.key])}
                >
                  <Text style={[
                    styles.equipmentChipText,
                    formData.characteristics[item.key] && styles.equipmentChipTextSelected,
                  ]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.subsectionTitle}>À proximité</Text>
            <View style={styles.nearbyGrid}>
              {NEARBY_OPTIONS.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.nearbyChip,
                    formData.characteristics.nearby?.includes(item) && styles.nearbyChipSelected,
                  ]}
                  onPress={() => toggleNearby(item)}
                >
                  <Text style={[
                    styles.nearbyChipText,
                    formData.characteristics.nearby?.includes(item) && styles.nearbyChipTextSelected,
                  ]}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Privacy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confidentialité</Text>

            <View style={styles.privacyCard}>
              <View style={styles.privacyHeader}>
                <Icon name="lock" size={24} color={theme.colors.primary} />
                <Text style={styles.privacyTitle}>Mode anonyme</Text>
                <Pressable
                  style={[styles.toggle, styles.toggleLarge, formData.anonymized && styles.toggleActive]}
                  onPress={() => updateField('anonymized', !formData.anonymized)}
                >
                  {formData.anonymized && <Icon name="check" size={16} color="white" />}
                </Pressable>
              </View>
              <Text style={styles.privacyDescription}>
                {formData.anonymized
                  ? 'Votre ville exacte et le prix précis seront masqués.'
                  : 'Toutes les informations seront visibles publiquement.'}
              </Text>
            </View>
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <ImagePickerBox
              values={formData.photos}
              onAdd={handleAddPhoto}
              onRemove={handleRemovePhoto}
              multiple
              maxImages={10}
              loading={photoLoading}
            />
          </View>

          {/* Actions */}
          <View style={styles.dangerSection}>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Icon name="x" size={20} color={theme.colors.warning} />
              <Text style={styles.closeButtonText}>Clôturer l'annonce</Text>
            </Pressable>

            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <Icon name="trash" size={20} color={theme.colors.rose} />
              <Text style={styles.deleteButtonText}>Supprimer l'annonce</Text>
            </Pressable>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Enregistrer" loading={saving} onPress={handleSave} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    marginBottom: hp(2),
  },
  headerTitle: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
    gap: hp(3),
  },
  typeDisplay: {
    backgroundColor: theme.colors.card,
    padding: hp(2),
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typeLabel: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  typeValue: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primary,
    marginTop: hp(0.3),
  },
  section: {
    gap: hp(1.5),
  },
  sectionTitle: {
    fontSize: hp(1.9),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: wp(3),
  },
  halfInput: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    padding: hp(2),
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggleLabel: {
    fontSize: hp(1.7),
    color: theme.colors.text,
  },
  toggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleLarge: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  toggleActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  textAreaContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xxl,
    borderWidth: 0.4,
    borderColor: theme.colors.text,
    padding: hp(2),
  },
  textArea: {
    fontSize: hp(1.7),
    color: theme.colors.text,
    minHeight: hp(10),
    textAlignVertical: 'top',
  },
  subsectionTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    marginTop: hp(0.5),
  },
  equipmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  equipmentChip: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  equipmentChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  equipmentChipText: {
    fontSize: hp(1.5),
    color: theme.colors.text,
  },
  equipmentChipTextSelected: {
    color: 'white',
  },
  nearbyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  nearbyChip: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  nearbyChipSelected: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  nearbyChipText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  nearbyChipTextSelected: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  privacyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginBottom: hp(1),
  },
  privacyTitle: {
    flex: 1,
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  privacyDescription: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    lineHeight: hp(2.2),
  },
  dangerSection: {
    gap: hp(1.5),
    paddingTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: hp(1.8),
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.warning + '15',
  },
  closeButtonText: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.medium,
    color: theme.colors.warning,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: hp(1.8),
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.rose + '15',
  },
  deleteButtonText: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.medium,
    color: theme.colors.rose,
  },
  footer: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});