import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, Switch, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { pharmacyListingService } from '../../services/pharmacyListingService';
import { storageService } from '../../services/storageService';
import {
  LISTING_TYPES,
  NEARBY_OPTIONS,
  getListingTypeLabel,
  getListingTypeColor,
  formatNumber,
} from '../../constants/listingOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import CityAutocomplete from '../../components/common/CityAutocomplete';
import ImagePickerBox from '../../components/common/ImagePickerBox';

export default function ListingEdit() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { session } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('info');

  const [formData, setFormData] = useState({
    type: null,
    title: '',
    description: '',
    price: '',
    negotiable: false,
    city: '',
    postal_code: '',
    region: '',
    department: '',
    latitude: null,
    longitude: null,
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
        city: data.city || '',
        postal_code: data.postal_code || '',
        region: data.region || '',
        department: data.department || '',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
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

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

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

  const handleCitySelect = (city) => {
    setFormData(prev => ({
      ...prev,
      city: city.city,
      postal_code: city.postcode,
      region: city.region,
      department: city.department,
      latitude: city.latitude,
      longitude: city.longitude,
    }));
  };

  const handleAddPhoto = async (asset) => {
    if (formData.photos.length >= 10) {
      Alert.alert('Limite atteinte', 'Maximum 10 photos');
      return;
    }
    setPhotoLoading(true);
    try {
      const url = await storageService.uploadImage(
        'listings',
        `${session.user.id}/${Date.now()}`,
        asset
      );
      updateField('photos', [...formData.photos, url]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger la photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleRemovePhoto = (index) => {
    updateField('photos', formData.photos.filter((_, i) => i !== index));
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
        description: formData.description?.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        negotiable: formData.negotiable,
        city: formData.city || null,
        postal_code: formData.postal_code || null,
        region: formData.region || null,
        department: formData.department || null,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
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
      Alert.alert('Erreur', error.message || 'Impossible de sauvegarder');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Supprimer l\'annonce', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await pharmacyListingService.delete(id);
            router.replace('/(tabs)/search');
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={commonStyles.loadingText}>Chargement...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const SECTIONS = [
    { key: 'info', label: 'Infos', icon: 'fileText' },
    { key: 'details', label: 'Détails', icon: 'home' },
    { key: 'photos', label: 'Photos', icon: 'image' },
    { key: 'privacy', label: 'Options', icon: 'lock' },
  ];

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <KeyboardAvoidingView style={commonStyles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={commonStyles.header}>
          <Pressable style={commonStyles.headerButton} onPress={() => router.back()}>
            <Icon name="x" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={commonStyles.headerTitle}>Modifier l'annonce</Text>
          <Pressable style={commonStyles.headerButton} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Icon name="check" size={24} color={theme.colors.primary} />
            )}
          </Pressable>
        </View>

        {/* Type Badge */}
        <View style={styles.typeBadgeContainer}>
          <View style={[commonStyles.badge, { backgroundColor: getListingTypeColor(formData.type) + '15' }]}>
            <Text style={[commonStyles.badgeText, { color: getListingTypeColor(formData.type) }]}>
              {getListingTypeLabel(formData.type)}
            </Text>
          </View>
        </View>

        {/* Section Tabs */}
        <View style={styles.tabsContainer}>
          {SECTIONS.map((section) => (
            <Pressable
              key={section.key}
              style={[styles.tab, activeSection === section.key && styles.tabActive]}
              onPress={() => setActiveSection(section.key)}
            >
              <Icon 
                name={section.icon} 
                size={18} 
                color={activeSection === section.key ? theme.colors.primary : theme.colors.textLight} 
              />
              <Text style={[styles.tabText, activeSection === section.key && styles.tabTextActive]}>
                {section.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        <ScrollView 
          style={commonStyles.flex1} 
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeSection === 'info' && (
            <SectionInfo 
              formData={formData} 
              updateField={updateField} 
              onCitySelect={handleCitySelect} 
            />
          )}
          {activeSection === 'details' && (
            <SectionDetails 
              formData={formData} 
              updateCharacteristic={updateCharacteristic} 
              toggleNearby={toggleNearby} 
            />
          )}
          {activeSection === 'photos' && (
            <SectionPhotos 
              formData={formData} 
              onAddPhoto={handleAddPhoto} 
              onRemovePhoto={handleRemovePhoto} 
              photoLoading={photoLoading} 
            />
          )}
          {activeSection === 'privacy' && (
            <SectionPrivacy 
              formData={formData} 
              updateField={updateField} 
              onDelete={handleDelete} 
            />
          )}
        </ScrollView>

        {/* Footer */}
        <View style={commonStyles.footer}>
          <Button
            title="Enregistrer les modifications"
            onPress={handleSave}
            loading={saving}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

// ============================================
// SECTION COMPONENTS
// ============================================

const SectionInfo = ({ formData, updateField, onCitySelect }) => (
  <View style={commonStyles.section}>
    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Titre de l'annonce *</Text>
      <Input 
        placeholder="Ex: Pharmacie de centre-ville à céder" 
        value={formData.title} 
        onChangeText={(v) => updateField('title', v)} 
      />
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Description</Text>
      <Input
        placeholder="Décrivez votre pharmacie..."
        value={formData.description}
        onChangeText={(v) => updateField('description', v)}
        multiline
        numberOfLines={5}
        inputStyle={commonStyles.textArea}
      />
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Ville</Text>
      <CityAutocomplete
        value={formData.city ? { city: formData.city, postcode: formData.postal_code } : null}
        onSelect={onCitySelect}
        placeholder="Rechercher une ville..."
      />
    </View>

    {formData.city && (
      <View style={commonStyles.card}>
        <View style={commonStyles.rowGapSmall}>
          <Icon name="mapPin" size={16} color={theme.colors.primary} />
          <Text style={[commonStyles.chipText, { fontFamily: theme.fonts.medium }]}>{formData.city}, {formData.postal_code}</Text>
        </View>
        <View style={[commonStyles.rowGapSmall, { marginTop: hp(0.8) }]}>
          <Icon name="map" size={16} color={theme.colors.textLight} />
          <Text style={commonStyles.hint}>{formData.department}, {formData.region}</Text>
        </View>
      </View>
    )}

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Prix de vente (€)</Text>
      <Input 
        placeholder="Ex: 850000" 
        value={formData.price} 
        onChangeText={(v) => updateField('price', v.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
      />
      <View style={[commonStyles.rowGapSmall, { marginTop: hp(1) }]}>
        <Switch
          value={formData.negotiable}
          onValueChange={(v) => updateField('negotiable', v)}
          trackColor={{ false: theme.colors.gray, true: theme.colors.primary + '50' }}
          thumbColor={formData.negotiable ? theme.colors.primary : '#f4f3f4'}
        />
        <Text style={commonStyles.hint}>Prix négociable</Text>
      </View>
    </View>
  </View>
);

const SectionDetails = ({ formData, updateCharacteristic, toggleNearby }) => (
  <View style={commonStyles.section}>
    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Surface (m²)</Text>
      <Input 
        placeholder="Ex: 150" 
        value={formData.characteristics.surface_m2} 
        onChangeText={(v) => updateCharacteristic('surface_m2', v.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
      />
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Nombre d'employés</Text>
      <Input 
        placeholder="Ex: 5" 
        value={formData.characteristics.staff_count} 
        onChangeText={(v) => updateCharacteristic('staff_count', v.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
      />
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Chiffre d'affaires annuel (€)</Text>
      <Input 
        placeholder="Ex: 2500000" 
        value={formData.characteristics.annual_revenue} 
        onChangeText={(v) => updateCharacteristic('annual_revenue', v.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
      />
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Bénéfice annuel (€)</Text>
      <Input 
        placeholder="Ex: 150000" 
        value={formData.characteristics.annual_profit} 
        onChangeText={(v) => updateCharacteristic('annual_profit', v.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
      />
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Horaires d'ouverture</Text>
      <Input 
        placeholder="Ex: 9h-19h du lundi au samedi" 
        value={formData.characteristics.opening_hours} 
        onChangeText={(v) => updateCharacteristic('opening_hours', v)}
      />
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>Équipements</Text>
      <View style={{ gap: hp(1) }}>
        <ToggleRow label="Parking client" value={formData.characteristics.parking} onToggle={(v) => updateCharacteristic('parking', v)} />
        <ToggleRow label="Robot de dispensation" value={formData.characteristics.has_robot} onToggle={(v) => updateCharacteristic('has_robot', v)} />
        <ToggleRow label="Laboratoire de préparation" value={formData.characteristics.has_lab} onToggle={(v) => updateCharacteristic('has_lab', v)} />
        <ToggleRow label="Drive / Click & Collect" value={formData.characteristics.has_drive} onToggle={(v) => updateCharacteristic('has_drive', v)} />
      </View>
    </View>

    <View style={commonStyles.formGroup}>
      <Text style={commonStyles.label}>À proximité</Text>
      <View style={commonStyles.chipsContainer}>
        {NEARBY_OPTIONS.map((item) => (
          <Pressable
            key={item}
            style={[commonStyles.chip, formData.characteristics.nearby?.includes(item) && commonStyles.chipActive]}
            onPress={() => toggleNearby(item)}
          >
            <Text style={[commonStyles.chipText, formData.characteristics.nearby?.includes(item) && commonStyles.chipTextActive]}>
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  </View>
);

const ToggleRow = ({ label, value, onToggle }) => (
  <View style={commonStyles.rowBetween}>
    <Text style={commonStyles.hint}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: theme.colors.gray, true: theme.colors.primary + '50' }}
      thumbColor={value ? theme.colors.primary : '#f4f3f4'}
    />
  </View>
);

const SectionPhotos = ({ formData, onAddPhoto, onRemovePhoto, photoLoading }) => (
  <View style={commonStyles.section}>
    <Text style={commonStyles.sectionTitle}>Photos de la pharmacie</Text>
    <Text style={commonStyles.hint}>Ajoutez jusqu'à 10 photos. La première sera l'image principale.</Text>
    
    <ImagePickerBox
      images={formData.photos}
      onAdd={onAddPhoto}
      onRemove={onRemovePhoto}
      maxImages={10}
      loading={photoLoading}
    />

    <Text style={[commonStyles.hint, { marginTop: hp(1) }]}>
      {formData.photos.length}/10 photos
    </Text>
  </View>
);

const SectionPrivacy = ({ formData, updateField, onDelete }) => (
  <View style={commonStyles.section}>
    {/* Anonymat */}
    <View style={commonStyles.card}>
      <View style={commonStyles.rowBetween}>
        <View style={[commonStyles.flex1, { marginRight: wp(3) }]}>
          <Text style={commonStyles.sectionTitleSmall}>Annonce anonyme</Text>
          <Text style={commonStyles.hint}>Masquer la ville exacte et vos coordonnées jusqu'au premier contact</Text>
        </View>
        <Switch
          value={formData.anonymized}
          onValueChange={(v) => updateField('anonymized', v)}
          trackColor={{ false: theme.colors.gray, true: theme.colors.primary + '50' }}
          thumbColor={formData.anonymized ? theme.colors.primary : '#f4f3f4'}
        />
      </View>
    </View>

    {/* Danger Zone */}
    <View style={[commonStyles.card, { marginTop: hp(3), borderColor: theme.colors.rose + '30' }]}>
      <Text style={[commonStyles.sectionTitleSmall, { color: theme.colors.rose }]}>Zone de danger</Text>
      <Text style={[commonStyles.hint, { marginBottom: hp(2) }]}>
        Ces actions sont irréversibles
      </Text>
      
      <Pressable style={commonStyles.buttonDanger} onPress={onDelete}>
        <Icon name="trash" size={18} color={theme.colors.rose} />
        <Text style={commonStyles.buttonDangerText}>Supprimer l'annonce</Text>
      </Pressable>
    </View>
  </View>
);

// ============================================
// STYLES LOCAUX
// ============================================

const styles = StyleSheet.create({
  typeBadgeContainer: {
    alignItems: 'center',
    paddingVertical: hp(1),
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.5),
    gap: wp(1.5),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
  },
});