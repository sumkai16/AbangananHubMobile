import { api } from './api';
import type { Property, PropertyUnit } from './properties';
import { cacheReservation, type Reservation } from './reservations';
import type { AuthUser } from './auth';

export type ConversationStatus = 'Active' | 'Resolved' | 'Cancelled';

// Matches App\Http\Resources\MessageResource. `ApiResource::attr()` omits a
// column entirely rather than nulling it when the model instance doesn't
// have it loaded — a message straight out of `create()` (the store()
// response) doesn't carry is_read/is_system, which only exist as DB
// defaults until the row is refetched. Both are therefore optional here,
// not `boolean`; treat "absent" the same as `false` when reading them.
export type Message = {
  message_id: number;
  conversation_id: number;
  sender_id: number | null;
  message: string;
  is_read?: boolean;
  is_system?: boolean;
  sent_at: string;
  sender?: AuthUser;
};

// Matches App\Http\Resources\ConversationResource, plus other_party/
// has_unread which the controller merges on top rather than serializing —
// see that Resource's comment on why they aren't model attributes.
export type Conversation = {
  conversation_id: number;
  tenant_id: number;
  landlord_id: number;
  property_id: number;
  unit_id: number | null;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
  property?: Property;
  unit?: PropertyUnit;
  tenant?: AuthUser;
  landlord?: AuthUser;
  messages?: Message[];
  latestMessage?: Message;
  activeReservation?: Reservation;
  other_party: AuthUser;
  has_unread?: boolean;
};

export type ConversationCounts = {
  active: number;
  resolved: number;
  cancelled: number;
  unread: number;
};

export type ConversationListFilter = 'all' | 'unread' | 'resolved' | 'cancelled';

export async function listConversations(
  status: ConversationListFilter = 'all'
): Promise<{ data: Conversation[]; counts: ConversationCounts }> {
  const { data } = await api.get<{ data: Conversation[]; counts: ConversationCounts }>(
    '/conversations',
    { params: { status } }
  );
  return data;
}

export async function getConversation(conversationId: number): Promise<Conversation> {
  const { data } = await api.get<{ data: Conversation }>(`/conversations/${conversationId}`);
  if (data.data.activeReservation) cacheReservation(data.data.activeReservation);
  return data.data;
}

export async function sendMessage(conversationId: number, message: string): Promise<Message> {
  const { data } = await api.post<{ data: Message }>(`/conversations/${conversationId}/messages`, {
    message,
  });
  return data.data;
}

export async function resolveConversation(conversationId: number): Promise<Conversation> {
  const { data } = await api.post<{ data: Conversation }>(`/conversations/${conversationId}/resolve`);
  return data.data;
}
