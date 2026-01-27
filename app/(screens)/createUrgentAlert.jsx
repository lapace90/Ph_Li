/**
 * Création d'alerte urgente
 * - Titulaires : recherche remplacement (préparateur, conseiller, étudiant)
 * - Laboratoires : recherche animateur urgent
 */
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { urgentAlertService } from '../../services/urgentAlertService';
import { isRecruiter, isLaboratory } from '../../helpers/roleLabel';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SingleSelect from '../../components/common/SingleSelect';
import MultiSelect from '../../components/common/MultiSelect';
import CityAutocomplete from '../../components/common/CityAutocomplete';
import DateRangePicker from '../../components/common/DateRangePicker';
import Icon from '../../assets/icons/Icon';
import { 
  ANIMATION_SPECIALTIES, 
  URGENT_ALERT_RADIUS_OPTIONS 
} from '../../constants/profileOptions';

const POSITION_TYPES = [
  { value: 'preparateur', label: 'Préparateur(trice)' },
  { value: 'conseiller', label: 'Conseiller(ère)' },
  { value: 'etudiant', label: 'Étudiant(e)' },
];

export default function CreateUrgentAlert() {
  const router = useRouter();
  const { user, session, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const userType = user?.user_type;
  const isLabo = isLaboratory(userType);
  const isTitulaire = isRecruiter(userType);

  const [form, setForm] = useState({
    title: '',
    description: '',
    positionType: isLabo ? 'animateur' : '',
    specialties: [],
    startDate: null,
    endDate: null,
    city: '',
    department: '',
    region: '',
    latitude: null,
    longitude: null,
    radiusKm: 30,
    hourlyRate: '',
    dailyRate: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profile) {
      setForm(prev => ({
        ...prev,
        city: profile.current_city || '',
        department: profile.current_department || '',
        region: profile.current_region || '',
        latitude: profile.current_latitude,
        longitude: profile.current_longitude,
      }));
    }
  }, [profile]);

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleCitySelect = (cityData) => {
    setForm(prev => ({
      ...prev,
      city: cityData.city,
      department: cityData.department,
      region: cityData.region,
      latitude: cityData.latitude,
      longitude: cityData.longitude,
    }));
  };

  const handleDateChange = ({ startDate, endDate }) => {
    setForm(prev => ({ ...prev, startDate, endDate }));
    if (errors.dates) setErrors(prev => ({ ...prev, dates: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Titre requis';
    if (!isLabo && !form.positionType) newErrors.positionType = 'Type de poste requis';
    if (!form.startDate || !form.endDate) newErrors.dates = 'Dates requises';
    if (!form.city || !form.latitude) newErrors.city = 'Localisation requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez compléter tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const alertData = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        positionType: form.positionType,
        specialties: form.specialties,
        startDate: form.startDate.toISOString().split('T')[0],
        endDate: form.endDate.toISOString().split('T')[0],
        city: form.city,
        latitude: form.latitude,
        longitude: form.longitude,
        radiusKm: form.radiusKm,
        hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : null,
        dailyRate: form.dailyRate ? parseFloat(form.dailyRate) : null,
      };

      if (isLabo) {
        await urgentAlertService.createForLaboratory(session.user.id, alertData);
      } else {
        await urgentAlertService.createForPharmacy(session.user.id, alertData);
      }

      Alert.alert(
        '🚨 Alerte publiée !',
        `Votre alerte urgente a été envoyée aux ${isLabo ? 'animateurs' : 'candidats'} dans un rayon de ${form.radiusKm} km.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de créer l\'alerte');
    } finally {
      setLoading(false);
    }
  };

  const getDaysCount = () => {
    if (!form.startDate || !form.endDate) return 0;
    const diff = form.endDate - form.startDate;
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Alerte urgente</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <ScrollView 
        style={commonStyles.flex1} 
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner info */}
        <View style={styles.infoBanner}>
          <Icon name="zap" size={20} color={theme.colors.warning} />
          <Text style={styles.infoBannerText}>
            Les {isLabo ? 'animateurs' : 'candidats'} à proximité seront notifiés immédiatement
          </Text>
        </View>

        <Input
          label="Titre de l'alerte *"
          placeholder={isLabo ? 'Ex: Animateur urgent Nice centre' : 'Ex: Remplacement urgent préparateur'}
          value={form.title}
          onChangeText={v => updateForm('title', v)}
          error={errors.title}
        />

        <Input
          label="Description"
          placeholder="Détails supplémentaires..."
          value={form.description}
          onChangeText={v => updateForm('description', v)}
          multiline
          numberOfLines={3}
          inputStyle={commonStyles.textArea}
        />

        {isTitulaire && (
          <SingleSelect
            label="Type de poste recherché *"
            options={POSITION_TYPES}
            selected={form.positionType}
            onChange={v => updateForm('positionType', v)}
            error={errors.positionType}
          />
        )}

        {isLabo && (
          <MultiSelect
            label="Spécialités requises"
            options={ANIMATION_SPECIALTIES}
            selected={form.specialties}
            onChange={v => updateForm('specialties', v)}
            hint="Optionnel - Filtrer les animateurs par spécialité"
          />
        )}

        <View style={commonStyles.formGroup}>
          <Text style={commonStyles.label}>Période du remplacement *</Text>
          <DateRangePicker
            startDate={form.startDate}
            endDate={form.endDate}
            onChange={handleDateChange}
            minDate={new Date()}
            placeholder="Sélectionner les dates"
          />
          {errors.dates && <Text style={commonStyles.error}>{errors.dates}</Text>}
          {getDaysCount() > 0 && (
            <Text style={[commonStyles.hint, { color: theme.colors.primary, marginTop: hp(0.5) }]}>
              📅 {getDaysCount()} jour{getDaysCount() > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        <View style={commonStyles.formGroup}>
          <Text style={commonStyles.label}>Localisation *</Text>
          <CityAutocomplete
            value={form.city}
            onSelect={handleCitySelect}
            placeholder="Rechercher une ville..."
            error={errors.city}
          />
        </View>

        <SingleSelect
          label="Rayon de recherche"
          options={URGENT_ALERT_RADIUS_OPTIONS}
          selected={form.radiusKm}
          onChange={v => updateForm('radiusKm', v)}
        />

        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>Rémunération (optionnel)</Text>
          {isLabo ? (
            <Input
              label="Tarif journalier (€)"
              placeholder="Ex: 250"
              value={form.dailyRate}
              onChangeText={v => updateForm('dailyRate', v)}
              keyboardType="number-pad"
            />
          ) : (
            <Input
              label="Taux horaire (€)"
              placeholder="Ex: 15"
              value={form.hourlyRate}
              onChangeText={v => updateForm('hourlyRate', v)}
              keyboardType="number-pad"
            />
          )}
        </View>

        {/* Résumé */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionTitleSmall}>📍 Résumé de l'alerte</Text>
          <View style={styles.summaryRow}>
            <Text style={commonStyles.hint}>Zone :</Text>
            <Text style={commonStyles.textSmall}>{form.city || '—'} ({form.radiusKm} km)</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={commonStyles.hint}>Période :</Text>
            <Text style={commonStyles.textSmall}>
              {form.startDate && form.endDate
                ? `${form.startDate.toLocaleDateString('fr-FR')} - ${form.endDate.toLocaleDateString('fr-FR')}`
                : '—'
              }
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={commonStyles.hint}>Recherche :</Text>
            <Text style={commonStyles.textSmall}>
              {isLabo ? 'Animateur' : POSITION_TYPES.find(p => p.value === form.positionType)?.label || '—'}
            </Text>
          </View>
        </View>

        <Button
          title="🚨 Publier l'alerte"
          loading={loading}
          onPress={handleSubmit}
          buttonStyle={{ backgroundColor: theme.colors.warning }}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  formContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(10),
    gap: hp(2),
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: theme.colors.warning + '15',
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
  },
  infoBannerText: {
    flex: 1,
    fontSize: hp(1.4),
    color: theme.colors.warning,
    fontFamily: theme.fonts.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(0.8),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
});