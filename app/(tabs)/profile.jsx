import { StyleSheet, Text, View, Pressable, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { usePrivacy } from '../../hooks/usePrivacy';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';
import RoleAvatar from '../../components/common/RoleAvatar';
import RppsBadge from '../../components/common/RppsBadge';
import ProfileInfoCard from '../../components/profile/ProfileInfoCard';

export default function Profile() {
    const router = useRouter();
    const { session, user, profile, signOut } = useAuth();
    const { privacy, setSearchable } = usePrivacy(session?.user?.id);

    const handleToggleSearchable = async (value) => {
        await setSearchable(value);
    };

    const getRoleLabel = () => {
        const roles = {
            preparateur: 'Préparateur(trice)',
            titulaire: 'Titulaire',
            conseiller: 'Conseiller(ère)',
            etudiant: 'Étudiant(e)',
        };
        return roles[user?.user_type] || 'Utilisateur';
    };

    const formatAvailability = () => {
        if (!profile?.availability_date) return null;
        const date = new Date(profile.availability_date);
        const today = new Date();
        if (date <= today) return 'Immédiatement';
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatContractType = () => {
        if (!profile?.preferred_contract_type) return null;
        const labels = {
            CDI: 'CDI',
            CDD: 'CDD',
            vacation: 'Vacation',
            remplacement: 'Remplacement',
            stage: 'Stage',
            alternance: 'Alternance',
        };
        return labels[profile.preferred_contract_type] || profile.preferred_contract_type;
    };

    const formatRelocation = () => {
        if (profile?.willing_to_relocate === true) return 'Oui';
        if (profile?.willing_to_relocate === false) return 'Non';
        return null;
    };

    const formatRadius = () => {
        if (!profile?.search_radius_km) return 'France entière';
        return `${profile.search_radius_km} km`;
    };

    const getLocationDisplay = () => {
        if (privacy?.show_exact_location) {
            return profile?.current_city || 'Non renseignée';
        }
        return profile?.current_region || 'Non renseignée';
    };

    return (
        <ScreenWrapper bg={theme.colors.background}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Mon Profil</Text>
                    <Pressable
                        style={styles.editHeaderButton}
                        onPress={() => router.push('/(screens)/editProfile')}
                    >
                        <Icon name="edit" size={20} color={theme.colors.primary} />
                    </Pressable>
                </View>

                {/* Carte profil principale */}
                <View style={styles.profileCard}>
                    <RoleAvatar
                        role={user?.user_type}
                        gender={profile?.gender}
                        size={wp(20)}
                    />
                    <View style={styles.profileInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name}>
                                {profile?.first_name} {profile?.last_name}
                            </Text>
                            <RppsBadge verified={false} size="small" />
                        </View>
                        <Text style={styles.role}>{getRoleLabel()}</Text>
                        <View style={styles.locationRow}>
                            <Icon name="mapPin" size={14} color={theme.colors.textLight} />
                            <Text style={styles.location}>{getLocationDisplay()}</Text>
                        </View>
                    </View>
                </View>

                {/* Toggle Recherche active */}
                <View style={styles.searchToggle}>
                    <View style={styles.searchToggleContent}>
                        <View style={[
                            styles.searchToggleIcon,
                            privacy?.searchable_by_recruiters && styles.searchToggleIconActive,
                        ]}>
                            <Icon
                                name="search"
                                size={22}
                                color={privacy?.searchable_by_recruiters ? 'white' : theme.colors.primary}
                            />
                        </View>
                        <View style={styles.searchToggleText}>
                            <Text style={styles.searchToggleTitle}>
                                {privacy?.searchable_by_recruiters ? 'Recherche active' : 'Recherche inactive'}
                            </Text>
                            <Text style={styles.searchToggleDescription}>
                                {privacy?.searchable_by_recruiters
                                    ? 'Les recruteurs peuvent voir votre profil'
                                    : 'Votre profil est invisible aux recruteurs'}
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={privacy?.searchable_by_recruiters || false}
                        onValueChange={handleToggleSearchable}
                        trackColor={{ false: theme.colors.gray, true: theme.colors.primary + '50' }}
                        thumbColor={privacy?.searchable_by_recruiters ? theme.colors.primary : theme.colors.darkLight}
                    />
                </View>

                {/* Infos professionnelles */}
                <ProfileInfoCard
                    title="Informations professionnelles"
                    items={[
                        {
                            icon: 'fileText',
                            label: 'Contrat recherché',
                            value: formatContractType(),
                        },
                        {
                            icon: 'briefcase',
                            label: 'Expérience',
                            value: profile?.experience_years
                                ? `${profile.experience_years} an${profile.experience_years > 1 ? 's' : ''}`
                                : null,
                        },
                        {
                            icon: 'star',
                            label: 'Spécialisations',
                            value: profile?.specializations?.join(', '),
                        },
                        {
                            icon: 'calendar',
                            label: 'Disponibilité',
                            value: formatAvailability(),
                        },
                        {
                            icon: 'map',
                            label: 'Rayon de recherche',
                            value: formatRadius(),
                        },
                        {
                            icon: 'home',
                            label: 'Prêt à déménager',
                            value: formatRelocation(),
                        },
                    ]}
                />

                {/* Infos contact */}
                <ProfileInfoCard
                    title="Contact"
                    items={[
                        {
                            icon: 'phone',
                            label: 'Téléphone',
                            value: profile?.phone,
                        },
                        {
                            icon: 'mapPin',
                            label: 'Localisation',
                            value: profile?.current_city
                                ? `${profile.current_city}${profile.current_postal_code ? ` (${profile.current_postal_code})` : ''}`
                                : null,
                        },
                    ]}
                />

                {/* Menu */}
                <View style={styles.menuSection}>
                    <MenuItem
                        icon="fileText"
                        label="Mes CV"
                        onPress={() => router.push('/(screens)/cvList')}
                    />
                    <MenuItem
                        icon="lock"
                        label="Confidentialité"
                        onPress={() => router.push('/(screens)/privacySettings')}
                    />
                    <MenuItem
                        icon="settings"
                        label="Paramètres"
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon="info"
                        label="À propos"
                        onPress={() => { }}
                        showBorder={false}
                    />
                </View>

                {/* Déconnexion */}
                <Pressable style={styles.logoutButton} onPress={signOut}>
                    <Icon name="logout" size={20} color={theme.colors.rose} />
                    <Text style={styles.logoutText}>Se déconnecter</Text>
                </Pressable>
            </ScrollView>
        </ScreenWrapper>
    );
}

const MenuItem = ({ icon, label, onPress, showBorder = true }) => (
    <Pressable
        style={[styles.menuItem, !showBorder && styles.menuItemNoBorder]}
        onPress={onPress}
    >
        <Icon name={icon} size={22} color={theme.colors.text} />
        <Text style={styles.menuLabel}>{label}</Text>
        <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
    </Pressable>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: wp(5),
        paddingTop: hp(6),
        paddingBottom: hp(4),
        gap: hp(2),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: hp(3),
        fontFamily: theme.fonts.bold,
        color: theme.colors.text,
    },
    editHeaderButton: {
        padding: hp(1),
        backgroundColor: theme.colors.primary + '15',
        borderRadius: theme.radius.md,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        padding: hp(2),
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    profileInfo: {
        flex: 1,
        marginLeft: wp(4),
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },
    name: {
        fontSize: hp(2.2),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    role: {
        fontSize: hp(1.6),
        color: theme.colors.primary,
        fontFamily: theme.fonts.medium,
        marginTop: 2,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(0.5),
        gap: wp(1),
    },
    location: {
        fontSize: hp(1.5),
        color: theme.colors.textLight,
    },
    searchToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        padding: hp(2),
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchToggleContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchToggleIcon: {
        width: wp(11),
        height: wp(11),
        borderRadius: wp(5.5),
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchToggleIconActive: {
        backgroundColor: theme.colors.primary,
    },
    searchToggleText: {
        flex: 1,
        marginLeft: wp(3),
    },
    searchToggleTitle: {
        fontSize: hp(1.8),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    searchToggleDescription: {
        fontSize: hp(1.4),
        color: theme.colors.textLight,
        marginTop: 2,
    },
    menuSection: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(2),
        paddingHorizontal: wp(4),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    menuItemNoBorder: {
        borderBottomWidth: 0,
    },
    menuLabel: {
        flex: 1,
        marginLeft: wp(4),
        fontSize: hp(1.9),
        color: theme.colors.text,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(2),
        gap: wp(2),
    },
    logoutText: {
        fontSize: hp(1.9),
        color: theme.colors.rose,
        fontFamily: theme.fonts.medium,
    },
});