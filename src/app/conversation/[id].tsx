import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
import { Button } from '@/components/ui/button';
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
import { cancelReservation, TERMINAL_STATUSES } from '@/lib/reservations';

function MessageBubble({
  message,
  isMine,
  isOriginal,
}: {
  message: Message;
  isMine: boolean;
  isOriginal: boolean;
}) {
  if (message.is_system) {
    return (
      <View className="my-1 items-center px-8">
        <Text className="text-center text-[11px] text-text-muted">{message.message}</Text>
      </View>
    );
  }

  return (
    <View>
      {isOriginal && (
        <Text className="mb-1.5 mt-2 text-[10.5px] font-bold uppercase tracking-wide text-text-muted">
          Original message
        </Text>
      )}
      <View className={`my-1 max-w-[80%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
        <View
          className={`rounded-2xl px-3.5 py-2.5 ${
            isOriginal
              ? 'rounded-bl-md bg-section'
              : isMine
                ? 'rounded-br-md bg-secondary'
                : 'rounded-bl-md border border-border bg-surface'
          }`}>
          <Text
            className={`text-[14px] ${isOriginal ? 'text-text-primary' : isMine ? 'text-white' : 'text-text-primary'}`}>
            {message.message}
          </Text>
        </View>
        <Text className="mt-1 text-[10px] text-text-muted">
          {new Date(message.sent_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </View>
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
  const [isCancelling, setIsCancelling] = useState(false);
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

  function handleCancelReservation() {
    const reservationId = conversation?.activeReservation?.reservation_id;
    if (!reservationId) return;

    Alert.alert('Cancel reservation?', 'This cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel reservation',
        style: 'destructive',
        onPress: async () => {
          setIsCancelling(true);
          try {
            const updated = await cancelReservation(reservationId);
            setConversation((prev) => (prev ? { ...prev, activeReservation: updated } : prev));
          } catch (err) {
            Alert.alert('Could not cancel', extractErrorMessage(err));
          } finally {
            setIsCancelling(false);
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color="#156F8C" />
      </View>
    );
  }

  if (error || !conversation) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-center text-sm font-semibold text-error">
          {error ?? 'Conversation not found'}
        </Text>
      </View>
    );
  }

  const isActive = conversation.status === 'Active';
  const isLandlordSide = user?.user_id === conversation.landlord_id;
  const canResolve = isActive && isLandlordSide;
  const otherPartyName = conversation.other_party?.first_name ?? 'them';
  const reservation = conversation.activeReservation;
  const clock = reservation?.move_in_clock;
  const canCancel = reservation && !TERMINAL_STATUSES.includes(reservation.rental_status);
  const cover = conversation.property?.media?.[0]?.media_url;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom header — replaces the native Stack title so the thread can
          carry the counterparty's identity as content, not chrome. */}
      <View className="border-b border-border bg-surface px-4 pb-3 pt-3">
        <Pressable onPress={() => router.back()} hitSlop={8} className="flex-row items-center gap-1 self-start">
          <Ionicons name="chevron-back" size={16} color="#156F8C" />
          <Text className="text-[13px] font-semibold text-primary">All conversations</Text>
        </Pressable>

        <View className="mt-3 flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <Text className="text-[14px] font-bold text-white">
              {conversation.other_party?.first_name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-text-primary" numberOfLines={1}>
              {otherPartyName} {conversation.other_party?.last_name}
            </Text>
            {!!conversation.property && (
              <Text className="text-[12px] text-text-muted" numberOfLines={1}>
                {conversation.property.title}
              </Text>
            )}
          </View>
          {canResolve && (
            <Pressable onPress={handleResolve} hitSlop={10} className="items-center justify-center">
              <Ionicons name="checkmark-done-outline" size={20} color="#156F8C" />
            </Pressable>
          )}
        </View>
      </View>

      {!!reservation && (
        <View className="border-b border-border bg-surface px-4 py-3">
          <StageStepper reservation={reservation} />
        </View>
      )}

      {/* Status-appropriate action bar — copy matches the web app's
          chat-panel.blade.php tenant branches exactly, not reinvented. */}
      {!isLandlordSide && !!reservation && (
        <View className="border-b border-border bg-surface px-4 py-3">
          {reservation.rental_status === 'Inquiry' && (
            <View className="flex-row items-center gap-2">
              <Text className="flex-1 text-center text-[12px] font-medium text-text-muted">
                Waiting for the landlord to respond
              </Text>
              <Button
                title="Cancel"
                variant="danger"
                fullWidth={false}
                isLoading={isCancelling}
                onPress={handleCancelReservation}
              />
            </View>
          )}

          {reservation.rental_status === 'Under Negotiation' && (
            <View className="flex-row items-center gap-2">
              <Text className="flex-1 text-center text-[12px] font-medium text-text-muted">
                Discuss the terms with the landlord
              </Text>
              <Button
                title="Cancel"
                variant="danger"
                fullWidth={false}
                isLoading={isCancelling}
                onPress={handleCancelReservation}
              />
            </View>
          )}

          {reservation.rental_status === 'Pending Rental Agreement' && (
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <Button
                  title="View & sign agreement"
                  onPress={() => router.push(`/reservation/${reservation.reservation_id}/agreement`)}
                />
              </View>
              <Button
                title="Cancel"
                variant="danger"
                fullWidth={false}
                isLoading={isCancelling}
                onPress={handleCancelReservation}
              />
            </View>
          )}

          {reservation.rental_status === 'Rental Agreement Signed' && !!clock && (
            <>
              <MoveInClockCard
                clock={clock}
                reservation={reservation}
                landlordName={conversation.landlord?.first_name ?? 'the landlord'}
              />
              <View className="mt-2.5 flex-row items-center gap-2">
                <View className="flex-1">
                  <Text className="text-[12px] font-bold text-text-primary">
                    Payment held by AbangananHub
                  </Text>
                  <Text className="text-[11px] text-text-muted">
                    Confirm move-in to release the held deposit to the landlord.
                  </Text>
                </View>
                <Button
                  title="Confirm move-in"
                  variant="cta"
                  fullWidth={false}
                  onPress={() => router.push(`/reservation/${reservation.reservation_id}/agreement`)}
                />
              </View>
            </>
          )}

          {reservation.rental_status === 'Rental Agreement Signed' && !clock && (
            <Button
              title="Proceed to payment"
              onPress={() => router.push(`/reservation/${reservation.reservation_id}/agreement`)}
            />
          )}

          {reservation.rental_status === 'Occupied' && (
            <Text className="text-center text-[12px] font-medium text-text-primary">
              You are occupying this unit
            </Text>
          )}
        </View>
      )}

      {!!conversation.property && (
        <Pressable
          onPress={() => router.push(`/property/${conversation.property_id}`)}
          className="flex-row items-center gap-3 border-b border-border bg-surface px-4 py-3">
          {cover ? (
            <Image source={{ uri: cover }} style={{ height: 44, width: 44, borderRadius: 10 }} contentFit="cover" />
          ) : (
            <View className="h-11 w-11 items-center justify-center rounded-[10px] bg-section">
              <Ionicons name="home-outline" size={18} color="#2AA7A1" />
            </View>
          )}
          <View className="flex-1">
            <Text className="text-[13px] font-semibold text-text-primary" numberOfLines={1}>
              {conversation.property.title}
            </Text>
            {!!conversation.unit && (
              <Text className="text-[11.5px] text-text-muted" numberOfLines={1}>
                {conversation.unit.unit_label}
                {!!conversation.unit.rental_fee &&
                  ` · ₱${Number(conversation.unit.rental_fee).toLocaleString()}/mo`}
              </Text>
            )}
          </View>
        </Pressable>
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
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              isMine={item.sender_id === user?.user_id}
              isOriginal={index === 0 && !item.is_system}
            />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center">
              <Ionicons name="chatbubble-outline" size={28} color="#2AA7A1" />
              <Text className="mt-2 text-center text-sm font-semibold text-text-primary">
                Say hello
              </Text>
              <Text className="mt-1 text-center text-xs text-text-muted">
                Messages you send here go straight to {otherPartyName}.
              </Text>
            </View>
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        {isActive ? (
          <View className="flex-row items-end gap-2 border-t border-border bg-surface px-3 py-2.5">
            <TextInput
              className="max-h-24 flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-[14px] text-text-primary"
              placeholder={`Message ${otherPartyName}...`}
              placeholderTextColor="#94A3B8"
              value={draft}
              onChangeText={setDraft}
              multiline
            />
            <Button
              title="Send"
              fullWidth={false}
              disabled={!draft.trim()}
              isLoading={isSending}
              onPress={handleSend}
            />
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
