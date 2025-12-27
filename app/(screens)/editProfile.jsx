import { Alert, ScrollView, StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
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

    useEffect(() => {
        if (profile) {
            setFormData({
                firstName: profile.first_name || '',
                lastName: profile.last_name || '',
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
            });
            setAvatarUri(profile.avatar_url || null);
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
                bio: formData.bio.trim() || null,
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
                avatar_url: avatarUri,
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
            <View style={styles.container}>
                <View style={styles.header}>
                    <BackButton router={router} />
                    <Text style={styles.title}>Modifier le profil</Text>
                    <View style={{ width: 36 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Photo de profil */}
                    <View style={styles.avatarSection}>
                        <ImagePickerBox
                            value={avatarUri}
                            onChange={handleAvatarChange}
                            shape="circle"
                            size={wp(28)}
                            placeholder="Photo"
                            loading={avatarLoading}
                        />
                        <Text style={styles.avatarHint}>Touchez pour modifier</Text>
                    </View>

                    {/* Identité */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Identité</Text>
                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Input
                                    placeholder="Prénom *"
                                    value={formData.firstName}
                                    onChangeText={(v) => updateField('firstName', v)}
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <Input
                                    placeholder="Nom *"
                                    value={formData.lastName}
                                    onChangeText={(v) => updateField('lastName', v)}
                                />
                            </View>
                        </View>
                        <Input
                            icon={<Icon name="phone" size={20} color={theme.colors.textLight} />}
                            placeholder="Téléphone (optionnel)"
                            keyboardType="phone-pad"
                            value={formData.phone}
                            onChangeText={(v) => updateField('phone', v)}
                        />
                    </View>

                    {/* Bio */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Présentation</Text>
                        <Text style={styles.sectionHint}>
                            Décrivez-vous en quelques mots pour les recruteurs
                        </Text>
                        <View style={styles.bioContainer}>
                            <TextInput
                                style={styles.bioInput}
                                placeholder="Ex: Préparatrice passionnée avec 5 ans d'expérience en officine, spécialisée en dermocosmétique et conseil personnalisé..."
                                placeholderTextColor={theme.colors.textLight}
                                value={formData.bio}
                                onChangeText={(v) => updateField('bio', v)}
                                multiline
                                numberOfLines={4}
                                maxLength={500}
                                textAlignVertical="top"
                            />
                            <Text style={styles.bioCounter}>
                                {formData.bio.length}/500
                            </Text>
                        </View>
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
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Disponibilité</Text>
                            <AvailabilityPicker
                                value={formData.availability}
                                onChange={(v) => updateField('availability', v)}
                            />
                        </View>
                    )}

                    {/* Contrats recherchés */}
                    {isCandidate && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Types de contrat recherchés</Text>
                            <ContractTypePicker
                                value={formData.contractTypes}
                                onChange={(v) => updateField('contractTypes', v)}
                                isStudent={isStudent}
                            />
                        </View>
                    )}

                    {/* Expérience (pas pour étudiants) */}
                    {!isStudent && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Expérience</Text>
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
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Spécialisations</Text>
                            <Text style={styles.sectionHint}>Sélectionnez vos domaines d'expertise</Text>
                            <View style={styles.specGrid}>
                                {SPECIALIZATIONS.map((spec) => (
                                    <Pressable
                                        key={spec}
                                        style={[
                                            styles.specChip,
                                            formData.specializations.includes(spec) && styles.specChipActive,
                                        ]}
                                        onPress={() => toggleSpecialization(spec)}
                                    >
                                        <Text style={[
                                            styles.specChipText,
                                            formData.specializations.includes(spec) && styles.specChipTextActive,
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
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mobilité</Text>
                            <RelocationToggle
                                value={formData.willingToRelocate}
                                onChange={(v) => updateField('willingToRelocate', v)}
                            />
                        </View>
                    )}
                </ScrollView>

                {/* Footer fixe */}
                <View style={styles.footer}>
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
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingTop: hp(2),
        paddingBottom: hp(1),
    },
    title: {
        fontSize: hp(2),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: wp(5),
        paddingBottom: hp(4),
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: hp(2),
    },
    avatarHint: {
        fontSize: hp(1.3),
        color: theme.colors.textLight,
        marginTop: hp(1),
    },
    section: {
        marginBottom: hp(2.5),
        gap: hp(1.5),
    },
    sectionTitle: {
        fontSize: hp(1.7),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    sectionHint: {
        fontSize: hp(1.3),
        color: theme.colors.textLight,
    },
    row: {
        flexDirection: 'row',
        gap: wp(2),
    },
    halfInput: {
        flex: 1,
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
        fontFamily: theme.fonts.regular,
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
    radiusContainer: {
        marginTop: hp(1.5),
    },
    specGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(2),
    },
    specChip: {
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.8),
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    specChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    specChipText: {
        fontSize: hp(1.4),
        color: theme.colors.text,
    },
    specChipTextActive: {
        color: 'white',
        fontFamily: theme.fonts.medium,
    },
    footer: {
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
});