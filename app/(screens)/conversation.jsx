import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useMessages } from '../../hooks/useMessaging';
import { messagingService } from '../../services/messagingService';
import { notificationService } from '../../services/notificationService';
import { blockService } from '../../services/blockService';
import { reportService, REPORT_REASON_LABELS, REPORT_CONTENT_TYPES } from '../../services/reportService';
import { favoritesService, FAVORITE_TYPES } from '../../services/favoritesService';
import { cvService } from '../../services/cvService';
import { formatConversationTime } from '../../helpers/dateUtils';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';

export default function Conversation() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams();
  const { user, isTitulaire, isCandidate } = useAuth();
  const flatListRef = useRef(null);

  const [conversationInfo, setConversationInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [inputText, setInputText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showOfferBanner, setShowOfferBanner] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [cvShared, setCvShared] = useState(false);
  const [cvLoading, setCvLoading] = useState(false);

  const { messages, loading, sending, hasMore, sendMessage, loadMore } = useMessages(matchId);

  // Charger les infos de la conversation
  useEffect(() => {
    const loadConversationInfo = async () => {
      if (!matchId || !user?.id) return;

      try {
        const info = await messagingService.getConversationByMatchId(matchId, user.id);
        setConversationInfo(info);

        // Marquer les notifications de cette conversation comme lues
        await notificationService.markConversationNotificationsAsRead(user.id, matchId);

        // Charger le statut de partage CV si candidat
        if (isCandidate) {
          const cvStatus = await cvService.isSharedInMatch(matchId);
          setCvShared(cvStatus.isShared);
        }
      } catch (err) {
        console.error('Error loading conversation info:', err);
      } finally {
        setLoadingInfo(false);
      }
    };

    loadConversationInfo();
  }, [matchId, user?.id, isCandidate]);

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || sending) return;

    const text = inputText;
    setInputText('');

    try {
      await sendMessage(text);
    } catch (err) {
      console.error('Error sending message:', err);
      setInputText(text);
    }
  }, [inputText, sending, sendMessage]);

  const handleBlock = async () => {
    const otherId = conversationInfo?.otherUser?.id;
    if (!otherId) return;

    Alert.alert(
      'Bloquer cet utilisateur',
      'Vous ne pourrez plus recevoir de messages de cette personne. Cette action est réversible depuis les paramètres.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Bloquer',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockService.blockUser(user.id, otherId);
              Alert.alert('Utilisateur bloqué', 'Vous ne recevrez plus de messages de cette personne.');
              setShowOptions(false);
              router.back();
            } catch (err) {
              Alert.alert('Erreur', err.message || 'Impossible de bloquer cet utilisateur');
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    setShowOptions(false);
    setShowReportModal(true);
  };

  const submitReport = async (reason) => {
    const otherId = conversationInfo?.otherUser?.id;
    if (!otherId) return;

    try {
      await reportService.createReport(user.id, REPORT_CONTENT_TYPES.PROFILE, otherId, reason);
      Alert.alert('Signalement envoyé', 'Merci pour votre signalement. Notre équipe va l\'examiner.');
      setShowReportModal(false);
    } catch (err) {
      Alert.alert('Erreur', err.message || 'Impossible d\'envoyer le signalement');
    }
  };

  const handleAddFavorite = async () => {
    const otherId = conversationInfo?.otherUser?.id;
    if (!otherId) return;

    try {
      // Déterminer le type de favori selon le contexte
      const favoriteType = isTitulaire ? FAVORITE_TYPES.CANDIDATE : FAVORITE_TYPES.JOB_OFFER;
      const targetId = isTitulaire ? otherId : (conversationInfo?.match?.job_offer_id || conversationInfo?.match?.internship_offer_id);

      if (!targetId) {
        Alert.alert('Erreur', 'Impossible d\'ajouter aux favoris');
        return;
      }

      await favoritesService.add(user.id, favoriteType, targetId);
      Alert.alert('Ajouté aux favoris', isTitulaire ? 'Ce candidat a été ajouté à vos favoris.' : 'Cette offre a été ajoutée à vos favoris.');
      setShowOptions(false);
    } catch (err) {
      if (err.message?.includes('déjà')) {
        Alert.alert('Déjà en favoris', 'Cet élément est déjà dans vos favoris.');
      } else {
        Alert.alert('Erreur', err.message || 'Impossible d\'ajouter aux favoris');
      }
    }
  };

  const navigateToOffer = () => {
    const offer = conversationInfo?.match?.job_offers || conversationInfo?.match?.internship_offers;
    if (!offer) return;

    const isJobOffer = !!conversationInfo?.match?.job_offer_id;
    router.push({
      pathname: isJobOffer ? '/(screens)/jobOfferDetail' : '/(screens)/internshipOfferDetail',
      params: { id: offer.id },
    });
  };

  const handleShareCv = async () => {
    if (!matchId || !user?.id) return;

    Alert.alert(
      'Partager votre CV',
      'L\'employeur pourra voir votre CV complet (nom, expériences détaillées, etc.). Voulez-vous continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Partager',
          onPress: async () => {
            setCvLoading(true);
            try {
              await cvService.shareInMatch(matchId, user.id);
              setCvShared(true);
              setShowOptions(false);
              Alert.alert('CV partagé', 'Votre CV est maintenant visible par l\'employeur.');
            } catch (err) {
              Alert.alert('Erreur', err.message || 'Impossible de partager le CV');
            } finally {
              setCvLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUnshareCv = async () => {
    if (!matchId || !user?.id) return;

    Alert.alert(
      'Révoquer le partage',
      'L\'employeur ne pourra plus voir votre CV complet. Voulez-vous continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Révoquer',
          style: 'destructive',
          onPress: async () => {
            setCvLoading(true);
            try {
              await cvService.unshareInMatch(matchId, user.id);
              setCvShared(false);
              setShowOptions(false);
              Alert.alert('Partage révoqué', 'Votre CV n\'est plus visible par l\'employeur.');
            } catch (err) {
              Alert.alert('Erreur', err.message || 'Impossible de révoquer le partage');
            } finally {
              setCvLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleViewOffer = () => {
    setShowOptions(false);
    navigateToOffer();
  };

  const handleViewCandidateCv = () => {
    setShowOptions(false);

    // Si le CV est partagé, ouvrir en mode partagé (complet)
    if (conversationInfo?.match?.cv_shared) {
      router.push({
        pathname: '/(screens)/cvView',
        params: { matchId, viewMode: 'shared' },
      });
    } else {
      // CV non partagé - informer l'employeur
      Alert.alert(
        'CV non partagé',
        'Le candidat n\'a pas encore partagé son CV complet. Vous pouvez lui demander de le faire via la conversation.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMe = item.sender_id === user?.id;
    const showDate = index === 0 ||
      new Date(item.created_at).toDateString() !==
      new Date(messages[index - 1]?.created_at).toDateString();

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>
              {new Date(item.created_at).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
        )}
        <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
          <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
              {item.content}
            </Text>
            <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
              {formatConversationTime(item.created_at)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const otherUser = conversationInfo?.otherUser;
  const offer = conversationInfo?.match?.job_offers || conversationInfo?.match?.internship_offers;

  if (loadingInfo) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg={theme.colors.background} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={commonStyles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <BackButton router={router} />

          <Pressable style={styles.headerInfo} onPress={() => {}}>
            {otherUser?.photo_url ? (
              <Image source={{ uri: otherUser.photo_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Icon name="user" size={20} color={theme.colors.gray} />
              </View>
            )}
            <View style={styles.headerText}>
              <Text style={styles.userName} numberOfLines={1}>
                {otherUser
                  ? `${otherUser.first_name} ${otherUser.last_name?.[0] || ''}.`
                  : 'Utilisateur'
                }
              </Text>
              {offer && (
                <Text style={styles.offerTitle} numberOfLines={1}>
                  {offer.title}
                </Text>
              )}
            </View>
          </Pressable>

          {/* Options button */}
          <Pressable style={styles.optionsButton} onPress={() => setShowOptions(true)}>
            <Icon name="moreVertical" size={22} color={theme.colors.text} />
          </Pressable>
        </View>

        {/* Offer reminder banner */}
        {showOfferBanner && offer && (
          <Pressable style={styles.offerBanner} onPress={() => setShowOfferModal(true)}>
            <View style={styles.offerBannerIcon}>
              <Icon name="briefcase" size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.offerBannerContent}>
              <Text style={styles.offerBannerLabel}>Match depuis l'offre</Text>
              <Text style={styles.offerBannerTitle} numberOfLines={1}>{offer.title}</Text>
            </View>
            <Pressable style={styles.offerBannerClose} onPress={() => setShowOfferBanner(false)}>
              <Icon name="x" size={16} color={theme.colors.textLight} />
            </Pressable>
          </Pressable>
        )}

        {/* CV shared banner for candidates */}
        {isCandidate && cvShared && (
          <View style={styles.cvSharedBanner}>
            <Icon name="checkCircle" size={16} color={theme.colors.success || '#22c55e'} />
            <Text style={styles.cvSharedText}>
              Votre CV complet est visible par l'employeur
            </Text>
          </View>
        )}

        {/* CV available banner for employers (titulaires) */}
        {isTitulaire && conversationInfo?.match?.cv_shared && (
          <Pressable
            style={styles.cvAvailableBanner}
            onPress={() => router.push({
              pathname: '/(screens)/cvView',
              params: { matchId, viewMode: 'shared' },
            })}
          >
            <Icon name="fileText" size={16} color={theme.colors.primary} />
            <Text style={styles.cvAvailableText}>
              Le candidat a partagé son CV complet
            </Text>
            <Icon name="chevronRight" size={16} color={theme.colors.primary} />
          </Pressable>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          inverted={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListHeaderComponent={
            hasMore ? (
              <Pressable style={styles.loadMoreButton} onPress={loadMore}>
                <Text style={styles.loadMoreText}>Charger plus</Text>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="messageCircle" size={40} color={theme.colors.gray} />
                <Text style={styles.emptyText}>
                  Envoyez le premier message !
                </Text>
              </View>
            )
          }
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Écrivez un message..."
            placeholderTextColor={theme.colors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <Pressable
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Icon name="send" size={20} color="white" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Options Modal */}
      <Modal visible={showOptions} transparent animationType="fade" onRequestClose={() => setShowOptions(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowOptions(false)}>
          <View style={styles.optionsModal}>
            {/* Option voir l'offre pour candidats */}
            {isCandidate && offer && (
              <>
                <Pressable style={styles.optionItem} onPress={handleViewOffer}>
                  <Icon name="briefcase" size={20} color={theme.colors.primary} />
                  <Text style={styles.optionText}>Voir l'offre</Text>
                </Pressable>
                <View style={styles.optionDivider} />
              </>
            )}

            {/* Option partage CV pour candidats */}
            {isCandidate && (
              <>
                <Pressable
                  style={styles.optionItem}
                  onPress={cvShared ? handleUnshareCv : handleShareCv}
                  disabled={cvLoading}
                >
                  <Icon
                    name={cvShared ? 'eyeOff' : 'fileText'}
                    size={20}
                    color={cvShared ? theme.colors.rose : theme.colors.primary}
                  />
                  <Text style={[styles.optionText, cvShared && { color: theme.colors.rose }]}>
                    {cvLoading ? 'Chargement...' : cvShared ? 'Masquer mon CV' : 'Montrer mon CV complet'}
                  </Text>
                </Pressable>
                <View style={styles.optionDivider} />
              </>
            )}

            {/* Option voir CV du candidat pour titulaires */}
            {isTitulaire && (
              <>
                <Pressable style={styles.optionItem} onPress={handleViewCandidateCv}>
                  <Icon name="fileText" size={20} color={theme.colors.primary} />
                  <Text style={styles.optionText}>Voir le CV du candidat</Text>
                </Pressable>
                <View style={styles.optionDivider} />
              </>
            )}

            <Pressable style={styles.optionItem} onPress={handleAddFavorite}>
              <Icon name="heart" size={20} color={theme.colors.primary} />
              <Text style={styles.optionText}>Ajouter aux favoris</Text>
            </Pressable>
            <View style={styles.optionDivider} />
            <Pressable style={styles.optionItem} onPress={handleReport}>
              <Icon name="flag" size={20} color={theme.colors.textLight} />
              <Text style={styles.optionText}>Signaler</Text>
            </Pressable>
            <View style={styles.optionDivider} />
            <Pressable style={styles.optionItem} onPress={handleBlock}>
              <Icon name="slash" size={20} color={theme.colors.rose} />
              <Text style={[styles.optionText, { color: theme.colors.rose }]}>Bloquer</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Report Modal */}
      <Modal visible={showReportModal} transparent animationType="slide" onRequestClose={() => setShowReportModal(false)}>
        <View style={styles.reportModalOverlay}>
          <View style={styles.reportModal}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Signaler cet utilisateur</Text>
              <Pressable onPress={() => setShowReportModal(false)}>
                <Icon name="x" size={24} color={theme.colors.text} />
              </Pressable>
            </View>
            <Text style={styles.reportSubtitle}>Choisissez une raison :</Text>
            {Object.entries(REPORT_REASON_LABELS).map(([reason, label]) => (
              <Pressable
                key={reason}
                style={styles.reportOption}
                onPress={() => submitReport(reason)}
              >
                <Text style={styles.reportOptionText}>{label}</Text>
                <Icon name="chevronRight" size={18} color={theme.colors.textLight} />
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Offer Preview Modal */}
      <Modal visible={showOfferModal} transparent animationType="slide" onRequestClose={() => setShowOfferModal(false)}>
        <View style={styles.reportModalOverlay}>
          <View style={styles.offerModal}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Offre d'emploi</Text>
              <Pressable onPress={() => setShowOfferModal(false)}>
                <Icon name="x" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            {offer && (
              <View style={styles.offerModalContent}>
                <View style={styles.offerModalIcon}>
                  <Icon name="briefcase" size={32} color={theme.colors.primary} />
                </View>

                <Text style={styles.offerModalTitle}>{offer.title}</Text>

                {offer.city && (
                  <View style={styles.offerModalRow}>
                    <Icon name="mapPin" size={16} color={theme.colors.textLight} />
                    <Text style={styles.offerModalCity}>{offer.city}</Text>
                  </View>
                )}

                <Text style={styles.offerModalHint}>
                  Vous avez matché avec cette offre
                </Text>

                <Pressable
                  style={styles.offerModalButton}
                  onPress={() => {
                    setShowOfferModal(false);
                    navigateToOffer();
                  }}
                >
                  <Text style={styles.offerModalButtonText}>Voir l'offre complète</Text>
                  <Icon name="arrowRight" size={18} color="white" />
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(3),
    gap: wp(2.5),
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.darkLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  userName: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.text,
  },
  offerTitle: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
  },
  optionsButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Offer banner
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    gap: wp(2.5),
  },
  offerBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerBannerContent: {
    flex: 1,
  },
  offerBannerLabel: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },
  offerBannerTitle: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: theme.colors.primary,
  },
  offerBannerClose: {
    padding: wp(1),
  },
  // CV shared banner (for candidates)
  cvSharedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    gap: wp(2),
  },
  cvSharedText: {
    fontSize: hp(1.3),
    color: '#166534',
    fontWeight: '500',
  },
  // CV available banner (for employers)
  cvAvailableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    gap: wp(2),
  },
  cvAvailableText: {
    flex: 1,
    fontSize: hp(1.4),
    color: theme.colors.primary,
    fontWeight: '500',
  },
  // Messages
  messagesContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    flexGrow: 1,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: hp(2),
  },
  dateText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    backgroundColor: theme.colors.darkLight,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.lg,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: hp(0.3),
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1),
    borderRadius: theme.radius.lg,
  },
  bubbleMe: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: hp(1.6),
    color: theme.colors.text,
    lineHeight: hp(2.2),
  },
  messageTextMe: {
    color: 'white',
  },
  messageTime: {
    fontSize: hp(1.1),
    color: theme.colors.textLight,
    marginTop: hp(0.3),
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Load more
  loadMoreButton: {
    alignSelf: 'center',
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    marginBottom: hp(1),
  },
  loadMoreText: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
  },
  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
    gap: hp(1.5),
  },
  emptyText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    gap: wp(2),
  },
  textInput: {
    flex: 1,
    minHeight: hp(5),
    maxHeight: hp(15),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    fontSize: hp(1.6),
    color: theme.colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.gray,
  },
  // Options modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsModal: {
    width: wp(70),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(5),
    gap: wp(3),
  },
  optionText: {
    fontSize: hp(1.7),
    color: theme.colors.text,
  },
  optionDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  // Report modal
  reportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  reportModal: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    paddingBottom: hp(4),
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  reportTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.text,
  },
  reportSubtitle: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
  },
  reportOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  reportOptionText: {
    fontSize: hp(1.6),
    color: theme.colors.text,
  },
  // Offer modal
  offerModal: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    paddingBottom: hp(4),
  },
  offerModalContent: {
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(3),
  },
  offerModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  offerModalTitle: {
    fontSize: hp(2.2),
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: hp(1),
  },
  offerModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    marginBottom: hp(2),
  },
  offerModalCity: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  offerModalHint: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginBottom: hp(3),
  },
  offerModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    borderRadius: theme.radius.lg,
    gap: wp(2),
  },
  offerModalButtonText: {
    fontSize: hp(1.7),
    fontWeight: '600',
    color: 'white',
  },
});
