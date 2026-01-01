import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform, Switch, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { useMyListings } from '../../hooks/usePharmacyListings';
import { storageService } from '../../services/storageService';
import {
  LISTING_TYPES,
  NEARBY_OPTIONS,
  EMPTY_LISTING,
  getListingTypeLabel,
  getListingTypeColor,
  formatPrice,
  formatNumber,
} from '../../constants/listingOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import CityAutocomplete from '../../components/common/CityAutocomplete';
import ImagePickerBox from '../../components/common/ImagePickerBox';

// TODO: Passer à false en production
const DEV_BYPASS_RPPS_CHECK = true;

const STEPS = [
  { key: 'type', title: 'Type', subtitle: 'Type d\'annonce' },
  { key: 'info', title: 'Infos', subtitle: 'Description' },
  { key: 'details', title: 'Détails', subtitle: 'Caractéristiques' },
  { key: 'photos', title: 'Photos', subtitle: 'Images' },
  { key: 'preview', title: 'Aperçu', subtitle: 'Vérification' },
];

export default function ListingCreate() {
  const router = useRouter();
  const { session, user, profile } = useAuth();
  const { createListing } = useMyListings(session?.user?.id);
  
  // Vérification RPPS requise
  const canPublish = DEV_BYPASS_RPPS_CHECK || (user?.user_type === 'titulaire' && user?.rpps_verified);
  
  useEffect(() => {
    if (!canPublish) {
      Alert.alert(
        'Accès refusé',
        'Seuls les titulaires avec un badge RPPS vérifié peuvent publier des annonces.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [canPublish]);

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [publishAsActive, setPublishAsActive] = useState(true);
  const [formData, setFormData] = useState({
    ...EMPTY_LISTING,
    city: profile?.current_city || '',
    postal_code: profile?.current_postal_code || '',
    region: profile?.current_region || '',
    department: profile?.current_department || '',
    latitude: profile?.current_latitude || null,
    longitude: profile?.current_longitude || null,
  });

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

  const canGoNext = () => {
    switch (currentStep) {
      case 0: return formData.type;
      case 1: return formData.title && formData.city;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handlePublish();
    }
  };

  const handleBack = () => {
    currentStep > 0 ? setCurrentStep(prev => prev - 1) : router.back();
  };

  const handleCancel = () => {
    Alert.alert(
      'Annuler',
      'Voulez-vous vraiment quitter ? Les informations saisies seront perdues.',
      [
        { text: 'Non', style: 'cancel' },
        { text: 'Oui, quitter', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      const listingData = {
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        negotiable: formData.negotiable,
        city: formData.city,
        postal_code: formData.postal_code,
        region: formData.region,
        department: formData.department,
        latitude: formData.latitude,
        longitude: formData.longitude,
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
        status: publishAsActive ? 'active' : 'draft',
      };

      const { error } = await createListing(listingData);
      if (error) throw error;

      Alert.alert(
        publishAsActive ? 'Annonce publiée !' : 'Brouillon enregistré',
        publishAsActive ? 'Votre annonce est maintenant visible.' : 'Vous pourrez la publier plus tard.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/marketplace') }]
      );
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de publier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <KeyboardAvoidingView style={commonStyles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={commonStyles.headerNoBorder}>
          <Pressable style={commonStyles.headerButton} onPress={handleBack}>
            <Icon name="arrowLeft" size={24} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={commonStyles.headerTitle}>{STEPS[currentStep].title}</Text>
            <Text style={commonStyles.hint}>{STEPS[currentStep].subtitle}</Text>
          </View>
          <Pressable style={commonStyles.headerButton} onPress={handleCancel}>
            <Icon name="x" size={24} color={theme.colors.textLight} />
          </Pressable>
        </View>

        {/* Progress */}
        <ProgressSteps steps={STEPS} currentStep={currentStep} />

        {/* Content */}
        <ScrollView 
          style={commonStyles.flex1} 
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 0 && <StepType formData={formData} updateField={updateField} />}
          {currentStep === 1 && <StepInfo formData={formData} updateField={updateField} onCitySelect={handleCitySelect} />}
          {currentStep === 2 && <StepDetails formData={formData} updateCharacteristic={updateCharacteristic} toggleNearby={toggleNearby} />}
          {currentStep === 3 && <StepPhotos formData={formData} onAddPhoto={handleAddPhoto} onRemovePhoto={handleRemovePhoto} photoLoading={photoLoading} />}
          {currentStep === 4 && <StepPreview formData={formData} updateField={updateField} publishAsActive={publishAsActive} setPublishAsActive={setPublishAsActive} />}
        </ScrollView>

        {/* Footer */}
        <View style={commonStyles.footer}>
          <Button
            title={currentStep === STEPS.length - 1 ? (publishAsActive ? 'Publier l\'annonce' : 'Enregistrer le brouillon') : 'Continuer'}
            onPress={handleNext}
            loading={loading}
            disabled={!canGoNext()}
            buttonStyle={!canGoNext() && { opacity: 0.5 }}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

// ============================================
// COMPONENTS
// ============================================

const ProgressSteps = ({ steps, currentStep }) => (
  <View style={styles.progressContainer}>
    {steps.map((step, index) => (
      <View key={step.key} style={commonStyles.row}>
        <View style={[
          styles.progressDot,
          index <= currentStep && styles.progressDotActive,
          index < currentStep && styles.progressDotCompleted,
        ]}>
          {index < currentStep ? (
            <Icon name="check" size={12} color="white" />
          ) : (
            <Text style={[styles.progressNumber, index <= currentStep && styles.progressNumberActive]}>
              {index + 1}
            </Text>
          )}
        </View>
        {index < steps.length - 1 && (
          <View style={[styles.progressLine, index < currentStep && styles.progressLineActive]} />
        )}
      </View>
    ))}
  </View>
);

const StepType = ({ formData, updateField }) => (
  <View style={commonStyles.section}>
    <Text style={commonStyles.sectionTitle}>Quel type d'annonce souhaitez-vous créer ?</Text>
    <View style={styles.typeCards}>
      {LISTING_TYPES.map((type) => {
        const isSelected = formData.type === type.value;
        const color = getListingTypeColor(type.value);
        return (
          <Pressable
            key={type.value}
            style={[
              styles.typeCard,
              isSelected && { borderColor: color, backgroundColor: color + '08' }
            ]}
            onPress={() => updateField('type', type.value)}
          >
            <View style={[styles.typeCardIcon, isSelected && { backgroundColor: color + '20' }]}>
              <Icon 
                name={type.icon} 
                size={24} 
                color={isSelected ? color : theme.colors.textLight} 
              />
            </View>
            <View style={styles.typeCardContent}>
              <Text style={[styles.typeCardTitle, isSelected && { color }]}>
                {type.label}
              </Text>
              <Text style={commonStyles.hint}>{type.description}</Text>
            </View>
            {isSelected && (
              <Icon name="check" size={22} color={color} />
            )}
          </Pressable>
        );
      })}
    </View>
  </View>
);

const StepInfo = ({ formData, updateField, onCitySelect }) => {
  const isVente = formData.type === 'vente';
  const isLocation = formData.type === 'location';
  const isAssociation = formData.type === 'association';

  return (
    <View style={commonStyles.section}>
      <View style={commonStyles.formGroup}>
        <Text style={commonStyles.label}>Titre de l'annonce *</Text>
        <Input 
          placeholder={
            isVente ? "Ex: Pharmacie de centre-ville à céder" :
            isLocation ? "Ex: Pharmacie en location-gérance disponible" :
            "Ex: Recherche associé pour pharmacie dynamique"
          }
          value={formData.title} 
          onChangeText={(v) => updateField('title', v)} 
        />
      </View>

      <View style={commonStyles.formGroup}>
        <Text style={commonStyles.label}>Description</Text>
        <Input
          placeholder={
            isVente ? "Décrivez votre pharmacie, son emplacement, sa clientèle..." :
            isLocation ? "Décrivez les conditions de la location-gérance, la pharmacie..." :
            "Décrivez votre projet d'association, le profil recherché..."
          }
          value={formData.description}
          onChangeText={(v) => updateField('description', v)}
          multiline
          numberOfLines={5}
          inputStyle={commonStyles.textArea}
        />
      </View>

      <View style={commonStyles.formGroup}>
        <Text style={commonStyles.label}>Ville *</Text>
        <CityAutocomplete
          value={formData.city ? { city: formData.city, postcode: formData.postal_code } : null}
          onSelect={onCitySelect}
          placeholder="Rechercher une ville..."
        />
      </View>

      {/* Champs financiers selon le type */}
      {isVente && (
        <View style={commonStyles.formGroup}>
          <Text style={commonStyles.label}>Prix de vente (€)</Text>
          <Input 
            placeholder="Ex: 850000" 
            value={formData.price?.toString() || ''} 
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
      )}

      {isLocation && (
        <>
          <View style={commonStyles.formGroup}>
            <Text style={commonStyles.label}>Loyer mensuel (€)</Text>
            <Input 
              placeholder="Ex: 5000" 
              value={formData.characteristics?.monthly_rent?.toString() || ''} 
              onChangeText={(v) => updateField('characteristics', { ...formData.characteristics, monthly_rent: v.replace(/[^0-9]/g, '') })}
              keyboardType="numeric"
            />
          </View>
          <View style={commonStyles.formGroup}>
            <Text style={commonStyles.label}>Durée minimale du bail (mois)</Text>
            <Input 
              placeholder="Ex: 36" 
              value={formData.characteristics?.lease_duration?.toString() || ''} 
              onChangeText={(v) => updateField('characteristics', { ...formData.characteristics, lease_duration: v.replace(/[^0-9]/g, '') })}
              keyboardType="numeric"
            />
          </View>
          <View style={commonStyles.formGroup}>
            <Text style={commonStyles.label}>Dépôt de garantie (€)</Text>
            <Input 
              placeholder="Ex: 15000" 
              value={formData.characteristics?.deposit?.toString() || ''} 
              onChangeText={(v) => updateField('characteristics', { ...formData.characteristics, deposit: v.replace(/[^0-9]/g, '') })}
              keyboardType="numeric"
            />
          </View>
        </>
      )}

      {isAssociation && (
        <>
          <View style={commonStyles.formGroup}>
            <Text style={commonStyles.label}>Pourcentage de parts à céder (%)</Text>
            <Input 
              placeholder="Ex: 49" 
              value={formData.characteristics?.shares_percentage?.toString() || ''} 
              onChangeText={(v) => updateField('characteristics', { ...formData.characteristics, shares_percentage: v.replace(/[^0-9]/g, '') })}
              keyboardType="numeric"
            />
          </View>
          <View style={commonStyles.formGroup}>
            <Text style={commonStyles.label}>Valorisation de la pharmacie (€)</Text>
            <Input 
              placeholder="Ex: 1200000" 
              value={formData.characteristics?.valuation?.toString() || ''} 
              onChangeText={(v) => updateField('characteristics', { ...formData.characteristics, valuation: v.replace(/[^0-9]/g, '') })}
              keyboardType="numeric"
            />
          </View>
          <View style={commonStyles.formGroup}>
            <Text style={commonStyles.label}>Apport minimum requis (€)</Text>
            <Input 
              placeholder="Ex: 300000" 
              value={formData.characteristics?.min_investment?.toString() || ''} 
              onChangeText={(v) => updateField('characteristics', { ...formData.characteristics, min_investment: v.replace(/[^0-9]/g, '') })}
              keyboardType="numeric"
            />
          </View>
          <View style={commonStyles.formGroup}>
            <Text style={commonStyles.label}>Profil recherché</Text>
            <Input
              placeholder="Ex: Pharmacien avec 5 ans d'expérience minimum, spécialisé en..."
              value={formData.characteristics?.partner_profile || ''}
              onChangeText={(v) => updateField('characteristics', { ...formData.characteristics, partner_profile: v })}
              multiline
              numberOfLines={3}
              inputStyle={commonStyles.textArea}
            />
          </View>
        </>
      )}
    </View>
  );
};

const StepDetails = ({ formData, updateCharacteristic, toggleNearby }) => {
  const isVente = formData.type === 'vente';
  const isLocation = formData.type === 'location';
  const isAssociation = formData.type === 'association';

  return (
    <View style={commonStyles.section}>
      <View style={commonStyles.formGroup}>
        <Text style={commonStyles.label}>Surface (m²)</Text>
        <Input 
          placeholder="Ex: 150" 
          value={formData.characteristics.surface_m2?.toString() || ''} 
          onChangeText={(v) => updateCharacteristic('surface_m2', v.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
        />
      </View>

      <View style={commonStyles.formGroup}>
        <Text style={commonStyles.label}>Nombre d'employés</Text>
        <Input 
          placeholder="Ex: 5" 
          value={formData.characteristics.staff_count?.toString() || ''} 
          onChangeText={(v) => updateCharacteristic('staff_count', v.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
        />
      </View>

      <View style={commonStyles.formGroup}>
        <Text style={commonStyles.label}>Chiffre d'affaires annuel (€)</Text>
        <Input 
          placeholder="Ex: 2500000" 
          value={formData.characteristics.annual_revenue?.toString() || ''} 
          onChangeText={(v) => updateCharacteristic('annual_revenue', v.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
        />
        {!isVente && (
          <Text style={[commonStyles.hint, { marginTop: hp(0.5) }]}>
            Information indicative pour les candidats
          </Text>
        )}
      </View>

      {/* Bénéfice net uniquement pour vente */}
      {isVente && (
        <View style={commonStyles.formGroup}>
          <Text style={commonStyles.label}>Bénéfice net annuel (€)</Text>
          <Input 
            placeholder="Ex: 180000" 
            value={formData.characteristics.annual_profit?.toString() || ''} 
            onChangeText={(v) => updateCharacteristic('annual_profit', v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />
        </View>
      )}

      {/* Conditions spécifiques location-gérance */}
      {isLocation && (
        <View style={commonStyles.formGroup}>
          <Text style={commonStyles.label}>Conditions particulières</Text>
          <Input
            placeholder="Ex: Option d'achat possible après 3 ans, formation assurée..."
            value={formData.characteristics.lease_conditions || ''}
            onChangeText={(v) => updateCharacteristic('lease_conditions', v)}
            multiline
            numberOfLines={3}
            inputStyle={commonStyles.textArea}
          />
        </View>
      )}

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
};

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

const StepPhotos = ({ formData, onAddPhoto, onRemovePhoto, photoLoading }) => (
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
  </View>
);

const StepPreview = ({ formData, updateField, publishAsActive, setPublishAsActive }) => (
  <View style={{ gap: hp(2) }}>
    {/* Anonymat */}
    <View style={commonStyles.card}>
      <View style={commonStyles.rowBetween}>
        <View style={commonStyles.flex1}>
          <Text style={commonStyles.sectionTitleSmall}>Annonce anonyme</Text>
          <Text style={commonStyles.hint}>Masquer la ville exacte et vos coordonnées</Text>
        </View>
        <Switch
          value={formData.anonymized}
          onValueChange={(v) => updateField('anonymized', v)}
          trackColor={{ false: theme.colors.gray, true: theme.colors.primary + '50' }}
          thumbColor={formData.anonymized ? theme.colors.primary : '#f4f3f4'}
        />
      </View>
    </View>

    {/* Preview Card */}
    <View style={commonStyles.card}>
      <View style={[commonStyles.badge, { backgroundColor: getListingTypeColor(formData.type) + '15', alignSelf: 'flex-start', marginBottom: hp(1) }]}>
        <Text style={[commonStyles.badgeText, { color: getListingTypeColor(formData.type) }]}>
          {getListingTypeLabel(formData.type)}
        </Text>
      </View>

      <Text style={commonStyles.sectionTitle}>{formData.title || 'Titre'}</Text>

      <View style={[commonStyles.section, { marginTop: hp(1.5), marginBottom: 0 }]}>
        <InfoRow icon="mapPin" text={formData.anonymized ? formData.region : `${formData.city}, ${formData.region}`} />
        {formData.price && <InfoRow icon="briefcase" text={`${formatNumber(formData.price)} €${formData.negotiable ? ' (négociable)' : ''}`} />}
        {formData.characteristics.surface_m2 && <InfoRow icon="home" text={`${formData.characteristics.surface_m2} m²`} />}
        {formData.characteristics.staff_count && <InfoRow icon="users" text={`${formData.characteristics.staff_count} employés`} />}
      </View>

      {formData.description && (
        <>
          <View style={commonStyles.divider} />
          <Text style={commonStyles.sectionTitleSmall}>Description</Text>
          <Text style={[commonStyles.hint, { lineHeight: hp(2.2) }]} numberOfLines={4}>{formData.description}</Text>
        </>
      )}

      {formData.photos.length > 0 && (
        <Text style={[commonStyles.hint, { marginTop: hp(1) }]}>
          📷 {formData.photos.length} photo{formData.photos.length > 1 ? 's' : ''}
        </Text>
      )}
    </View>

    {/* Option publication */}
    <View style={commonStyles.card}>
      <Text style={commonStyles.sectionTitleSmall}>Statut de publication</Text>
      <View style={[commonStyles.rowGapSmall, { marginTop: hp(1.5) }]}>
        <Pressable
          style={[styles.statusOption, publishAsActive && styles.statusOptionActive]}
          onPress={() => setPublishAsActive(true)}
        >
          <Icon name="eye" size={20} color={publishAsActive ? theme.colors.primary : theme.colors.textLight} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusOptionTitle, publishAsActive && { color: theme.colors.primary }]}>
              Publier maintenant
            </Text>
            <Text style={commonStyles.hint}>Visible immédiatement</Text>
          </View>
          {publishAsActive && <Icon name="check" size={20} color={theme.colors.primary} />}
        </Pressable>

        <Pressable
          style={[styles.statusOption, !publishAsActive && styles.statusOptionActive]}
          onPress={() => setPublishAsActive(false)}
        >
          <Icon name="edit" size={20} color={!publishAsActive ? theme.colors.secondary : theme.colors.textLight} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusOptionTitle, !publishAsActive && { color: theme.colors.secondary }]}>
              Brouillon
            </Text>
            <Text style={commonStyles.hint}>Enregistrer sans publier</Text>
          </View>
          {!publishAsActive && <Icon name="check" size={20} color={theme.colors.secondary} />}
        </Pressable>
      </View>
    </View>
  </View>
);

const InfoRow = ({ icon, text }) => (
  <View style={commonStyles.rowGapSmall}>
    <Icon name={icon} size={16} color={theme.colors.textLight} />
    <Text style={commonStyles.hint}>{text}</Text>
  </View>
);

// ============================================
// STYLES LOCAUX
// ============================================

const styles = StyleSheet.create({
  headerCenter: {
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(2),
    paddingHorizontal: wp(5),
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary,
  },
  progressDotCompleted: {
    backgroundColor: theme.colors.success,
  },
  progressNumber: {
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.textLight,
  },
  progressNumberActive: {
    color: 'white',
  },
  progressLine: {
    width: wp(6),
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: wp(0.5),
  },
  progressLineActive: {
    backgroundColor: theme.colors.success,
  },
  typeCards: {
    gap: hp(1.5),
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(2),
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    gap: wp(4),
  },
  typeCardIcon: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeCardContent: {
    flex: 1,
  },
  typeCardTitle: {
    fontSize: hp(1.7),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  statusOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '08',
  },
  statusOptionTitle: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
});