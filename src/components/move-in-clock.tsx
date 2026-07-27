import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import type { MoveInClock, Reservation } from '@/lib/reservations';

/**
 * The live escrow countdown, worded for the tenant.
 *
 * Mirrors the web app's `_move-in-clock.blade.php`. Both read
 * `reservation.move_in_clock`, which the server computes in
 * `Reservation::moveInClockState()` — **which clock is running is not
 * decided here.** Clock 1 (`turnover`) belongs to the landlord: turn over
 * the keys or the reservation escalates to admin review. Clock 2
 * (`confirmation`) belongs to the tenant: confirm move-in or the deposit
 * releases automatically.
 */
export function MoveInClockCard({
  clock,
  reservation,
  landlordName,
}: {
  clock: MoveInClock;
  reservation: Reservation;
  landlordName: string;
}) {
  const { active_clock, deadline_at, days_remaining, disputed } = clock;
  const onTurnoverClock = active_clock === 'turnover';
  const overdue = days_remaining !== null && days_remaining < 0;
  const urgent = !disputed && days_remaining !== null && days_remaining <= 1;

  const by = deadline_at
    ? new Date(deadline_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  const tone = disputed
    ? { bg: 'bg-warning/10', text: 'text-[#B45309]', icon: '#B45309' as const }
    : urgent
      ? { bg: 'bg-error/[0.07]', text: 'text-error', icon: '#DC2626' as const }
      : { bg: 'bg-section', text: 'text-primary', icon: '#156F8C' as const };

  const { headline, detail } = copyFor({
    disputed,
    onTurnoverClock,
    overdue,
    daysLeft: days_remaining,
    by,
    landlordName,
    hasConfirmedSlot: !!reservation.handover_at && !!reservation.handover_confirmed_at,
    slot: reservation.handover_at,
  });

  return (
    <View className={`rounded-2xl p-4 ${tone.bg}`}>
      <View className="flex-row items-start gap-2.5">
        <Ionicons
          name={disputed ? 'alert-circle-outline' : 'time-outline'}
          size={16}
          color={tone.icon}
          style={{ marginTop: 1 }}
        />
        <View className="flex-1">
          <Text className={`text-[14px] font-bold leading-snug ${tone.text}`}>{headline}</Text>
          <Text className={`mt-1 text-[12px] leading-relaxed ${tone.text} opacity-90`}>{detail}</Text>
        </View>

        {!disputed && days_remaining !== null && days_remaining >= 0 && (
          <Text className={`shrink-0 text-[12px] font-bold ${tone.text}`}>
            {days_remaining === 0 ? 'today' : `${days_remaining}d left`}
          </Text>
        )}
      </View>
    </View>
  );
}

// Wording mirrors the Blade partial's match() blocks, tenant-side only —
// this client has no landlord escrow screen yet (M15.10).
function copyFor({
  disputed,
  onTurnoverClock,
  overdue,
  daysLeft,
  by,
  landlordName,
  hasConfirmedSlot,
  slot,
}: {
  disputed: boolean;
  onTurnoverClock: boolean;
  overdue: boolean;
  daysLeft: number | null;
  by: string | null;
  landlordName: string;
  hasConfirmedSlot: boolean;
  slot: string | null;
}): { headline: string; detail: string } {
  if (disputed) {
    return {
      headline: 'Move-in issue reported — an administrator is reviewing it.',
      detail: 'The deposit stays on hold and the countdown is paused.',
    };
  }

  if (onTurnoverClock) {
    const slotText = slot
      ? new Date(slot).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : null;

    return {
      headline: hasConfirmedSlot && slotText
        ? `Key handover: ${slotText}`
        : `Agree a key handover time with ${landlordName}`,
      detail: overdue
        ? `The keys were due by ${by}. Your deposit is still held, and an administrator steps in if this isn't resolved.`
        : `Your deposit is held until you confirm move-in. Escalates to admin review if the keys aren't turned over by ${by}.`,
    };
  }

  return {
    headline: overdue
      ? 'Your confirmation window has closed'
      : daysLeft === 0
        ? 'Today is your last day to confirm your move-in'
        : 'Confirm your move-in',
    detail: overdue
      ? `It closed on ${by} — the deposit is released to the landlord automatically.`
      : `Confirm by ${by} or the deposit is released to the landlord automatically.`,
  };
}
