/* eslint-disable no-null/no-null */
// auth.ts

export interface AuthState {
  accessToken?: string;
  refreshToken?: string;
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

export async function isTokenValid(state: AuthState | null): Promise<boolean> {
  if (!state || !state.accessToken || !state.expiresAt) return false;

  // 如果token仍然有效（还有1分钟以上）
  if (Date.now() < state.expiresAt - 60 * 1000) {
    return true;
  }

  // token已过期，尝试使用refreshToken获取新的token
  if (state.refreshToken) {
    const refreshedState = await refreshAccessToken();
    return refreshedState !== null;
  }

  return false;
}

export async function refreshAccessToken(): Promise<AuthState | null> {
  const currentState = getAuthState();
  if (!currentState?.refreshToken) {
    return null;
  }

  try {
    const { GOOGLE_APP_CLIENT_ID, GOOGLE_APP_CLIENT_SECRET } = await import('../../../config');
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_APP_CLIENT_ID!,
        client_secret: GOOGLE_APP_CLIENT_SECRET!,
        refresh_token: currentState.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    const newAuthState = {
      ...currentState,
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      // 保留原有的refresh_token（除非返回了新的）
      refreshToken: data.refresh_token || currentState.refreshToken,
    };

    setAuthState(newAuthState);
    return newAuthState;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Token refresh failed:', error);
    clearAuthState();
    return null;
  }
}

export async function isTokenValidOrRefresh(): Promise<boolean> {
  const state = getAuthState();
  if (!state || !state.accessToken) return false;

  // 如果token仍然有效（还有5分钟以上）
  if (state.expiresAt && Date.now() < state.expiresAt - 5 * 60 * 1000) {
    return true;
  }

  // 尝试刷新token
  const refreshedState = await refreshAccessToken();
  return refreshedState !== null;
}

let refreshTimer: NodeJS.Timeout | null = null;

export function startTokenRefreshTimer() {
  // 清除现有定时器
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  // 每5分钟检查一次token状态
  refreshTimer = setInterval(async () => {
    const authState = getAuthState();
    if (authState && authState.expiresAt) {
      // 如果token在10分钟内过期，则刷新
      const timeUntilExpiry = authState.expiresAt - Date.now();
      if (timeUntilExpiry < 10 * 60 * 1000) {
        await refreshAccessToken();
      }
    }
  }, 5 * 60 * 1000); // 5分钟检查一次
}

export function stopTokenRefreshTimer() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

export function initializeGoogleAuth() {
  const authState = getAuthState();
  if (authState?.isLoggedIn) {
    startTokenRefreshTimer();
  }
}

export function onLoginSuccess() {
  startTokenRefreshTimer();
}

export function onLogout() {
  stopTokenRefreshTimer();
  clearAuthState();
}
