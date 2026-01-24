import { Alert, ScrollView, StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/profileService';
import { storageService } from '../../services/storageService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Icon from '../../assets/icons/Icon';
import CityAutocomplete from '../../components/common/CityAutocomplete';
import RadiusSlider from '../../components/common/RadiusSlider';
import ContractTypePicker from '../../components/common/ContractTypePicker';
import RelocationToggle from '../../components/common/RelocationToggle';
import AvailabilityPicker from '../../components/common/AvailabilityPicker';
import ImagePickerBox from '../../components/common/ImagePickerBox';
import { SPECIALIZATIONS } from '../../constants/profileOptions';

export default function EditProfile() {
    const router = useRouter();
    const { session, user, profile, refreshUserData } = useAuth();

    const [loading, setLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarUri, setAvatarUri] = useState(profile?.photo_url || null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        nickname: '',
        bio: '',
        phone: '',
        city: null,
        experienceYears: '',
        specializations: [],
        availability: null,
        searchRadius: 50,
        contractTypes: [],
        willingToRelocate: false,
    });

    const [initialData, setInitialData] = useState(null);

    useEffect(() => {
        if (profile) {
            const initial = {
                firstName: profile.first_name || '',
                lastName: profile.last_name || '',
                nickname: profile.nickname || '',
                bio: profile.bio || '',
                phone: profile.phone || '',
                city: profile.current_city ? {
                    city: profile.current_city,
                    postcode: profile.current_postal_code,
                    region: profile.current_region,
                    department: profile.current_department,
                    latitude: profile.current_latitude,
                    longitude: profile.current_longitude,
                    label: `${profile.current_city} - ${profile.current_region}`,
                } : null,
                experienceYears: profile.experience_years?.toString() || '',
                specializations: profile.specializations || [],
                availability: profile.availability_date || null,
                searchRadius: profile.search_radius_km ?? -1,
                contractTypes: profile.preferred_contract_types || [],
                willingToRelocate: profile.willing_to_relocate ?? false,
                photoUrl: profile.photo_url || null,
            };
            setFormData(initial);
            setInitialData(initial);
        }
    }, [profile]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAvatarChange = async (asset) => {
        if (!asset) {
            setAvatarUri(null);
            return;
        }

        setAvatarLoading(true);
        try {
            const url = await storageService.uploadImage('avatars', session.user.id, asset);
            setAvatarUri(url);
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de télécharger la photo');
            console.error(error);
        } finally {
            setAvatarLoading(false);
        }
    };

    const toggleSpecialization = (spec) => {
        setFormData(prev => ({
            ...prev,
            specializations: prev.specializations.includes(spec)
                ? prev.specializations.filter(s => s !== spec)
                : [...prev.specializations, spec],
        }));
    };

    const isCandidate = user?.user_type !== 'titulaire';
    const isStudent = user?.user_type === 'etudiant';

    const handleSave = async () => {
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            Alert.alert('Erreur', 'Le nom et prénom sont obligatoires');
            return;
        }

        // Mapping form → database
        const fieldMap = {
            firstName: { key: 'first_name', transform: v => v.trim() },
            lastName: { key: 'last_name', transform: v => v.trim() },
            nickname: { key: 'nickname', transform: v => v?.trim() || null },
            bio: { key: 'bio', transform: v => v.trim() || null },
            phone: { key: 'phone', transform: v => v.trim() || null },
            experienceYears: { key: 'experience_years', transform: v => v ? parseInt(v) : null },
            specializations: { key: 'specializations', transform: v => v.length > 0 ? v : null },
            availability: { key: 'availability_date', transform: v => v === 'immediate' ? new Date().toISOString().split('T')[0] : v },
            searchRadius: { key: 'search_radius_km', transform: v => v === -1 ? null : v },
            contractTypes: { key: 'preferred_contract_types', transform: v => v.length > 0 ? v : null },
            willingToRelocate: { key: 'willing_to_relocate', transform: v => v },
        };

        // Construire uniquement les champs modifiés
        const updates = {};

        for (const [formKey, { key, transform }] of Object.entries(fieldMap)) {
            if (JSON.stringify(formData[formKey]) !== JSON.stringify(initialData[formKey])) {
                updates[key] = transform(formData[formKey]);
            }
        }

        // Gérer la ville séparément (plusieurs colonnes)
        if (JSON.stringify(formData.city) !== JSON.stringify(initialData.city)) {
            updates.current_city = formData.city?.city || null;
            updates.current_postal_code = formData.city?.postcode || null;
            updates.current_region = formData.city?.region || null;
            updates.current_department = formData.city?.department || null;
            updates.current_latitude = formData.city?.latitude || null;
            updates.current_longitude = formData.city?.longitude || null;
        }

        // Photo
        if (avatarUri !== initialData.photoUrl) {
            updates.photo_url = avatarUri;
        }

        // Rien à modifier ?
        if (Object.keys(updates).length === 0) {
            router.back();
            return;
        }

        setLoading(true);
        try {
            await profileService.update(session.user.id, updates);
            await refreshUserData();
            Alert.alert('Succès', 'Profil mis à jour', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert('Erreur', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper bg={theme.colors.background}>
            <StatusBar style="dark" />
            <View style={commonStyles.flex1}>
                <View style={commonStyles.headerNoBorder}>
                    <BackButton router={router} />
                    <Text style={styles.title}>Modifier le profil</Text>
                    <View style={commonStyles.headerSpacer} />
                </View>

                <ScrollView
                    style={commonStyles.flex1}
                    contentContainerStyle={commonStyles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Photo de profil */}
                    <View style={commonStyles.avatarSection}>
                        <ImagePickerBox
                            value={avatarUri}
                            onChange={handleAvatarChange}
                            shape="circle"
                            size={wp(28)}
                            placeholder="Photo"
                            loading={avatarLoading}
                        />
                        <Text style={commonStyles.avatarHint}>Touchez pour modifier</Text>
                    </View>

                    {/* Identité */}
                    <View style={commonStyles.section}>
                        <Text style={commonStyles.sectionTitle}>Identité</Text>
                        <View style={commonStyles.formRow}>
                            <View style={commonStyles.formHalf}>
                                <Input
                                    placeholder="Prénom *"
                                    value={formData.firstName}
                                    onChangeText={(v) => updateField('firstName', v)}
                                />
                            </View>
                            <View style={commonStyles.formHalf}>
                                <Input
                                    placeholder="Nom *"
                                    value={formData.lastName}
                                    onChangeText={(v) => updateField('lastName', v)}
                                />
                            </View>
                        </View>
                        <Input
                            icon={<Icon name="atSign" size={20} color={theme.colors.textLight} />}
                            placeholder="Pseudo (optionnel)"
                            value={formData.nickname}
                            onChangeText={(v) => updateField('nickname', v.replace(/[^a-zA-Z0-9_-]/g, ''))}
                            maxLength={20}
                        />
                        <Text style={commonStyles.hint}>
                            Affiché en mode anonyme • 3-20 caractères • lettres, chiffres, - et _
                        </Text>
                        <Input
                            icon={<Icon name="phone" size={20} color={theme.colors.textLight} />}
                            placeholder="Téléphone (optionnel)"
                            keyboardType="phone-pad"
                            value={formData.phone}
                            onChangeText={(v) => updateField('phone', v)}
                        />
                    </View>

                    {/* Bio */}
                    <View style={commonStyles.section}>
                        <Text style={commonStyles.sectionTitle}>Présentation</Text>
                        <Text style={commonStyles.sectionHint}>
                            Décrivez-vous en quelques mots pour les recruteurs
                        </Text>
                        <View style={commonStyles.bioContainer}>
                            <TextInput
                                style={commonStyles.bioInput}
                                placeholder="Ex: Préparatrice passionnée avec 5 ans d'expérience en officine, spécialisée en dermocosmétique et conseil personnalisé..."
                                placeholderTextColor={theme.colors.textLight}
                                value={formData.bio}
                                onChangeText={(v) => updateField('bio', v)}
                                multiline
                                numberOfLines={4}
                                maxLength={500}
                                textAlignVertical="top"
                            />
                            <Text style={commonStyles.bioCounter}>
                                {formData.bio.length}/500
                            </Text>
                        </View>
                    </View>

                    {/* Localisation */}
                    <View style={[commonStyles.section, { zIndex: 100 }]}>
                        <Text style={commonStyles.sectionTitle}>Localisation</Text>
                        <CityAutocomplete
                            value={formData.city?.label}
                            onSelect={(city) => updateField('city', city)}
                            placeholder="Rechercher votre ville"
                        />
                        {isCandidate && (
                            <View style={styles.radiusContainer}>
                                <RadiusSlider
                                    value={formData.searchRadius}
                                    onChange={(v) => updateField('searchRadius', v)}
                                />
                            </View>
                        )}
                    </View>

                    {/* Disponibilité */}
                    {isCandidate && (
                        <View style={commonStyles.section}>
                            <AvailabilityPicker
                                value={formData.availability}
                                onChange={(v) => updateField('availability', v)}
                            />
                        </View>
                    )}

                    {/* Contrats recherchés */}
                    {isCandidate && (
                        <View style={commonStyles.section}>
                            <ContractTypePicker
                                value={formData.contractTypes}
                                onChange={(v) => updateField('contractTypes', v)}
                                isStudent={isStudent}
                            />
                        </View>
                    )}

                    {/* Expérience (pas pour étudiants) */}
                    {!isStudent && (
                        <View style={commonStyles.section}>
                            <Text style={commonStyles.sectionTitle}>Expérience</Text>
                            <Input
                                icon={<Icon name="briefcase" size={20} color={theme.colors.textLight} />}
                                placeholder="Années d'expérience"
                                keyboardType="numeric"
                                value={formData.experienceYears}
                                onChangeText={(v) => updateField('experienceYears', v)}
                            />
                        </View>
                    )}

                    {/* Spécialisations */}
                    {isCandidate && (
                        <View style={commonStyles.section}>
                            <Text style={commonStyles.sectionTitle}>Spécialisations</Text>
                            <Text style={commonStyles.sectionHint}>Sélectionnez vos domaines d'expertise</Text>
                            <View style={commonStyles.chipsContainer}>
                                {SPECIALIZATIONS.map((spec) => (
                                    <Pressable
                                        key={spec}
                                        style={[
                                            commonStyles.chip,
                                            formData.specializations.includes(spec) && commonStyles.chipActive,
                                        ]}
                                        onPress={() => toggleSpecialization(spec)}
                                    >
                                        <Text style={[
                                            commonStyles.chipText,
                                            formData.specializations.includes(spec) && commonStyles.chipTextActive,
                                        ]}>
                                            {spec}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Mobilité */}
                    {isCandidate && (
                        <View style={commonStyles.section}>
                            <RelocationToggle
                                value={formData.willingToRelocate}
                                onChange={(v) => updateField('willingToRelocate', v)}
                            />
                        </View>
                    )}
                </ScrollView>

                {/* Footer fixe */}
                <View style={commonStyles.footer}>
                    <Button
                        title="Enregistrer"
                        loading={loading}
                        onPress={handleSave}
                    />
                </View>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: hp(2),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    radiusContainer: {
        marginTop: hp(1.5),
    },
});