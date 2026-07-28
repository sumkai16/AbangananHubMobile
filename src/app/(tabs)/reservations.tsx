import { useFocusEffect, useRouter } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatRow } from '@/components/stat-row';
import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { StaggeredItem } from '@/components/ui/staggered-item';
import { extractErrorMessage } from '@/lib/api-error';
import { listReservations, type Reservation, type ReservationCounts } from '@/lib/reservations';

const STATUS_TEXT: Record<string, string> = {
  Inquiry: 'text-warning',
  'Under Negotiation': 'text-warning',
  'Pending Rental Agreement': 'text-warning',
  'Rental Agreement Signed': 'text-primary',
  Occupied: 'text-success',
  Completed: 'text-success',
  Cancelled: 'text-text-muted',
  Rejected: 'text-error',
};

// Plain text, not a pill — matches the prototype. Only needs to say
// "Signed", not the full rental_status.
const STATUS_LABELS: Record<string, string> = {
  'Rental Agreement Signed': 'Signed',
};

function ReservationRow({ reservation }: { reservation: Reservation }) {
  const landlordName = reservation.property?.landlord
    ? `${reservation.property.landlord.first_name} ${reservation.property.landlord.last_name}`
    : null;

  return (
    <View className="border-b border-border py-3.5">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-[14.5px] font-bold text-text-primary" numberOfLines={1}>
          {reservation.property?.title ?? 'Property'}
        </Text>
        <Text className={`shrink-0 text-[12.5px] font-bold ${STATUS_TEXT[reservation.rental_status] ?? 'text-text-muted'}`}>
          {STATUS_LABELS[reservation.rental_status] ?? reservation.rental_status}
        </Text>
      </View>

      <Text className="mt-0.5 text-[12px] text-text-muted" numberOfLines={1}>
        {[reservation.unit?.unit_label, landlordName].filter(Boolean).join(' · ')}
      </Text>

      {reservation.rental_status === 'Rejected' && !!reservation.rejection_reason && (
        <Text className="mt-1.5 text-xs font-semibold text-error">{reservation.rejection_reason}</Text>
      )}

      <Text className="mt-1.5 text-[11.5px] text-text-muted">
        {reservation.target_move_in_date
          ? `Move-in ${new Date(reservation.target_move_in_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
          : `Sent ${new Date(reservation.reservation_date).toLocaleDateString()}`}
      </Text>
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

  // "In Progress" is everything not yet occupied and not terminal — matches
  // the prototype's three-stat breakdown (Total / In Progress / Occupied).
  const inProgress = counts.all - counts.Occupied - counts.Cancelled - counts.Rejected;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 pb-3 pt-2">
        <Text className="text-2xl font-black tracking-tight text-text-primary">My Reservations</Text>
      </View>

      <View className="px-4 pb-4">
        <StatRow
          stats={[
            { label: 'Total', value: counts.all },
            { label: 'In Progress', value: Math.max(inProgress, 0), tone: 'text-warning' },
            { label: 'Occupied', value: counts.Occupied, tone: 'text-success' },
          ]}
        />
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
          <FileText size={32} color="#2AA7A1" />
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
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item, index }) => (
            <StaggeredItem index={index}>
              <AnimatedPressable scaleTo={0.98} onPress={() => router.push(`/reservation/${item.reservation_id}`)}>
                <ReservationRow reservation={item} />
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
