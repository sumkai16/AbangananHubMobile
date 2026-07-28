import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Check, CheckCircle2, CreditCard, Receipt } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { MoveInClockCard } from '@/components/move-in-clock';
import { BottomActionBar } from '@/components/ui/bottom-action-bar';
import { Button } from '@/components/ui/button';
import { getAgreement, signAgreement } from '@/lib/agreement';
import { extractErrorMessage } from '@/lib/api-error';
import { useAuth } from '@/lib/auth-context';
import { confirmMoveIn } from '@/lib/escrow';
import type { Reservation } from '@/lib/reservations';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline justify-between gap-4 border-t border-border py-2.5">
      <Text className="text-[13px] text-text-muted">{label}</Text>
      <Text className="text-right text-[13px] font-bold text-text-primary">{value}</Text>
    </View>
  );
}

export default function AgreementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reservationId = Number(id);

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [acceptTc, setAcceptTc] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const load = useCallback(async () => {
    try {
      setReservation(await getAgreement(reservationId));
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, [reservationId]);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  async function handleSign() {
    setIsSigning(true);
    try {
      const updated = await signAgreement(reservationId);
      setReservation(updated);
    } catch (err) {
      Alert.alert('Could not sign', extractErrorMessage(err));
    } finally {
      setIsSigning(false);
    }
  }

  function handleConfirmMoveIn() {
    Alert.alert(
      'Confirm your move-in?',
      'This releases your held deposit to the landlord. Only confirm once you have the keys and have seen the unit.',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Confirm move-in',
          onPress: async () => {
            setIsConfirming(true);
            try {
              setReservation(await confirmMoveIn(reservationId));
            } catch (err) {
              Alert.alert('Could not confirm', extractErrorMessage(err));
            } finally {
              setIsConfirming(false);
            }
          },
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={{ title: 'Rental Agreement' }} />
        <ActivityIndicator color="#156F8C" />
      </View>
    );
  }

  if (error || !reservation) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Stack.Screen options={{ title: 'Rental Agreement' }} />
        <Text className="text-center text-sm font-semibold text-error">
          {error ?? 'Agreement not available'}
        </Text>
      </View>
    );
  }

  const landlord = reservation.property?.landlord;
  const landlordName = landlord?.first_name ?? 'your landlord';
  const unit = reservation.unit;
  const isSigned = !!reservation.agreed_at;
  const canSign = reservation.rental_status === 'Pending Rental Agreement' && !isSigned;

  // A live clock means the deposit is held — the server only returns one
  // while money is escrowed, which is the same condition the web chat panel
  // uses to decide whether to render its clock at all.
  const clock = reservation.move_in_clock;
  const awaitingPayment = reservation.rental_status === 'Rental Agreement Signed' && !clock;
  // Clock 2: the keys are turned over and the tenant's window is open.
  const canConfirmMoveIn = clock?.active_clock === 'confirmation' && !clock.disputed;

  return (
    <View className="flex-1 bg-background">
    <ScrollView className="flex-1" contentContainerClassName={`p-4 ${awaitingPayment || reservation.rental_status === 'Occupied' ? 'pb-24' : 'pb-10'}`}>
      <Stack.Screen options={{ title: 'Rental Agreement' }} />

      {!!clock && (
        <View className="mb-5">
          <MoveInClockCard
            clock={clock}
            reservation={reservation}
            landlordName={landlordName}
          />

          {canConfirmMoveIn && (
            <View className="mt-3">
              <Button
                title="Confirm move-in"
                icon={CheckCircle2}
                isLoading={isConfirming}
                onPress={handleConfirmMoveIn}
              />
              <View className="mt-2">
                <Button
                  title="Something's wrong with the move-in"
                  variant="outline"
                  onPress={() => router.push(`/reservation/${reservationId}/dispute`)}
                />
              </View>
            </View>
          )}

          {clock.active_clock === 'turnover' && !clock.disputed && (
            <View className="mt-3">
              <Button
                title={reservation.handover_at ? 'Change handover time' : 'Propose a handover time'}
                variant="outline"
                icon={Calendar}
                onPress={() => router.push(`/reservation/${reservationId}/handover`)}
              />
            </View>
          )}
        </View>
      )}

      <View className="flex-row gap-3">
        <View className="flex-1 rounded-xl border border-border bg-section p-3">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Landlord</Text>
          <Text className="mt-1 text-[13px] font-bold text-text-primary">
            {landlord?.first_name} {landlord?.last_name}
          </Text>
        </View>
        <View className="flex-1 rounded-xl border border-border bg-section p-3">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Tenant</Text>
          <Text className="mt-1 text-[13px] font-bold text-text-primary">
            {user ? `${user.first_name} ${user.last_name}` : 'You'}
          </Text>
        </View>
      </View>

      <Text className="mt-5 text-[13px] leading-relaxed text-text-primary">
        This Rental Agreement covers the rental of{' '}
        <Text className="font-bold">{reservation.property?.address}</Text> —{' '}
        {reservation.property?.title} · {unit?.unit_label}
        {unit?.unit_type ? ` · ${unit.unit_type}` : ''}.
      </Text>

      <View className="mt-4">
        {!!unit?.rental_fee && <Row label="Rental Fee" value={`₱${Number(unit.rental_fee).toLocaleString()} / month`} />}
        {!!unit?.security_deposit && (
          <Row label="Security Deposit" value={`₱${Number(unit.security_deposit).toLocaleString()}`} />
        )}
        <Row label="Reservation Date" value={new Date(reservation.reservation_date).toLocaleDateString()} />
        {!!reservation.target_move_in_date && (
          <Row label="Target Move-In" value={new Date(reservation.target_move_in_date).toLocaleDateString()} />
        )}
      </View>

      {!!reservation.agreement_terms_notes && (
        <View className="mt-4 rounded-xl border border-border bg-section p-4">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Additional terms
          </Text>
          <Text className="mt-1.5 text-[13px] leading-relaxed text-text-primary">
            {reservation.agreement_terms_notes}
          </Text>
        </View>
      )}

      {isSigned ? (
        <View className="mt-6 flex-row items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3.5">
          <CheckCircle2 size={20} color="#22C55E" />
          <View className="flex-1">
            <Text className="text-[13px] font-bold text-text-primary">Agreement signed</Text>
            <Text className="mt-0.5 text-[11.5px] text-text-muted">
              Signed {new Date(reservation.agreed_at!).toLocaleString()}
            </Text>
          </View>
        </View>
      ) : canSign ? (
        <View className="mt-6 rounded-xl border border-border bg-surface p-4">
          <Text className="mb-3 text-[12px] font-semibold text-text-muted">
            Please read the entire agreement above before proceeding. Signing is a binding
            acknowledgment of these terms.
          </Text>

          <Pressable
            onPress={() => setAgree((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agree }}
            className="mb-3 flex-row items-start gap-3 active:opacity-70">
            <View
              className={`mt-0.5 h-5 w-5 items-center justify-center rounded-md border-2 ${
                agree ? 'border-secondary bg-secondary' : 'border-border'
              }`}>
              {agree && <Check size={13} color="#FFFFFF" />}
            </View>
            <Text className="flex-1 text-[13px] text-text-primary">
              I have read and agree to the terms of this Rental Agreement.
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setAcceptTc((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptTc }}
            className="mb-4 flex-row items-start gap-3 active:opacity-70">
            <View
              className={`mt-0.5 h-5 w-5 items-center justify-center rounded-md border-2 ${
                acceptTc ? 'border-secondary bg-secondary' : 'border-border'
              }`}>
              {acceptTc && <Check size={13} color="#FFFFFF" />}
            </View>
            <Text className="flex-1 text-[13px] text-text-primary">
              I accept AbangananHub's platform Terms and Conditions.
            </Text>
          </Pressable>

          <Button
            title="Sign Agreement"
            onPress={handleSign}
            disabled={!agree || !acceptTc}
            isLoading={isSigning}
          />
        </View>
      ) : null}

    </ScrollView>

      {awaitingPayment && (
        <BottomActionBar>
          <View className="flex-1">
            <Button
              title="Pay initial deposit"
              variant="cta"
              icon={CreditCard}
              onPress={() => router.push(`/reservation/${reservation.reservation_id}/pay`)}
            />
          </View>
        </BottomActionBar>
      )}

      {reservation.rental_status === 'Occupied' && (
        <BottomActionBar>
          <View className="flex-1">
            <Button
              title="Rent ledger"
              variant="outline"
              icon={Receipt}
              onPress={() => router.push(`/reservation/${reservationId}/tenancy`)}
            />
          </View>
        </BottomActionBar>
      )}
    </View>
  );
}
