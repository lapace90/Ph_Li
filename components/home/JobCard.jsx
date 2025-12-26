import { StyleSheet, Text, View, Pressable } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const JobCard = ({ job, onPress }) => {
    const getContractColor = (type) => {
        const colors = {
            CDI: theme.colors.success,
            CDD: theme.colors.secondary,
            vacation: theme.colors.warning,
            remplacement: theme.colors.primary,
            'temps-plein': theme.colors.success,
            'temps-partiel': theme.colors.warning,
            stage: theme.colors.secondary,
            alternance: theme.colors.primary,
        };
        return colors[type] || theme.colors.textLight;
    };

    const getContractLabel = (type) => {
        const labels = {
            CDI: 'CDI',
            CDD: 'CDD',
            vacation: 'Vacation',
            remplacement: 'Remplacement',
            'temps-plein': 'Temps plein',
            'temps-partiel': 'Temps partiel',
            stage: 'Stage',
            alternance: 'Alternance',
        };
        return labels[type] || type;
    };

    return (
        <Pressable
            style={styles.container}
            onPress={onPress}
        >
            <View style={styles.header}>
                <View style={[styles.contractBadge, { backgroundColor: getContractColor(job.contract_type) + '15' }]}>
                    <Text style={[styles.contractText, { color: getContractColor(job.contract_type) }]}>
                        {getContractLabel(job.contract_type)}
                    </Text>
                </View>
                {job.match_score && (
                    <View style={styles.matchBadge}>
                        <Text style={styles.matchText}>{job.match_score}%</Text>
                    </View>
                )}
            </View>

            <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
            <Text style={styles.pharmacy} numberOfLines={1}>{job.pharmacy_name}</Text>

            <View style={styles.footer}>
                <View style={styles.locationRow}>
                    <Icon name="mapPin" size={14} color={theme.colors.textLight} />
                    <Text style={styles.location}>{job.city}</Text>
                </View>
                <Text style={styles.distance}>{job.distance} km</Text>
            </View>
        </Pressable>
    );
};

export default JobCard;

const styles = StyleSheet.create({
    container: {
        width: wp(65),
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.xl,
        padding: hp(2),
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginRight: wp(3),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(1.5),
    },
    contractBadge: {
        paddingHorizontal: wp(2.5),
        paddingVertical: hp(0.4),
        borderRadius: theme.radius.md,
    },
    contractText: {
        fontSize: hp(1.3),
        fontFamily: theme.fonts.semiBold,
    },
    matchBadge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.3),
        borderRadius: theme.radius.sm,
    },
    matchText: {
        fontSize: hp(1.2),
        fontFamily: theme.fonts.bold,
        color: 'white',
    },
    title: {
        fontSize: hp(1.8),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
        marginBottom: hp(0.5),
    },
    pharmacy: {
        fontSize: hp(1.5),
        color: theme.colors.textLight,
        marginBottom: hp(1.5),
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
    },
    location: {
        fontSize: hp(1.4),
        color: theme.colors.textLight,
    },
    distance: {
        fontSize: hp(1.3),
        color: theme.colors.primary,
        fontFamily: theme.fonts.medium,
    },
});