import { StyleSheet, Dimensions } from 'react-native';
import { theme } from './theme';
import { hp, wp } from '../helpers/common';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const commonStyles = StyleSheet.create({
    // ============================================
    // CONTAINERS
    // ============================================
    flex1: {
        flex: 1,
    },
    screenContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        paddingHorizontal: wp(5),
        paddingBottom: hp(4),
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ============================================
    // HEADERS
    // ============================================
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.card,
    },
    headerNoBorder: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingTop: hp(2),
        paddingBottom: hp(1),
    },
    headerTitle: {
        fontSize: hp(1.8),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
        textAlign: 'center',
    },
    headerTitleLarge: {
        fontSize: hp(3),
        fontFamily: theme.fonts.bold,
        color: theme.colors.text,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerButtonSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    headerSpacerSmall: {
        width: 36,
    },

    // ============================================
    // SECTIONS
    // ============================================
    section: {
        marginBottom: hp(2.5),
        gap: hp(1.5),
    },
    sectionCompact: {
        marginBottom: hp(2),
        gap: hp(1),
    },
    sectionTitle: {
        fontSize: hp(1.7),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    sectionTitleSmall: {
        fontSize: hp(1.5),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    sectionHint: {
        fontSize: hp(1.3),
        color: theme.colors.textLight,
    },

    // ============================================
    // CARDS
    // ============================================
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.xl,
        padding: hp(2),
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardCompact: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: hp(1.5),
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardNoBorder: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.xl,
        padding: hp(2),
    },
    cardPressed: {
        opacity: 0.7,
    },

    // ============================================
    // INPUTS
    // ============================================
    input: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        fontSize: hp(1.6),
        fontFamily: theme.fonts.regular,
        color: theme.colors.text,
    },
    inputDisabled: {
        backgroundColor: theme.colors.gray + '30',
    },
    textArea: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        fontSize: hp(1.6),
        fontFamily: theme.fonts.regular,
        color: theme.colors.text,
        minHeight: hp(10),
        textAlignVertical: 'top',
    },
    label: {
        fontSize: hp(1.5),
        fontFamily: theme.fonts.medium,
        color: theme.colors.text,
        marginBottom: hp(0.5),
    },
    labelSmall: {
        fontSize: hp(1.3),
        color: theme.colors.textLight,
        marginBottom: hp(0.5),
    },
    hint: {
        fontSize: hp(1.3),
        color: theme.colors.textLight,
    },

    // ============================================
    // CHIPS
    // ============================================
    chip: {
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.8),
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    chipSmall: {
        paddingHorizontal: wp(2.5),
        paddingVertical: hp(0.5),
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    chipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    chipActiveSecondary: {
        backgroundColor: theme.colors.secondary,
        borderColor: theme.colors.secondary,
    },
    chipActiveSuccess: {
        backgroundColor: theme.colors.success,
        borderColor: theme.colors.success,
    },
    chipText: {
        fontSize: hp(1.4),
        color: theme.colors.text,
    },
    chipTextSmall: {
        fontSize: hp(1.2),
        color: theme.colors.text,
    },
    chipTextActive: {
        color: 'white',
        fontFamily: theme.fonts.medium,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(2),
    },
    chipsContainerCompact: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(1.5),
    },

    // ============================================
    // BADGES
    // ============================================
    badge: {
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.3),
        borderRadius: theme.radius.sm,
    },
    badgePrimary: {
        backgroundColor: theme.colors.primary + '15',
    },
    badgeSecondary: {
        backgroundColor: theme.colors.secondary + '15',
    },
    badgeSuccess: {
        backgroundColor: theme.colors.success + '15',
    },
    badgeText: {
        fontSize: hp(1.1),
        fontFamily: theme.fonts.medium,
    },
    badgeTextPrimary: {
        color: theme.colors.primary,
    },
    badgeTextSecondary: {
        color: theme.colors.secondary,
    },
    badgeTextSuccess: {
        color: theme.colors.success,
    },

    // ============================================
    // ROWS & LAYOUT
    // ============================================
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rowGap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(3),
    },
    rowGapSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },
    rowWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(2),
    },

    // ============================================
    // BUTTONS
    // ============================================
    buttonPrimary: {
        backgroundColor: theme.colors.primary,
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(6),
        borderRadius: theme.radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonPrimaryText: {
        color: 'white',
        fontSize: hp(1.6),
        fontFamily: theme.fonts.semiBold,
    },
    buttonSecondary: {
        backgroundColor: theme.colors.secondary,
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(6),
        borderRadius: theme.radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonSecondaryText: {
        color: 'white',
        fontSize: hp(1.6),
        fontFamily: theme.fonts.semiBold,
    },
    buttonOutline: {
        borderWidth: 1,
        borderColor: theme.colors.primary,
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(6),
        borderRadius: theme.radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonOutlineText: {
        color: theme.colors.primary,
        fontSize: hp(1.6),
        fontFamily: theme.fonts.medium,
    },
    buttonDanger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: wp(2),
        paddingVertical: hp(1.5),
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.rose + '10',
    },
    buttonDangerText: {
        fontSize: hp(1.5),
        color: theme.colors.rose,
        fontFamily: theme.fonts.medium,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonIcon: {
        padding: hp(1),
        borderRadius: theme.radius.md,
    },
    buttonIconPrimary: {
        backgroundColor: theme.colors.primary + '15',
    },

    // ============================================
    // FLOATING ACTION BUTTON
    // ============================================
    fab: {
        position: 'absolute',
        bottom: hp(3),
        right: wp(5),
        width: wp(14),
        height: wp(14),
        borderRadius: wp(7),
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },

    // ============================================
    // MODALS
    // ============================================
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalOverlayCentered: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: theme.radius.xxl,
        borderTopRightRadius: theme.radius.xxl,
        padding: wp(5),
        paddingBottom: hp(4),
    },
    modalContainerCentered: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.xxl,
        padding: wp(5),
        marginHorizontal: wp(5),
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: hp(2),
    },
    modalTitle: {
        fontSize: hp(2),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    modalCloseButton: {
        padding: hp(0.5),
    },

    // ============================================
    // EMPTY STATES
    // ============================================
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(10),
    },
    emptyIcon: {
        width: wp(20),
        height: wp(20),
        borderRadius: wp(10),
        backgroundColor: theme.colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    emptyTitle: {
        fontSize: hp(2),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: hp(1.5),
        color: theme.colors.textLight,
        textAlign: 'center',
        marginTop: hp(1),
    },

    // ============================================
    // LOADING
    // ============================================
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    loadingText: {
        marginTop: hp(2),
        fontSize: hp(1.5),
        color: theme.colors.textLight,
    },

    // ============================================
    // FOOTER
    // ============================================
    footer: {
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    footerNoBorder: {
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
        backgroundColor: theme.colors.background,
    },

    // ============================================
    // LISTS
    // ============================================
    listContainer: {
        paddingHorizontal: wp(5),
        paddingTop: hp(2),
        paddingBottom: hp(4),
        gap: hp(1.5),
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        padding: hp(2),
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    listItemContent: {
        flex: 1,
        marginLeft: wp(3),
    },
    listItemTitle: {
        fontSize: hp(1.6),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    listItemSubtitle: {
        fontSize: hp(1.4),
        color: theme.colors.textLight,
        marginTop: hp(0.3),
    },

    // ============================================
    // MENU ITEMS
    // ============================================
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
    menuItemLabel: {
        flex: 1,
        marginLeft: wp(3),
        fontSize: hp(1.6),
        color: theme.colors.text,
    },

    // ============================================
    // ACCORDION
    // ============================================
    accordionContainer: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.xl,
        marginBottom: hp(1.5),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: hp(2),
    },
    accordionHeaderExpanded: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    accordionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },
    accordionTitle: {
        fontSize: hp(1.7),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    accordionBadge: {
        backgroundColor: theme.colors.primary,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(1.5),
    },
    accordionBadgeText: {
        fontSize: hp(1.1),
        color: 'white',
        fontFamily: theme.fonts.semiBold,
    },
    accordionContent: {
        padding: hp(2),
        paddingTop: hp(1),
    },

    // ============================================
    // FORMS
    // ============================================
    formGroup: {
        marginBottom: hp(2),
    },
    formRow: {
        flexDirection: 'row',
        gap: wp(3),
    },
    formHalf: {
        flex: 1,
    },

    // ============================================
    // CHECKBOX
    // ============================================
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },
    checkboxLabel: {
        fontSize: hp(1.5),
        color: theme.colors.text,
    },

    // ============================================
    // DIVIDERS
    // ============================================
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: hp(2),
    },
    dividerLight: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: hp(1),
    },

    // ============================================
    // TEXT STYLES
    // ============================================
    textPrimary: {
        color: theme.colors.primary,
    },
    textSecondary: {
        color: theme.colors.secondary,
    },
    textSuccess: {
        color: theme.colors.success,
    },
    textDanger: {
        color: theme.colors.rose,
    },
    textLight: {
        color: theme.colors.textLight,
    },
    textBold: {
        fontFamily: theme.fonts.bold,
    },
    textSemiBold: {
        fontFamily: theme.fonts.semiBold,
    },
    textMedium: {
        fontFamily: theme.fonts.medium,
    },
    textCenter: {
        textAlign: 'center',
    },

    // ============================================
    // WEBVIEW / PDF
    // ============================================
    webview: {
        flex: 1,
        width: SCREEN_WIDTH,
    },

    // ============================================
    // SHADOWS
    // ============================================
    shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    shadowMedium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },

    // ============================================
    // PROGRESS STEPS (formulaires multi-étapes)
    // ============================================
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(2),
        paddingHorizontal: wp(5),
    },
    progressItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressDotActive: {
        backgroundColor: theme.colors.primary,
    },
    progressDotCompleted: {
        backgroundColor: theme.colors.success,
    },
    progressNumber: {
        fontSize: hp(1.4),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.textLight,
    },
    progressNumberActive: {
        color: 'white',
    },
    progressLine: {
        width: wp(8),
        height: 2,
        backgroundColor: theme.colors.border,
        marginHorizontal: wp(1),
    },
    progressLineActive: {
        backgroundColor: theme.colors.success,
    },

    // ============================================
    // TABS
    // ============================================
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    tabsContainerPill: {
        flexDirection: 'row',
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: 4,
        marginHorizontal: wp(5),
        marginBottom: hp(2),
    },
    tab: {
        flex: 1,
        paddingVertical: hp(1.5),
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabPill: {
        flex: 1,
        paddingVertical: hp(1.2),
        alignItems: 'center',
        borderRadius: theme.radius.md,
    },
    tabActive: {
        borderBottomColor: theme.colors.primary,
    },
    tabPillActive: {
        backgroundColor: theme.colors.primary,
    },
    tabText: {
        fontSize: hp(1.5),
        color: theme.colors.textLight,
    },
    tabTextActive: {
        color: theme.colors.primary,
        fontFamily: theme.fonts.semiBold,
    },
    tabPillTextActive: {
        color: 'white',
    },

    // ============================================
    // STATUS (points/badges dynamiques)
    // ============================================
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(0.5),
        paddingHorizontal: wp(3),
        borderRadius: theme.radius.md,
        gap: wp(2),
    },
    statusText: {
        fontSize: hp(1.3),
        fontFamily: theme.fonts.semiBold,
    },
    statusPill: {
        paddingVertical: hp(0.3),
        paddingHorizontal: wp(2),
        borderRadius: theme.radius.sm,
    },
    statusPillText: {
        fontSize: hp(1.15),
        fontFamily: theme.fonts.medium,
    },

    // ============================================
    // OFFER CARDS (liste annonces)
    // ============================================
    offerCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.xl,
        padding: hp(2),
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    offerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: hp(1.2),
    },
    offerTitle: {
        fontSize: hp(1.7),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    offerSubtitle: {
        fontSize: hp(1.35),
        color: theme.colors.textLight,
    },
    offerLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1.5),
    },
    offerLocationText: {
        fontSize: hp(1.3),
        color: theme.colors.textLight,
    },
    offerFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: hp(1.2),
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    offerDate: {
        fontSize: hp(1.25),
        color: theme.colors.textLight,
    },
    offerActions: {
        flexDirection: 'row',
        gap: wp(2),
    },

    // ============================================
    // ACTION BUTTONS (icônes rondes)
    // ============================================
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },

    // ============================================
    // STATS CARDS
    // ============================================
    statsRow: {
        flexDirection: 'row',
        gap: wp(2),
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: hp(1.5),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    statValue: {
        fontSize: hp(2.2),
        fontFamily: theme.fonts.bold,
        color: theme.colors.text,
    },
    statLabel: {
        fontSize: hp(1.1),
        color: theme.colors.textLight,
        marginTop: 2,
    },

    // ============================================
    // CANDIDATE CARDS
    // ============================================
    candidateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.xl,
        padding: hp(1.5),
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: wp(3),
    },
    candidateInfo: {
        flex: 1,
    },
    candidateName: {
        fontSize: hp(1.6),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    candidateDetails: {
        fontSize: hp(1.3),
        color: theme.colors.textLight,
        marginTop: 2,
    },

    // ============================================
    // TYPE SELECTION CARDS
    // ============================================
    typeCard: {
        flex: 1,
        padding: hp(2),
        borderRadius: theme.radius.xl,
        borderWidth: 2,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
        alignItems: 'center',
        gap: hp(1),
    },
    typeCardSelected: {
        borderColor: theme.colors.primary,
    },
    typeCardTitle: {
        fontSize: hp(1.7),
        fontFamily: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    typeCardDesc: {
        fontSize: hp(1.2),
        color: theme.colors.textLight,
        textAlign: 'center',
    },

    // ============================================
    // PREVIEW CARD
    // ============================================
    previewCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.xl,
        padding: hp(2.5),
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    previewTitle: {
        fontSize: hp(2),
        fontFamily: theme.fonts.bold,
        color: theme.colors.text,
    },
    previewSubtitle: {
        fontSize: hp(1.4),
        color: theme.colors.textLight,
        marginTop: hp(0.3),
    },
    previewInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
        marginBottom: hp(0.8),
    },
    previewInfoText: {
        fontSize: hp(1.4),
        color: theme.colors.textLight,
    },
    previewDescription: {
        fontSize: hp(1.45),
        color: theme.colors.text,
        lineHeight: hp(2.2),
    },
    previewTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: hp(0.8),
    },
    previewTag: {
        paddingVertical: hp(0.5),
        paddingHorizontal: wp(2.5),
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.background,
    },
    previewTagText: {
        fontSize: hp(1.3),
        color: theme.colors.textLight,
    },

    // ============================================
    // LOCATION INFO
    // ============================================
    locationInfo: {
        backgroundColor: theme.colors.card,
        padding: hp(2),
        borderRadius: theme.radius.lg,
        gap: hp(1),
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },
    locationText: {
        fontSize: hp(1.5),
        color: theme.colors.text,
        fontFamily: theme.fonts.medium,
    },
    locationTextLight: {
        fontSize: hp(1.4),
        color: theme.colors.textLight,
    },
});