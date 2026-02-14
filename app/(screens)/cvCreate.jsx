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
    EMPTY_CV_STRUCTURE,
    ALL_SKILLS,
    SOFTWARE_OPTIONS,
    CERTIFICATIONS,
    LANGUAGES,
    LANGUAGE_LEVELS,
    generateId,
} from '../../constants/cvOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Button from '../../components/common/Button';
import Icon from '../../assets/icons/Icon';
import { cvService } from '../../services/cvService';
import CVFormExperience from '../../components/cv/CVFormExperience';
import CVFormFormation from '../../components/cv/CVFormFormation';
import CVPreview from '../../components/cv/CVPreview';

const STEPS = [
    { id: 'info', label: 'Infos', icon: 'fileText' },
    { id: 'experiences', label: 'Expériences', icon: 'briefcase' },
    { id: 'formations', label: 'Formations', icon: 'book' },
    { id: 'skills', label: 'Compétences', icon: 'star' },
    { id: 'preview', label: 'Aperçu', icon: 'eye' },
];

export default function CVCreate() {
    const router = useRouter();
    const { session, profile } = useAuth();
    const { createCV } = useCVs(session?.user?.id);

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [expandedSection, setExpandedSection] = useState(null);
    const [visibility, setVisibility] = useState('anonymous');
    const [cvData, setCvData] = useState({
        ...EMPTY_CV_STRUCTURE,
        contact_email: session?.user?.email || '',
        contact_phone: profile?.phone || '',
        current_city: '',
        current_region: '',
    });

    const [showExpModal, setShowExpModal] = useState(false);
    const [editingExp, setEditingExp] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingForm, setEditingForm] = useState(null);

    const scrollRef = useRef(null);

    const goToStep = (index) => {
        if (index >= 0 && index < STEPS.length) {
            setCurrentStep(index);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
        }
    };

    const nextStep = () => goToStep(currentStep + 1);
    const prevStep = () => goToStep(currentStep - 1);

    const handleSaveExperience = (exp) => {
        setCvData(prev => {
            const existing = prev.experiences.findIndex(e => e.id === exp.id);
            if (existing >= 0) {
                const updated = [...prev.experiences];
                updated[existing] = exp;
                return { ...prev, experiences: updated };
            }
            return { ...prev, experiences: [...prev.experiences, exp] };
        });
        setShowExpModal(false);
        setEditingExp(null);
    };

    const handleDeleteExperience = (expId) => {
        Alert.alert(
            'Supprimer',
            'Voulez-vous supprimer cette expérience ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => {
                        setCvData(prev => ({
                            ...prev,
                            experiences: prev.experiences.filter(e => e.id !== expId),
                        }));
                        setShowExpModal(false);
                        setEditingExp(null);
                    }
                },
            ]
        );
    };

    const handleSaveFormation = (form) => {
        setCvData(prev => {
            const existing = prev.formations.findIndex(f => f.id === form.id);
            if (existing >= 0) {
                const updated = [...prev.formations];
                updated[existing] = form;
                return { ...prev, formations: updated };
            }
            return { ...prev, formations: [...prev.formations, form] };
        });
        setShowFormModal(false);
        setEditingForm(null);
    };

    const handleDeleteFormation = (formId) => {
        Alert.alert(
            'Supprimer',
            'Voulez-vous supprimer cette formation ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => {
                        setCvData(prev => ({
                            ...prev,
                            formations: prev.formations.filter(f => f.id !== formId),
                        }));
                        setShowFormModal(false);
                        setEditingForm(null);
                    }
                },
            ]
        );
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
                visibility,
                structured_data: cvData,
                has_structured_cv: true,
            });

            if (error) throw error;

            Alert.alert('Succès', 'CV créé avec succès', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert('Erreur', error.message);
        } finally {
            setLoading(false);
        }
    };

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
                        placeholder="Ex: CV Officine, CV Temps partiel..."
                        placeholderTextColor={theme.colors.textLight}
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                <View style={commonStyles.formGroup}>
                    <Text style={commonStyles.label}>Profession recherchée *</Text>
                    <TextInput
                        style={commonStyles.input}
                        placeholder="Ex: Préparateur en pharmacie, Pharmacien adjoint..."
                        placeholderTextColor={theme.colors.textLight}
                        value={cvData.profession_title}
                        onChangeText={(v) => setCvData(prev => ({ ...prev, profession_title: v }))}
                    />
                    <Text style={commonStyles.hint}>Ce titre apparaîtra en en-tête de votre CV</Text>
                </View>

                <View style={[commonStyles.formGroup, { zIndex: 100 }]}>
                    <Text style={commonStyles.label}>Votre localisation *</Text>
                    <CityAutocomplete
                        placeholder="Rechercher une ville..."
                        onSelect={handleCitySelect}
                        value={cvData.current_city && cvData.current_region
                            ? `${cvData.current_city} - ${cvData.current_region}`
                            : ''}
                    />

                    {profile?.current_city && (
                        <Pressable
                            style={styles.quickSelectButton}
                            onPress={() => {
                                setCvData(prev => ({
                                    ...prev,
                                    current_city: profile.current_city,
                                    current_region: profile.current_region,
                                }));
                            }}
                        >
                            <Icon name="mapPin" size={16} color={theme.colors.primary} />
                            <Text style={styles.quickSelectText}>
                                Utiliser ma ville actuelle ({profile.current_city})
                            </Text>
                        </Pressable>
                    )}

                    <Text style={[commonStyles.hint, { marginTop: hp(1) }]}>En mode anonyme, seule la région sera visible</Text>
                </View>

                {/* Coordonnées de contact (pour version complète du CV) */}
                <View style={commonStyles.formGroup}>
                    <Text style={commonStyles.label}>Coordonnées de contact</Text>
                    <Text style={commonStyles.hint}>
                        Ces informations apparaîtront uniquement sur la version complète du CV (après match)
                    </Text>

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

                <View style={commonStyles.formGroup}>
                    <Text style={commonStyles.label}>Visibilité par défaut</Text>
                    <View style={styles.visibilityRow}>
                        <Pressable
                            style={[styles.visibilityOption, visibility === 'anonymous' && styles.visibilityActive]}
                            onPress={() => setVisibility('anonymous')}
                        >
                            <Icon name="eyeOff" size={20} color={visibility === 'anonymous' ? 'white' : theme.colors.textLight} />
                            <Text style={[styles.visibilityText, visibility === 'anonymous' && styles.visibilityTextActive]}>
                                Anonyme
                            </Text>
                            <Text style={[styles.visibilityHint, visibility === 'anonymous' && styles.visibilityHintActive]}>
                                Noms et villes masqués
                            </Text>
                        </Pressable>
                        <Pressable
                            style={[styles.visibilityOption, visibility === 'public' && styles.visibilityActive]}
                            onPress={() => setVisibility('public')}
                        >
                            <Icon name="eye" size={20} color={visibility === 'public' ? 'white' : theme.colors.textLight} />
                            <Text style={[styles.visibilityText, visibility === 'public' && styles.visibilityTextActive]}>
                                Public
                            </Text>
                            <Text style={[styles.visibilityHint, visibility === 'public' && styles.visibilityHintActive]}>
                                Toutes les infos visibles
                            </Text>
                        </Pressable>
                    </View>
                </View>

                <View style={commonStyles.formGroup}>
                    <Text style={commonStyles.label}>Résumé / À propos</Text>
                    <TextInput
                        style={[commonStyles.textArea, styles.textAreaLarge]}
                        placeholder="Présentez-vous en quelques lignes : votre parcours, vos points forts, ce que vous recherchez..."
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

    const renderStepExperiences = () => (
        <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Expériences professionnelles</Text>
                <Pressable
                    style={styles.addButton}
                    onPress={() => {
                        setEditingExp(null);
                        setShowExpModal(true);
                    }}
                >
                    <Icon name="plus" size={20} color="white" />
                </Pressable>
            </View>

            {cvData.experiences.length === 0 ? (
                <View style={styles.emptyState}>
                    <Icon name="briefcase" size={40} color={theme.colors.gray} />
                    <Text style={commonStyles.emptyText}>Aucune expérience ajoutée</Text>
                    <Pressable
                        style={styles.emptyButton}
                        onPress={() => {
                            setEditingExp(null);
                            setShowExpModal(true);
                        }}
                    >
                        <Text style={styles.emptyButtonText}>Ajouter une expérience</Text>
                    </Pressable>
                </View>
            ) : (
                <View style={styles.itemsList}>
                    {cvData.experiences.map((exp) => (
                        <Pressable
                            key={exp.id}
                            style={commonStyles.listItem}
                            onPress={() => {
                                setEditingExp(exp);
                                setShowExpModal(true);
                            }}
                        >
                            <View style={styles.itemIcon}>
                                <Icon name="briefcase" size={20} color={theme.colors.primary} />
                            </View>
                            <View style={commonStyles.listItemContent}>
                                <Text style={commonStyles.listItemTitle}>{exp.job_title}</Text>
                                <Text style={styles.itemSubtitle}>{exp.company_name || 'Structure non renseignée'}</Text>
                                <Text style={commonStyles.listItemSubtitle}>
                                    {exp.start_date} - {exp.is_current ? 'Présent' : exp.end_date}
                                </Text>
                            </View>
                            <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );

    const renderStepFormations = () => (
        <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Formations</Text>
                <Pressable
                    style={styles.addButton}
                    onPress={() => {
                        setEditingForm(null);
                        setShowFormModal(true);
                    }}
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
                        onPress={() => {
                            setEditingForm(null);
                            setShowFormModal(true);
                        }}
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
                            onPress={() => {
                                setEditingForm(form);
                                setShowFormModal(true);
                            }}
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
        </View>
    );

    const renderStepSkills = () => {
        const toggleSection = (section) => {
            setExpandedSection(expandedSection === section ? null : section);
        };

        const renderAccordion = (id, title, icon, content, selectedItems = []) => {
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
                            <Text style={commonStyles.accordionTitle}>{title}</Text>
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
                                                {typeof item === 'object' ? item.name || item.language : item}
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

                {renderAccordion(
                    'skills',
                    'Compétences',
                    'star',
                    <View style={commonStyles.chipsContainer}>
                        {ALL_SKILLS.slice(0, 30).map((skill) => (
                            <Pressable
                                key={skill}
                                style={[
                                    commonStyles.chip,
                                    cvData.skills?.includes(skill) && commonStyles.chipActive,
                                ]}
                                onPress={() => toggleArrayItem('skills', skill)}
                            >
                                <Text style={[
                                    commonStyles.chipText,
                                    cvData.skills?.includes(skill) && commonStyles.chipTextActive,
                                ]}>
                                    {skill}
                                </Text>
                            </Pressable>
                        ))}
                    </View>,
                    cvData.skills || []
                )}

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

                {renderAccordion(
                    'certifications',
                    'Certifications',
                    'award',
                    <View style={commonStyles.chipsContainer}>
                        {CERTIFICATIONS.map((cert) => {
                            const isSelected = cvData.certifications?.some(c => c.name === cert.label);
                            return (
                                <Pressable
                                    key={cert.value}
                                    style={[
                                        commonStyles.chip,
                                        isSelected && commonStyles.chipActiveSuccess,
                                    ]}
                                    onPress={() => {
                                        if (isSelected) {
                                            setCvData(prev => ({
                                                ...prev,
                                                certifications: prev.certifications.filter(c => c.name !== cert.label),
                                            }));
                                        } else {
                                            setCvData(prev => ({
                                                ...prev,
                                                certifications: [...(prev.certifications || []), { name: cert.label, year: null }],
                                            }));
                                        }
                                    }}
                                >
                                    <Text style={[
                                        commonStyles.chipText,
                                        isSelected && commonStyles.chipTextActive,
                                    ]}>
                                        {cert.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>,
                    cvData.certifications || []
                )}

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

    const renderStepPreview = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Aperçu de votre CV</Text>
            <CVPreview
                structuredData={cvData}
                profile={profile}
                mode={visibility}
                showToggle={true}
                style={commonStyles.flex1}
            />
        </View>
    );

    const renderCurrentStep = () => {
        switch (STEPS[currentStep].id) {
            case 'info': return renderStepInfo();
            case 'experiences': return renderStepExperiences();
            case 'formations': return renderStepFormations();
            case 'skills': return renderStepSkills();
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
                    <Text style={styles.headerTitle}>Créer un CV</Text>
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
                                size={16}
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

                <Modal
                    visible={showExpModal}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => {
                        setShowExpModal(false);
                        setEditingExp(null);
                    }}
                >
                    <CVFormExperience
                        experience={editingExp}
                        onSave={handleSaveExperience}
                        onCancel={() => {
                            setShowExpModal(false);
                            setEditingExp(null);
                        }}
                        onDelete={editingExp ? handleDeleteExperience : undefined}
                    />
                </Modal>

                <Modal
                    visible={showFormModal}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => {
                        setShowFormModal(false);
                        setEditingForm(null);
                    }}
                >
                    <CVFormFormation
                        formation={editingForm}
                        onSave={handleSaveFormation}
                        onCancel={() => {
                            setShowFormModal(false);
                            setEditingForm(null);
                        }}
                        onDelete={editingForm ? handleDeleteFormation : undefined}
                    />
                </Modal>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    // Header
    headerTitle: {
        fontSize: hp(2),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },

    // Steps wizard
    stepsIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: wp(4),
        paddingVertical: hp(1.5),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    stepDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
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
        marginBottom: hp(2),
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

    // Form
    textAreaLarge: {
        minHeight: hp(12),
    },
    charCount: {
        fontSize: hp(1.2),
        color: theme.colors.textLight,
        textAlign: 'right',
        marginTop: hp(0.5),
    },

    // Visibility
    visibilityRow: {
        flexDirection: 'row',
        gap: wp(3),
    },
    visibilityOption: {
        flex: 1,
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.xl,
        padding: hp(2),
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    visibilityActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    visibilityText: {
        fontSize: hp(1.6),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
        marginTop: hp(0.5),
    },
    visibilityTextActive: {
        color: 'white',
    },
    visibilityHint: {
        fontSize: hp(1.2),
        color: theme.colors.textLight,
        marginTop: hp(0.3),
    },
    visibilityHintActive: {
        color: 'rgba(255,255,255,0.8)',
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(6),
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

    // Items list
    itemsList: {
        gap: hp(1.5),
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

    // Accordion preview
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
    quickSelectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
        paddingVertical: hp(1),
        paddingHorizontal: wp(3),
        marginTop: hp(1),
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary + '30',
        backgroundColor: theme.colors.primary + '10',
        alignSelf: 'flex-start',
    },
    quickSelectText: {
        fontSize: hp(1.5),
        fontFamily: theme.fonts.medium,
        color: theme.colors.primary,
    },
});