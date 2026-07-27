import { api } from './api';
import type { Paginated } from './properties';

// Matches App\Http\Resources\NotificationResource.
export type AppNotification = {
  notification_id: number;
  user_id: number;
  type: string;
  notifiable_type: string | null;
  notifiable_id: number | null;
  conversation_id: number | null;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export type NotificationsPage = Paginated<AppNotification> & { unread_count: number };

export async function listNotifications(
  tab: 'all' | 'unread' | 'review' | 'reservation' = 'all',
  page = 1
): Promise<NotificationsPage> {
  const { data } = await api.get<NotificationsPage>('/notifications', { params: { tab, page } });
  return data;
}

export async function markNotificationRead(notificationId: number): Promise<void> {
  await api.post(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/notifications/read-all');
}

// Reservation-type notification links point at the web app's route (e.g.
// `.../reservations/{id}/agreement`) — extract the reservation id so the
// mobile client can deep-link into its own `/reservation/[id]` screen
// instead of opening a web URL. Returns null when the link isn't a
// reservation route (nothing to extract).
export function reservationIdFromLink(link: string | null): number | null {
  if (!link) return null;
  const match = link.match(/\/reservations\/(\d+)/);
  return match ? Number(match[1]) : null;
}
