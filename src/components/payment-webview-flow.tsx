import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import WebView from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';

import { Button } from '@/components/ui/button';
import { extractErrorMessage } from '@/lib/api-error';
import type { CheckoutSession, Payment } from '@/lib/payments';

type Phase = 'starting' | 'checkout' | 'reconciling' | 'settled' | 'failed';

/**
 * The hosted-checkout flow, shared by the initial deposit and monthly rent.
 * The two differ only in which endpoints they call, so they share this
 * rather than keeping two copies of the interception logic in sync.
 *
 * GCash/QRPh render exactly as they do on web — nothing about PayMongo's
 * page changes. What's mobile-specific is the return: instead of letting
 * the WebView load `success_url` (a *web* route this Bearer-token client
 * has no session for), navigation toward it is intercepted and swapped for
 * a reconcile call. PayMongo can't reach a local dev machine, so in that
 * environment its webhook never fires and reconcile is the only thing that
 * ever settles the payment — see `Concerns\ReconcilesPaymongoCheckout`.
 */
export function PaymentWebViewFlow({
  title,
  successPath,
  start,
  reconcile,
  settledCopy,
  onDone,
  doneLabel,
}: {
  title: string;
  successPath: string;
  start: () => Promise<CheckoutSession>;
  reconcile: () => Promise<Payment | null>;
  settledCopy: { paid: string; pending: string };
  onDone: () => void;
  doneLabel: string;
}) {
  const [phase, setPhase] = useState<Phase>('starting');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  // The WebView can fire navigation events more than once for the same URL;
  // reconcile must not be called twice for one checkout.
  const reconciling = useRef(false);

  const startCheckout = useCallback(async () => {
    setPhase('starting');
    setError(null);
    try {
      const session = await start();
      setCheckoutUrl(session.checkout_url);
      setPhase('checkout');
    } catch (err) {
      setError(extractErrorMessage(err));
      setPhase('failed');
    }
  }, [start]);

  useEffect(() => {
    startCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per mount;
    // startCheckout's identity changes with the caller's inline closures.
  }, []);

  async function handleSuccessIntercepted() {
    if (reconciling.current) return;
    reconciling.current = true;
    setPhase('reconciling');
    try {
      setPayment(await reconcile());
      setPhase('settled');
    } catch (err) {
      setError(extractErrorMessage(err));
      setPhase('failed');
    } finally {
      reconciling.current = false;
    }
  }

  function handleShouldStartLoad(request: ShouldStartLoadRequest): boolean {
    if (request.url.includes(successPath)) {
      handleSuccessIntercepted();
      return false;
    }
    return true;
  }

  const screen = <Stack.Screen options={{ title, presentation: 'modal' }} />;

  if (phase === 'starting') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        {screen}
        <ActivityIndicator color="#156F8C" />
      </View>
    );
  }

  if (phase === 'failed') {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        {screen}
        <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
        <Text className="mt-3 text-center text-sm font-semibold text-error">{error}</Text>
        <View className="mt-4">
          <Button title="Try again" fullWidth={false} onPress={startCheckout} />
        </View>
      </View>
    );
  }

  if (phase === 'reconciling') {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        {screen}
        <ActivityIndicator color="#156F8C" />
        <Text className="mt-3 text-center text-sm font-semibold text-text-primary">
          Confirming your payment...
        </Text>
      </View>
    );
  }

  if (phase === 'settled') {
    const paid = payment?.status === 'Held' || payment?.status === 'Paid';
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        {screen}
        <Ionicons
          name={paid ? 'checkmark-circle' : 'time-outline'}
          size={40}
          color={paid ? '#22C55E' : '#FBBF24'}
        />
        <Text className="mt-3 text-center text-base font-bold text-text-primary">
          {paid ? 'Payment received' : 'Payment pending'}
        </Text>
        <Text className="mt-1 text-center text-xs text-text-muted">
          {paid ? settledCopy.paid : settledCopy.pending}
        </Text>
        <View className="mt-5">
          <Button title={doneLabel} fullWidth={false} onPress={onDone} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {screen}
      {!!checkoutUrl && (
        <WebView source={{ uri: checkoutUrl }} onShouldStartLoadWithRequest={handleShouldStartLoad} />
      )}
    </View>
  );
}
