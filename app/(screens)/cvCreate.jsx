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
import { useAuth } from '../../contexts/AuthContext';
import { useCVs } from '../../hooks/useCVs';
import { commonStyles } from '../../constants/styles';
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
    const { createCV, cvs } = useCVs(session?.user?.id);

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [expandedSection, setExpandedSection] = useState(null);
    const [visibility, setVisibility] = useState('anonymous');
    const [cvData, setCvData] = useState({ ...EMPTY_CV_STRUCTURE });

    // Modals
    const [showExpModal, setShowExpModal] = useState(false);
    const [editingExp, setEditingExp] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingForm, setEditingForm] = useState(null);

    const scrollRef = useRef(null);

    // Navigation entre étapes
    const goToStep = (index) => {
        if (index >= 0 && index < STEPS.length) {
            setCurrentStep(index);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
        }
    };

    const nextStep = () => goToStep(currentStep + 1);
    const prevStep = () => goToStep(currentStep - 1);

    // Gestion des expériences
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

    // Gestion des formations
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

    // Toggle compétence/logiciel/certification
    const toggleArrayItem = (field, item) => {
        setCvData(prev => {
            const current = prev[field] || [];
            const updated = current.includes(item)
                ? current.filter(i => i !== item)
                : [...current, item];
            return { ...prev, [field]: updated };
        });
    };

    // Gestion des langues
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

    // Soumission finale
    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert('Erreur', 'Veuillez donner un titre à votre CV');
            return;
        }

        if (cvs.length >= 5) {
            Alert.alert('Limite atteinte', 'Vous ne pouvez pas créer plus de 5 CV');
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

    // Rendu des étapes
    const renderStepInfo = () => (
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
                    style={[commonStyles.input, styles.textArea]}
                    placeholder="Présentez-vous en quelques lignes : votre parcours, vos points forts, ce que vous recherchez..."
                    placeholderTextColor={theme.colors.textLight}
                    value={cvData.summary}
                    onChangeText={(v) => setCvData(prev => ({ ...prev, summary: v }))}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    maxLength={500}
                />
                <Text style={styles.charCount}>{cvData.summary?.length || 0}/500</Text>
            </View>
        </View>
    );

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
                    <Text style={styles.emptyText}>Aucune expérience ajoutée</Text>
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
                    {cvData.experiences.map((exp, index) => (
                        <Pressable
                            key={exp.id}
                            style={styles.itemCard}
                            onPress={() => {
                                setEditingExp(exp);
                                setShowExpModal(true);
                            }}
                        >
                            <View style={styles.itemIcon}>
                                <Icon name="briefcase" size={20} color={theme.colors.primary} />
                            </View>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemTitle}>{exp.job_title}</Text>
                                <Text style={styles.itemSubtitle}>{exp.company_name || 'Structure non renseignée'}</Text>
                                <Text style={styles.itemMeta}>
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
                    <Text style={styles.emptyText}>Aucune formation ajoutée</Text>
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
                            style={styles.itemCard}
                            onPress={() => {
                                setEditingForm(form);
                                setShowFormModal(true);
                            }}
                        >
                            <View style={[styles.itemIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
                                <Icon name="book" size={20} color={theme.colors.secondary} />
                            </View>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemTitle}>{form.diploma_name || form.diploma_type}</Text>
                                <Text style={styles.itemSubtitle}>{form.school_name || 'Établissement non renseigné'}</Text>
                                <Text style={styles.itemMeta}>{form.year}</Text>
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

                    {/* Sélection visible même fermé */}
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

                    {/* Contenu expandé */}
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
                <Text style={styles.stepSubtitle}>Touchez une section pour la développer</Text>

                {/* Compétences */}
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

                {/* Logiciels */}
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
                                    cvData.software?.includes(soft.label) && styles.chipActiveSoftware,
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

                {/* Certifications */}
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
                                        isSelected && styles.chipActiveCert,
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

                {/* Langues */}
                {renderAccordion(
                    'languages',
                    'Langues',
                    'globe',
                    <View style={styles.languagesContainer}>
                        {cvData.languages.map((lang, index) => (
                            <View key={index} style={styles.languageCard}>
                                <View style={styles.languageHeader}>
                                    <Text style={styles.languageNumber}>Langue {index + 1}</Text>
                                    {index > 0 && (
                                        <Pressable
                                            style={styles.removeLanguageButton}
                                            onPress={() => removeLanguage(index)}
                                        >
                                            <Icon name="trash" size={16} color={theme.colors.rose} />
                                        </Pressable>
                                    )}
                                </View>

                                {/* Sélection de la langue */}
                                <Text style={styles.languageLabel}>Langue</Text>
                                <View style={styles.languageOptions}>
                                    {LANGUAGES.map((l) => (
                                        <Pressable
                                            key={l.value}
                                            style={[
                                                styles.languageOption,
                                                lang.language === l.value && styles.languageOptionActive,
                                            ]}
                                            onPress={() => updateLanguage(index, 'language', l.value)}
                                        >
                                            <Text style={[
                                                styles.languageOptionText,
                                                lang.language === l.value && styles.languageOptionTextActive,
                                            ]}>
                                                {l.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>

                                {/* Niveau */}
                                <Text style={styles.languageLabel}>Niveau</Text>
                                <View style={styles.levelOptions}>
                                    {LANGUAGE_LEVELS.map((level) => (
                                        <Pressable
                                            key={level.value}
                                            style={[
                                                styles.levelOption,
                                                lang.level === level.value && styles.levelOptionActive,
                                            ]}
                                            onPress={() => updateLanguage(index, 'level', level.value)}
                                        >
                                            <Text style={[
                                                styles.levelOptionText,
                                                lang.level === level.value && styles.levelOptionTextActive,
                                            ]}>
                                                {level.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        ))}

                        {/* Bouton ajouter langue */}
                        <Pressable style={styles.addLanguageButton} onPress={addLanguage}>
                            <Icon name="plus" size={18} color={theme.colors.primary} />
                            <Text style={styles.addLanguageText}>Ajouter une langue</Text>
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
                style={styles.previewContainer}
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
                {/* Header */}
                <View style={commonStyles.headerNoBorder}>
                    <BackButton router={router} />
                    <Text style={commonStyles.headerTitle}>Créer un CV</Text>
                    <View style={{ width: 36 }} />
                </View>

                {/* Steps indicator */}
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

                {/* Content */}
                <ScrollView
                    ref={scrollRef}
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {renderCurrentStep()}
                </ScrollView>

                {/* Footer navigation */}
                <View style={[commonStyles.footer, { flexDirection: 'row', alignItems: 'center' }]}>
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
                            buttonStyle={styles.submitButton}
                        />
                    )}
                </View>

                {/* Modal Expérience */}
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

                {/* Modal Formation */}
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

                {/* Modal Formation */}
                <Modal
                    visible={showFormModal}
                    animationType="slide"
                    presentationStyle="pageSheet"
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
    textArea: {
        minHeight: hp(12),
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: hp(1.2),
        color: theme.colors.textLight,
        textAlign: 'right',
        marginTop: hp(0.5),
    },
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
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(6),
        gap: hp(1),
    },
    emptyText: {
        fontSize: hp(1.6),
        color: theme.colors.textLight,
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
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.xl,
        padding: hp(1.5),
    },
    itemIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
        marginLeft: wp(3),
    },
    itemTitle: {
        fontSize: hp(1.6),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    itemSubtitle: {
        fontSize: hp(1.4),
        color: theme.colors.primary,
    },
    itemMeta: {
        fontSize: hp(1.3),
        color: theme.colors.textLight,
        marginTop: hp(0.2),
    },
    section: {
        marginBottom: hp(2.5),
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(1),
    },
    sectionTitle: {
        fontSize: hp(1.8),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
        marginBottom: hp(0.5),
    },
    addSmallButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
    },
    addSmallText: {
        fontSize: hp(1.4),
        color: theme.colors.primary,
        fontFamily: theme.fonts.medium,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(2),
    },
    chipSoftware: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
        borderColor: theme.colors.secondary + '50',
    },
    chipSoftwareActive: {
        backgroundColor: theme.colors.secondary,
        borderColor: theme.colors.secondary,
    },
    chipTextSoftware: {
        color: theme.colors.secondary,
    },
    chipCert: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
        borderColor: theme.colors.success + '50',
    },
    chipCertActive: {
        backgroundColor: theme.colors.success,
        borderColor: theme.colors.success,
    },
    languageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(1),
        gap: wp(2),
    },
    languageSelect: {
        flex: 2,
    },
    levelSelect: {
        flex: 1.5,
        flexDirection: 'row',
        gap: wp(1),
    },
    langChip: {
        paddingHorizontal: wp(2.5),
        paddingVertical: hp(0.6),
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.card,
        marginRight: wp(1),
    },
    langChipActive: {
        backgroundColor: theme.colors.primary,
    },
    langChipText: {
        fontSize: hp(1.3),
        color: theme.colors.text,
    },
    langChipTextActive: {
        color: 'white',
    },
    levelChip: {
        flex: 1,
        paddingVertical: hp(0.6),
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.card,
        alignItems: 'center',
    },
    levelChipActive: {
        backgroundColor: theme.colors.secondary,
    },
    levelChipText: {
        fontSize: hp(1.1),
        color: theme.colors.text,
    },
    levelChipTextActive: {
        color: 'white',
    },
    removeButton: {
        padding: wp(1),
    },
    previewContainer: {
        flex: 1,
        marginTop: hp(1),
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
    submitButton: {
        flex: 1,
    },
    // Accordéon styles
    stepSubtitle: {
        fontSize: hp(1.4),
        color: theme.colors.textLight,
        marginBottom: hp(2),
    },
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
    chipActiveSoftware: {
        backgroundColor: theme.colors.secondary,
        borderColor: theme.colors.secondary,
    },
    chipActiveCert: {
        backgroundColor: theme.colors.success,
        borderColor: theme.colors.success,
    },

    // Langues styles
    languagesContainer: {
        gap: hp(1.5),
    },
    languageCard: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.lg,
        padding: hp(1.5),
    },
    languageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(1),
    },
    languageNumber: {
        fontSize: hp(1.4),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    removeLanguageButton: {
        padding: hp(0.5),
    },
    languageLabel: {
        fontSize: hp(1.3),
        color: theme.colors.textLight,
        marginBottom: hp(0.5),
        marginTop: hp(0.5),
    },
    languageOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(1.5),
    },
    languageOption: {
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.6),
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    languageOptionActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    languageOptionText: {
        fontSize: hp(1.3),
        color: theme.colors.text,
    },
    languageOptionTextActive: {
        color: 'white',
        fontFamily: theme.fonts.medium,
    },
    levelOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(1.5),
    },
    levelOption: {
        paddingHorizontal: wp(2.5),
        paddingVertical: hp(0.6),
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    levelOptionActive: {
        backgroundColor: theme.colors.secondary,
        borderColor: theme.colors.secondary,
    },
    levelOptionText: {
        fontSize: hp(1.2),
        color: theme.colors.text,
    },
    levelOptionTextActive: {
        color: 'white',
        fontFamily: theme.fonts.medium,
    },
    addLanguageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(2),
        paddingVertical: hp(1.2),
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderStyle: 'dashed',
    },
    addLanguageText: {
        fontSize: hp(1.4),
        color: theme.colors.primary,
        fontFamily: theme.fonts.medium,
    },
});