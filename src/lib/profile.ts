import { api } from './api';
import type { AuthUser } from './auth';

// Matches Api\ProfileController@show — {data: {user, roles}}. Used to
// hydrate the session on cold start (a stored token proves *a* session
// exists, not which user or role) and to re-sync after anything that could
// change roles (e.g. a landlord verification being approved).
export type Profile = {
  user: AuthUser;
  roles: string[];
};

export async function getProfile(): Promise<Profile> {
  const { data } = await api.get<{ data: Profile }>('/profile');
  return data.data;
}

export async function updateProfile(payload: {
  first_name?: string;
  last_name?: string;
  contact_number?: string | null;
  bio?: string | null;
}): Promise<AuthUser> {
  const { data } = await api.patch<{ data: AuthUser }>('/profile', payload);
  return data.data;
}

export async function updatePassword(payload: {
  current_password: string;
  password: string;
  password_confirmation: string;
}): Promise<void> {
  await api.patch('/profile/password', payload);
}
