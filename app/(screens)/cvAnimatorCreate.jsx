import { useState, useRef } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    View,
    ScrollView,
    Pressable,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useCVs } from '../../hooks/useCVs';
import CityAutocomplete from '../../components/common/CityAutocomplete';
import {
    EMPTY_ANIMATOR_CV_STRUCTURE,
    EMPTY_BRAND_CERTIFICATION,
    getMissionTypeLabel,
    getMissionTypeIcon,
    getPharmacyTypeLabel,
    mapMissionToKeyMission,
    generateId,
} from '../../constants/cvAnimatorOptions';
import { missionService } from '../../services/missionService';
import {
    ANIMATION_SPECIALTIES,
    DAILY_RATE_RANGES,
    FRENCH_REGIONS,
} from '../../constants/profileOptions';
import {
    SOFTWARE_OPTIONS,
    LANGUAGES,
    LANGUAGE_LEVELS,
} from '../../constants/cvOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Button from '../../components/common/Button';
import Icon from '../../assets/icons/Icon';
import { cvService } from '../../services/cvService';
import CVAnimatorFormBrands from '../../components/cv/CVAnimatorFormBrands';
import CVAnimatorFormMission from '../../components/cv/CVAnimatorFormMission';
import CVFormFormation from '../../components/cv/CVFormFormation';
import CVAnimatorPreview from '../../components/cv/CVAnimatorPreview';

const STEPS = [
    { id: 'info', label: 'Infos', icon: 'fileText' },
    { id: 'expertise', label: 'Expertise', icon: 'briefcase' },
    { id: 'formations', label: 'Formations', icon: 'book' },
    { id: 'skills', label: 'Compétences', icon: 'star' },
    { id: 'tarifs', label: 'Tarifs', icon: 'dollarSign' },
    { id: 'preview', label: 'Aperçu', icon: 'eye' },
];

