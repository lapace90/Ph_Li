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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { messagingService } from '../../services/messagingService';
import { pharmacyListingService } from '../../services/pharmacyListingService';
import { supabase } from '../../lib/supabase';
import { formatConversationTime } from '../../helpers/dateUtils';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Icon from '../../assets/icons/Icon';
import { getListingTypeLabel, getListingTypeColor } from '../../constants/listingOptions';

export default function ListingConversation() {
  const router = useRouter();
  const { listingId, isNew } = useLocalSearchParams();
  const { user } = useAuth();
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();

  const [listing, setListing] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');

  // Charger l'annonce et les messages
  useEffect(() => {
    loadData();
  }, [listingId, user?.id]);

  // S'abonner aux nouveaux messages en temps réel
  useEffect(() => {
    if (!listingId) return;

    const unsubscribe = messagingService.subscribeToListingMessages(
      listingId,
      (newMessage) => {
        setMessages(prev => {
          // Éviter les doublons
          if (prev.some(m => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
        // Marquer comme lu si ce n'est pas notre message
        if (newMessage.sender_id !== user?.id) {
          messagingService.markListingMessagesAsRead(listingId, user.id);
        }
      }
    );

    return unsubscribe;
  }, [listingId, user?.id]);

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const loadData = async () => {
    if (!listingId || !user?.id) return;

    try {
      setLoading(true);

      // Charger l'annonce
      const listingData = await pharmacyListingService.getById(listingId);
      setListing(listingData);

      // Charger les messages
      const messagesData = await messagingService.getListingMessages(listingId);
      setMessages(messagesData);

      // Marquer les messages comme lus
      await messagingService.markListingMessagesAsRead(listingId, user.id);

      // Charger le profil de l'autre utilisateur
      // Si je suis le propriétaire, chercher parmi les expéditeurs
      // Sinon, charger le profil du propriétaire
      let otherUserId = null;

      if (listingData.user_id === user.id) {
        // Je suis le propriétaire, chercher l'autre utilisateur dans les messages
        otherUserId = messagesData.find(m => m.sender_id !== user.id)?.sender_id;
      } else {
        // Je ne suis pas le propriétaire, l'autre utilisateur est le propriétaire
        otherUserId = listingData.user_id;
      }

      if (otherUserId) {
        const { data } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, photo_url')
          .eq('id', otherUserId)
          .single();
        setOtherUser(data);
      }
    } catch (error) {
      console.error('Error loading listing conversation:', error);
      Alert.alert('Erreur', 'Impossible de charger la conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || sending) return;

    const text = inputText;
    setInputText('');
    setSending(true);

    try {
      await messagingService.sendListingMessage(listingId, user.id, text);
      // Ne pas ajouter manuellement - le realtime s'en chargera
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer le message');
      setInputText(text);
    } finally {
      setSending(false);
    }
  }, [inputText, sending, listingId, user?.id]);

  const renderMessage = ({ item }) => {
    const isMe = item.sender_id === user?.id;
    const time = formatConversationTime(item.created_at);

    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
          <Text style={[styles.messageText, isMe && styles.messageTextMe]}>{item.content}</Text>
          <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>{time}</Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    if (!listing) return null;

    const photo = listing.photos?.[0];

    return (
      <Pressable
        style={styles.listingCard}
        onPress={() => router.push({ pathname: '/(screens)/listingDetail', params: { id: listingId } })}
      >
        {photo ? (
          <Image source={{ uri: photo }} style={styles.listingPhoto} contentFit="cover" />
        ) : (
          <View style={[styles.listingPhoto, styles.listingPhotoEmpty]}>
            <Icon name="home" size={24} color={theme.colors.gray} />
          </View>
        )}
        <View style={styles.listingInfo}>
          <View style={[styles.typeBadge, { backgroundColor: getListingTypeColor(listing.type) }]}>
            <Text style={styles.typeBadgeText}>{getListingTypeLabel(listing.type)}</Text>
          </View>
          <Text style={styles.listingTitle} numberOfLines={2}>{listing.title}</Text>
          <Text style={commonStyles.hint} numberOfLines={1}>
            {listing.city}, {listing.region}
          </Text>
        </View>
        <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
      </Pressable>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={commonStyles.header}>
          <BackButton />
          <Text style={commonStyles.headerTitle}>Chargement...</Text>
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  const headerTitle = listing?.anonymized
    ? 'Conversation anonyme'
    : otherUser
    ? `${otherUser.first_name} ${otherUser.last_name?.[0] || ''}.`
    : 'Conversation';

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={[commonStyles.header, { paddingTop: insets.top + hp(1) }]}>
          <BackButton />
          <View style={styles.headerCenter}>
            {otherUser?.photo_url && !listing?.anonymized && (
              <Image source={{ uri: otherUser.photo_url }} style={styles.headerPhoto} />
            )}
            <View>
              <Text style={commonStyles.headerTitle}>{headerTitle}</Text>
              {listing && (
                <Text style={styles.headerSubtitle}>{getListingTypeLabel(listing.type)}</Text>
              )}
            </View>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, hp(1)) }]}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Votre message..."
            placeholderTextColor={theme.colors.textLight}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    paddingLeft: wp(2),
  },
  headerPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerSubtitle: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    fontFamily: theme.fonts.regular,
  },
  listingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: wp(3),
    marginBottom: hp(2),
    borderRadius: theme.radius.lg,
    gap: wp(3),
  },
  listingPhoto: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.md,
  },
  listingPhotoEmpty: {
    backgroundColor: theme.colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingInfo: {
    flex: 1,
    gap: hp(0.5),
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: theme.radius.sm,
  },
  typeBadgeText: {
    color: 'white',
    fontSize: hp(1.2),
    fontFamily: theme.fonts.semiBold,
  },
  listingTitle: {
    fontSize: hp(1.6),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  messagesList: {
    padding: wp(4),
    paddingBottom: hp(2),
  },
  messageRow: {
    marginBottom: hp(1.5),
    flexDirection: 'row',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: wp(3),
    borderRadius: theme.radius.lg,
  },
  messageBubbleOther: {
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: 4,
  },
  messageBubbleMe: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: hp(1.7),
    color: theme.colors.text,
    lineHeight: hp(2.2),
  },
  messageTextMe: {
    color: 'white',
  },
  messageTime: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    marginTop: hp(0.5),
  },
  messageTimeMe: {
    color: 'rgba(255,255,255,0.8)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: wp(4),
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: wp(2),
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xl,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    fontSize: hp(1.7),
    color: theme.colors.text,
    maxHeight: hp(12),
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
    opacity: 0.5,
  },
});
