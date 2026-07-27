import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { getToken } from './api';
import { login, logout, register, type AuthResponse, type AuthUser } from './auth';
import { connectEcho, disconnectEcho } from './echo';
import { getProfile } from './profile';

type AuthContextValue = {
  user: AuthUser | null;
  // Roles read from GET /profile at boot (or from login/register's own
  // response, which returns the same shape without a second round trip).
  // Empty until hydration finishes — check isLoading before reading it as
  // "this user has no roles."
  roles: string[];
  // Mirrors the server's User::homeRoute() precedence: a landlord sees the
  // landlord shell even if they also hold the Tenant role. Admin is
  // deliberately absent — admin stays web-only (see PRD.md § Scope decided).
  isLandlord: boolean;
  // True whenever a token is stored, even in the brief window before
  // hydrate() resolves — the token proves a session exists before we know
  // which user or role it belongs to.
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: Omit<Parameters<typeof register>[0], 'device_name'>) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-reads roles from the server — call after anything that could
   * change them (e.g. a landlord verification being approved). */
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// device_name identifies this Sanctum token in `personal_access_tokens` —
// doesn't need to be unique per device, just descriptive for the user's
// "active sessions" list.
const DEVICE_NAME = 'AbangananHub Mobile App';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Starts true: on launch we don't yet know if a token exists, so routing
  // must wait rather than briefly flashing the login screen.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getToken().then(async (token) => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      // A stored token can be dead (revoked, account suspended) — the
      // request interceptor in api.ts clears it on a 401, so a failure
      // here means "not actually signed in," not a network error to retry.
      try {
        const profile = await getProfile();
        setUser(profile.user);
        setRoles(profile.roles);
        setIsAuthenticated(true);
        connectEcho(token);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  function applyAuthResponse(data: AuthResponse) {
    setUser(data.user);
    setRoles(data.roles);
    setIsAuthenticated(true);
    connectEcho(data.token);
  }

  async function signIn(email: string, password: string) {
    const data = await login(email, password, DEVICE_NAME);
    applyAuthResponse(data);
  }

  async function signUp(payload: Omit<Parameters<typeof register>[0], 'device_name'>) {
    const data = await register({ ...payload, device_name: DEVICE_NAME });
    applyAuthResponse(data);
  }

  async function signOut() {
    await logout();
    disconnectEcho();
    setUser(null);
    setRoles([]);
    setIsAuthenticated(false);
  }

  async function refreshProfile() {
    const profile = await getProfile();
    setUser(profile.user);
    setRoles(profile.roles);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        isLandlord: roles.includes('Landlord'),
        isAuthenticated,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
