import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import '@/global.css';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/lib/auth-context';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

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
        <AnimatedSplashOverlay />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
