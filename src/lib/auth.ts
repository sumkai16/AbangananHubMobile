import { api, clearToken, setToken } from './api';

// Matches Api\AuthController::login/register's response shape exactly
// (app/Http/Controllers/Api/AuthController.php on the Laravel side) —
// {user, token, roles}, both endpoints now return the same shape.
export type AuthUser = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture: string | null;
  account_status: string;
  created_at?: string;
  [key: string]: unknown;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
  roles: string[];
};

export async function login(email: string, password: string, deviceName: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', {
    email,
    password,
    device_name: deviceName,
  });
  await setToken(data.token);
  return data;
}

export async function register(payload: {
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  password: string;
  password_confirmation: string;
  device_name: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  await setToken(data.token);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    // Clear locally even if the request fails (e.g. token already dead) —
    // the user's intent is to be logged out on this device regardless.
    await clearToken();
  }
}
