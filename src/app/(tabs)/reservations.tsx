import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { extractErrorMessage } from '@/lib/api-error';
import {
  cancelReservation,
  listReservations,
  TERMINAL_STATUSES,
  type Reservation,
  type ReservationCounts,
} from '@/lib/reservations';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Inquiry: { bg: 'bg-warning/10', text: 'text-warning' },
  'Under Negotiation': { bg: 'bg-warning/10', text: 'text-warning' },
  'Pending Rental Agreement': { bg: 'bg-warning/10', text: 'text-warning' },
  'Rental Agreement Signed': { bg: 'bg-secondary/10', text: 'text-secondary' },
  Occupied: { bg: 'bg-success/10', text: 'text-success' },
  Completed: { bg: 'bg-success/10', text: 'text-success' },
  Cancelled: { bg: 'bg-border', text: 'text-text-muted' },
  Rejected: { bg: 'bg-error/10', text: 'text-error' },
};

// The status pill only needs to say "Signed", not the full rental_status —
// matches the prototype's shorthand.
const STATUS_LABELS: Record<string, string> = {
  'Rental Agreement Signed': 'Signed',
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { bg: 'bg-border', text: 'text-text-muted' };
  return (
    <View className={`rounded-full px-2.5 py-1 ${style.bg}`}>
      <Text className={`text-[11px] font-bold ${style.text}`}>{STATUS_LABELS[status] ?? status}</Text>
    </View>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <View className="flex-1 items-center rounded-2xl border border-border bg-surface py-3.5">
      <Text className={`text-[22px] font-black ${tone}`}>{value}</Text>
      <Text className="mt-0.5 text-[11px] font-semibold text-text-muted">{label}</Text>
    </View>
  );
}

function ReservationCard({
  reservation,
  onCancel,
}: {
  reservation: Reservation;
  onCancel: () => void;
}) {
  const canCancel = !TERMINAL_STATUSES.includes(reservation.rental_status);
  const landlordName = reservation.property?.landlord
    ? `${reservation.property.landlord.first_name} ${reservation.property.landlord.last_name}`
    : null;

  return (
    <View className="rounded-2xl border border-border bg-surface p-4">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-[14.5px] font-bold text-text-primary" numberOfLines={1}>
            {reservation.property?.title ?? 'Property'}
          </Text>
          <Text className="mt-0.5 text-[12px] text-text-muted" numberOfLines={1}>
            {[reservation.unit?.unit_label, landlordName].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <StatusBadge status={reservation.rental_status} />
      </View>

      {!!reservation.remarks && (
        <Text className="mt-2 text-xs text-text-muted" numberOfLines={2}>
          {reservation.remarks}
        </Text>
      )}

      {reservation.rental_status === 'Rejected' && !!reservation.rejection_reason && (
        <Text className="mt-2 text-xs font-semibold text-error">{reservation.rejection_reason}</Text>
      )}

      <Text className="mt-2 text-[11.5px] text-text-muted">
        {reservation.target_move_in_date
          ? `Move-in ${new Date(reservation.target_move_in_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
          : `Sent ${new Date(reservation.reservation_date).toLocaleDateString()}`}
      </Text>

      {canCancel && (
        <View className="mt-3">
          <Button
            title="Cancel"
            variant="danger"
            fullWidth={false}
            // This card sits inside the list's own Pressable (tap-to-open-detail)
            // — stopPropagation keeps a Cancel tap from also navigating, same
            // pattern as property-card.tsx's favorite toggle.
            onPress={(e) => {
              e.stopPropagation();
              onCancel();
            }}
          />
        </View>
      )}
    </View>
  );
}

const EMPTY_COUNTS: ReservationCounts = {
  all: 0,
  Inquiry: 0,
  'Under Negotiation': 0,
  'Pending Rental Agreement': 0,
  'Rental Agreement Signed': 0,
  Occupied: 0,
  Cancelled: 0,
  Rejected: 0,
};

export default function ReservationsScreen() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [counts, setCounts] = useState<ReservationCounts>(EMPTY_COUNTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequestId = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    try {
      const result = await listReservations('all');
      if (requestId !== latestRequestId.current) return;
      setReservations(result.data);
      setCounts(result.counts);
      setError(null);
    } catch (err) {
      if (requestId !== latestRequestId.current) return;
      // eslint-disable-next-line no-console -- real error, not a debug leftover.
      console.error('[ReservationsScreen] failed to load reservations', err);
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

  function handleCancel(reservation: Reservation) {
    Alert.alert('Cancel reservation?', 'This cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel reservation',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = await cancelReservation(reservation.reservation_id);
            setReservations((prev) =>
              prev.map((r) => (r.reservation_id === updated.reservation_id ? updated : r))
            );
          } catch (err) {
            Alert.alert('Could not cancel', extractErrorMessage(err));
          }
        },
      },
    ]);
  }

  // "In Progress" is everything not yet occupied and not terminal — matches
  // the prototype's three-tile breakdown (Total / In Progress / Occupied).
  const inProgress = counts.all - counts.Occupied - counts.Cancelled - counts.Rejected;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 pb-3 pt-2">
        <Text className="text-2xl font-black tracking-tight text-text-primary">My Reservations</Text>
      </View>

      <View className="flex-row gap-2.5 px-4 pb-4">
        <StatTile label="Total" value={counts.all} tone="text-text-primary" />
        <StatTile label="In Progress" value={Math.max(inProgress, 0)} tone="text-warning" />
        <StatTile label="Occupied" value={counts.Occupied} tone="text-success" />
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
      ) : reservations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="document-text-outline" size={32} color="#2AA7A1" />
          <Text className="mt-3 text-center text-base font-semibold text-text-primary">
            No reservations yet
          </Text>
          <Text className="mt-1 text-center text-sm text-text-muted">
            Send an inquiry from a property's unit to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => String(item.reservation_id)}
          contentContainerStyle={{ gap: 12, padding: 16, paddingTop: 0 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/reservation/${item.reservation_id}`)}>
              <ReservationCard reservation={item} onCancel={() => handleCancel(item)} />
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
