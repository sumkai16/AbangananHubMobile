import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { extractErrorMessage } from '@/lib/api-error';
import {
  cancelReservation,
  getCachedReservation,
  TERMINAL_STATUSES,
  type Reservation,
  type RentalStatus,
} from '@/lib/reservations';

// Matches the web app's journey (tenant/reservations/index.blade.php) — five
// steps, terminal statuses (Cancelled/Rejected/Completed) shown separately
// rather than pretending they sit on this line.
const JOURNEY_STEPS: { status: RentalStatus; label: string }[] = [
  { status: 'Inquiry', label: 'Inquiry' },
  { status: 'Under Negotiation', label: 'Negotiation' },
  { status: 'Pending Rental Agreement', label: 'Agreement' },
  { status: 'Rental Agreement Signed', label: 'Signed' },
  { status: 'Occupied', label: 'Occupied' },
];

function StatusJourney({ status }: { status: RentalStatus }) {
  const stepIndex = JOURNEY_STEPS.findIndex((s) => s.status === status);
  if (stepIndex === -1) return null; // terminal status, no journey to draw

  return (
    <View className="flex-row items-center">
      {JOURNEY_STEPS.map((step, i) => {
        const done = i <= stepIndex;
        return (
          <View key={step.status} className="flex-1 items-center">
            <View className="w-full flex-row items-center">
              <View
                className={`h-2.5 w-2.5 rounded-full ${done ? 'bg-secondary' : 'bg-border'}`}
              />
              {i < JOURNEY_STEPS.length - 1 && (
                <View className={`h-0.5 flex-1 ${i < stepIndex ? 'bg-secondary' : 'bg-border'}`} />
              )}
            </View>
            <Text
              className={`mt-1.5 text-center text-[9.5px] font-semibold ${
                done ? 'text-secondary' : 'text-text-muted'
              }`}
              numberOfLines={1}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const TERMINAL_TONE: Record<string, { bg: string; text: string; label: string }> = {
  Cancelled: { bg: 'bg-border', text: 'text-text-muted', label: 'Cancelled' },
  Rejected: { bg: 'bg-error/10', text: 'text-error', label: 'Rejected' },
  Completed: { bg: 'bg-success/10', text: 'text-success', label: 'Completed' },
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3 py-2.5">
      <View className="h-8 w-8 items-center justify-center rounded-lg bg-section">
        <Ionicons name={icon} size={15} color="#156F8C" />
      </View>
      <View className="flex-1">
        <Text className="text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">
          {label}
        </Text>
        <Text className="text-[13px] font-semibold text-text-primary">{value}</Text>
      </View>
    </View>
  );
}

export default function ReservationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reservationId = Number(id);
  const reservation = getCachedReservation(reservationId);

  if (!reservation) {
    // No GET /tenant/reservations/{id} exists to fall back on — see
    // src/lib/reservations.ts. Only reachable via a cold deep link.
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-8">
        <Stack.Screen options={{ title: 'Reservation' }} />
        <Ionicons name="alert-circle-outline" size={32} color="#94A3B8" />
        <Text className="mt-3 text-center text-sm font-semibold text-text-primary">
          Reservation not loaded
        </Text>
        <Text className="mt-1 text-center text-xs text-text-muted">
          Go back to your reservations list and open it from there.
        </Text>
        <View className="mt-4">
          <Button title="Go back" fullWidth={false} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return <ReservationDetail reservation={reservation} />;
}

// Matches Api\Tenant\AgreementController::show's allowed statuses — the
// agreement (and, once signed, the payment step) only exists past this point.
const AGREEMENT_VISIBLE_STATUSES: RentalStatus[] = [
  'Pending Rental Agreement',
  'Rental Agreement Signed',
  'Occupied',
];

function ReservationDetail({ reservation: initial }: { reservation: Reservation }) {
  const router = useRouter();
  const [reservation, setReservation] = useState(initial);
  const canCancel = !TERMINAL_STATUSES.includes(reservation.rental_status);
  const canViewAgreement = AGREEMENT_VISIBLE_STATUSES.includes(reservation.rental_status);
  const terminalTone = TERMINAL_TONE[reservation.rental_status];
  const cover = reservation.property?.media?.[0]?.media_url;

  function handleCancel() {
    Alert.alert('Cancel reservation?', 'This cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel reservation',
        style: 'destructive',
        onPress: async () => {
          try {
            setReservation(await cancelReservation(reservation.reservation_id));
          } catch (err) {
            Alert.alert('Could not cancel', extractErrorMessage(err));
          }
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: reservation.property?.title ?? 'Reservation' }} />
      <ScrollView contentContainerClassName="pb-8">
        {!!cover && <Image source={{ uri: cover }} style={{ width: '100%', height: 180 }} contentFit="cover" />}

        <View className="p-4">
          <Text className="text-lg font-black tracking-tight text-text-primary" numberOfLines={2}>
            {reservation.property?.title ?? 'Property'}
          </Text>
          <Text className="mt-0.5 text-xs text-text-muted">{reservation.unit?.unit_label}</Text>

          <View className="mt-5">
            {terminalTone ? (
              <View className={`self-start rounded-full px-3 py-1 ${terminalTone.bg}`}>
                <Text className={`text-xs font-bold ${terminalTone.text}`}>{terminalTone.label}</Text>
              </View>
            ) : (
              <>
                <Text className="mb-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Reservation journey
                </Text>
                <StatusJourney status={reservation.rental_status} />
              </>
            )}
          </View>

          {reservation.rental_status === 'Rejected' && !!reservation.rejection_reason && (
            <View className="mt-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3">
              <Text className="text-xs font-semibold text-error">{reservation.rejection_reason}</Text>
            </View>
          )}

          <View className="mt-5 border-t border-border">
            <InfoRow
              icon="calendar-outline"
              label="Sent"
              value={new Date(reservation.reservation_date).toLocaleDateString()}
            />
            {!!reservation.target_move_in_date && (
              <InfoRow
                icon="log-in-outline"
                label="Target move-in"
                value={new Date(reservation.target_move_in_date).toLocaleDateString()}
              />
            )}
            {!!reservation.agreed_monthly_rent && (
              <InfoRow
                icon="cash-outline"
                label="Monthly rent"
                value={`₱${Number(reservation.agreed_monthly_rent).toLocaleString()}`}
              />
            )}
            {!!reservation.property?.landlord && (
              <View className="flex-row items-center justify-between border-t border-border py-2.5">
                <Text className="text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">
                  Landlord
                </Text>
                <View className="flex-row items-center gap-2">
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-secondary">
                    <Text className="text-[11px] font-bold text-white">
                      {reservation.property.landlord.first_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text className="text-[13px] font-semibold text-text-primary">
                    {reservation.property.landlord.first_name} {reservation.property.landlord.last_name}
                  </Text>
                </View>
              </View>
            )}
            {!!reservation.remarks && (
              <View className="border-t border-border py-2.5">
                <Text className="text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">
                  Your message
                </Text>
                <Text className="mt-1 text-[13px] text-text-primary">{reservation.remarks}</Text>
              </View>
            )}
          </View>

          {canViewAgreement && (
            <View className="mt-6">
              <Button
                title={
                  reservation.rental_status === 'Pending Rental Agreement'
                    ? 'Review & sign agreement'
                    : 'View agreement'
                }
                icon="document-text-outline"
                onPress={() => router.push(`/reservation/${reservation.reservation_id}/agreement`)}
              />
            </View>
          )}

          {canCancel && (
            <View className="mt-3">
              <Button title="Cancel reservation" variant="danger" onPress={handleCancel} />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
