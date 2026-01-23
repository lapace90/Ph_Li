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
  });
  const [newBrand, setNewBrand] = useState('');

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState({});

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
      });
      setAvatarUri(profile.photo_url);
    }
  }, [profile, animatorProfile]);

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

      const data = await animatorService.getAvailability(
        session.user.id, 
        startDate, 
        endDate
      );
      
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

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        date: dateStr,
        status: availability[dateStr] || null,
        isPast: new Date(dateStr) < new Date(new Date().toDateString()),
      });
    }

    return days;
  };

  const toggleDayAvailability = async (dateStr, currentStatus) => {
    if (!session?.user?.id) return;

    let newStatus;
    if (!currentStatus) {
      newStatus = 'available';
    } else if (currentStatus === 'available') {
      newStatus = 'unavailable';
    } else {
      newStatus = null;
    }

    try {
      if (newStatus) {
        await animatorService.setAvailability(session.user.id, dateStr, newStatus);
        setAvailability(prev => ({ ...prev, [dateStr]: newStatus }));
      } else {
        await animatorService.removeAvailability(session.user.id, dateStr);
        setAvailability(prev => {
          const updated = { ...prev };
          delete updated[dateStr];
          return updated;
        });
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier la disponibilité');
    }
  };

  const setMonthAvailability = async (status) => {
    if (!session?.user?.id) return;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const today = new Date().toISOString().split('T')[0];

    const dates = [];
    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (dateStr >= today) {
        dates.push(dateStr);
      }
    }

    try {
      await animatorService.setAvailabilityBulk(session.user.id, dates, status);
      const newAvail = { ...availability };
      dates.forEach(d => { 
        newAvail[d] = status; 
      });
      setAvailability(newAvail);
      Alert.alert('Succès', `${dates.length} jours marqués`);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier les disponibilités');
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + direction);
      return newMonth;
    });
  };

  // ============================================
  // FORM HANDLERS
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
          updated_at: new Date().toISOString(),
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

  const days = getDaysInMonth();

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Mon profil</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable 
          style={[styles.tab, activeTab === 'profile' && styles.tabActive]} 
          onPress={() => setActiveTab('profile')}
        >
          <Icon 
            name="user" 
            size={18} 
            color={activeTab === 'profile' ? theme.colors.primary : theme.colors.textLight} 
          />
          <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
            Profil
          </Text>
        </Pressable>
        
        <Pressable 
          style={[styles.tab, activeTab === 'calendar' && styles.tabActive]} 
          onPress={() => setActiveTab('calendar')}
        >
          <Icon 
            name="calendar" 
            size={18} 
            color={activeTab === 'calendar' ? theme.colors.primary : theme.colors.textLight} 
          />
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.tabTextActive]}>
            Disponibilités
          </Text>
        </Pressable>
      </View>

      {/* TAB PROFIL */}
      {activeTab === 'profile' && (
        <ScrollView 
          style={commonStyles.flex1} 
          contentContainerStyle={styles.content} 
          showsVerticalScrollIndicator={false}
        >
          {/* Photo */}
          <View style={styles.avatarSection}>
            <ImagePickerBox
              value={avatarUri}
              onChange={handleAvatarChange}
              shape="circle"
              size={120}
              placeholder="Ajouter une photo"
              loading={avatarLoading}
            />
          </View>

          {/* Dispo immédiate */}
          <View style={styles.availableCard}>
            <View style={commonStyles.flex1}>
              <View style={styles.availableRow}>
                <View style={[
                  styles.availableDot, 
                  formData.availableNow && styles.availableDotActive
                ]} />
                <Text style={styles.switchLabel}>Disponible maintenant</Text>
              </View>
              <Text style={commonStyles.hint}>Visible en priorité par les labos</Text>
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
            
            <View style={styles.row}>
              <Input 
                label="Prénom" 
                value={formData.firstName} 
                onChangeText={v => updateField('firstName', v)} 
                containerStyle={commonStyles.flex1} 
              />
              <Input 
                label="Nom" 
                value={formData.lastName} 
                onChangeText={v => updateField('lastName', v)} 
                containerStyle={commonStyles.flex1} 
              />
            </View>
            
            <Input 
              label="Téléphone" 
              value={formData.phone} 
              onChangeText={v => updateField('phone', v)} 
              keyboardType="phone-pad" 
            />
            
            <Input 
              label="Années d'expérience" 
              value={formData.experienceYears} 
              onChangeText={v => updateField('experienceYears', v)} 
              keyboardType="number-pad" 
              placeholder="Ex: 5" 
            />
          </View>

          {/* Bio */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Présentation</Text>
            <View style={styles.bioContainer}>
              <TextInput
                style={styles.bioInput}
                value={formData.bio}
                onChangeText={v => updateField('bio', v)}
                placeholder="Décrivez votre parcours et votre expertise..."
                placeholderTextColor={theme.colors.textLight}
                multiline
                maxLength={500}
              />
              <Text style={styles.bioCounter}>{formData.bio.length}/500</Text>
            </View>
          </View>

          {/* Spécialités */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Spécialités d'animation</Text>
            <View style={styles.chipsContainer}>
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
            <View style={styles.row}>
              <Input 
                label="Minimum" 
                value={formData.dailyRateMin} 
                onChangeText={v => updateField('dailyRateMin', v)} 
                keyboardType="number-pad" 
                placeholder="200" 
                containerStyle={commonStyles.flex1} 
              />
              <Input 
                label="Maximum" 
                value={formData.dailyRateMax} 
                onChangeText={v => updateField('dailyRateMax', v)} 
                keyboardType="number-pad" 
                placeholder="350" 
                containerStyle={commonStyles.flex1} 
              />
            </View>
          </View>

          {/* Zones de mobilité */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Zones de mobilité</Text>
            <View style={styles.chipsContainer}>
              {FRENCH_REGIONS.map(region => (
                <Pressable
                  key={region}
                  style={[
                    commonStyles.chipSmall, 
                    formData.mobilityZones.includes(region) && commonStyles.chipActive
                  ]}
                  onPress={() => toggleRegion(region)}
                >
                  <Text style={[
                    commonStyles.chipTextSmall, 
                    formData.mobilityZones.includes(region) && commonStyles.chipTextActive
                  ]}>
                    {region}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.vehicleCard}>
              <View style={commonStyles.flex1}>
                <Text style={styles.switchLabel}>Véhicule personnel</Text>
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
            <View style={styles.brandInputRow}>
              <Input 
                placeholder="Ajouter une marque..." 
                value={newBrand} 
                onChangeText={setNewBrand} 
                containerStyle={commonStyles.flex1} 
                onSubmitEditing={addBrand} 
              />
              <Pressable style={styles.addButton} onPress={addBrand}>
                <Icon name="plus" size={20} color="#fff" />
              </Pressable>
            </View>
            
            {formData.brandsExperience.length > 0 && (
              <View style={styles.chipsContainer}>
                {formData.brandsExperience.map((brand, i) => (
                  <Pressable 
                    key={i} 
                    style={[commonStyles.chip, commonStyles.chipActive]} 
                    onPress={() => removeBrand(brand)}
                  >
                    <Text style={[commonStyles.chipText, commonStyles.chipTextActive]}>
                      {brand}
                    </Text>
                    <Icon name="x" size={14} color="#fff" style={{ marginLeft: 4 }} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: hp(15) }} />
        </ScrollView>
      )}

      {/* TAB CALENDRIER */}
      {activeTab === 'calendar' && (
        <View style={commonStyles.flex1}>
          <ScrollView contentContainerStyle={styles.content}>
            {/* Légende */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDotAvailable]} />
                <Text style={commonStyles.hint}>Disponible</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDotUnavailable]} />
                <Text style={commonStyles.hint}>Indisponible</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDotBooked]} />
                <Text style={commonStyles.hint}>Réservé</Text>
              </View>
            </View>

            {/* Navigation mois */}
            <View style={styles.monthNav}>
              <Pressable style={styles.monthArrow} onPress={() => navigateMonth(-1)}>
                <Icon name="chevronLeft" size={24} color={theme.colors.text} />
              </Pressable>
              <Text style={styles.monthTitle}>
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <Pressable style={styles.monthArrow} onPress={() => navigateMonth(1)}>
                <Icon name="chevronRight" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            {/* Jours semaine */}
            <View style={styles.weekDays}>
              {DAYS.map(day => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>

            {/* Grille */}
            <View style={styles.calendarGrid}>
              {days.map((item, index) => {
                const isDisabled = !item || item.isPast || item.status === 'booked';
                
                return (
                  <Pressable
                    key={index}
                    style={[
                      styles.calendarDay,
                      !item && styles.calendarDayEmpty,
                      item?.isPast && styles.calendarDayPast,
                    ]}
                    onPress={() => !isDisabled && toggleDayAvailability(item.date, item.status)}
                    disabled={isDisabled}
                  >
                    {item && (
                      <>
                        <Text style={[
                          styles.dayNumber, 
                          item.isPast && styles.dayNumberPast
                        ]}>
                          {item.day}
                        </Text>
                        {item.status && (
                          <View style={[
                            styles.dayStatus,
                            item.status === 'available' && styles.dayStatusAvailable,
                            item.status === 'unavailable' && styles.dayStatusUnavailable,
                            item.status === 'booked' && styles.dayStatusBooked,
                          ]} />
                        )}
                      </>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Actions rapides */}
            <View style={styles.quickActions}>
              <Pressable 
                style={[styles.quickAction, styles.quickActionAvailable]} 
                onPress={() => setMonthAvailability('available')}
              >
                <Icon name="check" size={18} color={theme.colors.success} />
                <Text style={[styles.quickActionText, { color: theme.colors.success }]}>
                  Tout dispo
                </Text>
              </Pressable>
              
              <Pressable 
                style={[styles.quickAction, styles.quickActionUnavailable]} 
                onPress={() => setMonthAvailability('unavailable')}
              >
                <Icon name="x" size={18} color={theme.colors.rose} />
                <Text style={[styles.quickActionText, { color: theme.colors.rose }]}>
                  Tout indispo
                </Text>
              </Pressable>
            </View>

            <Text style={styles.calendarHint}>
              Appuyez sur un jour pour changer son statut
            </Text>
          </ScrollView>
        </View>
      )}

      {/* Footer */}
      {activeTab === 'profile' && (
        <View style={commonStyles.footer}>
          <Button title="Enregistrer" loading={loading} onPress={handleSave} />
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: wp(5),
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: hp(1.5),
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingVertical: hp(2),
  },

  // Form
  row: {
    flexDirection: 'row',
    gap: wp(3),
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginTop: hp(1),
  },
  bioContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: hp(1.5),
  },
  bioInput: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    minHeight: hp(10),
    textAlignVertical: 'top',
  },
  bioCounter: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    textAlign: 'right',
    marginTop: hp(0.5),
  },

  // Cards
  availableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    marginTop: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  switchLabel: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  availableDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.gray,
  },
  availableDotActive: {
    backgroundColor: theme.colors.success,
  },

  // Brands
  brandInputRow: {
    flexDirection: 'row',
    gap: wp(2),
    marginTop: hp(1),
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Calendar
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(5),
    marginBottom: hp(2),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendDotAvailable: {
    backgroundColor: theme.colors.success,
  },
  legendDotUnavailable: {
    backgroundColor: theme.colors.rose,
  },
  legendDotBooked: {
    backgroundColor: theme.colors.warning,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  monthArrow: {
    padding: wp(2),
  },
  monthTitle: {
    fontSize: hp(2),
    fontWeight: '700',
    color: theme.colors.text,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: hp(1),
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  calendarDayEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  calendarDayPast: {
    opacity: 0.4,
  },
  dayNumber: {
    fontSize: hp(1.5),
    color: theme.colors.text,
  },
  dayNumberPast: {
    color: theme.colors.textLight,
  },
  dayStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 2,
  },
  dayStatusAvailable: {
    backgroundColor: theme.colors.success,
  },
  dayStatusUnavailable: {
    backgroundColor: theme.colors.rose,
  },
  dayStatusBooked: {
    backgroundColor: theme.colors.warning,
  },
  quickActions: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: hp(3),
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
  },
  quickActionAvailable: {
    backgroundColor: theme.colors.success + '15',
  },
  quickActionUnavailable: {
    backgroundColor: theme.colors.rose + '15',
  },
  quickActionText: {
    fontSize: hp(1.4),
    fontWeight: '600',
  },
  calendarHint: {
    textAlign: 'center',
    marginTop: hp(2),
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
});