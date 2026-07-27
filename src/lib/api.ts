import axios from 'axios';

import { deleteStoredToken, getStoredToken, setStoredToken } from './token-storage';

// Set in .env (copy .env.example) — 127.0.0.1 will not reach your Laravel
// dev server from a device or most emulators. See .env.example.
const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    'EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env and fill in your machine\'s LAN IP.'
  );
}

const TOKEN_KEY = 'abangananhub_token';

export const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json' },
});

// Every authenticated request needs the Sanctum Bearer token — attached here
// once instead of at every call site, so a call site can't forget it.
api.interceptors.request.use(async (config) => {
  const token = await getStoredToken(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 means the token is dead (logout elsewhere, or the account was
// suspended — see EnsureAccountActive on the server, which revokes the
// presenting token). Clearing it here means the next screen render sees
// "logged out" instead of silently retrying with a token that will never
// work again.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await deleteStoredToken(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export async function setToken(token: string): Promise<void> {
  await setStoredToken(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return getStoredToken(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await deleteStoredToken(TOKEN_KEY);
}
