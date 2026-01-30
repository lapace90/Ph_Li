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
import { supabase } from '../../lib/supabase';
import { blockService } from '../../services/blockService';
import { reportService, REPORT_REASON_LABELS, REPORT_CONTENT_TYPES } from '../../services/reportService';
import { favoritesService, FAVORITE_TYPES } from '../../services/favoritesService';
import { formatConversationTime } from '../../helpers/dateUtils';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';

export default function AnimatorConversation() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams();
  const { user, isAnimator } = useAuth();
  const flatListRef = useRef(null);

  const [conversationInfo, setConversationInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMissionBanner, setShowMissionBanner] = useState(true);

  // Charger les infos du match animateur
  useEffect(() => {
    const loadConversationInfo = async () => {
      if (!matchId || !user?.id) return;

      try {
        const { data: match, error } = await supabase
          .from('animator_matches')
          .select(`
            *,
            mission:animation_missions(*),
            animator:animator_profiles(*, profile:profiles(*)),
            laboratory:laboratory_profiles(*)
          `)
          .eq('id', matchId)
          .single();

        if (error) throw error;

        // Déterminer l'autre utilisateur
        let otherUser;
        if (isAnimator) {
          otherUser = {
            id: match.laboratory?.id,
            name: match.laboratory?.company_name || match.laboratory?.brand_name || 'Laboratoire',
            photo_url: match.laboratory?.logo_url,
          };
        } else {
          otherUser = {
            id: match.animator?.id,
            name: match.animator?.profile
              ? `${match.animator.profile.first_name} ${match.animator.profile.last_name?.[0] || ''}.`
              : 'Animateur',
            photo_url: match.animator?.profile?.photo_url,
          };
        }

        setConversationInfo({ match, otherUser, mission: match.mission });
      } catch (err) {
        console.error('Error loading animator conversation info:', err);
      } finally {
        setLoadingInfo(false);
      }
    };

    loadConversationInfo();
  }, [matchId, user?.id, isAnimator]);

  // Charger les messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!matchId) return;

      try {
        const { data, error } = await supabase
          .from('animator_messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('Error loading animator messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [matchId]);

  // Subscription temps réel
  useEffect(() => {
    if (!matchId) return;

    const subscription = supabase
      .channel(`animator_messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'animator_messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [matchId]);

  // Marquer comme lu
  useEffect(() => {
    if (!matchId || !user?.id || messages.length === 0) return;

    supabase
      .from('animator_messages')
      .update({ read: true })
      .eq('match_id', matchId)
      .neq('sender_id', user.id)
      .eq('read', false)
      .then(() => {});
  }, [matchId, user?.id, messages.length]);

  // Scroll vers le bas
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || sending || !matchId || !user?.id) return;

    const text = inputText;
    setInputText('');
    setSending(true);

    try {
      const { data, error } = await supabase
        .from('animator_messages')
        .insert({
          match_id: matchId,
          sender_id: user.id,
          content: text.trim(),
          read: false,
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => {
        if (prev.find(m => m.id === data.id)) return prev;
        return [...prev, data];
      });

      await supabase
        .from('animator_matches')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', matchId);
    } catch (err) {
      console.error('Error sending animator message:', err);
      setInputText(text);
    } finally {
      setSending(false);
    }
  }, [inputText, sending, matchId, user?.id]);

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
      const favoriteType = isAnimator ? FAVORITE_TYPES.LABORATORY : FAVORITE_TYPES.ANIMATOR;
      await favoritesService.add(user.id, favoriteType, otherId);
      Alert.alert('Ajouté aux favoris', isAnimator ? 'Ce laboratoire a été ajouté à vos favoris.' : 'Cet animateur a été ajouté à vos favoris.');
      setShowOptions(false);
    } catch (err) {
      if (err.message?.includes('déjà') || err.message?.includes('Limite')) {
        Alert.alert('Information', err.message);
      } else {
        Alert.alert('Erreur', err.message || 'Impossible d\'ajouter aux favoris');
      }
    }
  };

  const navigateToMission = () => {
    const mission = conversationInfo?.mission;
    if (!mission) return;

    router.push({
      pathname: '/(screens)/missionDetail',
      params: { id: mission.id },
    });
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
  const mission = conversationInfo?.mission;

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
    <ScreenWrapper bg={theme.colors.background}>
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
                <Icon name={isAnimator ? 'briefcase' : 'user'} size={20} color={theme.colors.gray} />
              </View>
            )}
            <View style={styles.headerText}>
              <Text style={styles.userName} numberOfLines={1}>
                {otherUser?.name || 'Utilisateur'}
              </Text>
              {mission && (
                <Text style={styles.missionTitle} numberOfLines={1}>
                  {mission.title}
                </Text>
              )}
            </View>
          </Pressable>

          {/* Options button */}
          <Pressable style={styles.optionsButton} onPress={() => setShowOptions(true)}>
            <Icon name="moreVertical" size={22} color={theme.colors.text} />
          </Pressable>
        </View>

        {/* Mission reminder banner */}
        {showMissionBanner && mission && (
          <Pressable style={styles.missionBanner} onPress={navigateToMission}>
            <View style={styles.missionBannerIcon}>
              <Icon name="briefcase" size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.missionBannerContent}>
              <Text style={styles.missionBannerLabel}>Match depuis la mission</Text>
              <Text style={styles.missionBannerTitle} numberOfLines={1}>{mission.title}</Text>
            </View>
            <Pressable style={styles.missionBannerClose} onPress={() => setShowMissionBanner(false)}>
              <Icon name="x" size={16} color={theme.colors.textLight} />
            </Pressable>
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
          ListEmptyComponent={
            loadingMessages ? (
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
  missionTitle: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
  },
  optionsButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Mission banner
  missionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    gap: wp(2.5),
  },
  missionBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionBannerContent: {
    flex: 1,
  },
  missionBannerLabel: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },
  missionBannerTitle: {
    fontSize: hp(1.5),
    fontWeight: '600',
    color: theme.colors.primary,
  },
  missionBannerClose: {
    padding: wp(1),
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
});
