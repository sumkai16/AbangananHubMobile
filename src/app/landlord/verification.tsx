import { Stack } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import WebView from 'react-native-webview';

import { Button } from '@/components/ui/button';
import { extractErrorMessage } from '@/lib/api-error';
import { getWebviewLoginUrl } from '@/lib/webview-auth';

/**
 * The landlord KYC wizard — face-api.js liveness against getUserMedia, OCR
 * ID matching — stays web UI in a WebView rather than being ported.
 * Porting it means finding a native equivalent for a 68-point landmark
 * model and re-tuning every threshold, for a flow each landlord completes
 * exactly once. See plans/mobile-app.md (server repo).
 *
 * Accepted consequence: the wizard already collapses to its mobile
 * step-bar below `lg`, so it renders fine — but it is web UI in a native
 * shell and will look like it.
 */
export default function LandlordVerificationScreen() {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Request a fresh ticket every time this screen mounts — it's single-use
  // and expires in 2 minutes, so it must not be requested ahead of time or
  // reused after a back-navigation.
  const load = useCallback(async () => {
    setError(null);
    setUrl(null);
    try {
      setUrl(await getWebviewLoginUrl());
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Stack.Screen options={{ title: 'Verification' }} />
        <AlertCircle size={32} color="#EF4444" />
        <Text className="mt-3 text-center text-sm font-semibold text-error">{error}</Text>
        <View className="mt-4">
          <Button title="Try again" fullWidth={false} onPress={load} />
        </View>
      </View>
    );
  }

  if (!url) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={{ title: 'Verification' }} />
        <ActivityIndicator color="#156F8C" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Landlord verification' }} />
      <WebView
        source={{ uri: url }}
        // The wizard needs camera access for ID/selfie capture.
        mediaCapturePermissionGrantType="grant"
        allowsInlineMediaPlayback
        javaScriptEnabled
      />
    </View>
  );
}
