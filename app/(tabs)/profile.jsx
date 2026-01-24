// app/(tabs)/profile.jsx
import { StyleSheet, Text, View, Pressable, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { usePrivacy } from '../../hooks/usePrivacy';
import { usePharmacyDetails } from '../../hooks/usePharmacyDetails';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import RoleAvatar from '../../components/common/RoleAvatar';
import Icon from '../../assets/icons/Icon';
import RppsBadge from '../../components/common/RppsBadge';
import SiretBadge from '../../components/common/SiretBadge';
import { getRoleLabel } from '../../helpers/roleLabel';

export default function Profile() {
    const router = useRouter();
    const { session, user, profile, signOut } = useAuth();
    const { privacy, setSearchable } = usePrivacy(session?.user?.id);

    // Déterminer le type d'utilisateur
    const isTitulaire = user?.user_type === 'titulaire';
    const isPreparateur = user?.user_type === 'preparateur';
    const isAnimator = user?.user_type === 'animateur';
    const isLaboratory = user?.user_type === 'laboratoire';
    const isCandidate = !isTitulaire && !isAnimator && !isLaboratory;
    const canHaveRPPS = isTitulaire || isPreparateur;

    // Charger les pharmacies pour les titulaires
    const { pharmacies, loading: pharmaciesLoading, verifiedPharmacies } = usePharmacyDetails(
        isTitulaire ? session?.user?.id : null
    );

    const handleToggleSearchable = async (value) => {
        await setSearchable(value);
    };

    // Déterminer la route d'édition selon le type d'utilisateur
    const getEditProfileRoute = () => {
        if (isAnimator) return '/(screens)/editAnimatorProfile';
        if (isLaboratory) return '/(screens)/editLaboratoryProfile';
        return '/(screens)/editProfile';
    };

    const formatAvailability = () => {
        if (!profile?.availability_date) return null;
        const date = new Date(profile.availability_date);
        const today = new Date();
        if (date <= today) return 'Disponible immédiatement';
        return `Disponible le ${date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
        })}`;
    };

    const formatContractTypes = () => {
        if (!profile?.preferred_contract_types?.length) return null;
        const labels = {
            CDI: 'CDI',
            CDD: 'CDD',
            vacation: 'Vacation',
            remplacement: 'Remplacement',
            stage: 'Stage',
            alternance: 'Alternance',
        };
        return profile.preferred_contract_types
            .map(type => labels[type] || type)
            .join(' • ');
    };

    const formatRadius = () => {
        if (!profile?.search_radius_km) return null;
        return `${profile.search_radius_km} km`;
    };

    const getLocation = () => {
        if (!profile?.current_city) return null;
        if (profile.current_region) {
            return `${profile.current_city}, ${profile.current_region}`;
        }
        return profile.current_city;
    };

    const getExperience = () => {
        if (!profile?.experience_years) return null;
        return `${profile.experience_years} an${profile.experience_years > 1 ? 's' : ''} d'expérience`;
    };

    const MenuItem = ({ icon, label, subtitle, onPress, showBorder = true, highlight = false }) => (
        <Pressable
            style={[commonStyles.menuItem, !showBorder && commonStyles.menuItemNoBorder]}
            onPress={onPress}
        >
            <Icon name={icon} size={20} color={highlight ? theme.colors.primary : theme.colors.text} />
            <View style={{ flex: 1, marginLeft: wp(3) }}>
                <Text style={[styles.menuLabel, highlight && { color: theme.colors.primary }]}>{label}</Text>
                {subtitle && <Text style={commonStyles.hint}>{subtitle}</Text>}
            </View>
            <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
        </Pressable>
    );

    return (
        <ScreenWrapper bg={theme.colors.background}>
            <ScrollView
                style={commonStyles.flex1}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={commonStyles.rowBetween}>
                    <Text style={commonStyles.headerTitleLarge}>Profil</Text>
                    <Pressable
                        style={styles.editButton}
                        onPress={() => router.push(getEditProfileRoute())}
                    >
                        <Icon name="edit" size={20} color={theme.colors.primary} />
                    </Pressable>
                </View>

                {/* Carte profil principale */}
                <View style={commonStyles.card}>
                    <View style={commonStyles.row}>
                        {profile?.photo_url ? (
                            <Image 
                                source={{ uri: profile.photo_url }} 
                                style={{ width: hp(10), height: hp(10), borderRadius: hp(5) }}
                                contentFit="cover"
                            />
                        ) : (
                            <RoleAvatar role={user?.user_type} gender={profile?.gender} size={hp(10)} />
                        )}
                        <View style={styles.profileInfo}>
                            <View style={[commonStyles.row, { gap: wp(2) }]}>
                                <Text style={styles.name}>
                                    {profile?.first_name} {profile?.last_name}
                                </Text>
                                {user?.rpps_verified && <RppsBadge verified={true} size="small" />}
                                {user?.siret_verified && <SiretBadge verified={true} size="small" />}
                            </View>
                            <Text style={styles.role}>{getRoleLabel(user?.user_type, profile?.gender)}</Text>
                            {getLocation() && (
                                <View style={[commonStyles.row, { marginTop: hp(0.5), gap: wp(1) }]}>
                                    <Icon name="mapPin" size={14} color={theme.colors.textLight} />
                                    <Text style={commonStyles.hint}>{getLocation()}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Bio */}
                {profile?.bio ? (
                    <View style={commonStyles.card}>
                        <Text style={styles.bioText}>{profile.bio}</Text>
                    </View>
                ) : (
                    <Pressable
                        style={styles.bioEmpty}
                        onPress={() => router.push(getEditProfileRoute())}
                    >
                        <Icon name="edit" size={18} color={theme.colors.textLight} />
                        <Text style={commonStyles.hint}>Ajouter une présentation</Text>
                    </Pressable>
                )}

                {/* ====== SECTION CANDIDAT ====== */}
                {isCandidate && (
                    <>
                        {/* Toggle recherche */}
                        <View style={commonStyles.card}>
                            <View style={[commonStyles.rowBetween, { padding: 0 }]}>
                                <View style={[commonStyles.row, commonStyles.flex1]}>
                                    <View style={[
                                        styles.searchToggleIcon,
                                        privacy?.searchable_by_recruiters && styles.searchToggleIconActive,
                                    ]}>
                                        <Icon
                                            name="search"
                                            size={20}
                                            color={privacy?.searchable_by_recruiters ? 'white' : theme.colors.primary}
                                        />
                                    </View>
                                    <View style={styles.searchToggleInfo}>
                                        <Text style={styles.searchToggleTitle}>
                                            {privacy?.searchable_by_recruiters ? 'Recherche active' : 'Recherche inactive'}
                                        </Text>
                                        <Text style={commonStyles.hint}>
                                            {privacy?.searchable_by_recruiters
                                                ? 'Visible par les recruteurs'
                                                : 'Profil masqué'}
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={privacy?.searchable_by_recruiters || false}
                                    onValueChange={handleToggleSearchable}
                                    trackColor={{ false: theme.colors.gray, true: theme.colors.primary + '50' }}
                                    thumbColor={privacy?.searchable_by_recruiters ? theme.colors.primary : '#f4f3f4'}
                                />
                            </View>
                        </View>

                        {/* Infos de recherche */}
                        <View style={[commonStyles.card, { gap: hp(1.2) }]}>
                            {formatAvailability() && (
                                <View style={[commonStyles.row, { gap: wp(3) }]}>
                                    <Icon name="calendar" size={18} color={theme.colors.primary} />
                                    <Text style={commonStyles.flex1}>{formatAvailability()}</Text>
                                </View>
                            )}
                            {formatContractTypes() && (
                                <View style={[commonStyles.row, { gap: wp(3) }]}>
                                    <Icon name="briefcase" size={18} color={theme.colors.primary} />
                                    <Text style={commonStyles.flex1}>{formatContractTypes()}</Text>
                                </View>
                            )}
                            {formatRadius() && (
                                <View style={[commonStyles.row, { gap: wp(3) }]}>
                                    <Icon name="mapPin" size={18} color={theme.colors.primary} />
                                    <Text style={commonStyles.flex1}>Rayon : {formatRadius()}</Text>
                                </View>
                            )}
                            {getExperience() && (
                                <View style={[commonStyles.row, { gap: wp(3) }]}>
                                    <Icon name="clock" size={18} color={theme.colors.primary} />
                                    <Text style={commonStyles.flex1}>{getExperience()}</Text>
                                </View>
                            )}
                            {profile?.willing_to_relocate && (
                                <View style={[commonStyles.row, { gap: wp(3) }]}>
                                    <Icon name="home" size={18} color={theme.colors.primary} />
                                    <Text style={commonStyles.flex1}>Prêt(e) à déménager</Text>
                                </View>
                            )}
                            {profile?.specializations?.length > 0 && (
                                <View style={[commonStyles.row, { gap: wp(3) }]}>
                                    <Icon name="star" size={18} color={theme.colors.primary} />
                                    <Text style={commonStyles.flex1}>{profile.specializations.join(', ')}</Text>
                                </View>
                            )}
                        </View>
                    </>
                )}

                {/* ====== SECTION TITULAIRE ====== */}
                {isTitulaire && (
                    <>
                        {/* Accès rapide recruteur */}
                        <View style={[commonStyles.card, { padding: 0, overflow: 'hidden' }]}>
                            <MenuItem
                                icon="briefcase"
                                label="Mes annonces"
                                subtitle="Emplois, stages et pharmacies"
                                onPress={() => router.push('/(screens)/recruiterDashboard')}
                                showBorder
                                highlight
                            />
                            <MenuItem
                                icon="shield"
                                label="Vérifications & Pharmacies"
                                subtitle={user?.siret_verified ? "✓ SIRET vérifié" : "Vérifiez votre SIRET"}
                                onPress={() => router.push('/(screens)/pharmacyManagement')}
                                showBorder={false}
                            />
                        </View>

                        {/* Mes pharmacies */}
                        {pharmacies.length > 0 && (
                            <View style={[commonStyles.card, { padding: 0, overflow: 'hidden' }]}>
                                <View style={styles.pharmaciesSectionHeader}>
                                    <View style={commonStyles.flex1}>
                                        <Text style={commonStyles.sectionTitleSmall}>Mes pharmacies</Text>
                                        <Text style={commonStyles.hint}>
                                            {verifiedPharmacies.length} sur {pharmacies.length} vérifiée{verifiedPharmacies.length > 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                    <Pressable
                                        style={styles.viewAllButton}
                                        onPress={() => router.push('/(screens)/pharmacyManagement')}
                                    >
                                        <Text style={styles.viewAllText}>Voir tout</Text>
                                        <Icon name="chevronRight" size={16} color={theme.colors.primary} />
                                    </Pressable>
                                </View>

                                {pharmacies.slice(0, 3).map((pharmacy, index) => (
                                    <Pressable
                                        key={pharmacy.id}
                                        style={[
                                            styles.pharmacyCompactCard,
                                            index < Math.min(2, pharmacies.length - 1) && styles.pharmacyCardBorder
                                        ]}
                                        onPress={() => router.push('/(screens)/pharmacyManagement')}
                                    >
                                        <View style={styles.pharmacyCompactIcon}>
                                            <Icon name="building" size={16} color={theme.colors.primary} />
                                        </View>
                                        <View style={commonStyles.flex1}>
                                            <View style={commonStyles.rowGapSmall}>
                                                <Text style={styles.pharmacyCompactName} numberOfLines={1}>
                                                    {pharmacy.name}
                                                </Text>
                                                {pharmacy.siret_verified && (
                                                    <View style={styles.verifiedBadgeSmall}>
                                                        <Icon name="checkCircle" size={10} color={theme.colors.success} />
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={commonStyles.hint} numberOfLines={1}>
                                                {pharmacy.city}
                                            </Text>
                                        </View>
                                        <Icon name="chevronRight" size={16} color={theme.colors.textLight} />
                                    </Pressable>
                                ))}
                            </View>
                        )}

                        {/* Message si aucune pharmacie */}
                        {pharmacies.length === 0 && !pharmaciesLoading && (
                            <Pressable
                                style={styles.addPharmacyCard}
                                onPress={() => router.push('/(screens)/pharmacyManagement')}
                            >
                                <Icon name="building" size={24} color={theme.colors.primary} />
                                <View style={commonStyles.flex1}>
                                    <Text style={styles.addPharmacyTitle}>Ajoutez vos pharmacies</Text>
                                    <Text style={commonStyles.hint}>
                                        Facilitez la création d'annonces et renforcez votre crédibilité
                                    </Text>
                                </View>
                                <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
                            </Pressable>
                        )}

                        {/* Infos pharmacie principale (si définie dans le profil) */}
                        {profile?.pharmacy_name && pharmacies.length === 0 && (
                            <View style={[commonStyles.card, { gap: hp(1.2) }]}>
                                <View style={[commonStyles.row, { gap: wp(3) }]}>
                                    <Icon name="home" size={18} color={theme.colors.primary} />
                                    <Text style={commonStyles.flex1}>{profile.pharmacy_name}</Text>
                                </View>
                                {getLocation() && (
                                    <View style={[commonStyles.row, { gap: wp(3) }]}>
                                        <Icon name="mapPin" size={18} color={theme.colors.textLight} />
                                        <Text style={[commonStyles.flex1, { color: theme.colors.textLight }]}>{getLocation()}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </>
                )}

                {/* ====== VÉRIFICATIONS MANQUANTES (préparateurs et titulaires) ====== */}
                {canHaveRPPS && !user?.rpps_verified && (
                    <Pressable
                        style={styles.rppsWarning}
                        onPress={() => router.push('/(screens)/rppsVerification')}
                    >
                        <Icon name="alertCircle" size={20} color={theme.colors.warning} />
                        <View style={commonStyles.flex1}>
                            <Text style={styles.rppsWarningTitle}>Vérification RPPS</Text>
                            <Text style={commonStyles.hint}>
                                {isTitulaire
                                    ? 'Requis pour publier des annonces'
                                    : 'Obtenez le badge vérifié sur votre profil'}
                            </Text>
                        </View>
                        <Icon name="chevronRight" size={18} color={theme.colors.warning} />
                    </Pressable>
                )}

                {/* Alerte SIRET pour titulaires */}
                {isTitulaire && !user?.siret_verified && (
                    <Pressable
                        style={[styles.rppsWarning, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}
                        onPress={() => router.push('/(screens)/pharmacyManagement')}
                    >
                        <Icon name="building" size={20} color={theme.colors.primary} />
                        <View style={commonStyles.flex1}>
                            <Text style={[styles.rppsWarningTitle, { color: theme.colors.primary }]}>Vérification SIRET</Text>
                            <Text style={commonStyles.hint}>
                                Sécurisez votre profil sur le marketplace
                            </Text>
                        </View>
                        <Icon name="chevronRight" size={18} color={theme.colors.primary} />
                    </Pressable>
                )}

                {/* Menu commun */}
                <View style={[commonStyles.card, { padding: 0, overflow: 'hidden' }]}>
                    {/* CV seulement pour les candidats */}
                    {isCandidate && (
                        <MenuItem
                            icon="fileText"
                            label="Mes CV"
                            onPress={() => router.push('/(screens)/cvList')}
                        />
                    )}
                    <MenuItem
                        icon="shield"
                        label="Confidentialité"
                        onPress={() => router.push('/(screens)/privacySettings')}
                    />
                    <MenuItem
                        icon="settings"
                        label="Paramètres"
                        onPress={() => router.push('/(screens)/settings')}
                    />
                    <MenuItem
                        icon="info"
                        label="À propos"
                        onPress={() => router.push('/(screens)/about')}
                        showBorder={false}
                    />
                </View>

                {/* Déconnexion */}
                <Pressable style={[commonStyles.row, styles.logoutButton]} onPress={signOut}>
                    <Icon name="logout" size={20} color={theme.colors.rose} />
                    <Text style={styles.logoutText}>Se déconnecter</Text>
                </Pressable>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: wp(5),
        paddingTop: hp(2),
        paddingBottom: hp(4),
        gap: hp(2),
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
        marginLeft: wp(4),
    },
    name: {
        fontSize: hp(2.2),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    role: {
        fontSize: hp(1.6),
        color: theme.colors.primary,
        marginTop: hp(0.3),
    },
    bioText: {
        fontSize: hp(1.6),
        color: theme.colors.text,
        lineHeight: hp(2.4),
    },
    bioEmpty: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: hp(2),
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
        gap: wp(2),
    },
    searchToggleIcon: {
        width: wp(10),
        height: wp(10),
        borderRadius: wp(5),
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchToggleIconActive: {
        backgroundColor: theme.colors.primary,
    },
    searchToggleInfo: {
        marginLeft: wp(3),
        flex: 1,
    },
    searchToggleTitle: {
        fontSize: hp(1.6),
        fontFamily: theme.fonts.medium,
        color: theme.colors.text,
    },
    rppsWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.warning + '15',
        padding: hp(2),
        borderRadius: theme.radius.lg,
        gap: wp(3),
        borderWidth: 1,
        borderColor: theme.colors.warning + '30',
    },
    rppsWarningTitle: {
        fontSize: hp(1.5),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.warning,
    },
    logoutButton: {
        justifyContent: 'center',
        padding: hp(2),
        gap: wp(2),
    },
    logoutText: {
        fontSize: hp(1.6),
        color: theme.colors.rose,
        fontFamily: theme.fonts.medium,
    },
    menuLabel: {
        fontSize: hp(1.6),
        color: theme.colors.text,
    },
    // Pharmacies section
    pharmaciesSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: hp(2),
        paddingBottom: hp(1.5),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
    },
    viewAllText: {
        fontSize: hp(1.4),
        fontFamily: theme.fonts.medium,
        color: theme.colors.primary,
    },
    pharmacyCompactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(3),
        padding: hp(1.5),
        paddingHorizontal: hp(2),
    },
    pharmacyCardBorder: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    pharmacyCompactIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pharmacyCompactName: {
        fontSize: hp(1.5),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    verifiedBadgeSmall: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: theme.colors.success + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addPharmacyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(3),
        backgroundColor: theme.colors.card,
        padding: hp(2),
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.primary + '30',
        borderStyle: 'dashed',
    },
    addPharmacyTitle: {
        fontSize: hp(1.6),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
        marginBottom: hp(0.3),
    },
});