export default function CVAnimatorCreate() {
    const router = useRouter();
    const { session, profile } = useAuth();
    const { createCV } = useCVs(session?.user?.id);

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [expandedSection, setExpandedSection] = useState(null);
    const [cvData, setCvData] = useState({
        ...EMPTY_ANIMATOR_CV_STRUCTURE,
        contact_email: session?.user?.email || '',
        contact_phone: profile?.phone || '',
        current_city: profile?.current_city || '',
        current_region: profile?.current_region || '',
    });

    // Modals state
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [showMissionModal, setShowMissionModal] = useState(false);
    const [editingMission, setEditingMission] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingForm, setEditingForm] = useState(null);
    const [certBrand, setCertBrand] = useState('');
    const [certName, setCertName] = useState('');
    const [certYear, setCertYear] = useState('');
    // Import missions state
    const [showImportModal, setShowImportModal] = useState(false);
    const [completedMissions, setCompletedMissions] = useState([]);
    const [selectedImports, setSelectedImports] = useState([]);
    const [loadingMissions, setLoadingMissions] = useState(false);

    const scrollRef = useRef(null);

    // Navigation
    const goToStep = (index) => {
        if (index >= 0 && index < STEPS.length) {
            setCurrentStep(index);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
        }
    };
    const nextStep = () => goToStep(currentStep + 1);
    const prevStep = () => goToStep(currentStep - 1);

    // CRUD helpers
    const saveItemToArray = (field, item) => {
        setCvData(prev => {
            const arr = prev[field] || [];
            const idx = arr.findIndex(e => e.id === item.id);
            if (idx >= 0) {
                const updated = [...arr];
                updated[idx] = item;
                return { ...prev, [field]: updated };
            }
            return { ...prev, [field]: [...arr, item] };
        });
    };

    const deleteItemFromArray = (field, itemId, modalSetter, editingSetter) => {
        Alert.alert('Supprimer', 'Voulez-vous supprimer cet élément ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer', style: 'destructive',
                onPress: () => {
                    setCvData(prev => ({
                        ...prev,
                        [field]: prev[field].filter(e => e.id !== itemId),
                    }));
                    modalSetter(false);
                    editingSetter(null);
                },
            },
        ]);
    };

    const toggleArrayItem = (field, item) => {
        setCvData(prev => {
            const current = prev[field] || [];
            const updated = current.includes(item)
                ? current.filter(i => i !== item)
                : [...current, item];
            return { ...prev, [field]: updated };
        });
    };

    // Brand experience handlers
    const handleSaveBrand = (brand) => {
        saveItemToArray('brands_experience', brand);
        setShowBrandModal(false);
        setEditingBrand(null);
    };
    const handleDeleteBrand = (id) => {
        deleteItemFromArray('brands_experience', id, setShowBrandModal, setEditingBrand);
    };

    // Mission handlers
    const handleSaveMission = (mission) => {
        saveItemToArray('key_missions', mission);
        setShowMissionModal(false);
        setEditingMission(null);
    };
    const handleDeleteMission = (id) => {
        deleteItemFromArray('key_missions', id, setShowMissionModal, setEditingMission);
    };

    // Formation handlers
    const handleSaveFormation = (form) => {
        saveItemToArray('formations', form);
        setShowFormModal(false);
        setEditingForm(null);
    };
    const handleDeleteFormation = (id) => {
        deleteItemFromArray('formations', id, setShowFormModal, setEditingForm);
    };

    // Certification handlers
    const addCertification = (brand, name, year) => {
        const cert = { ...EMPTY_BRAND_CERTIFICATION, id: generateId(), brand, certification_name: name, year };
        setCvData(prev => ({
            ...prev,
            brand_certifications: [...prev.brand_certifications, cert],
        }));
    };
    const removeCertification = (id) => {
        setCvData(prev => ({
            ...prev,
            brand_certifications: prev.brand_certifications.filter(c => c.id !== id),
        }));
    };

    // Language handlers
    const addLanguage = () => {
        setCvData(prev => ({
            ...prev,
            languages: [...prev.languages, { language: '', level: 'intermediate' }],
        }));
    };
    const updateLanguage = (index, field, value) => {
        setCvData(prev => {
            const updated = [...prev.languages];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, languages: updated };
        });
    };
    const removeLanguage = (index) => {
        setCvData(prev => ({
            ...prev,
            languages: prev.languages.filter((_, i) => i !== index),
        }));
    };

    // Mission import handlers
    const handleOpenImport = async () => {
        setShowImportModal(true);
        setLoadingMissions(true);
        setSelectedImports([]);
        try {
            const missions = await missionService.getByAnimatorId(
                session?.user?.id,
                { status: 'completed' }
            );
            // Filter out already imported missions
            const existingIds = cvData.key_missions
                .map(m => m.source_mission_id)
                .filter(Boolean);
            const available = (missions || []).filter(m => !existingIds.includes(m.id));
            setCompletedMissions(available);
        } catch (err) {
            Alert.alert('Erreur', 'Impossible de charger les missions');
            setCompletedMissions([]);
        } finally {
            setLoadingMissions(false);
        }
    };

    const toggleImportSelection = (missionId) => {
        setSelectedImports(prev =>
            prev.includes(missionId)
                ? prev.filter(id => id !== missionId)
                : [...prev, missionId]
        );
    };

    const handleConfirmImport = () => {
        const toImport = completedMissions
            .filter(m => selectedImports.includes(m.id))
            .map(mapMissionToKeyMission);
        if (toImport.length > 0) {
            setCvData(prev => ({
                ...prev,
                key_missions: [...prev.key_missions, ...toImport],
            }));
        }
        setShowImportModal(false);
        setSelectedImports([]);
    };

    // Submit
    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert('Erreur', 'Veuillez donner un titre à votre CV');
            return;
        }
        const quotaCheck = await cvService.canGenerateCV(session?.user?.id);
        if (!quotaCheck.allowed) {
            Alert.alert('Limite atteinte', quotaCheck.message || 'Vous ne pouvez pas creer plus de CV.');
            return;
        }
        setLoading(true);
        try {
            const { error } = await createCV({
                title: title.trim(),
                visibility: 'public',
                structured_data: { cv_type: 'animator', ...cvData },
                has_structured_cv: true,
            });
            if (error) throw error;
            Alert.alert('Succès', 'CV créé avec succès', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (error) {
            Alert.alert('Erreur', error.message);
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // STEP 1 - INFOS
    // ============================================================
    const renderStepInfo = () => {
        const handleCitySelect = (cityData) => {
            setCvData(prev => ({
                ...prev,
                current_city: cityData.city,
                current_region: cityData.region,
            }));
        };

        return (
            <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Informations générales</Text>

                <View style={commonStyles.formGroup}>
                    <Text style={commonStyles.label}>Titre du CV *</Text>
                    <TextInput
                        style={commonStyles.input}
                        placeholder="Ex: CV Animation Dermocosmétique..."
                        placeholderTextColor={theme.colors.textLight}
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                <View style={commonStyles.formGroup}>
                    <Text style={commonStyles.label}>Spécialité d'animation *</Text>
                    <TextInput
                        style={commonStyles.input}
                        placeholder="Ex: Animatrice Dermocosmétique, Formatrice Micronutrition..."
                        placeholderTextColor={theme.colors.textLight}
                        value={cvData.specialty_title}
                        onChangeText={(v) => setCvData(prev => ({ ...prev, specialty_title: v }))}
                    />
                    <Text style={commonStyles.hint}>Ce titre apparaîtra en en-tête de votre CV</Text>
                </View>

                <View style={commonStyles.formGroup}>
                    <Text style={commonStyles.label}>Votre localisation actuelle</Text>
                    <CityAutocomplete
                        placeholder="Rechercher votre ville..."
                        onSelect={handleCitySelect}
                        initialValue={cvData.current_city}
                    />
                    {cvData.current_city && (
                        <View style={[commonStyles.card, { marginTop: hp(1) }]}>
                            <View style={commonStyles.rowGapSmall}>
                                <Icon name="mapPin" size={16} color={theme.colors.primary} />
                                <Text style={{ fontFamily: theme.fonts.medium, color: theme.colors.text }}>
                                    {cvData.current_city}
                                </Text>
                            </View>
                            <Text style={[commonStyles.hint, { marginTop: hp(0.5), marginLeft: wp(6) }]}>
                                {cvData.current_region}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={commonStyles.formGroup}>
                    <Text style={commonStyles.label}>Coordonnées de contact</Text>
                    <TextInput
                        style={[commonStyles.input, { marginTop: hp(1) }]}
                        placeholder="Email de contact (optionnel)"
                        placeholderTextColor={theme.colors.textLight}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={cvData.contact_email}
                        onChangeText={(v) => setCvData(prev => ({ ...prev, contact_email: v.trim() }))}
                    />
                    <TextInput
                        style={[commonStyles.input, { marginTop: hp(1) }]}
                        placeholder="Téléphone (optionnel)"
                        placeholderTextColor={theme.colors.textLight}
                        keyboardType="phone-pad"
                        value={cvData.contact_phone}
                        onChangeText={(v) => setCvData(prev => ({ ...prev, contact_phone: v }))}
                    />
                </View>

                {/* Toggles de visibilité individuels */}
                <View style={commonStyles.formGroup}>
                    <Text style={commonStyles.label}>Visibilité sur le CV</Text>
                    <Text style={commonStyles.hint}>Choisissez ce qui sera visible par les recruteurs</Text>

                    <View style={styles.toggleItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.toggleLabel}>Photo de profil</Text>
                            <Text style={styles.toggleHint}>
                                Afficher votre photo sur le CV (sinon visible uniquement après match)
                            </Text>
                        </View>
                        <Switch
                            value={cvData.show_photo}
                            onValueChange={(v) => setCvData(prev => ({ ...prev, show_photo: v }))}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
                            thumbColor={cvData.show_photo ? theme.colors.primary : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.toggleItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.toggleLabel}>Rating PharmaLink</Text>
                            <Text style={styles.toggleHint}>
                                Afficher votre note et nombre de missions complétées
                            </Text>
                        </View>
                        <Switch
                            value={cvData.show_rating}
                            onValueChange={(v) => setCvData(prev => ({ ...prev, show_rating: v }))}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
                            thumbColor={cvData.show_rating ? theme.colors.primary : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.toggleItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.toggleLabel}>Coordonnées</Text>
                            <Text style={styles.toggleHint}>
                                Afficher email et téléphone (sinon visibles uniquement après match)
                            </Text>
                        </View>
                        <Switch
                            value={cvData.show_contact}
                            onValueChange={(v) => setCvData(prev => ({ ...prev, show_contact: v }))}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
                            thumbColor={cvData.show_contact ? theme.colors.primary : '#f4f3f4'}
                        />
                    </View>
                </View>

                <View style={commonStyles.formGroup}>
                    <Text style={commonStyles.label}>Résumé / À propos</Text>
                    <TextInput
                        style={[commonStyles.textArea, styles.textAreaLarge]}
                        placeholder="Présentez-vous : parcours, spécialités, ce que vous apportez aux marques et pharmacies..."
                        placeholderTextColor={theme.colors.textLight}
                        value={cvData.summary}
                        onChangeText={(v) => setCvData(prev => ({ ...prev, summary: v }))}
                        multiline
                        numberOfLines={5}
                        maxLength={500}
                    />
                    <Text style={styles.charCount}>{cvData.summary?.length || 0}/500</Text>
                </View>
            </View>
        );
    };

    // ============================================================
    // STEP 2 - EXPERTISE (Brands + Missions)
    // ============================================================
    const renderStepExpertise = () => (
        <View style={styles.stepContent}>
            {/* Brands section */}
            <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Marques & Laboratoires</Text>
                <Pressable
                    style={styles.addButton}
                    onPress={() => { setEditingBrand(null); setShowBrandModal(true); }}
                >
                    <Icon name="plus" size={20} color="white" />
                </Pressable>
            </View>
            <Text style={commonStyles.hint}>Résumé de votre expérience par marque</Text>

            {cvData.brands_experience.length === 0 ? (
                <View style={styles.emptyState}>
                    <Icon name="award" size={40} color={theme.colors.gray} />
                    <Text style={commonStyles.emptyText}>Aucune marque ajoutée</Text>
                    <Pressable
                        style={styles.emptyButton}
                        onPress={() => { setEditingBrand(null); setShowBrandModal(true); }}
                    >
                        <Text style={styles.emptyButtonText}>Ajouter une marque</Text>
                    </Pressable>
                </View>
            ) : (
                <View style={styles.itemsList}>
                    {cvData.brands_experience.map((brand) => (
                        <Pressable
                            key={brand.id}
                            style={commonStyles.listItem}
                            onPress={() => { setEditingBrand(brand); setShowBrandModal(true); }}
                        >
                            <View style={styles.itemIcon}>
                                <Icon name="award" size={20} color={theme.colors.primary} />
                            </View>
                            <View style={commonStyles.listItemContent}>
                                <Text style={commonStyles.listItemTitle}>{brand.brand}</Text>
                                <Text style={styles.itemSubtitle}>
                                    {brand.years ? `${brand.years} an${brand.years > 1 ? 's' : ''}` : ''}
                                    {brand.years && brand.mission_count ? ' - ' : ''}
                                    {brand.mission_count || ''}
                                </Text>
                                {brand.specialties?.length > 0 && (
                                    <Text style={commonStyles.listItemSubtitle} numberOfLines={1}>
                                        {brand.specialties.join(', ')}
                                    </Text>
                                )}
                            </View>
                            <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
                        </Pressable>
                    ))}
                </View>
            )}

            {/* Missions section */}
            <View style={[styles.stepHeader, { marginTop: hp(4) }]}>
                <Text style={styles.stepTitle}>Missions marquantes</Text>
                <View style={{ flexDirection: 'row', gap: wp(2) }}>
                    <Pressable
                        style={styles.importButton}
                        onPress={handleOpenImport}
                    >
                        <Icon name="download" size={16} color={theme.colors.primary} />
                        <Text style={styles.importButtonText}>Importer</Text>
                    </Pressable>
                    <Pressable
                        style={styles.addButton}
                        onPress={() => { setEditingMission(null); setShowMissionModal(true); }}
                    >
                        <Icon name="plus" size={20} color="white" />
                    </Pressable>
                </View>
            </View>
            <Text style={commonStyles.hint}>Détaillez vos missions les plus significatives</Text>

            {cvData.key_missions.length === 0 ? (
                <View style={styles.emptyState}>
                    <Icon name="star" size={40} color={theme.colors.gray} />
                    <Text style={commonStyles.emptyText}>Aucune mission ajoutée</Text>
                    <Pressable
                        style={styles.emptyButton}
                        onPress={() => { setEditingMission(null); setShowMissionModal(true); }}
                    >
                        <Text style={styles.emptyButtonText}>Ajouter une mission</Text>
                    </Pressable>
                </View>
            ) : (
                <View style={styles.itemsList}>
                    {cvData.key_missions.map((mission) => (
                        <Pressable
                            key={mission.id}
                            style={commonStyles.listItem}
                            onPress={() => { setEditingMission(mission); setShowMissionModal(true); }}
                        >
                            <View style={[styles.itemIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
                                <Icon
                                    name={getMissionTypeIcon(mission.mission_type)}
                                    size={20}
                                    color={theme.colors.secondary}
                                />
                            </View>
                            <View style={commonStyles.listItemContent}>
                                <Text style={commonStyles.listItemTitle}>
                                    {getMissionTypeLabel(mission.mission_type)} - {mission.brand}
                                </Text>
                                <Text style={styles.itemSubtitle}>
                                    {mission.city || ''}{mission.city && mission.date ? ' - ' : ''}{mission.date || ''}
                                </Text>
                                {mission.pharmacy_type && (
                                    <Text style={commonStyles.listItemSubtitle}>
                                        {getPharmacyTypeLabel(mission.pharmacy_type)}
                                    </Text>
                                )}
                            </View>
                            <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );

    // ============================================================
    // STEP 3 - FORMATIONS
    // ============================================================
    const renderStepFormations = () => {
        return (
            <View style={styles.stepContent}>
                {/* Formations académiques */}
                <View style={styles.stepHeader}>
                    <Text style={styles.stepTitle}>Formations</Text>
                    <Pressable
                        style={styles.addButton}
                        onPress={() => { setEditingForm(null); setShowFormModal(true); }}
                    >
                        <Icon name="plus" size={20} color="white" />
                    </Pressable>
                </View>

                {cvData.formations.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="book" size={40} color={theme.colors.gray} />
                        <Text style={commonStyles.emptyText}>Aucune formation ajoutée</Text>
                        <Pressable
                            style={styles.emptyButton}
                            onPress={() => { setEditingForm(null); setShowFormModal(true); }}
                        >
                            <Text style={styles.emptyButtonText}>Ajouter une formation</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.itemsList}>
                        {cvData.formations.map((form) => (
                            <Pressable
                                key={form.id}
                                style={commonStyles.listItem}
                                onPress={() => { setEditingForm(form); setShowFormModal(true); }}
                            >
                                <View style={[styles.itemIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
                                    <Icon name="book" size={20} color={theme.colors.secondary} />
                                </View>
                                <View style={commonStyles.listItemContent}>
                                    <Text style={commonStyles.listItemTitle}>{form.diploma_name || form.diploma_type}</Text>
                                    <Text style={styles.itemSubtitle}>{form.school_name || 'Établissement non renseigné'}</Text>
                                    <Text style={commonStyles.listItemSubtitle}>{form.year}</Text>
                                </View>
                                <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
                            </Pressable>
                        ))}
                    </View>
                )}

                {/* Certifications marque */}
                <View style={[styles.stepHeader, { marginTop: hp(4) }]}>
                    <Text style={styles.stepTitle}>Certifications marques</Text>
                </View>
                <Text style={commonStyles.hint}>Formations dispensées par les laboratoires</Text>

                {cvData.brand_certifications.length > 0 && (
                    <View style={[styles.itemsList, { marginTop: hp(1) }]}>
                        {cvData.brand_certifications.map((cert) => (
                            <View key={cert.id} style={styles.certItem}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.certBrand}>{cert.brand}</Text>
                                    <Text style={styles.certName}>{cert.certification_name}</Text>
                                    {cert.year && <Text style={styles.certYear}>{cert.year}</Text>}
                                </View>
                                <Pressable onPress={() => removeCertification(cert.id)}>
                                    <Icon name="x" size={18} color={theme.colors.textLight} />
                                </Pressable>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.certForm}>
                    <TextInput
                        style={[commonStyles.input, { marginBottom: hp(1) }]}
                        placeholder="Marque / Labo"
                        placeholderTextColor={theme.colors.textLight}
                        value={certBrand}
                        onChangeText={setCertBrand}
                    />
                    <TextInput
                        style={[commonStyles.input, { marginBottom: hp(1) }]}
                        placeholder="Nom de la certification"
                        placeholderTextColor={theme.colors.textLight}
                        value={certName}
                        onChangeText={setCertName}
                    />
                    <View style={styles.certFormRow}>
                        <TextInput
                            style={[commonStyles.input, { flex: 1 }]}
                            placeholder="Année"
                            placeholderTextColor={theme.colors.textLight}
                            value={certYear}
                            onChangeText={setCertYear}
                            keyboardType="numeric"
                            maxLength={4}
                        />
                        <Pressable
                            style={styles.certAddButton}
                            onPress={() => {
                                if (!certBrand.trim() || !certName.trim()) {
                                    Alert.alert('Erreur', 'Renseignez la marque et le nom de la certification');
                                    return;
                                }
                                addCertification(certBrand.trim(), certName.trim(), certYear ? parseInt(certYear) : null);
                                setCertBrand('');
                                setCertName('');
                                setCertYear('');
                            }}
                        >
                            <Icon name="plus" size={20} color="white" />
                            <Text style={styles.certAddButtonText}>Ajouter</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    };

    // ============================================================
    // STEP 4 - COMPÉTENCES
    // ============================================================
    const renderStepSkills = () => {
        const toggleSection = (section) => {
            setExpandedSection(expandedSection === section ? null : section);
        };

        const renderAccordion = (id, titleText, icon, content, selectedItems = []) => {
            const isExpanded = expandedSection === id;
            const hasSelection = selectedItems.length > 0;

            return (
                <View style={commonStyles.accordionContainer}>
                    <Pressable
                        style={[commonStyles.accordionHeader, isExpanded && commonStyles.accordionHeaderExpanded]}
                        onPress={() => toggleSection(id)}
                    >
                        <View style={commonStyles.accordionTitleRow}>
                            <Icon name={icon} size={20} color={theme.colors.primary} />
                            <Text style={commonStyles.accordionTitle}>{titleText}</Text>
                            {hasSelection && (
                                <View style={commonStyles.accordionBadge}>
                                    <Text style={commonStyles.accordionBadgeText}>{selectedItems.length}</Text>
                                </View>
                            )}
                        </View>
                        <Icon
                            name={isExpanded ? 'chevronUp' : 'chevronDown'}
                            size={20}
                            color={theme.colors.textLight}
                        />
                    </Pressable>

                    {!isExpanded && hasSelection && (
                        <View style={styles.accordionPreview}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.previewChips}>
                                    {selectedItems.slice(0, 5).map((item, index) => (
                                        <View key={index} style={styles.previewChip}>
                                            <Text style={styles.previewChipText} numberOfLines={1}>
                                                {typeof item === 'object' ? item.label || item.language : item}
                                            </Text>
                                        </View>
                                    ))}
                                    {selectedItems.length > 5 && (
                                        <Text style={styles.previewMore}>+{selectedItems.length - 5}</Text>
                                    )}
                                </View>
                            </ScrollView>
                        </View>
                    )}

                    {isExpanded && (
                        <View style={commonStyles.accordionContent}>
                            {content}
                        </View>
                    )}
                </View>
            );
        };

        return (
            <ScrollView
                style={styles.stepContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: hp(4) }}
            >
                <Text style={styles.stepTitle}>Compétences & Qualifications</Text>
                <Text style={commonStyles.hint}>Touchez une section pour la développer</Text>

                {/* Animation specialties */}
                {renderAccordion(
                    'specialties',
                    'Spécialités d\'animation',
                    'star',
                    <View style={commonStyles.chipsContainer}>
                        {ANIMATION_SPECIALTIES.map((spec) => (
                            <Pressable
                                key={spec.value}
                                style={[
                                    commonStyles.chip,
                                    cvData.animation_specialties?.includes(spec.value) && commonStyles.chipActive,
                                ]}
                                onPress={() => toggleArrayItem('animation_specialties', spec.value)}
                            >
                                <Text style={[
                                    commonStyles.chipText,
                                    cvData.animation_specialties?.includes(spec.value) && commonStyles.chipTextActive,
                                ]}>
                                    {spec.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>,
                    (cvData.animation_specialties || []).map(v => {
                        const s = ANIMATION_SPECIALTIES.find(s => s.value === v);
                        return s || { label: v };
                    })
                )}

                {/* Software */}
                {renderAccordion(
                    'software',
                    'Logiciels',
                    'laptop',
                    <View style={commonStyles.chipsContainer}>
                        {SOFTWARE_OPTIONS.map((soft) => (
                            <Pressable
                                key={soft.value}
                                style={[
                                    commonStyles.chip,
                                    cvData.software?.includes(soft.label) && commonStyles.chipActiveSecondary,
                                ]}
                                onPress={() => toggleArrayItem('software', soft.label)}
                            >
                                <Text style={[
                                    commonStyles.chipText,
                                    cvData.software?.includes(soft.label) && commonStyles.chipTextActive,
                                ]}>
                                    {soft.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>,
                    cvData.software || []
                )}

                {/* Languages */}
                {renderAccordion(
                    'languages',
                    'Langues',
                    'globe',
                    <View style={styles.languagesContainer}>
                        {cvData.languages.map((lang, index) => (
                            <View key={index} style={styles.languageCard}>
                                <View style={commonStyles.rowBetween}>
                                    <Text style={styles.languageNumber}>Langue {index + 1}</Text>
                                    {index > 0 && (
                                        <Pressable onPress={() => removeLanguage(index)}>
                                            <Icon name="trash" size={16} color={theme.colors.rose} />
                                        </Pressable>
                                    )}
                                </View>

                                <Text style={commonStyles.labelSmall}>Langue</Text>
                                <View style={commonStyles.chipsContainerCompact}>
                                    {LANGUAGES.map((l) => (
                                        <Pressable
                                            key={l.value}
                                            style={[
                                                commonStyles.chipSmall,
                                                lang.language === l.value && commonStyles.chipActive,
                                            ]}
                                            onPress={() => updateLanguage(index, 'language', l.value)}
                                        >
                                            <Text style={[
                                                commonStyles.chipTextSmall,
                                                lang.language === l.value && commonStyles.chipTextActive,
                                            ]}>
                                                {l.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>

                                <Text style={commonStyles.labelSmall}>Niveau</Text>
                                <View style={commonStyles.chipsContainerCompact}>
                                    {LANGUAGE_LEVELS.map((level) => (
                                        <Pressable
                                            key={level.value}
                                            style={[
                                                commonStyles.chipSmall,
                                                lang.level === level.value && commonStyles.chipActiveSecondary,
                                            ]}
                                            onPress={() => updateLanguage(index, 'level', level.value)}
                                        >
                                            <Text style={[
                                                commonStyles.chipTextSmall,
                                                lang.level === level.value && commonStyles.chipTextActive,
                                            ]}>
                                                {level.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        ))}
                        <Pressable style={commonStyles.buttonOutline} onPress={addLanguage}>
                            <Text style={commonStyles.buttonOutlineText}>+ Ajouter une langue</Text>
                        </Pressable>
                    </View>,
                    cvData.languages || []
                )}
            </ScrollView>
        );
    };

    // ============================================================
    // STEP 5 - TARIFS & MOBILITÉ
    // ============================================================
    const renderStepTarifs = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Tarifs & Mobilité</Text>

            {/* Daily rate */}
            <View style={commonStyles.formGroup}>
                <Text style={commonStyles.label}>Tarif journalier (TJM)</Text>
                <Text style={commonStyles.hint}>Fourchette indicative pour les recruteurs</Text>
                <View style={commonStyles.chipsContainer}>
                    {DAILY_RATE_RANGES.map((range) => {
                        const isSelected =
                            cvData.daily_rate_min === range.min && cvData.daily_rate_max === range.max;
                        return (
                            <Pressable
                                key={range.label}
                                style={[commonStyles.chip, isSelected && commonStyles.chipActive]}
                                onPress={() => {
                                    if (isSelected) {
                                        setCvData(prev => ({ ...prev, daily_rate_min: null, daily_rate_max: null }));
                                    } else {
                                        setCvData(prev => ({ ...prev, daily_rate_min: range.min, daily_rate_max: range.max }));
                                    }
                                }}
                            >
                                <Text style={[commonStyles.chipText, isSelected && commonStyles.chipTextActive]}>
                                    {range.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            {/* Mobility zones */}
            <View style={commonStyles.formGroup}>
                <Text style={commonStyles.label}>Zones de mobilité</Text>
                <Text style={commonStyles.hint}>Régions où vous êtes disponible</Text>
                <View style={commonStyles.chipsContainer}>
                    {FRENCH_REGIONS.map((region) => {
                        const isSelected = cvData.mobility_zones?.includes(region);
                        return (
                            <Pressable
                                key={region}
                                style={[commonStyles.chip, isSelected && commonStyles.chipActiveSecondary]}
                                onPress={() => toggleArrayItem('mobility_zones', region)}
                            >
                                <Text style={[commonStyles.chipText, isSelected && commonStyles.chipTextActive]}>
                                    {region}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            {/* Vehicle */}
            <View style={commonStyles.formGroup}>
                <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={commonStyles.label}>Véhicule personnel</Text>
                        <Text style={commonStyles.hint}>Vous disposez d'un véhicule pour vos déplacements</Text>
                    </View>
                    <Switch
                        value={cvData.has_vehicle}
                        onValueChange={(v) => setCvData(prev => ({ ...prev, has_vehicle: v }))}
                        trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
                        thumbColor={cvData.has_vehicle ? theme.colors.primary : '#f4f3f4'}
                    />
                </View>
            </View>

        </View>
    );

    // ============================================================
    // STEP 6 - PREVIEW
    // ============================================================
    const renderStepPreview = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Aperçu de votre CV</Text>
            <CVAnimatorPreview
                structuredData={cvData}
                profile={profile}
                showToggle={true}
                style={commonStyles.flex1}
            />
        </View>
    );

    // ============================================================
    // RENDER
    // ============================================================
    const renderCurrentStep = () => {
        switch (STEPS[currentStep].id) {
            case 'info': return renderStepInfo();
            case 'expertise': return renderStepExpertise();
            case 'formations': return renderStepFormations();
            case 'skills': return renderStepSkills();
            case 'tarifs': return renderStepTarifs();
            case 'preview': return renderStepPreview();
            default: return null;
        }
    };

    return (
        <ScreenWrapper bg={theme.colors.background}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                style={commonStyles.flex1}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={commonStyles.headerNoBorder}>
                    <BackButton router={router} />
                    <Text style={styles.headerTitle}>CV Animateur</Text>
                    <View style={commonStyles.headerSpacer} />
                </View>

                <View style={styles.stepsIndicator}>
                    {STEPS.map((step, index) => (
                        <Pressable
                            key={step.id}
                            style={[
                                styles.stepDot,
                                index === currentStep && styles.stepDotActive,
                                index < currentStep && styles.stepDotCompleted,
                            ]}
                            onPress={() => goToStep(index)}
                        >
                            <Icon
                                name={step.icon}
                                size={14}
                                color={index <= currentStep ? 'white' : theme.colors.textLight}
                            />
                        </Pressable>
                    ))}
                </View>

                <ScrollView
                    ref={scrollRef}
                    style={commonStyles.flex1}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {renderCurrentStep()}
                </ScrollView>

                <View style={styles.footerNav}>
                    {currentStep > 0 && (
                        <Pressable style={styles.prevButton} onPress={prevStep}>
                            <Icon name="arrowLeft" size={20} color={theme.colors.text} />
                            <Text style={styles.prevButtonText}>Retour</Text>
                        </Pressable>
                    )}

                    {currentStep < STEPS.length - 1 ? (
                        <Pressable style={styles.nextButton} onPress={nextStep}>
                            <Text style={styles.nextButtonText}>Suivant</Text>
                            <Icon name="arrowRight" size={20} color="white" />
                        </Pressable>
                    ) : (
                        <Button
                            title="Enregistrer le CV"
                            loading={loading}
                            onPress={handleSubmit}
                            buttonStyle={commonStyles.flex1}
                        />
                    )}
                </View>

                {/* Brand experience modal */}
                <Modal
                    visible={showBrandModal}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => { setShowBrandModal(false); setEditingBrand(null); }}
                >
                    <CVAnimatorFormBrands
                        brandExperience={editingBrand}
                        onSave={handleSaveBrand}
                        onCancel={() => { setShowBrandModal(false); setEditingBrand(null); }}
                        onDelete={editingBrand ? handleDeleteBrand : undefined}
                    />
                </Modal>

                {/* Mission modal */}
                <Modal
                    visible={showMissionModal}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => { setShowMissionModal(false); setEditingMission(null); }}
                >
                    <CVAnimatorFormMission
                        mission={editingMission}
                        onSave={handleSaveMission}
                        onCancel={() => { setShowMissionModal(false); setEditingMission(null); }}
                        onDelete={editingMission ? handleDeleteMission : undefined}
                    />
                </Modal>

                {/* Formation modal */}
                <Modal
                    visible={showFormModal}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => { setShowFormModal(false); setEditingForm(null); }}
                >
                    <CVFormFormation
                        formation={editingForm}
                        onSave={handleSaveFormation}
                        onCancel={() => { setShowFormModal(false); setEditingForm(null); }}
                        onDelete={editingForm ? handleDeleteFormation : undefined}
                    />
                </Modal>

                {/* Import missions modal */}
                <Modal
                    visible={showImportModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowImportModal(false)}
                >
                    <Pressable
                        style={styles.importOverlay}
                        onPress={() => setShowImportModal(false)}
                    >
                        <View style={styles.importContainer} onStartShouldSetResponder={() => true}>
                            <View style={styles.importHeader}>
                                <Text style={styles.importTitle}>Importer des missions</Text>
                                <Pressable onPress={() => setShowImportModal(false)}>
                                    <Icon name="x" size={24} color={theme.colors.text} />
                                </Pressable>
                            </View>

                            {loadingMissions ? (
                                <View style={styles.importLoading}>
                                    <ActivityIndicator size="large" color={theme.colors.primary} />
                                    <Text style={commonStyles.hint}>Chargement des missions...</Text>
                                </View>
                            ) : completedMissions.length === 0 ? (
                                <View style={styles.importLoading}>
                                    <Icon name="checkCircle" size={40} color={theme.colors.gray} />
                                    <Text style={commonStyles.emptyText}>
                                        Aucune mission disponible à importer
                                    </Text>
                                    <Text style={commonStyles.hint}>
                                        Vos missions complétées apparaîtront ici
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <Text style={[commonStyles.hint, { paddingHorizontal: wp(4), marginBottom: hp(1) }]}>
                                        Sélectionnez les missions à ajouter à votre CV
                                    </Text>
                                    <ScrollView style={styles.importList}>
                                        {completedMissions.map((mission) => {
                                            const isSelected = selectedImports.includes(mission.id);
                                            const brandName = mission.client_profile?.brand_name
                                                || mission.client_profile?.company_name
                                                || [mission.client_profile?.first_name, mission.client_profile?.last_name].filter(Boolean).join(' ')
                                                || 'Client';
                                            return (
                                                <Pressable
                                                    key={mission.id}
                                                    style={[styles.importItem, isSelected && styles.importItemSelected]}
                                                    onPress={() => toggleImportSelection(mission.id)}
                                                >
                                                    <View style={[
                                                        styles.importCheckbox,
                                                        isSelected && styles.importCheckboxActive,
                                                    ]}>
                                                        {isSelected && (
                                                            <Icon name="check" size={14} color="white" />
                                                        )}
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.importItemTitle}>
                                                            {getMissionTypeLabel(mission.mission_type)} - {brandName}
                                                        </Text>
                                                        <Text style={styles.importItemSubtitle}>
                                                            {mission.city || ''}{mission.city && mission.start_date ? ' - ' : ''}
                                                            {mission.start_date ? new Date(mission.start_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : ''}
                                                        </Text>
                                                        {mission.title && (
                                                            <Text style={styles.importItemDesc} numberOfLines={1}>
                                                                {mission.title}
                                                            </Text>
                                                        )}
                                                    </View>
                                                </Pressable>
                                            );
                                        })}
                                    </ScrollView>
                                    <View style={styles.importFooter}>
                                        <Text style={commonStyles.hint}>
                                            {selectedImports.length} mission{selectedImports.length > 1 ? 's' : ''} sélectionnée{selectedImports.length > 1 ? 's' : ''}
                                        </Text>
                                        <Pressable
                                            style={[
                                                styles.importConfirmButton,
                                                selectedImports.length === 0 && { opacity: 0.5 },
                                            ]}
                                            onPress={handleConfirmImport}
                                            disabled={selectedImports.length === 0}
                                        >
                                            <Text style={styles.importConfirmText}>Importer</Text>
                                        </Pressable>
                                    </View>
                                </>
                            )}
                        </View>
                    </Pressable>
                </Modal>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    headerTitle: {
        fontSize: hp(2),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    stepsIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: wp(3),
        paddingVertical: hp(1.5),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    stepDot: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: theme.colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    stepDotActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    stepDotCompleted: {
        backgroundColor: theme.colors.primary + '80',
        borderColor: theme.colors.primary + '80',
    },
    stepContent: {
        flex: 1,
        padding: wp(5),
    },
    stepHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(0.5),
    },
    stepTitle: {
        fontSize: hp(2),
        fontFamily: theme.fonts.bold,
        color: theme.colors.text,
        marginBottom: hp(1),
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textAreaLarge: {
        minHeight: hp(12),
    },
    charCount: {
        fontSize: hp(1.2),
        color: theme.colors.textLight,
        textAlign: 'right',
        marginTop: hp(0.5),
    },
    // Visibility toggles
    toggleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(3),
        backgroundColor: theme.colors.card,
        padding: hp(1.5),
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginTop: hp(1),
    },
    toggleLabel: {
        fontSize: hp(1.5),
        fontFamily: theme.fonts.medium,
        color: theme.colors.text,
    },
    toggleHint: {
        fontSize: hp(1.2),
        color: theme.colors.textLight,
        marginTop: hp(0.3),
    },
    // Import button
    importButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
        paddingHorizontal: wp(3),
        paddingVertical: hp(1),
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.primary + '15',
        borderWidth: 1,
        borderColor: theme.colors.primary + '30',
    },
    importButtonText: {
        fontSize: hp(1.3),
        fontFamily: theme.fonts.medium,
        color: theme.colors.primary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(4),
        gap: hp(1),
    },
    emptyButton: {
        marginTop: hp(1),
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        backgroundColor: theme.colors.primary + '15',
        borderRadius: theme.radius.lg,
    },
    emptyButtonText: {
        fontSize: hp(1.5),
        color: theme.colors.primary,
        fontFamily: theme.fonts.medium,
    },
    itemsList: {
        gap: hp(1.5),
        marginTop: hp(1),
    },
    itemIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemSubtitle: {
        fontSize: hp(1.4),
        color: theme.colors.primary,
    },
    // Certifications
    certItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        padding: hp(1.5),
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    certBrand: {
        fontSize: hp(1.5),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.primary,
    },
    certName: {
        fontSize: hp(1.4),
        color: theme.colors.text,
    },
    certYear: {
        fontSize: hp(1.3),
        color: theme.colors.textLight,
    },
    certForm: {
        marginTop: hp(2),
        padding: hp(1.5),
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    certFormRow: {
        flexDirection: 'row',
        gap: wp(2),
        alignItems: 'center',
    },
    certAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
        backgroundColor: theme.colors.primary,
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        borderRadius: theme.radius.lg,
    },
    certAddButtonText: {
        fontSize: hp(1.4),
        fontFamily: theme.fonts.medium,
        color: 'white',
    },
    // Accordion
    accordionPreview: {
        paddingHorizontal: hp(2),
        paddingBottom: hp(1.5),
    },
    previewChips: {
        flexDirection: 'row',
        gap: wp(1.5),
    },
    previewChip: {
        backgroundColor: theme.colors.primary + '15',
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.4),
        borderRadius: theme.radius.sm,
        maxWidth: wp(25),
    },
    previewChipText: {
        fontSize: hp(1.2),
        color: theme.colors.primary,
    },
    previewMore: {
        fontSize: hp(1.2),
        color: theme.colors.textLight,
        alignSelf: 'center',
    },
    // Languages
    languagesContainer: {
        gap: hp(1.5),
    },
    languageCard: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.lg,
        padding: hp(1.5),
        gap: hp(1),
    },
    languageNumber: {
        fontSize: hp(1.4),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    // Switch row
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(3),
    },
    // Footer nav
    footerNav: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    prevButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
    },
    prevButtonText: {
        fontSize: hp(1.6),
        fontFamily: theme.fonts.medium,
        color: theme.colors.text,
    },
    nextButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(2),
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.xl,
        paddingVertical: hp(1.5),
    },
    nextButtonText: {
        fontSize: hp(1.6),
        fontFamily: theme.fonts.semiBold,
        color: 'white',
    },
    // Import modal
    importOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    importContainer: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: theme.radius.xxl,
        borderTopRightRadius: theme.radius.xxl,
        maxHeight: '75%',
        paddingBottom: hp(4),
    },
    importHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    importTitle: {
        fontSize: hp(1.8),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    importLoading: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(6),
        gap: hp(1.5),
    },
    importList: {
        maxHeight: hp(40),
        paddingHorizontal: wp(4),
    },
    importItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(3),
        padding: hp(1.5),
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: hp(1),
    },
    importItemSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '08',
    },
    importCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    importCheckboxActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    importItemTitle: {
        fontSize: hp(1.5),
        fontFamily: theme.fonts.medium,
        color: theme.colors.text,
    },
    importItemSubtitle: {
        fontSize: hp(1.3),
        color: theme.colors.primary,
        marginTop: hp(0.2),
    },
    importItemDesc: {
        fontSize: hp(1.2),
        color: theme.colors.textLight,
        marginTop: hp(0.2),
    },
    importFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingTop: hp(1.5),
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    importConfirmButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: wp(5),
        paddingVertical: hp(1.2),
        borderRadius: theme.radius.lg,
    },
    importConfirmText: {
        fontSize: hp(1.5),
        fontFamily: theme.fonts.semiBold,
        color: 'white',
    },
});
