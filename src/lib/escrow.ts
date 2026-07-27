import { api } from './api';
import { cacheReservation, type Reservation } from './reservations';

// The escrow actions that sit on top of a signed-and-paid reservation:
// confirming move-in (releases the held deposit), disputing it (freezes the
// deposit for admin review), and agreeing a key handover slot.
//
// Handover is deliberately **symmetric** — either party proposes, the other
// confirms — which is why its routes live outside the tenant/landlord
// middleware on the server. Gate::authorize('scheduleHandover') does the
// real check. Same file will serve the landlord screens in M15.10.

export async function confirmMoveIn(reservationId: number): Promise<Reservation> {
  const { data } = await api.post<{ data: Reservation }>(
    `/tenant/reservations/${reservationId}/confirm-move-in`
  );
  cacheReservation(data.data);
  return data.data;
}

// `reason` must be 10–1000 chars — the server rejects anything shorter with
// "Please give us a little more detail". The form enforces the same minimum
// so the user finds out before submitting, not after.
export const DISPUTE_REASON_MIN = 10;
export const DISPUTE_REASON_MAX = 1000;

export async function disputeMoveIn(reservationId: number, reason: string): Promise<Reservation> {
  const { data } = await api.post<{ data: Reservation }>(
    `/tenant/reservations/${reservationId}/dispute-move-in`,
    { reason }
  );
  cacheReservation(data.data);
  return data.data;
}

// handoverAt must be a future datetime within the next year (server-validated).
export async function proposeHandover(
  reservationId: number,
  handoverAt: Date
): Promise<Reservation> {
  const { data } = await api.post<{ data: Reservation }>(
    `/reservations/${reservationId}/handover/propose`,
    { handover_at: toServerDateTime(handoverAt) }
  );
  cacheReservation(data.data);
  return data.data;
}

export async function confirmHandover(reservationId: number): Promise<Reservation> {
  const { data } = await api.post<{ data: Reservation }>(
    `/reservations/${reservationId}/handover/confirm`
  );
  cacheReservation(data.data);
  return data.data;
}

// Laravel's `date` validation parses this fine, and unlike toISOString() it
// stays in the device's local zone — the user picked a wall-clock time for a
// handover they'll physically attend, so shifting it to UTC would be wrong.
function toServerDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}
