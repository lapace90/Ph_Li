import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/profileService';
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
import { storageService } from '../../services/storageService';

const SPECIALIZATIONS = [
    'Orthopédie',
    'Homéopathie',
    'Phytothérapie',
    'Aromathérapie',
    'Dermocosmétique',
    'Nutrition',
    'Maintien à domicile',
    'Vaccination',
];

export default function EditProfile() {
    const router = useRouter();
    const { session, user, profile, refreshUserData } = useAuth();

    const [loading, setLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarUri, setAvatarUri] = useState(profile?.avatar_url || null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        city: null,
        experienceYears: '',
        specializations: [],
        availability: null,
        searchRadius: 50,
        contractTypes: [],
        willingToRelocate: false,

    });

    useEffect(() => {
        if (profile) {
            setFormData({
                firstName: profile.first_name || '',
                lastName: profile.last_name || '',
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
                searchRadius: profile.search_radius_km ?? -1,  // ← utiliser ?? pour gérer null
                contractTypes: profile.preferred_contract_types || [], 
                willingToRelocate: profile.willing_to_relocate ?? false,
            });
            setAvatarUri(profile.avatar_url || null); 
        }
    }, [profile]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Fonction pour gérer le changement d'avatar
    const handleAvatarChange = async (asset) => {
        if (!asset) {
            // Suppression de l'avatar
            setAvatarUri(null);
            return;
        }

        setAvatarLoading(true);
        try {
            const url = await storageService.uploadImage('avatars', session.user.id, asset);
            setAvatarUri(url);

            // Mettre à jour le profil immédiatement
            await profileService.update(session.user.id, { avatar_url: url });
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

        setLoading(true);
        try {
            await profileService.update(session.user.id, {
                first_name: formData.firstName.trim(),
                last_name: formData.lastName.trim(),
                phone: formData.phone.trim() || null,
                current_city: formData.city?.city || null,
                current_postal_code: formData.city?.postcode || null,
                current_region: formData.city?.region || null,
                current_department: formData.city?.department || null,
                current_latitude: formData.city?.latitude || null,
                current_longitude: formData.city?.longitude || null,
                experience_years: formData.experienceYears ? parseInt(formData.experienceYears) : null,
                specializations: formData.specializations.length > 0 ? formData.specializations : null,
                availability_date: formData.availability === 'immediate'
                    ? new Date().toISOString().split('T')[0]
                    : formData.availability,
                search_radius_km: formData.searchRadius === -1 ? null : formData.searchRadius,
                preferred_contract_types: formData.contractTypes.length > 0 ? formData.contractTypes : null,
                willing_to_relocate: formData.willingToRelocate,
            });

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
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <BackButton router={router} />
                    <Text style={styles.title}>Modifier le profil</Text>
                    <View style={{ width: 36 }} />
                </View>

                {/* Photo de profil */}
                <View style={styles.avatarSection}>
                    <ImagePickerBox
                        value={avatarUri}
                        onChange={handleAvatarChange}
                        shape="circle"
                        size={wp(30)}
                        placeholder="Photo de profil"
                        loading={avatarLoading}
                    />
                </View>

                {/* Identité */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Identité</Text>

                    <Input
                        icon={<Icon name="user" size={22} color={theme.colors.textLight} />}
                        placeholder="Prénom *"
                        value={formData.firstName}
                        onChangeText={(v) => updateField('firstName', v)}
                    />

                    <Input
                        icon={<Icon name="user" size={22} color={theme.colors.textLight} />}
                        placeholder="Nom *"
                        value={formData.lastName}
                        onChangeText={(v) => updateField('lastName', v)}
                    />

                    <Input
                        icon={<Icon name="phone" size={22} color={theme.colors.textLight} />}
                        placeholder="Téléphone"
                        keyboardType="phone-pad"
                        value={formData.phone}
                        onChangeText={(v) => updateField('phone', v)}
                    />
                </View>

                {/* Localisation */}
                <View style={[styles.section, { zIndex: 100 }]}>
                    <Text style={styles.sectionTitle}>Localisation</Text>

                    <CityAutocomplete
                        value={formData.city?.label}
                        onSelect={(city) => updateField('city', city)}
                        placeholder="Rechercher votre ville"
                    />

                    {isCandidate && (
                        <RadiusSlider
                            value={formData.searchRadius}
                            onChange={(v) => updateField('searchRadius', v)}
                        />
                    )}
                </View>

                {/* Expérience (pas pour étudiants) */}
                {!isStudent && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Expérience</Text>

                        <Input
                            icon={<Icon name="briefcase" size={22} color={theme.colors.textLight} />}
                            placeholder="Années d'expérience"
                            keyboardType="numeric"
                            value={formData.experienceYears}
                            onChangeText={(v) => updateField('experienceYears', v)}
                        />

                        <Text style={styles.label}>Spécialisations</Text>
                        <View style={styles.tagsContainer}>
                            {SPECIALIZATIONS.map((spec) => (
                                <Pressable
                                    key={spec}
                                    style={[
                                        styles.tag,
                                        formData.specializations.includes(spec) && styles.tagSelected,
                                    ]}
                                    onPress={() => toggleSpecialization(spec)}
                                >
                                    <Text style={[
                                        styles.tagText,
                                        formData.specializations.includes(spec) && styles.tagTextSelected,
                                    ]}>
                                        {spec}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}

                {/* Disponibilité (candidats) */}
                {/* Recherche (candidats) */}
                {isCandidate && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recherche</Text>

                        <ContractTypePicker
                            value={formData.contractTypes}
                            onChange={(v) => updateField('contractTypes', v)}
                            userType={user?.user_type}
                        />

                        <AvailabilityPicker
                            value={formData.availability}
                            onChange={(v) => updateField('availability', v)}
                        />

                        <RelocationToggle
                            value={formData.willingToRelocate}
                            onChange={(v) => updateField('willingToRelocate', v)}
                        />
                    </View>
                )}

                <Button
                    title="Enregistrer"
                    loading={loading}
                    onPress={handleSave}
                    buttonStyle={styles.saveButton}
                />
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: wp(5),
        paddingTop: hp(2),
        paddingBottom: hp(4),
        gap: hp(3),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: hp(2.2),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    section: {
        gap: hp(1.5),
    },
    sectionTitle: {
        fontSize: hp(2),
        color: theme.colors.text,
        fontFamily: theme.fonts.semiBold,
    },
    label: {
        fontSize: hp(1.7),
        color: theme.colors.textLight,
        marginTop: hp(0.5),
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: hp(1),
    },
    tag: {
        paddingVertical: hp(1),
        paddingHorizontal: wp(3),
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
    },
    tagSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '15',
    },
    tagText: {
        fontSize: hp(1.5),
        color: theme.colors.text,
    },
    tagTextSelected: {
        color: theme.colors.primary,
        fontFamily: theme.fonts.medium,
    },
    saveButton: {
        marginTop: hp(2),
    },
    avatarSection: {
        alignItems: 'center',
        gap: hp(1),
        marginBottom: hp(2),
    },
    avatarHint: {
        fontSize: hp(1.3),
        color: theme.colors.textLight,
    },
});