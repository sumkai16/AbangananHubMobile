import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { PaymentWebViewFlow } from '@/components/payment-webview-flow';
import { INITIAL_PAYMENT_SUCCESS_PATH, payInitial, reconcileInitial } from '@/lib/payments';

export default function PayScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reservationId = Number(id);

  return (
    <PaymentWebViewFlow
      title="Complete payment"
      successPath={INITIAL_PAYMENT_SUCCESS_PATH}
      start={useCallback(() => payInitial(reservationId), [reservationId])}
      reconcile={useCallback(() => reconcileInitial(reservationId), [reservationId])}
      settledCopy={{
        paid: 'Your deposit is held until move-in is confirmed.',
        pending: "We haven't confirmed this payment yet — check back shortly.",
      }}
      doneLabel="Back to agreement"
      onDone={() => router.replace(`/reservation/${reservationId}/agreement`)}
    />
  );
}
