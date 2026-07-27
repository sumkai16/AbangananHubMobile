import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { extractErrorMessage } from '@/lib/api-error';
import { useAuth } from '@/lib/auth-context';
import { confirmHandover, proposeHandover } from '@/lib/escrow';
import { getCachedReservation } from '@/lib/reservations';

/**
 * Agreeing a key handover slot. Symmetric by design — either party
 * proposes, the other confirms — so this same screen serves the landlord
 * once M15.10 lands. The server's `scheduleHandover` gate is the real
 * authority on who may act.
 */
export default function HandoverScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reservationId = Number(id);
  const reservation = getCachedReservation(reservationId);

  // Default to tomorrow at 10am — a sensible slot, and it satisfies the
  // server's `after:now` rule without the user having to change anything.
  const [slot, setSlot] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  });
  const [picking, setPicking] = useState<'date' | 'time' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!reservation) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Stack.Screen options={{ title: 'Key handover' }} />
        <Ionicons name="alert-circle-outline" size={32} color="#94A3B8" />
        <Text className="mt-3 text-center text-sm font-semibold text-text-primary">
          Reservation not loaded
        </Text>
        <View className="mt-4">
          <Button title="Go back" fullWidth={false} onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const proposedByMe = reservation.handover_proposed_by === user?.user_id;
  const hasProposal = !!reservation.handover_at && !reservation.handover_confirmed_at;
  const isConfirmed = !!reservation.handover_at && !!reservation.handover_confirmed_at;
  // A proposal from the other side is a request waiting on this reader, not
  // status — so it gets a decision card rather than a line of text.
  const awaitingMyAnswer = hasProposal && !proposedByMe;

  const existingSlot = reservation.handover_at ? new Date(reservation.handover_at) : null;

  async function submit(action: 'propose' | 'confirm') {
    setIsSubmitting(true);
    try {
      if (action === 'confirm') {
        await confirmHandover(reservationId);
        Alert.alert('Confirmed', 'The key handover time is set.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        await proposeHandover(reservationId, slot);
        Alert.alert('Proposed', 'Waiting for the other party to confirm.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      Alert.alert('Could not schedule', extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-10">
      <Stack.Screen options={{ title: 'Key handover' }} />

      {!!existingSlot && (
        <View className="mb-5 rounded-2xl border border-border bg-surface p-4">
          <Text className="text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">
            {isConfirmed ? 'Confirmed handover' : awaitingMyAnswer ? 'They proposed' : 'You proposed'}
          </Text>
          <Text className="mt-1 text-[20px] font-bold tracking-tight text-text-primary">
            {existingSlot.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text className="text-[15px] font-medium text-text-muted">
            {existingSlot.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </Text>

          {awaitingMyAnswer && (
            <View className="mt-4">
              <Button
                title="Confirm this time"
                isLoading={isSubmitting}
                onPress={() => submit('confirm')}
              />
            </View>
          )}
        </View>
      )}

      <Text className="mb-3 text-[13px] font-bold text-primary">
        {existingSlot ? 'Suggest a different time' : 'Propose a handover time'}
      </Text>

      <View className="rounded-2xl border border-border bg-surface p-1.5">
        <Pressable
          onPress={() => setPicking('date')}
          className="flex-row items-center justify-between rounded-xl px-3 py-3.5 active:bg-section">
          <View className="flex-row items-center gap-3">
            <Ionicons name="calendar-outline" size={16} color="#64748B" />
            <Text className="text-[14px] text-text-primary">Date</Text>
          </View>
          <Text className="text-[14px] font-semibold text-text-primary">
            {slot.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </Pressable>

        <View className="mx-3 h-px bg-border" />

        <Pressable
          onPress={() => setPicking('time')}
          className="flex-row items-center justify-between rounded-xl px-3 py-3.5 active:bg-section">
          <View className="flex-row items-center gap-3">
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text className="text-[14px] text-text-primary">Time</Text>
          </View>
          <Text className="text-[14px] font-semibold text-text-primary">
            {slot.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </Pressable>
      </View>

      {picking && (
        <DateTimePicker
          value={slot}
          mode={picking}
          minimumDate={picking === 'date' ? new Date() : undefined}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selected) => {
            // Android fires with type 'dismissed' on cancel; iOS spinner
            // fires continuously, so it stays open until the user taps Done.
            if (Platform.OS === 'android') setPicking(null);
            if (event.type === 'dismissed' || !selected) return;
            setSlot(selected);
          }}
        />
      )}

      {Platform.OS === 'ios' && picking && (
        <View className="mt-2">
          <Button title="Done" variant="outline" onPress={() => setPicking(null)} />
        </View>
      )}

      <Text className="mt-3 text-[11.5px] leading-relaxed text-text-muted">
        The other party confirms it before it becomes the agreed time.
      </Text>

      <View className="mt-5">
        <Button
          title={existingSlot ? 'Propose new time' : 'Propose time'}
          isLoading={isSubmitting}
          onPress={() => submit('propose')}
        />
      </View>
    </ScrollView>
  );
}
