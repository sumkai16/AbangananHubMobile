import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// SecureStore has no web implementation (iOS/Android only) — calling it in
// a browser throws "getValueWithKeyAsync is not a function". Web has no
// hardware-backed secure storage equivalent, so `localStorage` is the
// pragmatic fallback there; this only matters for `npx expo start --web`
// smoke-testing, real usage is the native app where SecureStore is used.
export async function getStoredToken(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  }
  return SecureStore.getItemAsync(key);
}

export async function setStoredToken(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteStoredToken(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
