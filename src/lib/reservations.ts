import { api } from './api';
import type { Paginated, Property, PropertyUnit } from './properties';

// Matches App\Models\Reservation::TERMINAL_STATUSES + the non-terminal
// progression (Api\Tenant\ReservationController, ../AbangananHub).
export type RentalStatus =
  | 'Inquiry'
  | 'Under Negotiation'
  | 'Pending Rental Agreement'
  | 'Rental Agreement Signed'
  | 'Occupied'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected';

export const TERMINAL_STATUSES: RentalStatus[] = ['Cancelled', 'Rejected', 'Completed'];

// Matches App\Http\Resources\ReservationResource.
export type Reservation = {
  reservation_id: number;
  property_id: number;
  unit_id: number;
  tenant_id: number;
  conversation_id: number | null;
  reservation_date: string;
  target_move_in_date: string | null;
  target_move_out_date: string | null;
  duration_of_stay: string | null;
  agreed_monthly_rent: string | null;
  rent_due_day: number | null;
  occupants_count: number | null;
  rental_status: RentalStatus;
  agreement_terms_notes: string | null;
  agreed_at: string | null;
  remarks: string | null;
  rejection_reason: string | null;
  tenant_confirmed_move_in_at: string | null;
  keys_turned_over_at: string | null;
  move_in_deadline_at: string | null;
  move_in_disputed_at: string | null;
  move_in_dispute_reason: string | null;
  handover_at: string | null;
  handover_proposed_by: number | null;
  handover_proposed_at: string | null;
  handover_confirmed_at: string | null;
  move_in_clock: MoveInClock | null;
  created_at: string;
  updated_at: string;
  property?: Property;
  unit?: PropertyUnit;
};

// Serialized by Reservation::moveInClockState() (server, 2026-07-27).
// There is one deadline column and two clocks; which one is running depends
// on turnover, on a dispute, and — before the nightly backfill — on a
// computed value. The server decides, so this client and the web view
// cannot disagree about which clock is live. **Do not re-derive this** from
// keys_turned_over_at / move_in_deadline_at, which are also in the payload
// but are not sufficient alone. Null when no clock is running.
export type MoveInClock = {
  active_clock: 'turnover' | 'confirmation';
  deadline_at: string | null;
  days_remaining: number | null;
  disputed: boolean;
};

// Matches Api\Tenant\ReservationController::statusCounts() exactly — that
// method has no 'Completed' branch (a permanent omission, not a sparse-zero
// one), so this type must not claim the key exists.
export type ReservationCounts = Record<
  'all' | Exclude<RentalStatus, 'Completed'>,
  number
>;

// Api\Tenant\ReservationController@index returns response()->json($paginator)
// merged with `counts` — a flat paginator shape (current_page/last_page at
// the top level), same as GET /properties, not nested under `meta`.
export type ReservationList = Paginated<Reservation> & { counts: ReservationCounts };

// There is no GET /tenant/reservations/{id} — the web app doesn't need one
// either, since its index page renders every reservation server-side and the
// detail modal just reads the same payload. This cache is the client-side
// equivalent: populated whenever the list loads, read by the detail screen.
// A cache miss (e.g. a cold deep link to /reservation/{id}) has no fallback
// fetch — the detail screen sends the user back to the list instead.
const reservationCache = new Map<number, Reservation>();

export function getCachedReservation(reservationId: number): Reservation | undefined {
  return reservationCache.get(reservationId);
}

export function cacheReservation(reservation: Reservation): void {
  reservationCache.set(reservation.reservation_id, reservation);
}

export async function listReservations(status?: RentalStatus | 'all'): Promise<ReservationList> {
  const { data } = await api.get<ReservationList>('/tenant/reservations', {
    params: status ? { status } : undefined,
  });
  data.data.forEach(cacheReservation);
  return data;
}

export type CreateReservationPayload = {
  unit_id: number;
  target_move_in_date?: string;
  target_move_out_date?: string;
  remarks?: string;
  message?: string;
};

export async function createReservation(payload: CreateReservationPayload): Promise<Reservation> {
  const { data } = await api.post<{ data: Reservation }>('/tenant/reservations', payload);
  cacheReservation(data.data);
  return data.data;
}

export async function cancelReservation(reservationId: number): Promise<Reservation> {
  const { data } = await api.patch<{ data: Reservation }>(`/tenant/reservations/${reservationId}/cancel`);
  cacheReservation(data.data);
  return data.data;
}
