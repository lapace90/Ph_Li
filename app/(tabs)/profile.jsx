import { StyleSheet, Text, View, Pressable, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { usePrivacy } from '../../hooks/usePrivacy';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import RoleAvatar from '../../components/common/RoleAvatar';
import Icon from '../../assets/icons/Icon';
import Avatar from '../../components/common/Avatar';
import RppsBadge from '../../components/common/RppsBadge';

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

    return (
        <ScreenWrapper bg={theme.colors.background}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Profil</Text>
                    <Pressable
                        style={styles.editButton}
                        onPress={() => router.push('/(screens)/editProfile')}
                    >
                        <Icon name="edit" size={20} color={theme.colors.primary} />
                    </Pressable>
                </View>

                {/* Carte profil principale */}
                <View style={styles.profileCard}>
                    {profile?.avatar_url ? (
                        <Avatar
                            uri={profile.avatar_url}
                            size={hp(10)}
                            rounded
                        />
                    ) : (
                        <RoleAvatar
                            role={user?.user_type}
                            gender={profile?.gender}
                            size={hp(10)}
                        />
                    )}
                    <View style={styles.profileInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name}>
                                {profile?.first_name} {profile?.last_name}
                            </Text>
                            {user?.rpps_verified && <RppsBadge size="small" />}
                        </View>
                        <Text style={styles.role}>{getRoleLabel()}</Text>
                        {getLocation() && (
                            <View style={styles.locationRow}>
                                <Icon name="mapPin" size={14} color={theme.colors.textLight} />
                                <Text style={styles.locationText}>{getLocation()}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Bio */}
                {profile?.bio ? (
                    <View style={styles.bioCard}>
                        <Text style={styles.bioText}>{profile.bio}</Text>
                    </View>
                ) : (
                    <Pressable
                        style={styles.bioEmpty}
                        onPress={() => router.push('/(screens)/profileEdit')}
                    >
                        <Icon name="edit" size={18} color={theme.colors.textLight} />
                        <Text style={styles.bioEmptyText}>Ajouter une présentation</Text>
                    </Pressable>
                )}

                {/* Toggle recherche */}
                <View style={styles.searchToggle}>
                    <View style={styles.searchToggleLeft}>
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
                            <Text style={styles.searchToggleDesc}>
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
                        thumbColor={privacy?.searchable_by_recruiters ? theme.colors.primary : theme.colors.darkLight}
                    />
                </View>

                {/* Infos rapides */}
                <View style={styles.quickInfoCard}>
                    {formatAvailability() && (
                        <View style={styles.quickInfoRow}>
                            <Icon name="calendar" size={18} color={theme.colors.primary} />
                            <Text style={styles.quickInfoText}>{formatAvailability()}</Text>
                        </View>
                    )}
                    {getExperience() && (
                        <View style={styles.quickInfoRow}>
                            <Icon name="briefcase" size={18} color={theme.colors.primary} />
                            <Text style={styles.quickInfoText}>{getExperience()}</Text>
                        </View>
                    )}
                    {formatContractTypes() && (
                        <View style={styles.quickInfoRow}>
                            <Icon name="fileText" size={18} color={theme.colors.primary} />
                            <Text style={styles.quickInfoText}>{formatContractTypes()}</Text>
                        </View>
                    )}
                    {formatRadius() && (
                        <View style={styles.quickInfoRow}>
                            <Icon name="map" size={18} color={theme.colors.primary} />
                            <Text style={styles.quickInfoText}>Recherche dans un rayon de {formatRadius()}</Text>
                        </View>
                    )}
                    {profile?.willing_to_relocate && (
                        <View style={styles.quickInfoRow}>
                            <Icon name="home" size={18} color={theme.colors.primary} />
                            <Text style={styles.quickInfoText}>Prêt(e) à déménager</Text>
                        </View>
                    )}
                    {profile?.specializations?.length > 0 && (
                        <View style={styles.quickInfoRow}>
                            <Icon name="star" size={18} color={theme.colors.primary} />
                            <Text style={styles.quickInfoText}>{profile.specializations.join(', ')}</Text>
                        </View>
                    )}
                </View>

                {/* Menu */}
                <View style={styles.menuCard}>
                    <MenuItem
                        icon="fileText"
                        label="Mes CV"
                        onPress={() => router.push('/(screens)/cvList')}
                    />
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
        <Icon name={icon} size={20} color={theme.colors.text} />
        <Text style={styles.menuLabel}>{label}</Text>
        <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
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
    editButton: {
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
        fontSize: hp(1.5),
        color: theme.colors.primary,
        fontFamily: theme.fonts.medium,
        marginTop: hp(0.3),
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(0.5),
        gap: wp(1),
    },
    locationText: {
        fontSize: hp(1.4),
        color: theme.colors.textLight,
    },
    bioCard: {
        backgroundColor: theme.colors.card,
        padding: hp(2),
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    bioText: {
        fontSize: hp(1.5),
        color: theme.colors.text,
        lineHeight: hp(2.2),
    },
    bioEmpty: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(2),
        backgroundColor: theme.colors.card,
        padding: hp(2),
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
    },
    bioEmptyText: {
        fontSize: hp(1.5),
        color: theme.colors.textLight,
    },
    searchToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.card,
        padding: hp(2),
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchToggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
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
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    searchToggleDesc: {
        fontSize: hp(1.3),
        color: theme.colors.textLight,
        marginTop: hp(0.2),
    },
    quickInfoCard: {
        backgroundColor: theme.colors.card,
        padding: hp(2),
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: hp(1.2),
    },
    quickInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(3),
    },
    quickInfoText: {
        flex: 1,
        fontSize: hp(1.5),
        color: theme.colors.text,
    },
    menuCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(1.8),
        paddingHorizontal: wp(4),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    menuItemNoBorder: {
        borderBottomWidth: 0,
    },
    menuLabel: {
        flex: 1,
        marginLeft: wp(3),
        fontSize: hp(1.6),
        color: theme.colors.text,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(1.5),
        gap: wp(2),
    },
    logoutText: {
        fontSize: hp(1.6),
        color: theme.colors.rose,
        fontFamily: theme.fonts.medium,
    },
});