import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MoveInClockCard } from '@/components/move-in-clock';
import { StageStepper } from '@/components/stage-stepper';
import { extractErrorMessage } from '@/lib/api-error';
import { useAuth } from '@/lib/auth-context';
import {
  getConversation,
  resolveConversation,
  sendMessage,
  type Conversation,
  type Message,
} from '@/lib/conversations';
import { getEcho } from '@/lib/echo';

function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  if (message.is_system) {
    return (
      <View className="my-1 items-center px-8">
        <Text className="text-center text-[11px] text-text-muted">{message.message}</Text>
      </View>
    );
  }

  return (
    <View className={`my-1 max-w-[80%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
      <View
        className={`rounded-2xl px-3.5 py-2.5 ${
          isMine ? 'rounded-br-md bg-secondary' : 'rounded-bl-md border border-border bg-surface'
        }`}>
        <Text className={`text-[14px] ${isMine ? 'text-white' : 'text-text-primary'}`}>
          {message.message}
        </Text>
      </View>
      <Text className="mt-1 text-[10px] text-text-muted">
        {new Date(message.sent_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
      </Text>
    </View>
  );
}

export default function ConversationThreadScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Number(id);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    try {
      const data = await getConversation(conversationId);
      setConversation(data);
      setMessages([...(data.messages ?? [])].sort((a, b) => a.message_id - b.message_id));
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, [conversationId]);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  // Real-time via Echo on conversation.{id} — see plans/mobile-wbs.md M7.3.
  // The server also broadcasts to the recipient's own user.{id} channel
  // (handled by the Messages list, not here) for the case where this
  // screen isn't open.
  useEffect(() => {
    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`conversation.${conversationId}`);
    channel.listen('.MessageSent', (event: { message_id: number; sender_id: number | null; sender_name: string | null; is_system: boolean; message: string; sent_at: string }) => {
      setMessages((prev) => {
        if (prev.some((m) => m.message_id === event.message_id)) return prev;
        return [
          ...prev,
          {
            message_id: event.message_id,
            conversation_id: conversationId,
            sender_id: event.sender_id,
            message: event.message,
            is_read: false,
            is_system: event.is_system,
            sent_at: event.sent_at,
          },
        ];
      });
    });

    return () => {
      channel.stopListening('.MessageSent');
      echo.leave(`conversation.${conversationId}`);
    };
  }, [conversationId]);

  async function handleSend() {
    const text = draft.trim();
    if (!text) return;

    setDraft('');
    setIsSending(true);
    try {
      const message = await sendMessage(conversationId, text);
      setMessages((prev) =>
        prev.some((m) => m.message_id === message.message_id) ? prev : [...prev, message]
      );
    } catch (err) {
      setDraft(text);
      Alert.alert('Could not send', extractErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  }

  async function handleResolve() {
    Alert.alert('Mark as resolved?', 'You can still view the conversation afterward.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark resolved',
        onPress: async () => {
          try {
            const updated = await resolveConversation(conversationId);
            setConversation((prev) => (prev ? { ...prev, status: updated.status } : prev));
          } catch (err) {
            Alert.alert('Could not resolve', extractErrorMessage(err));
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={{ title: 'Conversation' }} />
        <ActivityIndicator color="#156F8C" />
      </View>
    );
  }

  if (error || !conversation) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Stack.Screen options={{ title: 'Conversation' }} />
        <Text className="text-center text-sm font-semibold text-error">
          {error ?? 'Conversation not found'}
        </Text>
      </View>
    );
  }

  const isActive = conversation.status === 'Active';
  const isLandlordSide = user?.user_id === conversation.landlord_id;
  const canResolve = isActive && isLandlordSide;
  const clock = conversation.activeReservation?.move_in_clock;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: `${conversation.other_party?.first_name ?? ''} ${conversation.other_party?.last_name ?? ''}`.trim(),
          headerRight: canResolve
            ? () => (
                <Pressable
                  onPress={handleResolve}
                  hitSlop={12}
                  className="items-center justify-center pr-1">
                  <Ionicons name="checkmark-done-outline" size={20} color="#156F8C" />
                </Pressable>
              )
            : undefined,
        }}
      />

      {conversation.property && (
        <Pressable
          onPress={() => router.push(`/property/${conversation.property_id}`)}
          className="border-b border-border bg-surface px-4 py-2.5">
          <Text className="text-[12px] font-semibold text-text-primary" numberOfLines={1}>
            {conversation.property.title}
          </Text>
          {!!conversation.unit && (
            <Text className="text-[11px] text-text-muted" numberOfLines={1}>
              {conversation.unit.unit_label}
            </Text>
          )}
        </Pressable>
      )}

      {!!conversation.activeReservation && (
        <View className="border-b border-border bg-surface px-4 py-3">
          <StageStepper reservation={conversation.activeReservation} />
        </View>
      )}

      {!!clock && (
        <View className="px-4 pt-3">
          <MoveInClockCard
            clock={clock}
            reservation={conversation.activeReservation!}
            landlordName={
              isLandlordSide
                ? conversation.other_party?.first_name ?? 'the tenant'
                : conversation.landlord?.first_name ?? 'the landlord'
            }
          />
        </View>
      )}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item.message_id)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          renderItem={({ item }) => (
            <MessageBubble message={item} isMine={item.sender_id === user?.user_id} />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center">
              <Ionicons name="chatbubble-outline" size={28} color="#2AA7A1" />
              <Text className="mt-2 text-center text-sm font-semibold text-text-primary">
                Say hello
              </Text>
              <Text className="mt-1 text-center text-xs text-text-muted">
                Messages you send here go straight to {conversation.other_party?.first_name ?? 'them'}.
              </Text>
            </View>
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        {isActive ? (
          <View className="flex-row items-end gap-2 border-t border-border bg-surface px-3 py-2.5">
            <TextInput
              className="max-h-24 flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-[14px] text-text-primary"
              placeholder="Message..."
              placeholderTextColor="#94A3B8"
              value={draft}
              onChangeText={setDraft}
              multiline
            />
            <Pressable
              onPress={handleSend}
              disabled={!draft.trim() || isSending}
              hitSlop={6}
              className={`h-11 w-11 items-center justify-center rounded-full ${
                draft.trim() ? 'bg-secondary' : 'bg-border'
              }`}>
              <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <View className="border-t border-border bg-section px-4 py-3">
            <Text className="text-center text-[12px] font-semibold text-text-muted">
              This conversation is {conversation.status.toLowerCase()}.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
