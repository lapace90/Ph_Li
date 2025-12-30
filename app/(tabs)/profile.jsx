// app/(tabs)/profile.jsx

import { StyleSheet, Text, View, Pressable, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
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

    const MenuItem = ({ icon, label, onPress, showBorder = true }) => (
        <Pressable
            style={[commonStyles.menuItem, !showBorder && commonStyles.menuItemNoBorder]}
            onPress={onPress}
        >
            <Icon name={icon} size={20} color={theme.colors.text} />
            <Text style={commonStyles.menuItemLabel}>{label}</Text>
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
                        onPress={() => router.push('/(screens)/editProfile')}
                    >
                        <Icon name="edit" size={20} color={theme.colors.primary} />
                    </Pressable>
                </View>

                {/* Carte profil principale */}
                <View style={commonStyles.card}>
                    <View style={commonStyles.row}>
                        {profile?.photo_url ? (
                            <Avatar uri={profile.photo_url} size={hp(10)} rounded />
                        ) : (
                            <RoleAvatar role={user?.user_type} gender={profile?.gender} size={hp(10)} />
                        )}
                        <View style={styles.profileInfo}>
                            <View style={[commonStyles.row, { gap: wp(2) }]}>
                                <Text style={styles.name}>
                                    {profile?.first_name} {profile?.last_name}
                                </Text>
                                {user?.rpps_verified && <RppsBadge size="small" />}
                            </View>
                            <Text style={styles.role}>{getRoleLabel()}</Text>
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
                        onPress={() => router.push('/(screens)/editProfile')}
                    >
                        <Icon name="edit" size={18} color={theme.colors.textLight} />
                        <Text style={commonStyles.hint}>Ajouter une présentation</Text>
                    </Pressable>
                )}

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
                            thumbColor={privacy?.searchable_by_recruiters ? theme.colors.primary : theme.colors.darkLight}
                        />
                    </View>
                </View>

                {/* Infos rapides */}
                <View style={[commonStyles.card, { gap: hp(1.2) }]}>
                    {formatAvailability() && (
                        <View style={[commonStyles.row, { gap: wp(3) }]}>
                            <Icon name="calendar" size={18} color={theme.colors.primary} />
                            <Text style={commonStyles.flex1}>{formatAvailability()}</Text>
                        </View>
                    )}
                    {getExperience() && (
                        <View style={[commonStyles.row, { gap: wp(3) }]}>
                            <Icon name="briefcase" size={18} color={theme.colors.primary} />
                            <Text style={commonStyles.flex1}>{getExperience()}</Text>
                        </View>
                    )}
                    {formatContractTypes() && (
                        <View style={[commonStyles.row, { gap: wp(3) }]}>
                            <Icon name="fileText" size={18} color={theme.colors.primary} />
                            <Text style={commonStyles.flex1}>{formatContractTypes()}</Text>
                        </View>
                    )}
                    {formatRadius() && (
                        <View style={[commonStyles.row, { gap: wp(3) }]}>
                            <Icon name="map" size={18} color={theme.colors.primary} />
                            <Text style={commonStyles.flex1}>Recherche dans un rayon de {formatRadius()}</Text>
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

                {/* Menu */}
                <View style={[commonStyles.card, { padding: 0, overflow: 'hidden' }]}>
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
        paddingTop: hp(6),
        paddingBottom: hp(4),
        gap: hp(2),
    },
    editButton: {
        padding: hp(1),
        backgroundColor: theme.colors.primary + '15',
        borderRadius: theme.radius.md,
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
        fontSize: hp(1.5),
        color: theme.colors.primary,
        fontFamily: theme.fonts.medium,
        marginTop: hp(0.3),
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
    logoutButton: {
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