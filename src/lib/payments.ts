import { api } from './api';

export type PaymentStatus = 'Pending' | 'Held' | 'Paid' | 'Released' | 'Failed' | 'Refunded';

// Matches App\Http\Resources\PaymentResource — trimmed to the fields the
// payment WebView flow actually reads.
export type Payment = {
  payment_id: number;
  reservation_id: number;
  payment_type: 'Initial' | 'Monthly';
  amount: string;
  payment_method: string;
  status: PaymentStatus;
  paid_at: string | null;
};

export type CheckoutSession = {
  checkout_url: string;
  payment: Payment;
};

// The URL path PayMongo's success_url points at (Tenant\PaymentController's
// `payments.success` web route) — the WebView intercepts navigation to a URL
// containing this rather than letting it load, per plans/mobile-app.md.
export const INITIAL_PAYMENT_SUCCESS_PATH = '/payment-success';
// `payments.rent.success` — see Tenant\PaymentController::payRent.
export const RENT_PAYMENT_SUCCESS_PATH = '/rent-success';

export async function payInitial(reservationId: number): Promise<CheckoutSession> {
  const { data } = await api.post<{ data: CheckoutSession }>(
    `/tenant/reservations/${reservationId}/pay`
  );
  return data.data;
}

// Called after the WebView intercepts success_url. In local dev PayMongo
// cannot reach the machine so its webhook never fires — this is the only
// path that settles the payment until it's deployed. Returns null if no
// payment ever reached Paid (e.g. the user backed out of PayMongo's page).
export async function reconcileInitial(reservationId: number): Promise<Payment | null> {
  const { data } = await api.post<{ data: Payment | null }>(
    `/tenant/reservations/${reservationId}/payment/reconcile`
  );
  return data.data;
}

// Unlike payInitial, this can succeed (200) with no checkout session:
// Api\Tenant\PaymentController::payRent returns `{message: "Your rent is
// already fully paid."}` when RentLedger finds no unsettled period. That's
// not an error, so it isn't thrown as one — but it has no checkout_url, so
// callers must not assume one.
export class NothingToPayError extends Error {}

export async function payRent(reservationId: number): Promise<CheckoutSession> {
  const { data } = await api.post<{ data?: CheckoutSession; message?: string }>(
    `/tenant/tenancy/${reservationId}/pay-rent`
  );

  if (!data.data) {
    throw new NothingToPayError(data.message ?? 'Your rent is already fully paid.');
  }

  return data.data;
}

export async function reconcileRent(reservationId: number): Promise<Payment | null> {
  const { data } = await api.post<{ data: Payment | null }>(
    `/tenant/tenancy/${reservationId}/payment/reconcile`
  );
  return data.data;
}
