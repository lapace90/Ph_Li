// Écran de proposition de mission (côté Labo/Titulaire, après match)

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { missionService } from '../../services/missionService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import DateRangePicker from '../../components/common/DateRangePicker';
import CityAutocomplete from '../../components/common/CityAutocomplete';
import Icon from '../../assets/icons/Icon';
import MissionTimeline from '../../components/missions/MissionTimeline';

export default function MissionProposal() {
  const router = useRouter();
  const { missionId, matchId, animatorId } = useLocalSearchParams();
  const { session } = useAuth();

  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    startDate: null,
    endDate: null,
    dailyRate: '',
    city: '',
    department: '',
    region: '',
    latitude: null,
    longitude: null,
    description: '',
  });

  useEffect(() => {
    loadMission();
  }, [missionId]);

  const loadMission = async () => {
    try {
      const data = await missionService.getById(missionId);
      setMission(data);
      // Pré-remplir avec les données existantes
      setForm({
        startDate: data.start_date || null,
        endDate: data.end_date || null,
        dailyRate: data.daily_rate_min?.toString() || '',
        city: data.city || '',
        department: data.department || '',
        region: data.region || '',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        description: data.description || '',
      });
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger la mission');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const handleDateChange = ({ startDate, endDate }) => {
    setForm(prev => ({ ...prev, startDate, endDate }));
    if (errors.startDate || errors.endDate) {
      setErrors(prev => ({ ...prev, startDate: null, endDate: null }));
    }
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
    if (errors.city) setErrors(prev => ({ ...prev, city: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.startDate) newErrors.startDate = 'La date de debut est requise';
    if (!form.endDate) newErrors.endDate = 'La date de fin est requise';
    if (!form.dailyRate || isNaN(Number(form.dailyRate))) newErrors.dailyRate = 'Tarif journalier valide requis';
    if (!form.city.trim()) newErrors.city = 'Le lieu est requis';
    if (!form.description.trim()) newErrors.description = 'La description est requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await missionService.sendProposal(missionId, animatorId, matchId, {
        startDate: form.startDate,
        endDate: form.endDate,
        dailyRate: Number(form.dailyRate),
        city: form.city,
        department: form.department,
        region: form.region,
        latitude: form.latitude,
        longitude: form.longitude,
        description: form.description,
      });
      Alert.alert(
        'Proposition envoyee',
        'L\'animateur recevra votre proposition et pourra l\'accepter ou la decliner.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'envoyer la proposition. Reessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  const animator = mission?.animator;
  const animatorProfile = animator?.profile;

  return (
    <ScreenWrapper>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Proposition de mission</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <ScrollView
        style={commonStyles.flex1}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Timeline */}
        <MissionTimeline status="open" />

        {/* Profil animateur */}
        {animatorProfile && (
          <View style={styles.animatorCard}>
            <View style={styles.animatorHeader}>
              {animatorProfile.photo_url ? (
                <Image source={{ uri: animatorProfile.photo_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, commonStyles.centered, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Icon name="user" size={28} color={theme.colors.primary} />
                </View>
              )}
              <View style={commonStyles.flex1}>
                <Text style={styles.animatorName}>
                  {animatorProfile.first_name} {animatorProfile.last_name?.[0]}.
                </Text>
                <View style={commonStyles.rowGapSmall}>
                  {animator.average_rating > 0 && (
                    <View style={commonStyles.rowGapSmall}>
                      <Icon name="star" size={14} color={theme.colors.warning} />
                      <Text style={styles.ratingText}>{animator.average_rating.toFixed(1)}</Text>
                    </View>
                  )}
                  {animator.missions_completed > 0 && (
                    <Text style={styles.missionsText}>
                      {animator.missions_completed} mission{animator.missions_completed > 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Formulaire de proposition */}
        <Text style={styles.sectionTitle}>Details de la proposition</Text>

        <DateRangePicker
          startDate={form.startDate}
          endDate={form.endDate}
          onChange={handleDateChange}
        />
        {errors.startDate && <Text style={commonStyles.error}>{errors.startDate}</Text>}

        <CityAutocomplete
          label="Lieu de la mission *"
          value={form.city}
          onSelect={handleCitySelect}
          error={errors.city}
        />

        <Input
          label="Tarif journalier propose (EUR) *"
          placeholder="Ex: 250"
          value={form.dailyRate}
          onChangeText={(v) => updateForm('dailyRate', v)}
          keyboardType="numeric"
          error={errors.dailyRate}
        />

        <Input
          label="Description detaillee *"
          placeholder="Decrivez les attentes, les produits, l'environnement..."
          value={form.description}
          onChangeText={(v) => updateForm('description', v)}
          multiline
          containerStyles={{ minHeight: hp(15) }}
          error={errors.description}
        />

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Annuler"
            onPress={() => router.back()}
            buttonStyle={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
          <Button
            title="Envoyer la proposition"
            onPress={handleSubmit}
            loading={submitting}
            buttonStyle={styles.submitButton}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
  },
  animatorCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: wp(4),
    marginBottom: hp(2.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  animatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  animatorName: {
    fontSize: hp(1.8),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: hp(0.3),
  },
  ratingText: {
    fontSize: hp(1.4),
    fontWeight: '600',
    color: theme.colors.text,
  },
  missionsText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
  },
  sectionTitle: {
    fontSize: hp(1.8),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: hp(1.5),
  },
  actions: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: hp(2),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.text,
  },
  submitButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
  },
});
