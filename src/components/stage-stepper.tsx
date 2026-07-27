import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import type { Reservation, RentalStatus } from '@/lib/reservations';

const STAGE_LABELS = ['Inquiry', 'Negotiation', 'Agreement', 'Signed', 'Paid', 'Occupied'];

/**
 * The six-node rental progress stepper. Mirrors the web app's
 * `_stage-stepper.blade.php` exactly — same six stages, same rule for the
 * "Paid" stage (a reservation sits on `Rental Agreement Signed` for the
 * entire time money is escrowed; "Paid" is Signed *and* a deposit is held).
 *
 * "Settled" is read off `move_in_clock !== null` rather than a payments
 * list — a move-in clock only exists while a deposit is Held (see
 * `Reservation::moveInClockState()`), so this needs no extra data beyond
 * what the conversation payload already carries.
 */
export function StageStepper({ reservation }: { reservation: Reservation | null | undefined }) {
  const currentStageIndex = stageIndexFor(reservation);

  return (
    <View className="flex-row items-start">
      {STAGE_LABELS.map((_, i) => {
        const isDone = currentStageIndex !== null && i < currentStageIndex;
        const isCurrent = currentStageIndex !== null && i === currentStageIndex;
        const isLast = i === STAGE_LABELS.length - 1;

        return (
          <View key={i} className={`flex-row items-start ${isLast ? '' : 'flex-1'}`}>
            {isDone ? (
              <View className="h-[18px] w-[18px] items-center justify-center rounded-full bg-secondary">
                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
              </View>
            ) : isCurrent ? (
              <View className="h-[18px] w-[18px] items-center justify-center rounded-full bg-secondary/15">
                <View className="h-[9px] w-[9px] rounded-full bg-secondary" />
              </View>
            ) : (
              <View className="h-[18px] w-[18px] rounded-full border-2 border-border bg-surface" />
            )}

            {!isLast && (
              <View className={`mx-1 mt-[8px] h-0.5 flex-1 rounded-full ${isDone ? 'bg-secondary' : 'bg-border'}`} />
            )}
          </View>
        );
      })}
    </View>
  );
}

function stageIndexFor(reservation: Reservation | null | undefined): number | null {
  if (!reservation) return null;

  const settled = reservation.move_in_clock !== null;

  const map: Partial<Record<RentalStatus, number>> = {
    Inquiry: 0,
    'Under Negotiation': 1,
    'Pending Rental Agreement': 2,
    'Rental Agreement Signed': settled ? 4 : 3,
    Occupied: 5,
  };

  return map[reservation.rental_status] ?? null;
}
