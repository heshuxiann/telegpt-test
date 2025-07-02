/* eslint-disable no-null/no-null */
// auth.ts

export interface AuthState {
  accessToken?: string;
  grantedScopes?: string;
  expiresAt?: number;
  isLoggedIn: boolean;
  idToken?: string;
}

const STORAGE_KEY = 'google_auth_state';

export function setAuthState(state: AuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getAuthState(): AuthState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearAuthState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isTokenValid(state: AuthState | null): boolean {
  if (!state || !state.accessToken || !state.expiresAt) return false;
  return Date.now() < state.expiresAt - 60 * 1000;
}
