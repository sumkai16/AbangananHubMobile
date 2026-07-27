import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { extractErrorMessage } from '@/lib/api-error';
import { useAuth } from '@/lib/auth-context';
import { listConversations, type Conversation } from '@/lib/conversations';
import { getEcho } from '@/lib/echo';
import { relativeTime } from '@/lib/relative-time';

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const cover = conversation.property?.media?.[0]?.media_url;
  // The preview is whatever the latest message actually says — including
  // system messages ("signed the rental agreement", "paid rent for Aug
  // 2026", "proposed a key handover"). No separate "status caption" field
  // is fabricated; the real message text already reads as one.
  const preview = conversation.latestMessage?.message;
  const unread = !!conversation.has_unread;

  return (
    <View className="flex-row items-start gap-3 border-b border-border py-3.5">
      {cover ? (
        <Image source={{ uri: cover }} style={{ height: 52, width: 52, borderRadius: 26 }} contentFit="cover" />
      ) : (
        <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-secondary">
          <Text className="text-[17px] font-bold text-white">
            {conversation.other_party?.first_name?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
      )}

      <View className="flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-1.5">
            {unread && <View className="h-1.5 w-1.5 rounded-full bg-secondary" />}
            <Text className="flex-1 text-[14px] font-bold text-text-primary" numberOfLines={1}>
              {conversation.other_party?.first_name} {conversation.other_party?.last_name}
            </Text>
          </View>
          {!!conversation.latestMessage?.sent_at && (
            <Text className="shrink-0 text-[11px] text-text-muted">
              {relativeTime(conversation.latestMessage.sent_at)}
            </Text>
          )}
        </View>

        {!!preview && (
          <Text className="mt-1 text-[12.5px] text-text-muted" numberOfLines={2}>
            {preview}
          </Text>
        )}

        {conversation.status !== 'Active' && (
          <Text className="mt-1 text-[11.5px] font-bold text-primary">{conversation.status}</Text>
        )}
      </View>
    </View>
  );
}

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequestId = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    try {
      const result = await listConversations('all');
      if (requestId !== latestRequestId.current) return;
      setConversations(result.data);
      setError(null);
    } catch (err) {
      if (requestId !== latestRequestId.current) return;
      setError(extractErrorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      load().finally(() => setIsLoading(false));
    }, [load])
  );

  // A message arriving on *any* conversation should bump this list's unread
  // dot and preview without the user having to leave the thread and come
  // back — subscribe on the user's own channel, not per-conversation.
  useEffect(() => {
    if (!user) return;
    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`user.${user.user_id}`);
    channel.listen('.MessageSent', () => load());

    return () => {
      channel.stopListening('.MessageSent');
      echo.leave(`user.${user.user_id}`);
    };
  }, [user, load]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 pb-3 pt-2">
        <Text className="text-2xl font-black tracking-tight text-text-primary">Messages</Text>
      </View>

      {error && (
        <View className="mx-4 mb-3 rounded-lg border border-error/30 bg-error/10 px-4 py-2.5">
          <Text className="text-xs font-semibold text-error">{error}</Text>
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#156F8C" />
        </View>
      ) : conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="chatbubble-outline" size={32} color="#2AA7A1" />
          <Text className="mt-3 text-center text-base font-semibold text-text-primary">
            No messages yet
          </Text>
          <Text className="mt-1 text-center text-sm text-text-muted">
            Conversations start when you inquire about a property.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.conversation_id)}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/conversation/${item.conversation_id}`)}>
              <ConversationRow conversation={item} />
            </Pressable>
          )}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#156F8C" />
          }
        />
      )}
    </SafeAreaView>
  );
}
