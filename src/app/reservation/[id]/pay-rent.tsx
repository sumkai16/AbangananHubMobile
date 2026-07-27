import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { PaymentWebViewFlow } from '@/components/payment-webview-flow';
import { payRent, reconcileRent, RENT_PAYMENT_SUCCESS_PATH } from '@/lib/payments';

export default function PayRentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reservationId = Number(id);

  return (
    <PaymentWebViewFlow
      title="Pay rent"
      successPath={RENT_PAYMENT_SUCCESS_PATH}
      start={useCallback(() => payRent(reservationId), [reservationId])}
      reconcile={useCallback(() => reconcileRent(reservationId), [reservationId])}
      settledCopy={{
        paid: 'Your rent payment has been recorded.',
        pending: "We haven't confirmed this payment yet — check back shortly.",
      }}
      doneLabel="Back to rent ledger"
      onDone={() => router.replace(`/reservation/${reservationId}/tenancy`)}
    />
  );
}
