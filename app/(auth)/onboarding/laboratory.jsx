// app/(auth)/onboarding/laboratory.jsx
// Onboarding spécifique pour les laboratoires (B2B)

import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../../../helpers/common';
import { theme } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import ScreenWrapper from '../../../components/common/ScreenWrapper';
import BackButton from '../../../components/common/BackButton';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import Icon from '../../../assets/icons/Icon';
import { PRODUCT_CATEGORIES } from '../../../constants/profileOptions';

export default function LaboratoryOnboarding() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const { session, refreshUserData } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState(1); // 1: SIRET, 2: Infos entreprise, 3: Contact
  
  // Step 1: SIRET
  const [siret, setSiret] = useState('');
  const [siretData, setSiretData] = useState(null);
  const [siretVerified, setSiretVerified] = useState(false);
  
  // Step 2: Infos entreprise
  const [companyName, setCompanyName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [productCategories, setProductCategories] = useState([]);
  
  // Step 3: Contact
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');

  const toggleCategory = (value) => {
    setProductCategories((prev) =>
      prev.includes(value)
        ? prev.filter((c) => c !== value)
        : [...prev, value]
    );
  };

  const verifySiret = async () => {
    const cleanSiret = siret.replace(/\s/g, '');
    
    if (cleanSiret.length !== 14) {
      Alert.alert('Erreur', 'Le SIRET doit contenir 14 chiffres');
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${cleanSiret}`
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la vérification');
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        Alert.alert('SIRET non trouvé', 'Ce numéro SIRET n\'existe pas dans la base SIRENE');
        return;
      }

      const company = data.results[0];
      const etablissement = company.matching_etablissements?.find(e => e.siret === cleanSiret)
        || (company.siege?.siret === cleanSiret ? company.siege : null);

      if (!etablissement) {
        Alert.alert('SIRET non trouvé', 'Ce numéro SIRET n\'existe pas dans la base SIRENE');
        return;
      }

      const isActive = etablissement.etat_administratif === 'A';

      if (!isActive) {
        Alert.alert(
          'Établissement fermé',
          'Ce SIRET correspond à un établissement qui n\'est plus actif.'
        );
        return;
      }

      const extractedData = {
        siret: cleanSiret,
        companyName: company.nom_complet || company.nom_raison_sociale || '',
        address: etablissement.adresse || '',
        postalCode: etablissement.code_postal || '',
        city: etablissement.libelle_commune || '',
        isActive: true,
      };

      setSiretData(extractedData);
      setSiretVerified(true);
      setCompanyName(extractedData.companyName);

      Alert.alert(
        'SIRET vérifié ✓',
        `Entreprise : ${extractedData.companyName}\nAdresse : ${extractedData.address}`
      );

    } catch (error) {
      console.error('Erreur vérification SIRET:', error);
      Alert.alert('Erreur', 'Impossible de vérifier le SIRET. Vous pouvez continuer sans vérification.');
    } finally {
      setVerifying(false);
    }
  };

  const validateStep1 = () => {
    const cleanSiret = siret.replace(/\s/g, '');
    if (cleanSiret.length !== 14) {
      Alert.alert('Erreur', 'Le SIRET doit contenir 14 chiffres');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!companyName.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner le nom de l\'entreprise');
      return false;
    }
    if (productCategories.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une catégorie de produits');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      Alert.alert('Erreur', 'Veuillez renseigner un email de contact valide');
      return false;
    }
    if (!contactFirstName.trim() || !contactLastName.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner le nom du contact principal');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    try {
      const userId = session.user.id;

      // 1. Mettre à jour users avec le type
      const { error: userError } = await supabase
        .from('users')
        .update({ user_type: 'laboratoire' })
        .eq('id', userId);
      if (userError) throw userError;

      // 2. Créer le profil de base (avec les infos du contact)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          first_name: contactFirstName.trim(),
          last_name: contactLastName.trim(),
          phone: contactPhone.trim() || null,
        });
      if (profileError) throw profileError;

      // 3. Créer le profil laboratoire
      const { error: labError } = await supabase
        .from('laboratory_profiles')
        .upsert({
          id: userId,
          company_name: companyName.trim(),
          brand_name: brandName.trim() || null,
          description: description.trim() || null,
          website_url: website.trim() || null,
          siret: siret.replace(/\s/g, ''),
          siret_verified: siretVerified,
          product_categories: productCategories,
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim() || null,
          subscription_tier: 'free',
        });
      if (labError) throw labError;

      // 4. Créer les privacy settings par défaut
      const { error: privacyError } = await supabase
        .from('privacy_settings')
        .upsert({
          user_id: userId,
          profile_visibility: 'public',
          show_full_name: true,
          show_photo: true,
          show_exact_location: true,
          searchable_by_recruiters: false,  // Les labos ne sont pas "cherchables" comme candidats
        });
      if (privacyError) throw privacyError;

      // 5. Marquer le profil comme complet
      await supabase
        .from('users')
        .update({ profile_completed: true })
        .eq('id', userId);

      // 6. Rafraîchir et rediriger
      await refreshUserData();
      router.replace('/(tabs)/home');

    } catch (error) {
      console.error('Erreur onboarding laboratoire:', error);
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Composant chip sélectionnable
  const SelectableChip = ({ label, selected, onPress }) => (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
      {selected && (
        <Icon name="check" size={14} color="#fff" style={{ marginLeft: 4 }} />
      )}
    </Pressable>
  );

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={handleBack} />
          <Text style={styles.step}>Étape {step}/3</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 1: SIRET */}
          {step === 1 && (
            <>
              <View style={styles.iconHeader}>
                <View style={styles.iconCircle}>
                  <Icon name="building" size={32} color={theme.colors.primary} />
                </View>
              </View>
              
              <Text style={styles.title}>Identification entreprise</Text>
              <Text style={styles.subtitle}>
                Entrez votre numéro SIRET pour vérifier votre entreprise
              </Text>

              <View style={styles.form}>
                <Input
                  label="Numéro SIRET"
                  placeholder="123 456 789 00012"
                  value={siret}
                  onChangeText={setSiret}
                  keyboardType="number-pad"
                  maxLength={17}
                />

                <Button
                  title={verifying ? "Vérification..." : "Vérifier le SIRET"}
                  onPress={verifySiret}
                  loading={verifying}
                  buttonStyle={styles.verifyButton}
                  textStyle={styles.verifyButtonText}
                  hasShadow={false}
                />

                {siretVerified && (
                  <View style={styles.verifiedBadge}>
                    <Icon name="check-circle" size={20} color={theme.colors.success} />
                    <Text style={styles.verifiedText}>
                      SIRET vérifié : {siretData?.companyName}
                    </Text>
                  </View>
                )}

                <View style={styles.infoBox}>
                  <Icon name="info" size={18} color={theme.colors.primary} />
                  <Text style={styles.infoText}>
                    La vérification du SIRET vous permet d'obtenir le badge "Labo Vérifié" 
                    et inspire confiance aux animateurs et pharmacies.
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* STEP 2: Infos entreprise */}
          {step === 2 && (
            <>
              <Text style={styles.title}>Votre entreprise</Text>
              <Text style={styles.subtitle}>
                Ces informations seront visibles sur votre profil
              </Text>

              <View style={styles.form}>
                <Input
                  label="Nom de l'entreprise *"
                  placeholder="Ex: Laboratoires Pierre Fabre"
                  value={companyName}
                  onChangeText={setCompanyName}
                />

                <Input
                  label="Marque commerciale (si différente)"
                  placeholder="Ex: Avène, Ducray..."
                  value={brandName}
                  onChangeText={setBrandName}
                />

                <Input
                  label="Description (optionnel)"
                  placeholder="Présentez votre laboratoire en quelques mots..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  inputStyle={{ height: hp(12) }}
                />

                <Input
                  label="Site web (optionnel)"
                  placeholder="https://www.votre-site.com"
                  value={website}
                  onChangeText={setWebsite}
                  keyboardType="url"
                  autoCapitalize="none"
                />

                <Text style={[styles.label, { marginTop: hp(1) }]}>
                  Catégories de produits *
                </Text>
                <View style={styles.chipContainer}>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectableChip
                      key={cat.value}
                      label={cat.label}
                      selected={productCategories.includes(cat.value)}
                      onPress={() => toggleCategory(cat.value)}
                    />
                  ))}
                </View>
              </View>
            </>
          )}

          {/* STEP 3: Contact */}
          {step === 3 && (
            <>
              <Text style={styles.title}>Contact principal</Text>
              <Text style={styles.subtitle}>
                Cette personne sera le contact référent sur Pharma Link
              </Text>

              <View style={styles.form}>
                <View style={styles.row}>
                  <Input
                    placeholder="Prénom *"
                    value={contactFirstName}
                    onChangeText={setContactFirstName}
                    containerStyles={styles.halfInput}
                  />
                  <Input
                    placeholder="Nom *"
                    value={contactLastName}
                    onChangeText={setContactLastName}
                    containerStyles={styles.halfInput}
                  />
                </View>

                <Input
                  label="Email professionnel *"
                  placeholder="contact@laboratoire.com"
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Input
                  label="Téléphone (optionnel)"
                  placeholder="01 23 45 67 89"
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  keyboardType="phone-pad"
                />

                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>Récapitulatif</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Entreprise :</Text>
                    <Text style={styles.summaryValue}>{companyName}</Text>
                  </View>
                  {siretVerified && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>SIRET :</Text>
                      <View style={styles.summaryBadge}>
                        <Icon name="check" size={12} color={theme.colors.success} />
                        <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
                          Vérifié
                        </Text>
                      </View>
                    </View>
                  )}
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Catégories :</Text>
                    <Text style={styles.summaryValue}>
                      {productCategories.length} sélectionnée(s)
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Abonnement :</Text>
                    <Text style={styles.summaryValue}>Gratuit (Free)</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {step < 3 ? (
            <Button title="Continuer" onPress={handleNext} />
          ) : (
            <Button
              title="Créer mon compte laboratoire"
              onPress={handleSubmit}
              loading={loading}
            />
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(5),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(2),
  },
  step: {
    fontSize: hp(1.6),
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: hp(4),
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: hp(2),
  },
  iconCircle: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: hp(2.8),
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: hp(1.7),
    color: theme.colors.textLight,
    marginBottom: hp(3),
  },
  form: {
    gap: hp(1.5),
  },
  label: {
    fontSize: hp(1.7),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    marginBottom: hp(0.5),
  },
  verifyButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  verifyButtonText: {
    color: theme.colors.primary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '15',
    padding: hp(1.5),
    borderRadius: theme.radius.md,
    gap: wp(2),
  },
  verifiedText: {
    flex: 1,
    fontSize: hp(1.6),
    color: theme.colors.success,
    fontFamily: theme.fonts.medium,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary + '10',
    padding: hp(1.5),
    borderRadius: theme.radius.md,
    gap: wp(2),
    marginTop: hp(1),
  },
  infoText: {
    flex: 1,
    fontSize: hp(1.5),
    color: theme.colors.text,
    lineHeight: hp(2.2),
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  chipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    fontSize: hp(1.5),
    color: theme.colors.text,
  },
  chipTextSelected: {
    color: '#fff',
    fontFamily: theme.fonts.medium,
  },
  row: {
    flexDirection: 'row',
    gap: wp(3),
  },
  halfInput: {
    flex: 1,
    borderRadius: theme.radius.lg,
  },
  summaryBox: {
    backgroundColor: theme.colors.card,
    padding: hp(2),
    borderRadius: theme.radius.lg,
    marginTop: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryTitle: {
    fontSize: hp(1.8),
    color: theme.colors.text,
    fontFamily: theme.fonts.semibold,
    marginBottom: hp(1.5),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  summaryLabel: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
  },
  summaryValue: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  footer: {
    paddingVertical: hp(2),
  },
});