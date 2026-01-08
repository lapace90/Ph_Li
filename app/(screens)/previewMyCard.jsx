/**
 * Prévisualisation de ma carte candidat
 * Permet au candidat de voir comment les recruteurs le voient
 */

import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { usePrivacy } from '../../hooks/usePrivacy';
import { useCVs } from '../../hooks/useCVs';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import { getDisplayName } from '../../helpers/displayName';
import { getRoleLabel } from '../../helpers/roleLabel';

export default function PreviewMyCard() {
    const router = useRouter();
    const { user, profile, session } = useAuth();
    const { privacy } = usePrivacy(session?.user?.id);
    const { cvs } = useCVs();
    const [viewMode, setViewMode] = useState('card'); // 'card' ou 'cv'

    const userType = user?.user_type;
    const isSearchable = privacy?.searchable_by_recruiters;

    // CV par défaut
    const defaultCV = cvs?.find(cv => cv.is_default) || cvs?.[0];
    const hasStandardCV = defaultCV?.type === 'standard';

    // Paramètres de confidentialité
    const showFullName = privacy?.show_full_name;
    const showPhoto = privacy?.show_photo;
    const showExactLocation = privacy?.show_exact_location;

    // Nom affiché
    const displayName = getDisplayName(profile, !showFullName);

    // Localisation affichée
    const displayLocation = showExactLocation
        ? `${profile?.current_city}, ${profile?.current_department}`
        : profile?.current_region || 'France';

    // Type de profil
    { getRoleLabel(userType, profile?.gender) }

    // Contrats recherchés formatés
    const getContractLabels = () => {
        const labels = {
            'CDI': 'CDI',
            'CDD': 'CDD',
            'vacation': 'Vacations',
            'remplacement': 'Remplacements',
        };
        return profile?.preferred_contract_types?.map(c => labels[c] || c) || [];
    };

    return (
        <ScreenWrapper bg={theme.colors.background}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={commonStyles.headerNoBorder}>
                <Pressable style={commonStyles.headerButton} onPress={() => router.back()}>
                    <Icon name="arrowLeft" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={commonStyles.headerTitleLarge}>Ma carte</Text>
                <Pressable
                    style={commonStyles.headerButton}
                    onPress={() => router.push('/(screens)/privacySettings')}
                >
                    <Icon name="settings" size={22} color={theme.colors.text} />
                </Pressable>
            </View>

            <ScrollView
                style={commonStyles.flex1}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Statut */}
                <View style={[
                    styles.statusBanner,
                    { backgroundColor: isSearchable ? theme.colors.success + '15' : theme.colors.warning + '15' }
                ]}>
                    <Icon
                        name={isSearchable ? 'checkCircle' : 'alertCircle'}
                        size={18}
                        color={isSearchable ? theme.colors.success : theme.colors.warning}
                    />
                    <Text style={[
                        styles.statusText,
                        { color: isSearchable ? theme.colors.success : theme.colors.warning }
                    ]}>
                        {isSearchable ? 'Visible par les recruteurs' : 'Profil masqué'}
                    </Text>
                </View>

                {/* Toggle vue si CV standard disponible */}
                {hasStandardCV && (
                    <View style={styles.toggleContainer}>
                        <Pressable
                            style={[styles.toggleButton, viewMode === 'card' && styles.toggleActive]}
                            onPress={() => setViewMode('card')}
                        >
                            <Icon name="user" size={16} color={viewMode === 'card' ? 'white' : theme.colors.textLight} />
                            <Text style={[styles.toggleText, viewMode === 'card' && styles.toggleTextActive]}>Carte</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.toggleButton, viewMode === 'cv' && styles.toggleActive]}
                            onPress={() => setViewMode('cv')}
                        >
                            <Icon name="file" size={16} color={viewMode === 'cv' ? 'white' : theme.colors.textLight} />
                            <Text style={[styles.toggleText, viewMode === 'cv' && styles.toggleTextActive]}>CV détaillé</Text>
                        </Pressable>
                    </View>
                )}

                {/* CARTE COMPACTE */}
                {viewMode === 'card' && (
                    <View style={styles.card}>
                        {/* En-tête avec photo miniature + infos principales */}
                        <View style={styles.cardHeader}>
                            {showPhoto && profile?.photo_url ? (
                                <Image source={{ uri: profile.photo_url }} style={styles.photoSmall} />
                            ) : (
                                <View style={styles.photoPlaceholderSmall}>
                                    <Icon name="user" size={24} color={theme.colors.textLight} />
                                </View>
                            )}

                            <View style={styles.headerInfo}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.cardName}>{displayName}</Text>
                                    <View style={styles.typeBadge}>
                                        <Text style={styles.typeBadgeText}>{getProfileTypeLabel()}</Text>
                                    </View>
                                </View>

                                <View style={styles.metaRow}>
                                    <Icon name="mapPin" size={12} color={theme.colors.textLight} />
                                    <Text style={styles.metaText}>{displayLocation}</Text>
                                    {profile?.experience_years > 0 && (
                                        <>
                                            <Text style={styles.metaDot}>•</Text>
                                            <Text style={styles.metaText}>{profile.experience_years} ans exp.</Text>
                                        </>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Infos clés en grille */}
                        <View style={styles.infoGrid}>
                            {/* Disponibilité */}
                            <View style={styles.infoItem}>
                                <Icon name="calendar" size={16} color={theme.colors.primary} />
                                <View>
                                    <Text style={styles.infoLabel}>Disponibilité</Text>
                                    <Text style={styles.infoValue}>
                                        {profile?.availability_date
                                            ? (new Date(profile.availability_date) <= new Date()
                                                ? 'Immédiate'
                                                : new Date(profile.availability_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }))
                                            : 'Non précisée'
                                        }
                                    </Text>
                                </View>
                            </View>

                            {/* Rayon de recherche */}
                            <View style={styles.infoItem}>
                                <Icon name="target" size={16} color={theme.colors.primary} />
                                <View>
                                    <Text style={styles.infoLabel}>Rayon</Text>
                                    <Text style={styles.infoValue}>
                                        {profile?.search_radius_km ? `${profile.search_radius_km} km` : 'Non défini'}
                                    </Text>
                                </View>
                            </View>

                            {/* Mobilité */}
                            <View style={styles.infoItem}>
                                <Icon name="truck" size={16} color={theme.colors.primary} />
                                <View>
                                    <Text style={styles.infoLabel}>Mobilité</Text>
                                    <Text style={styles.infoValue}>
                                        {profile?.willing_to_relocate ? 'Prêt à déménager' : 'Zone actuelle'}
                                    </Text>
                                </View>
                            </View>

                            {/* Diplômes */}
                            <View style={styles.infoItem}>
                                <Icon name="award" size={16} color={theme.colors.primary} />
                                <View>
                                    <Text style={styles.infoLabel}>Diplômes</Text>
                                    <Text style={styles.infoValue} numberOfLines={1}>
                                        {profile?.diplomas?.length > 0
                                            ? profile.diplomas.slice(0, 2).join(', ')
                                            : 'Non renseignés'
                                        }
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Contrats recherchés */}
                        {getContractLabels().length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Recherche</Text>
                                <View style={styles.tagsRow}>
                                    {getContractLabels().map((label, i) => (
                                        <View key={i} style={styles.contractTag}>
                                            <Text style={styles.contractTagText}>{label}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Spécialisations */}
                        {profile?.specializations?.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Spécialisations</Text>
                                <View style={styles.tagsRow}>
                                    {profile.specializations.map((spec, i) => (
                                        <View key={i} style={styles.specTag}>
                                            <Text style={styles.specTagText}>{spec}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Régions préférées */}
                        {profile?.preferred_regions?.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Zones recherchées</Text>
                                <Text style={styles.regionsText}>
                                    {profile.preferred_regions.join(' • ')}
                                </Text>
                            </View>
                        )}

                        {/* Bio courte */}
                        {profile?.bio && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>À propos</Text>
                                <Text style={styles.bioText} numberOfLines={3}>{profile.bio}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* VUE CV DÉTAILLÉ */}
                {viewMode === 'cv' && hasStandardCV && (
                    <View style={styles.card}>
                        <View style={styles.cvHeader}>
                            <Text style={styles.cvTitle}>CV Standardisé</Text>
                            <View style={styles.cvBadge}>
                                <Icon name="checkCircle" size={12} color={theme.colors.success} />
                                <Text style={styles.cvBadgeText}>Complet</Text>
                            </View>
                        </View>

                        {/* Expériences */}
                        {defaultCV?.experiences?.length > 0 && (
                            <View style={styles.cvSection}>
                                <View style={styles.cvSectionHeader}>
                                    <Icon name="briefcase" size={16} color={theme.colors.primary} />
                                    <Text style={styles.cvSectionTitle}>Expériences</Text>
                                </View>
                                {defaultCV.experiences.slice(0, 3).map((exp, i) => (
                                    <View key={i} style={styles.cvItem}>
                                        <Text style={styles.cvItemTitle}>{exp.title}</Text>
                                        <Text style={styles.cvItemSubtitle}>{exp.company} • {exp.duration}</Text>
                                        {exp.description && (
                                            <Text style={styles.cvItemDesc} numberOfLines={2}>{exp.description}</Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Formations */}
                        {defaultCV?.formations?.length > 0 && (
                            <View style={styles.cvSection}>
                                <View style={styles.cvSectionHeader}>
                                    <Icon name="award" size={16} color={theme.colors.primary} />
                                    <Text style={styles.cvSectionTitle}>Formations</Text>
                                </View>
                                {defaultCV.formations.slice(0, 3).map((form, i) => (
                                    <View key={i} style={styles.cvItem}>
                                        <Text style={styles.cvItemTitle}>{form.diploma}</Text>
                                        <Text style={styles.cvItemSubtitle}>{form.school} • {form.year}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Compétences */}
                        {defaultCV?.skills?.length > 0 && (
                            <View style={styles.cvSection}>
                                <View style={styles.cvSectionHeader}>
                                    <Icon name="star" size={16} color={theme.colors.primary} />
                                    <Text style={styles.cvSectionTitle}>Compétences</Text>
                                </View>
                                <View style={styles.tagsRow}>
                                    {defaultCV.skills.map((skill, i) => (
                                        <View key={i} style={styles.specTag}>
                                            <Text style={styles.specTagText}>{skill}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Langues */}
                        {defaultCV?.languages?.length > 0 && (
                            <View style={styles.cvSection}>
                                <View style={styles.cvSectionHeader}>
                                    <Icon name="globe" size={16} color={theme.colors.primary} />
                                    <Text style={styles.cvSectionTitle}>Langues</Text>
                                </View>
                                <Text style={styles.languagesText}>
                                    {defaultCV.languages.map(l => `${l.name} (${l.level})`).join(' • ')}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Conseils */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>💡 Améliorer mon profil</Text>

                    {!profile?.photo_url && (
                        <Pressable style={styles.tipItem} onPress={() => router.push('/(tabs)/profile')}>
                            <Icon name="camera" size={14} color={theme.colors.warning} />
                            <Text style={styles.tipText}>Ajouter une photo</Text>
                            <Icon name="chevronRight" size={14} color={theme.colors.textLight} />
                        </Pressable>
                    )}
                    {!profile?.bio && (
                        <Pressable style={styles.tipItem} onPress={() => router.push('/(tabs)/profile')}>
                            <Icon name="edit" size={14} color={theme.colors.warning} />
                            <Text style={styles.tipText}>Rédiger une bio</Text>
                            <Icon name="chevronRight" size={14} color={theme.colors.textLight} />
                        </Pressable>
                    )}
                    {!profile?.search_radius_km && (
                        <Pressable style={styles.tipItem} onPress={() => router.push('/(screens)/searchZones')}>
                            <Icon name="target" size={14} color={theme.colors.warning} />
                            <Text style={styles.tipText}>Définir un rayon de recherche</Text>
                            <Icon name="chevronRight" size={14} color={theme.colors.textLight} />
                        </Pressable>
                    )}
                    {!hasStandardCV && (
                        <Pressable style={styles.tipItem} onPress={() => router.push('/(screens)/cvList')}>
                            <Icon name="file" size={14} color={theme.colors.warning} />
                            <Text style={styles.tipText}>Créer un CV standardisé</Text>
                            <Icon name="chevronRight" size={14} color={theme.colors.textLight} />
                        </Pressable>
                    )}
                    {profile?.photo_url && profile?.bio && profile?.search_radius_km && hasStandardCV && (
                        <View style={styles.tipItem}>
                            <Icon name="checkCircle" size={14} color={theme.colors.success} />
                            <Text style={[styles.tipText, { color: theme.colors.success }]}>Profil complet !</Text>
                        </View>
                    )}
                </View>

                {/* Actions */}
                <View style={styles.actionsSection}>
                    <Pressable
                        style={commonStyles.buttonPrimary}
                        onPress={() => router.push('/(tabs)/profile')}
                    >
                        <Icon name="edit" size={18} color="white" />
                        <Text style={commonStyles.buttonPrimaryText}>Modifier mon profil</Text>
                    </Pressable>
                </View>

            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: wp(4),
        paddingBottom: hp(10),
    },

    // Status
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
        padding: wp(3),
        borderRadius: theme.radius.md,
        marginBottom: hp(2),
    },
    statusText: {
        fontSize: hp(1.4),
        fontWeight: '500',
    },

    // Toggle
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: 4,
        marginBottom: hp(2),
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(2),
        paddingVertical: hp(1),
        borderRadius: theme.radius.md,
    },
    toggleActive: {
        backgroundColor: theme.colors.primary,
    },
    toggleText: {
        fontSize: hp(1.4),
        color: theme.colors.textLight,
    },
    toggleTextActive: {
        color: 'white',
        fontWeight: '600',
    },

    // Card
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: wp(4),
        marginBottom: hp(2),
    },

    // Card Header
    cardHeader: {
        flexDirection: 'row',
        gap: wp(3),
        marginBottom: hp(2),
        paddingBottom: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    photoSmall: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    photoPlaceholderSmall: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
        marginBottom: hp(0.5),
    },
    cardName: {
        fontSize: hp(1.8),
        fontWeight: '700',
        color: theme.colors.text,
    },
    typeBadge: {
        backgroundColor: theme.colors.primary + '20',
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.2),
        borderRadius: theme.radius.sm,
    },
    typeBadgeText: {
        fontSize: hp(1.1),
        color: theme.colors.primary,
        fontWeight: '600',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
    },
    metaText: {
        fontSize: hp(1.3),
        color: theme.colors.textLight,
    },
    metaDot: {
        color: theme.colors.textLight,
    },

    // Info Grid
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: hp(1.5),
    },
    infoItem: {
        width: '50%',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: wp(2),
        paddingVertical: hp(1),
    },
    infoLabel: {
        fontSize: hp(1.1),
        color: theme.colors.textLight,
    },
    infoValue: {
        fontSize: hp(1.3),
        color: theme.colors.text,
        fontWeight: '500',
    },

    // Sections
    section: {
        paddingTop: hp(1.5),
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        marginTop: hp(0.5),
    },
    sectionLabel: {
        fontSize: hp(1.2),
        color: theme.colors.textLight,
        marginBottom: hp(0.8),
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Tags
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(2),
    },
    contractTag: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: wp(2.5),
        paddingVertical: hp(0.4),
        borderRadius: theme.radius.sm,
    },
    contractTagText: {
        fontSize: hp(1.2),
        color: 'white',
        fontWeight: '600',
    },
    specTag: {
        backgroundColor: theme.colors.primaryLight,
        paddingHorizontal: wp(2.5),
        paddingVertical: hp(0.4),
        borderRadius: theme.radius.sm,
    },
    specTagText: {
        fontSize: hp(1.2),
        color: theme.colors.primary,
        fontWeight: '500',
    },

    // Regions
    regionsText: {
        fontSize: hp(1.3),
        color: theme.colors.text,
    },

    // Bio
    bioText: {
        fontSize: hp(1.4),
        color: theme.colors.text,
        lineHeight: hp(2),
    },

    // CV View
    cvHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    cvTitle: {
        fontSize: hp(1.8),
        fontWeight: '700',
        color: theme.colors.text,
    },
    cvBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
        backgroundColor: theme.colors.success + '15',
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.3),
        borderRadius: theme.radius.sm,
    },
    cvBadgeText: {
        fontSize: hp(1.1),
        color: theme.colors.success,
        fontWeight: '500',
    },
    cvSection: {
        marginBottom: hp(2),
    },
    cvSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
        marginBottom: hp(1),
    },
    cvSectionTitle: {
        fontSize: hp(1.5),
        fontWeight: '600',
        color: theme.colors.text,
    },
    cvItem: {
        paddingLeft: wp(6),
        marginBottom: hp(1),
    },
    cvItemTitle: {
        fontSize: hp(1.4),
        fontWeight: '600',
        color: theme.colors.text,
    },
    cvItemSubtitle: {
        fontSize: hp(1.2),
        color: theme.colors.textLight,
    },
    cvItemDesc: {
        fontSize: hp(1.2),
        color: theme.colors.text,
        marginTop: hp(0.3),
    },
    languagesText: {
        fontSize: hp(1.3),
        color: theme.colors.text,
    },

    // Tips
    tipsCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: wp(4),
        marginBottom: hp(2),
    },
    tipsTitle: {
        fontSize: hp(1.5),
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: hp(1),
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
        paddingVertical: hp(0.8),
    },
    tipText: {
        fontSize: hp(1.3),
        color: theme.colors.text,
        flex: 1,
    },

    // Actions
    actionsSection: {
        gap: hp(1.5),
    },
});