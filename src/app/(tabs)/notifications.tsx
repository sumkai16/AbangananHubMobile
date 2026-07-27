import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { StaggeredItem } from '@/components/ui/staggered-item';
import { extractErrorMessage } from '@/lib/api-error';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  reservationIdFromLink,
  type AppNotification,
} from '@/lib/notifications';
import { relativeTime } from '@/lib/relative-time';

const TYPE_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  reservation: 'home-outline',
  agreement: 'document-text-outline',
  payment: 'card-outline',
  review: 'star-outline',
};

function NotificationRow({ notification }: { notification: AppNotification }) {
  const icon = TYPE_ICON[notification.type] ?? 'notifications-outline';
  return (
    <View className="flex-row items-start gap-3 border-b border-border py-3.5">
      <View
        className={`h-10 w-10 items-center justify-center rounded-full ${
          notification.is_read ? 'bg-section' : 'bg-secondary'
        }`}>
        <Ionicons name={icon} size={17} color={notification.is_read ? '#156F8C' : '#FFFFFF'} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          {!notification.is_read && <View className="h-1.5 w-1.5 rounded-full bg-secondary" />}
          <Text className="flex-1 text-[13.5px] font-bold text-text-primary" numberOfLines={1}>
            {notification.title}
          </Text>
          <Text className="shrink-0 text-[11px] text-text-muted">
            {relativeTime(notification.created_at)}
          </Text>
        </View>
        <Text className="mt-1 text-[12.5px] text-text-muted" numberOfLines={2}>
          {notification.message}
        </Text>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequestId = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    try {
      const result = await listNotifications('all');
      if (requestId !== latestRequestId.current) return;
      setNotifications(result.data);
      setUnreadCount(result.unread_count);
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

  async function handleRefresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      load();
    }
  }

  async function handleTap(notification: AppNotification) {
    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === notification.notification_id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      markNotificationRead(notification.notification_id).catch(() => {});
    }

    if (notification.conversation_id) {
      router.push(`/conversation/${notification.conversation_id}`);
      return;
    }
    const reservationId = reservationIdFromLink(notification.link);
    if (reservationId) {
      router.push(`/reservation/${reservationId}`);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
        <Text className="text-2xl font-black tracking-tight text-text-primary">Notifications</Text>
        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAllRead} hitSlop={8}>
            <Text className="text-[12.5px] font-semibold text-primary">Mark all read</Text>
          </Pressable>
        )}
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
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="notifications-outline" size={32} color="#2AA7A1" />
          <Text className="mt-3 text-center text-base font-semibold text-text-primary">
            No notifications yet
          </Text>
          <Text className="mt-1 text-center text-sm text-text-muted">
            Updates on your reservations and messages will show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.notification_id)}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item, index }) => (
            <StaggeredItem index={index}>
              <AnimatedPressable scaleTo={0.98} onPress={() => handleTap(item)}>
                <NotificationRow notification={item} />
              </AnimatedPressable>
            </StaggeredItem>
          )}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#156F8C" />
          }
        />
      )}
    </SafeAreaView>
  );
}
