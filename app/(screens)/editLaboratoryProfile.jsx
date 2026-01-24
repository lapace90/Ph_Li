import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  TextInput, 
  Alert, 
  StyleSheet 
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { storageService } from '../../services/storageService';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ImagePickerBox from '../../components/common/ImagePickerBox';
import Icon from '../../assets/icons/Icon';
import { PRODUCT_CATEGORIES } from '../../constants/profileOptions';

export default function EditLaboratoryProfile() {
  const router = useRouter();
  const { session, laboratoryProfile, refreshLaboratoryProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [logoUri, setLogoUri] = useState(null);
  const [logoLoading, setLogoLoading] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    brandName: '',
    description: '',
    websiteUrl: '',
    contactEmail: '',
    contactPhone: '',
    productCategories: [],
    address: '',
    city: '',
    postalCode: '',
  });

  // ============================================
  // INITIALISATION
  // ============================================

  useEffect(() => {
    if (laboratoryProfile) {
      setFormData({
        companyName: laboratoryProfile.company_name || '',
        brandName: laboratoryProfile.brand_name || '',
        description: laboratoryProfile.description || '',
        websiteUrl: laboratoryProfile.website_url || '',
        contactEmail: laboratoryProfile.contact_email || '',
        contactPhone: laboratoryProfile.contact_phone || '',
        productCategories: laboratoryProfile.product_categories || [],
        address: laboratoryProfile.address || '',
        city: laboratoryProfile.city || '',
        postalCode: laboratoryProfile.postal_code || '',
      });
      setLogoUri(laboratoryProfile.logo_url);
    }
  }, [laboratoryProfile]);

  // ============================================
  // FORM HANDLERS
  // ============================================

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (cat) => {
    setFormData(prev => ({
      ...prev,
      productCategories: prev.productCategories.includes(cat)
        ? prev.productCategories.filter(c => c !== cat)
        : [...prev.productCategories, cat],
    }));
  };

  const handleLogoChange = async (asset) => {
    if (!asset) {
      setLogoUri(null);
      return;
    }
    
    setLogoLoading(true);
    try {
      const url = await storageService.uploadImage(
        'logos', 
        session.user.id, 
        asset
      );
      setLogoUri(url);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger le logo');
    } finally {
      setLogoLoading(false);
    }
  };

  // ============================================
  // SAUVEGARDE
  // ============================================

  const handleSave = async () => {
    if (!formData.companyName.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'entreprise est obligatoire');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('laboratory_profiles')
        .update({
          company_name: formData.companyName.trim(),
          brand_name: formData.brandName.trim() || null,
          description: formData.description.trim() || null,
          website_url: formData.websiteUrl.trim() || null,
          contact_email: formData.contactEmail.trim() || null,
          contact_phone: formData.contactPhone.trim() || null,
          product_categories: formData.productCategories.length > 0 
            ? formData.productCategories 
            : null,
          logo_url: logoUri,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          postal_code: formData.postalCode.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) throw error;

      await refreshLaboratoryProfile?.();
      Alert.alert('Succès', 'Profil mis à jour');
      router.back();
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // COMPLÉTUDE
  // ============================================

  const completionItems = [
    { label: 'Logo', done: !!logoUri },
    { label: 'Description', done: !!formData.description },
    { label: 'Catégories', done: formData.productCategories.length > 0 },
    { label: 'Email', done: !!formData.contactEmail },
    { label: 'Téléphone', done: !!formData.contactPhone },
    { label: 'Site web', done: !!formData.websiteUrl },
  ];
  const completionScore = Math.round(
    (completionItems.filter(i => i.done).length / completionItems.length) * 100
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Mon profil</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <ScrollView 
        style={commonStyles.flex1} 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Complétude */}
        <View style={styles.completionBar}>
          <View style={commonStyles.rowBetween}>
            <Text style={styles.completionLabel}>Profil complété</Text>
            <Text style={[
              styles.completionScore, 
              completionScore === 100 && styles.completionScoreComplete
            ]}>
              {completionScore}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completionScore}%` }]} />
          </View>
        </View>

        {/* Logo */}
        <View style={styles.logoSection}>
          <ImagePickerBox
            value={logoUri}
            onChange={handleLogoChange}
            shape="square"
            size={120}
            placeholder="Ajouter un logo"
            loading={logoLoading}
          />
          <Text style={commonStyles.hint}>Logo de l'entreprise</Text>
        </View>

        {/* Infos entreprise */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Informations entreprise</Text>
          
          <Input
            label="Raison sociale *"
            value={formData.companyName}
            onChangeText={v => updateField('companyName', v)}
            placeholder="Nom légal de l'entreprise"
          />
          
          <Input
            label="Nom de marque"
            value={formData.brandName}
            onChangeText={v => updateField('brandName', v)}
            placeholder="Nom commercial (si différent)"
          />

          {laboratoryProfile?.siret && (
            <View style={styles.siretBadge}>
              <Icon name="checkCircle" size={16} color={theme.colors.success} />
              <Text style={styles.siretText}>
                SIRET vérifié : {laboratoryProfile.siret}
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Description</Text>
          <View style={commonStyles.bioContainer}>
            <TextInput
              style={commonStyles.bioInput}
              value={formData.description}
              onChangeText={v => updateField('description', v)}
              placeholder="Présentez votre laboratoire, vos produits et votre expertise..."
              placeholderTextColor={theme.colors.textLight}
              multiline
              maxLength={1000}
            />
            <Text style={commonStyles.bioCounter}>
              {formData.description.length}/1000
            </Text>
          </View>
        </View>

        {/* Catégories */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Catégories de produits</Text>
          <Text style={commonStyles.hint}>Sélectionnez vos domaines d'activité</Text>
          <View style={commonStyles.chipsContainer}>
            {PRODUCT_CATEGORIES.map(cat => (
              <Pressable
                key={cat.value}
                style={[
                  commonStyles.chip, 
                  formData.productCategories.includes(cat.value) && commonStyles.chipActive
                ]}
                onPress={() => toggleCategory(cat.value)}
              >
                <Text style={[
                  commonStyles.chipText, 
                  formData.productCategories.includes(cat.value) && commonStyles.chipTextActive
                ]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Contact */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Contact</Text>
          
          <Input
            label="Email de contact"
            value={formData.contactEmail}
            onChangeText={v => updateField('contactEmail', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="contact@labo.fr"
          />
          
          <Input
            label="Téléphone"
            value={formData.contactPhone}
            onChangeText={v => updateField('contactPhone', v)}
            keyboardType="phone-pad"
            placeholder="01 23 45 67 89"
          />
          
          <Input
            label="Site web"
            value={formData.websiteUrl}
            onChangeText={v => updateField('websiteUrl', v)}
            keyboardType="url"
            autoCapitalize="none"
            placeholder="https://www.votrelabo.fr"
          />
        </View>

        {/* Adresse */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Adresse</Text>
          
          <Input
            label="Adresse"
            value={formData.address}
            onChangeText={v => updateField('address', v)}
            placeholder="123 rue du Laboratoire"
          />

          <View style={commonStyles.formRow}>
            <Input
              label="Code postal"
              value={formData.postalCode}
              onChangeText={v => updateField('postalCode', v)}
              keyboardType="number-pad"
              placeholder="75001"
              containerStyle={styles.postalCodeInput}
            />
            <Input
              label="Ville"
              value={formData.city}
              onChangeText={v => updateField('city', v)}
              placeholder="Paris"
              containerStyle={commonStyles.flex1}
            />
          </View>
        </View>

        {/* Abonnement */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Abonnement</Text>
          <Pressable 
            style={styles.subscriptionCard} 
            onPress={() => router.push('/subscription')}
          >
            <View style={[
              styles.subscriptionIcon, 
              laboratoryProfile?.subscription_tier === 'premium' && styles.subscriptionIconPremium,
              laboratoryProfile?.subscription_tier === 'business' && styles.subscriptionIconBusiness,
            ]}>
              <Icon 
                name={
                  laboratoryProfile?.subscription_tier === 'business' ? 'zap' : 
                  laboratoryProfile?.subscription_tier === 'premium' ? 'star' : 'user'
                } 
                size={24} 
                color={laboratoryProfile?.subscription_tier !== 'free' ? '#fff' : theme.colors.primary} 
              />
            </View>
            <View style={commonStyles.flex1}>
              <Text style={styles.subscriptionTier}>
                {laboratoryProfile?.subscription_tier === 'premium' ? 'Premium' :
                 laboratoryProfile?.subscription_tier === 'business' ? 'Business' : 'Gratuit'}
              </Text>
              <Text style={commonStyles.hint}>
                {laboratoryProfile?.subscription_expires_at
                  ? `Expire le ${new Date(laboratoryProfile.subscription_expires_at).toLocaleDateString('fr-FR')}`
                  : 'Gérer mon abonnement'
                }
              </Text>
            </View>
            <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
          </Pressable>
        </View>

        {/* Usage */}
        {laboratoryProfile && (
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Utilisation ce mois</Text>
            <View style={commonStyles.card}>
              <UsageRow 
                label="Missions créées" 
                used={laboratoryProfile.missions_used_this_month || 0} 
                limit={
                  laboratoryProfile.subscription_tier === 'business' ? '∞' : 
                  laboratoryProfile.subscription_tier === 'premium' ? 10 : 3
                } 
              />
              <UsageRow 
                label="Contacts animateurs" 
                used={laboratoryProfile.contacts_used_this_month || 0} 
                limit={
                  laboratoryProfile.subscription_tier === 'business' ? '∞' : 
                  laboratoryProfile.subscription_tier === 'premium' ? 30 : 10
                } 
              />
            </View>
          </View>
        )}

        <View style={{ height: hp(15) }} />
      </ScrollView>

      <View style={commonStyles.footer}>
        <Button title="Enregistrer" loading={loading} onPress={handleSave} />
      </View>
    </ScreenWrapper>
  );
}

// ============================================
// SOUS-COMPOSANTS
// ============================================

const UsageRow = ({ label, used, limit }) => (
  <View style={styles.usageRow}>
    <Text style={styles.usageLabel}>{label}</Text>
    <Text style={styles.usageValue}>{used} / {limit}</Text>
  </View>
);

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  content: {
    padding: wp(5),
  },
  postalCodeInput: {
    width: '35%',
  },

  // Completion
  completionBar: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(2),
    marginBottom: hp(2),
  },
  completionLabel: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  completionScore: {
    fontSize: hp(1.6),
    fontWeight: '700',
    color: theme.colors.primary,
  },
  completionScoreComplete: {
    color: theme.colors.success,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.gray + '30',
    borderRadius: 3,
    marginTop: hp(1),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    paddingVertical: hp(2),
  },

  // SIRET
  siretBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: theme.colors.success + '15',
    padding: hp(1.2),
    borderRadius: theme.radius.md,
    marginTop: hp(1),
  },
  siretText: {
    fontSize: hp(1.4),
    color: theme.colors.success,
    fontFamily: theme.fonts.medium,
  },

  // Subscription
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: hp(2),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: wp(3),
  },
  subscriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionIconPremium: {
    backgroundColor: theme.colors.warning,
  },
  subscriptionIconBusiness: {
    backgroundColor: theme.colors.primary,
  },
  subscriptionTier: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },

  // Usage
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  usageLabel: {
    fontSize: hp(1.5),
    color: theme.colors.text,
  },
  usageValue: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: theme.colors.primary,
  },
});