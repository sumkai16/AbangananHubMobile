import { api } from './api';
import { cacheReservation, type Reservation } from './reservations';

// Matches Api\Tenant\AgreementController@show — only reachable while the
// reservation is Pending Rental Agreement / Rental Agreement Signed /
// Occupied; the server 404s outside that range rather than this client
// re-deriving the same check.
export async function getAgreement(reservationId: number): Promise<Reservation> {
  const { data } = await api.get<{ data: Reservation }>(`/tenant/reservations/${reservationId}/agreement`);
  cacheReservation(data.data);
  return data.data;
}

export async function signAgreement(reservationId: number): Promise<Reservation> {
  const { data } = await api.post<{ data: Reservation }>(
    `/tenant/reservations/${reservationId}/agreement/sign`,
    { agree: true, accept_tc: true }
  );
  cacheReservation(data.data);
  return data.data;
}
