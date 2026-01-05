import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  StyleSheet, Text, View, FlatList, Pressable, TextInput, 
  KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import { useMessages } from '../../hooks/useMessaging';
import { messagingService } from '../../services/messagingService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Icon from '../../assets/icons/Icon';

export default function Conversation() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams();
  const { user } = useAuth();
  const flatListRef = useRef(null);

  const { messages, loading, sending, hasMore, sendMessage, loadMore } = useMessages(matchId);

  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [matchData, setMatchData] = useState(null);

  // Charger les infos de la conversation
  useEffect(() => {
    const loadConversationData = async () => {
      if (!matchId || !user?.id) return;

      try {
        const { match, otherUser: other } = await messagingService.getConversationByMatchId(matchId, user.id);
        setMatchData(match);
        setOtherUser(other);
      } catch (err) {
        console.error('Error loading conversation:', err);
      }
    };

    loadConversationData();
  }, [matchId, user?.id]);

  // Scroll vers le bas quand nouveaux messages
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
      // Remettre le texte en cas d'erreur
      setInputText(text);
    }
  }, [inputText, sending, sendMessage]);

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const prevDate = new Date(prevMsg.created_at).toDateString();
    return currentDate !== prevDate;
  };

  const renderMessage = ({ item, index }) => {
    const isOwn = item.sender_id === user?.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDateSeparator = shouldShowDateSeparator(item, prevMessage);

    return (
      <View>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {formatDateSeparator(item.created_at)}
            </Text>
          </View>
        )}
        <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
          <View style={[styles.messageBubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
            <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
              {item.content}
            </Text>
            <View style={styles.messageFooter}>
              <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
                {formatMessageTime(item.created_at)}
              </Text>
              {isOwn && (
                <Icon 
                  name={item.read ? 'checkCircle' : 'check'} 
                  size={12} 
                  color={item.read ? theme.colors.primary : 'rgba(255,255,255,0.6)'} 
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    if (!hasMore) return null;
    return (
      <Pressable style={styles.loadMoreButton} onPress={loadMore}>
        <Text style={styles.loadMoreText}>Charger les messages précédents</Text>
      </Pressable>
    );
  };

  const offer = matchData?.job_offers || matchData?.internship_offers;

  if (loading && messages.length === 0) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Icon name="arrowLeft" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Conversation</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrowLeft" size={24} color={theme.colors.text} />
        </Pressable>
        
        <Pressable style={styles.headerCenter}>
          {otherUser?.photo_url ? (
            <Image source={{ uri: otherUser.photo_url }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
              <Icon name="user" size={18} color={theme.colors.gray} />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {otherUser 
                ? `${otherUser.first_name} ${otherUser.last_name?.[0] || ''}.`
                : 'Conversation'
              }
            </Text>
            {offer && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {offer.title}
              </Text>
            )}
          </View>
        </Pressable>

        <Pressable style={styles.headerButton}>
          <Icon name="info" size={22} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={commonStyles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Votre message..."
            placeholderTextColor={theme.colors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <Pressable 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: wp(3),
  },
  backButton: {
    padding: wp(1),
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.darkLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: hp(1.9),
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: hp(1.3),
    color: theme.colors.primary,
  },
  headerButton: {
    padding: wp(1),
  },
  headerSpacer: {
    width: 40,
  },
  // Messages
  messagesContent: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: hp(2),
  },
  dateSeparatorText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    backgroundColor: theme.colors.background,
    paddingHorizontal: wp(3),
  },
  messageRow: {
    marginBottom: hp(1),
    alignItems: 'flex-start',
  },
  messageRowOwn: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: theme.radius.lg,
  },
  bubbleOwn: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  messageText: {
    fontSize: hp(1.6),
    color: theme.colors.text,
    lineHeight: hp(2.3),
  },
  messageTextOwn: {
    color: 'white',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: wp(1),
    marginTop: hp(0.5),
  },
  messageTime: {
    fontSize: hp(1.1),
    color: theme.colors.textLight,
  },
  messageTimeOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  loadMoreButton: {
    alignSelf: 'center',
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
  },
  loadMoreText: {
    fontSize: hp(1.4),
    color: theme.colors.primary,
  },
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    gap: wp(2),
  },
  textInput: {
    flex: 1,
    minHeight: hp(5),
    maxHeight: hp(15),
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    fontSize: hp(1.6),
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
});