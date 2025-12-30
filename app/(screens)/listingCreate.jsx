import { useState } from 'react';
import { Alert, StyleSheet, Text, View, ScrollView, Pressable, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useMyListings } from '../../hooks/usePharmacyListings';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Icon from '../../assets/icons/Icon';
import CityAutocomplete from '../../components/common/CityAutocomplete';
import ImagePickerBox from '../../components/common/ImagePickerBox';
import { storageService } from '../../services/storageService';

const LISTING_TYPES = [
  { value: 'vente', label: 'Vente', icon: 'briefcase', description: 'Vendre votre pharmacie' },
  { value: 'location-gerance', label: 'Location-gérance', icon: 'home', description: 'Mettre en location-gérance' },
  { value: 'collaboration', label: 'Collaboration', icon: 'users', description: 'Rechercher un collaborateur' },
  { value: 'association', label: 'Association', icon: 'heart', description: 'Trouver un associé' },
];

const NEARBY_OPTIONS = [
  'Centre médical', 'Hôpital', 'EHPAD', 'Centre commercial',
  'Parking', 'Transport en commun', 'École', 'Zone piétonne',
];

export default function ListingCreate() {
  const router = useRouter();
  const { session } = useAuth();
  const { createListing } = useMyListings(session?.user?.id);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleNext = () => {
    if (step === 1 && !formData.type) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type d\'annonce');
      return;
    }
    if (step === 2) {
      if (!formData.title.trim()) {
        Alert.alert('Erreur', 'Veuillez entrer un titre');
        return;
      }
      if (!formData.city) {
        Alert.alert('Erreur', 'Veuillez sélectionner une ville');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const listingData = {
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        negotiable: formData.negotiable,
        city: formData.city?.city,
        postal_code: formData.city?.postcode,
        region: formData.city?.region,
        department: formData.city?.department,
        latitude: formData.city?.latitude,
        longitude: formData.city?.longitude,
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
        status: 'active',
      };

      const { error } = await createListing(listingData);
      if (error) throw error;

      Alert.alert('Succès', 'Votre annonce a été publiée', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/marketplace') },
      ]);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((s) => (
        <View
          key={s}
          style={[
            styles.stepDot,
            s === step && styles.stepDotActive,
            s < step && styles.stepDotCompleted,
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Type d'annonce</Text>
      <Text style={commonStyles.hint}>Que souhaitez-vous faire ?</Text>

      <View style={styles.typeCards}>
        {LISTING_TYPES.map((type) => (
          <Pressable
            key={type.value}
            style={[
              styles.typeCard,
              formData.type === type.value && styles.typeCardSelected,
            ]}
            onPress={() => updateField('type', type.value)}
          >
            <View style={[
              styles.typeIcon,
              formData.type === type.value && styles.typeIconSelected,
            ]}>
              <Icon
                name={type.icon}
                size={24}
                color={formData.type === type.value ? 'white' : theme.colors.primary}
              />
            </View>
            <Text style={[
              styles.typeLabel,
              formData.type === type.value && styles.typeLabelSelected,
            ]}>
              {type.label}
            </Text>
            <Text style={commonStyles.hint}>{type.description}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Informations générales</Text>

      <View style={styles.formSection}>
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
            placeholder="Ville *"
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
          <View style={[
            commonStyles.checkbox,
            formData.negotiable && commonStyles.checkboxChecked,
          ]}>
            {formData.negotiable && <Icon name="check" size={14} color="white" />}
          </View>
        </Pressable>

        <View style={styles.textAreaContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="Description détaillée..."
            placeholderTextColor={theme.colors.textLight}
            value={formData.description}
            onChangeText={(v) => updateField('description', v)}
            multiline
            numberOfLines={6}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Caractéristiques</Text>

      <View style={styles.formSection}>
        <View style={commonStyles.formRow}>
          <View style={commonStyles.formHalf}>
            <Input
              placeholder="Surface (m²)"
              keyboardType="numeric"
              value={formData.characteristics.surface_m2}
              onChangeText={(v) => updateCharacteristic('surface_m2', v)}
            />
          </View>
          <View style={commonStyles.formHalf}>
            <Input
              placeholder="Employés"
              keyboardType="numeric"
              value={formData.characteristics.staff_count}
              onChangeText={(v) => updateCharacteristic('staff_count', v)}
            />
          </View>
        </View>

        <View style={commonStyles.formRow}>
          <View style={commonStyles.formHalf}>
            <Input
              placeholder="CA annuel (€)"
              keyboardType="numeric"
              value={formData.characteristics.annual_revenue}
              onChangeText={(v) => updateCharacteristic('annual_revenue', v)}
            />
          </View>
          <View style={commonStyles.formHalf}>
            <Input
              placeholder="Bénéfice (€)"
              keyboardType="numeric"
              value={formData.characteristics.annual_profit}
              onChangeText={(v) => updateCharacteristic('annual_profit', v)}
            />
          </View>
        </View>

        <Input
          placeholder="Horaires d'ouverture"
          value={formData.characteristics.opening_hours}
          onChangeText={(v) => updateCharacteristic('opening_hours', v)}
        />

        <Text style={commonStyles.label}>Équipements</Text>
        {[
          { key: 'parking', label: 'Parking client' },
          { key: 'has_robot', label: 'Robot de dispensation' },
          { key: 'has_lab', label: 'Préparations magistrales' },
          { key: 'has_drive', label: 'Drive / Click & Collect' },
        ].map((item) => (
          <Pressable
            key={item.key}
            style={styles.toggleRow}
            onPress={() => updateCharacteristic(item.key, !formData.characteristics[item.key])}
          >
            <Text style={styles.toggleLabel}>{item.label}</Text>
            <View style={[
              commonStyles.checkbox,
              formData.characteristics[item.key] && commonStyles.checkboxChecked,
            ]}>
              {formData.characteristics[item.key] && <Icon name="check" size={14} color="white" />}
            </View>
          </Pressable>
        ))}

        <Text style={commonStyles.label}>À proximité</Text>
        <View style={commonStyles.chipsContainer}>
          {NEARBY_OPTIONS.map((item) => (
            <Pressable
              key={item}
              style={[
                commonStyles.chip,
                formData.characteristics.nearby?.includes(item) && commonStyles.chipActive,
              ]}
              onPress={() => toggleNearby(item)}
            >
              <Text style={[
                commonStyles.chipText,
                formData.characteristics.nearby?.includes(item) && commonStyles.chipTextActive,
              ]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Photos & Confidentialité</Text>

      <View style={styles.formSection}>
        <Text style={commonStyles.label}>Photos (max 10)</Text>
        <ImagePickerBox
          values={formData.photos}
          onAdd={handleAddPhoto}
          onRemove={handleRemovePhoto}
          multiple
          maxImages={10}
          loading={photoLoading}
        />

        <View style={styles.privacyCard}>
          <View style={commonStyles.rowBetween}>
            <View style={commonStyles.rowGapSmall}>
              <Icon name="shield" size={20} color={theme.colors.primary} />
              <Text style={styles.privacyTitle}>Mode anonyme</Text>
            </View>
            <Pressable
              style={[
                styles.toggleLarge,
                formData.anonymized && commonStyles.checkboxChecked,
              ]}
              onPress={() => updateField('anonymized', !formData.anonymized)}
            >
              {formData.anonymized && <Icon name="check" size={16} color="white" />}
            </Pressable>
          </View>
          <Text style={commonStyles.hint}>
            {formData.anonymized
              ? 'Votre ville exacte et le prix précis seront masqués.'
              : 'Toutes les informations seront visibles publiquement.'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={commonStyles.flex1}>
        <View style={styles.header}>
          <Pressable onPress={handleBack}>
            <Icon name="arrowLeft" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Nouvelle annonce</Text>
          <View style={{ width: 24 }} />
        </View>

        {renderStepIndicator()}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        <View style={commonStyles.footer}>
          {step < 4 ? (
            <Button title="Continuer" onPress={handleNext} />
          ) : (
            <Button title="Publier l'annonce" loading={loading} onPress={handleSubmit} />
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    marginBottom: hp(2),
  },
  headerTitle: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },

  // Steps
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(2),
    marginBottom: hp(3),
  },
  stepDot: {
    width: wp(12),
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
  },
  stepDotActive: {
    backgroundColor: theme.colors.primary,
  },
  stepDotCompleted: {
    backgroundColor: theme.colors.primary + '50',
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: wp(5),
  },
  stepTitle: {
    fontSize: hp(2.4),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },

  // Type cards
  typeCards: {
    gap: hp(2),
    marginTop: hp(2),
  },
  typeCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  typeCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '08',
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  typeIconSelected: {
    backgroundColor: theme.colors.primary,
  },
  typeLabel: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  typeLabelSelected: {
    color: theme.colors.primary,
  },

  // Form
  formSection: {
    gap: hp(2),
    paddingBottom: hp(4),
    marginTop: hp(2),
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
  toggleLarge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
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
    minHeight: hp(12),
    textAlignVertical: 'top',
  },

  // Privacy
  privacyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: hp(1),
  },
  privacyTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
});