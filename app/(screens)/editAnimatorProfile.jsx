/**
 * Édition du profil animateur
 * Format inputs aligné sur editProfile.jsx
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  TextInput, 
  Alert, 
  Switch, 
  StyleSheet 
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { animatorService } from '../../services/animatorService';
import { siretVerificationService } from '../../services/siretVerificationService';
import { storageService } from '../../services/storageService';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ImagePickerBox from '../../components/common/ImagePickerBox';
import Icon from '../../assets/icons/Icon';
import { ANIMATION_SPECIALTIES, FRENCH_REGIONS } from '../../constants/profileOptions';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function EditAnimatorProfile() {
  const router = useRouter();
  const { session, profile, animatorProfile, refreshAnimatorProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    specialties: [],
    mobilityZones: [],
    dailyRateMin: '',
    dailyRateMax: '',
    hasVehicle: false,
    availableNow: false,
    brandsExperience: [],
    experienceYears: '',
    siret: '',
  });
  const [newBrand, setNewBrand] = useState('');

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState({});
  const [siretVerificationStatus, setSiretVerificationStatus] = useState(null);

  // ============================================
  // INITIALISATION
  // ============================================

  useEffect(() => {
    if (profile && animatorProfile) {
      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        specialties: animatorProfile.animation_specialties || [],
        mobilityZones: animatorProfile.mobility_zones || [],
        dailyRateMin: animatorProfile.daily_rate_min?.toString() || '',
        dailyRateMax: animatorProfile.daily_rate_max?.toString() || '',
        hasVehicle: animatorProfile.has_vehicle || false,
        availableNow: animatorProfile.available_now || false,
        brandsExperience: animatorProfile.brands_experience || [],
        experienceYears: animatorProfile.experience_years?.toString() || '',
        siret: '',
      });
      setAvatarUri(profile.photo_url);
    }
  }, [profile, animatorProfile]);

  // Charger le statut de vérification SIRET
  useEffect(() => {
    loadSiretStatus();
  }, []);

  const loadSiretStatus = async () => {
    if (!session?.user?.id) return;
    try {
      const status = await siretVerificationService.getVerificationStatus(session.user.id);
      setSiretVerificationStatus(status);
    } catch (error) {
      console.error('Erreur chargement statut SIRET:', error);
    }
  };

  // ============================================
  // CALENDRIER
  // ============================================

  const loadAvailability = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const data = await animatorService.getAvailability(session.user.id, startDate, endDate);
      
      const availMap = {};
      data.forEach(item => {
        availMap[item.date] = item.status;
      });
      setAvailability(availMap);
    } catch (error) {
      console.error('Erreur chargement disponibilités:', error);
    }
  }, [session?.user?.id, currentMonth]);

  useEffect(() => {
    if (activeTab === 'calendar') {
      loadAvailability();
    }
  }, [activeTab, loadAvailability]);

  const toggleDayAvailability = async (date) => {
    const currentStatus = availability[date] || 'available';
    const nextStatus = currentStatus === 'available' ? 'unavailable' : 'available';

    try {
      await animatorService.setAvailability(session.user.id, date, nextStatus);
      setAvailability(prev => ({ ...prev, [date]: nextStatus }));
    } catch (error) {
      console.error('Erreur modification disponibilité:', error);
      Alert.alert('Erreur', error.message || 'Impossible de modifier la disponibilité');
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startPadding = (firstDay.getDay() + 6) % 7;
    
    for (let i = 0; i < startPadding; i++) {
      days.push({ date: null, day: null });
    }
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, day: d });
    }
    
    return days;
  };

  const changeMonth = (delta) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  // ============================================
  // HANDLERS
  // ============================================

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSpecialty = (spec) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
        ? prev.specialties.filter(s => s !== spec)
        : [...prev.specialties, spec],
    }));
  };

  const toggleRegion = (region) => {
    setFormData(prev => ({
      ...prev,
      mobilityZones: prev.mobilityZones.includes(region)
        ? prev.mobilityZones.filter(r => r !== region)
        : [...prev.mobilityZones, region],
    }));
  };

  const addBrand = () => {
    const brand = newBrand.trim();
    if (brand && !formData.brandsExperience.includes(brand)) {
      updateField('brandsExperience', [...formData.brandsExperience, brand]);
      setNewBrand('');
    }
  };

  const removeBrand = (brand) => {
    updateField(
      'brandsExperience', 
      formData.brandsExperience.filter(b => b !== brand)
    );
  };

  const handleAvatarChange = async (asset) => {
    if (!asset) {
      setAvatarUri(null);
      return;
    }
    
    setAvatarLoading(true);
    try {
      const url = await storageService.uploadImage(
        'avatars', 
        session.user.id, 
        asset
      );
      setAvatarUri(url);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger la photo');
    } finally {
      setAvatarLoading(false);
    }
  };

  // ============================================
  // SAUVEGARDE
  // ============================================

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Erreur', 'Le nom et prénom sont obligatoires');
      return;
    }

    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          phone: formData.phone.trim() || null,
          bio: formData.bio.trim() || null,
          photo_url: avatarUri,
          experience_years: formData.experienceYears 
            ? parseInt(formData.experienceYears) 
            : null,
        })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      const { error: animatorError } = await supabase
        .from('animator_profiles')
        .update({
          animation_specialties: formData.specialties.length > 0
            ? formData.specialties
            : null,
          mobility_zones: formData.mobilityZones.length > 0
            ? formData.mobilityZones
            : null,
          daily_rate_min: formData.dailyRateMin
            ? parseInt(formData.dailyRateMin)
            : null,
          daily_rate_max: formData.dailyRateMax
            ? parseInt(formData.dailyRateMax)
            : null,
          has_vehicle: formData.hasVehicle,
          available_now: formData.availableNow,
          brands_experience: formData.brandsExperience.length > 0
            ? formData.brandsExperience
            : null,
        })
        .eq('id', session.user.id);

      if (animatorError) throw animatorError;

      await refreshAnimatorProfile?.();
      Alert.alert('Succès', 'Profil mis à jour');
      router.back();
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const renderProfileTab = () => (
    <ScrollView 
      style={commonStyles.flex1} 
      contentContainerStyle={commonStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={commonStyles.avatarSection}>
        <ImagePickerBox
          imageUri={avatarUri}
          onImageChange={handleAvatarChange}
          loading={avatarLoading}
          size={120}
          rounded
        />
        <Text style={commonStyles.avatarHint}>Touchez pour modifier</Text>
      </View>

      {/* Dispo maintenant */}
      <View style={styles.availableNowCard}>
        <View style={commonStyles.flex1}>
          <Text style={commonStyles.switchLabel}>Disponible maintenant</Text>
          <Text style={commonStyles.hint}>Apparaître en priorité dans les recherches</Text>
        </View>
        <Switch
          value={formData.availableNow}
          onValueChange={v => updateField('availableNow', v)}
          trackColor={{ 
            false: theme.colors.gray, 
            true: theme.colors.success + '50' 
          }}
          thumbColor={formData.availableNow ? theme.colors.success : '#f4f3f4'}
        />
      </View>

      {/* Infos perso */}
      <View style={commonStyles.section}>
        <Text style={commonStyles.sectionTitle}>Informations personnelles</Text>
        
        <View style={commonStyles.formRow}>
          <View style={commonStyles.formHalf}>
            <Input
              icon={<Icon name="user" size={20} color={theme.colors.textLight} />}
              placeholder="Prénom *"
              value={formData.firstName}
              onChangeText={v => updateField('firstName', v)}
            />
          </View>
          <View style={commonStyles.formHalf}>
            <Input
              icon={<Icon name="user" size={20} color={theme.colors.textLight} />}
              placeholder="Nom *"
              value={formData.lastName}
              onChangeText={v => updateField('lastName', v)}
            />
          </View>
        </View>
        
        <Input
          icon={<Icon name="phone" size={20} color={theme.colors.textLight} />}
          placeholder="Téléphone (optionnel)"
          value={formData.phone}
          onChangeText={v => updateField('phone', v)}
          keyboardType="phone-pad"
        />
        
        <Input
          icon={<Icon name="briefcase" size={20} color={theme.colors.textLight} />}
          placeholder="Années d'expérience"
          value={formData.experienceYears}
          onChangeText={v => updateField('experienceYears', v)}
          keyboardType="number-pad"
        />
      </View>

      {/* Vérification SIRET */}
      <View style={commonStyles.section}>
        <Text style={commonStyles.sectionTitle}>Vérification professionnelle</Text>
        <Text style={commonStyles.sectionHint}>
          Obtenez le badge vérifié en certifiant votre statut d'auto-entrepreneur
        </Text>

        {siretVerificationStatus?.verified ? (
          <View style={styles.siretBadge}>
            <Icon name="checkCircle" size={20} color={theme.colors.success} />
            <View style={commonStyles.flex1}>
              <Text style={styles.siretTitle}>SIRET Vérifié</Text>
              <Text style={styles.siretNumber}>
                {siretVerificationStatus.siretNumber?.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')}
              </Text>
            </View>
            <Pressable onPress={() => router.push('/(screens)/siretVerification')}>
              <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.verifyButton}
            onPress={() => router.push('/(screens)/siretVerification')}
          >
            <View style={styles.verifyButtonIcon}>
              <Icon name="shield" size={24} color={theme.colors.primary} />
            </View>
            <View style={commonStyles.flex1}>
              <Text style={styles.verifyButtonTitle}>Vérifier mon SIRET</Text>
              <Text style={commonStyles.hint}>
                Badge vérifié + crédibilité renforcée
              </Text>
            </View>
            <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
          </Pressable>
        )}
      </View>

      {/* Bio */}
      <View style={commonStyles.section}>
        <Text style={commonStyles.sectionTitle}>Présentation</Text>
        <Text style={commonStyles.sectionHint}>
          Décrivez votre parcours et votre expertise
        </Text>
        <View style={commonStyles.bioContainer}>
          <TextInput
            style={commonStyles.bioInput}
            value={formData.bio}
            onChangeText={v => updateField('bio', v)}
            placeholder="Ex: Animatrice passionnée avec 5 ans d'expérience en dermocosmétique..."
            placeholderTextColor={theme.colors.textLight}
            multiline
            maxLength={500}
          />
          <Text style={commonStyles.bioCounter}>{formData.bio.length}/500</Text>
        </View>
      </View>

      {/* Spécialités */}
      <View style={commonStyles.section}>
        <Text style={commonStyles.sectionTitle}>Spécialités d'animation</Text>
        <View style={commonStyles.chipsContainer}>
          {ANIMATION_SPECIALTIES.map(spec => (
            <Pressable
              key={spec.value}
              style={[
                commonStyles.chip, 
                formData.specialties.includes(spec.value) && commonStyles.chipActive
              ]}
              onPress={() => toggleSpecialty(spec.value)}
            >
              <Text style={[
                commonStyles.chipText, 
                formData.specialties.includes(spec.value) && commonStyles.chipTextActive
              ]}>
                {spec.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Tarifs */}
      <View style={commonStyles.section}>
        <Text style={commonStyles.sectionTitle}>Tarif journalier (€)</Text>
        <View style={commonStyles.formRow}>
          <View style={commonStyles.formHalf}>
            <Input
              icon={<Icon name="dollarSign" size={20} color={theme.colors.textLight} />}
              placeholder="Minimum (ex: 200)"
              value={formData.dailyRateMin}
              onChangeText={v => updateField('dailyRateMin', v)}
              keyboardType="number-pad"
            />
          </View>
          <View style={commonStyles.formHalf}>
            <Input
              icon={<Icon name="dollarSign" size={20} color={theme.colors.textLight} />}
              placeholder="Maximum (ex: 350)"
              value={formData.dailyRateMax}
              onChangeText={v => updateField('dailyRateMax', v)}
              keyboardType="number-pad"
            />
          </View>
        </View>
      </View>

      {/* Zones de mobilité */}
      <View style={commonStyles.section}>
        <Text style={commonStyles.sectionTitle}>Zones de mobilité</Text>
        <View style={commonStyles.chipsContainer}>
          {FRENCH_REGIONS.map(region => (
            <Pressable
              key={region}
              style={[
                commonStyles.chip, 
                formData.mobilityZones.includes(region) && commonStyles.chipActive
              ]}
              onPress={() => toggleRegion(region)}
            >
              <Text style={[
                commonStyles.chipText, 
                formData.mobilityZones.includes(region) && commonStyles.chipTextActive
              ]}>
                {region}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.vehicleCard}>
          <View style={commonStyles.flex1}>
            <View style={commonStyles.rowGapSmall}>
              <Icon name="car" size={18} color={theme.colors.text} />
              <Text style={commonStyles.switchLabel}>Véhicule personnel</Text>
            </View>
            <Text style={commonStyles.hint}>Facilite les déplacements</Text>
          </View>
          <Switch
            value={formData.hasVehicle}
            onValueChange={v => updateField('hasVehicle', v)}
            trackColor={{ 
              false: theme.colors.gray, 
              true: theme.colors.primary + '50' 
            }}
            thumbColor={formData.hasVehicle ? theme.colors.primary : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Marques */}
      <View style={commonStyles.section}>
        <Text style={commonStyles.sectionTitle}>Expérience marques</Text>
        <Text style={commonStyles.sectionHint}>
          Ajoutez les marques avec lesquelles vous avez travaillé
        </Text>
        
        <View style={styles.brandInputRow}>
          <View style={commonStyles.flex1}>
            <Input
              icon={<Icon name="award" size={20} color={theme.colors.textLight} />}
              placeholder="Nom de la marque"
              value={newBrand}
              onChangeText={setNewBrand}
              onSubmitEditing={addBrand}
            />
          </View>
          <Pressable style={commonStyles.addButton} onPress={addBrand}>
            <Icon name="plus" size={20} color="white" />
          </Pressable>
        </View>

        {formData.brandsExperience.length > 0 && (
          <View style={commonStyles.chipsContainer}>
            {formData.brandsExperience.map((brand, index) => (
              <View key={index} style={[commonStyles.chip, commonStyles.chipActive]}>
                <Text style={commonStyles.chipTextActive}>{brand}</Text>
                <Pressable onPress={() => removeBrand(brand)} hitSlop={8}>
                  <Icon name="x" size={14} color="white" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={{ height: hp(10) }} />
    </ScrollView>
  );

  const renderCalendarTab = () => {
    const days = getDaysInMonth();
    const today = new Date().toISOString().split('T')[0];

    return (
      <ScrollView 
        style={commonStyles.flex1} 
        contentContainerStyle={commonStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation mois */}
        <View style={commonStyles.monthNav}>
          <Pressable onPress={() => changeMonth(-1)} style={commonStyles.monthButton}>
            <Icon name="chevronLeft" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={commonStyles.monthTitle}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <Pressable onPress={() => changeMonth(1)} style={commonStyles.monthButton}>
            <Icon name="chevronRight" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        {/* Légende */}
        <View style={commonStyles.legend}>
          <View style={commonStyles.legendItem}>
            <View style={[commonStyles.legendDot, commonStyles.calendarLegendAvailable]} />
            <Text style={commonStyles.hint}>Disponible</Text>
          </View>
          <View style={commonStyles.legendItem}>
            <View style={[commonStyles.legendDot, commonStyles.calendarLegendUnavailable]} />
            <Text style={commonStyles.hint}>Indisponible</Text>
          </View>
          <View style={commonStyles.legendItem}>
            <View style={[commonStyles.legendDot, commonStyles.calendarLegendBooked]} />
            <Text style={commonStyles.hint}>Réservé</Text>
          </View>
        </View>

        {/* Jours de la semaine */}
        <View style={commonStyles.weekDays}>
          {DAYS.map((day, i) => (
            <Text key={i} style={commonStyles.weekDay}>{day}</Text>
          ))}
        </View>

        {/* Grille des jours */}
        <View style={commonStyles.daysGrid}>
          {days.map((item, index) => {
            if (!item.date) {
              return <View key={index} style={commonStyles.dayCell} />;
            }

            const status = availability[item.date] || 'available';
            const isPast = item.date < today;
            const isBooked = status === 'booked';

            return (
              <Pressable
                key={index}
                style={[
                  commonStyles.dayCell,
                  status === 'available' && commonStyles.calendarDayAvailable,
                  status === 'unavailable' && commonStyles.calendarDayUnavailable,
                  status === 'booked' && commonStyles.calendarDayBooked,
                  isPast && commonStyles.calendarDayPast,
                ]}
                onPress={() => !isPast && !isBooked && toggleDayAvailability(item.date)}
                disabled={isPast || isBooked}
              >
                <Text style={[
                  commonStyles.dayText,
                  status === 'unavailable' && commonStyles.calendarDayTextUnavailable,
                  isPast && commonStyles.calendarDayTextPast,
                ]}>
                  {item.day}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[commonStyles.hint, { textAlign: 'center', marginTop: hp(2) }]}>
          Touchez une date pour basculer sa disponibilité
        </Text>

        <View style={{ height: hp(10) }} />
      </ScrollView>
    );
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={commonStyles.header}>
        <BackButton />
        <Text style={commonStyles.headerTitle}>Mon profil animateur</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={commonStyles.tabs}>
        <Pressable
          style={[commonStyles.tab, activeTab === 'profile' && commonStyles.tabActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Icon 
            name="user" 
            size={18} 
            color={activeTab === 'profile' ? theme.colors.primary : theme.colors.textLight} 
          />
          <Text style={[
            commonStyles.tabText, 
            activeTab === 'profile' && commonStyles.tabTextActive
          ]}>
            Profil
          </Text>
        </Pressable>
        <Pressable
          style={[commonStyles.tab, activeTab === 'calendar' && commonStyles.tabActive]}
          onPress={() => setActiveTab('calendar')}
        >
          <Icon 
            name="calendar" 
            size={18} 
            color={activeTab === 'calendar' ? theme.colors.primary : theme.colors.textLight} 
          />
          <Text style={[
            commonStyles.tabText, 
            activeTab === 'calendar' && commonStyles.tabTextActive
          ]}>
            Disponibilités
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <View style={commonStyles.flex1}>
        {activeTab === 'profile' ? renderProfileTab() : renderCalendarTab()}
      </View>

      {/* Footer */}
      {activeTab === 'profile' && (
        <View style={commonStyles.footer}>
          <Button
            title="Enregistrer"
            loading={loading}
            onPress={handleSave}
          />
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // Available now card
  availableNowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '10',
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    marginHorizontal: wp(4),
    marginBottom: hp(2),
  },

  // Vehicle card
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    marginTop: hp(1.5),
  },

  // Brand input
  brandInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },

  // SIRET verification
  siretBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: theme.colors.success + '15',
    padding: hp(1.8),
    borderRadius: theme.radius.lg,
  },
  siretTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.success,
    marginBottom: hp(0.3),
  },
  siretNumber: {
    fontSize: hp(1.3),
    color: theme.colors.success,
    fontFamily: theme.fonts.medium,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: theme.colors.card,
    padding: hp(1.8),
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  verifyButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
});