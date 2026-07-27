import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import '@/global.css';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { BrowseFiltersProvider } from '@/lib/browse-filters-context';
import { reservationIdFromLink } from '@/lib/notifications';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Tapping a push (foreground, background, or cold-start) routes to the
  // reservation it's about — the same `link`-parsing rule the in-app
  // notifications list uses, since the push payload only carries `link`
  // (see ExpoPushNotifier), not a conversation_id.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const link = response.notification.request.content.data?.link as string | undefined;
      const reservationId = reservationIdFromLink(link ?? null);
      if (reservationId) {
        router.push(`/reservation/${reservationId}`);
      }
    });
    return () => subscription.remove();
  }, [router]);

  // AnimatedSplashOverlay owns hiding the splash screen (it calls
  // SplashScreen.hideAsync() itself once its first frame lays out) — this
  // just holds off rendering real routes until we know the auth state,
  // so the overlay never uncovers a login flash for an already-signed-in user.
  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="property/[id]" options={{ headerShown: true }} />
        <Stack.Screen name="reservation/[id]/index" options={{ headerShown: true }} />
        <Stack.Screen name="reservation/[id]/agreement" options={{ headerShown: true }} />
        <Stack.Screen name="reservation/[id]/tenancy" options={{ headerShown: true }} />
        <Stack.Screen name="reservation/[id]/handover" options={{ headerShown: true }} />
        <Stack.Screen name="reservation/[id]/dispute" options={{ headerShown: true }} />
        <Stack.Screen name="reservation/[id]/pay" options={{ headerShown: true, presentation: 'modal' }} />
        <Stack.Screen name="reservation/[id]/pay-rent" options={{ headerShown: true, presentation: 'modal' }} />
        <Stack.Screen name="landlord/verification" options={{ headerShown: true, presentation: 'modal' }} />
        <Stack.Screen name="profile/edit" options={{ headerShown: true, title: 'Edit Profile' }} />
        <Stack.Screen
          name="profile/change-password"
          options={{ headerShown: true, title: 'Change Password' }}
        />
        <Stack.Screen name="reviews/submit" options={{ headerShown: true, title: 'Write a Review' }} />
        <Stack.Screen name="reports/submit" options={{ headerShown: true, title: 'Report a Problem' }} />
        <Stack.Screen name="reports/index" options={{ headerShown: true, title: 'My Reports' }} />
        <Stack.Screen name="search" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="conversation/[id]" options={{ headerShown: true }} />
        <Stack.Screen name="reservation/inquire" options={{ headerShown: true, presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <BrowseFiltersProvider>
          <AnimatedSplashOverlay />
          <RootNavigator />
        </BrowseFiltersProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
