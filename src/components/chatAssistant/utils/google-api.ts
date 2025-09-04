/* eslint-disable @stylistic/max-len */
/* eslint-disable no-console */

import { message as showMessage, Modal } from 'antd';

import type { AuthState } from './google-auth';

import { GOOGLE_API_KEY, GOOGLE_APP_CLIENT_ID, GOOGLE_APP_CLIENT_SECRET } from '../../../config';
import { IS_ELECTRON } from '../../../util/browser/windowEnvironment';
import { getAuthState, onLoginSuccess, setAuthState } from './google-auth';

export const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar',
];

export function loadGoogleSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google SDK'));
    document.head.appendChild(script);
  });
}

export async function loginWithGoogle(): Promise<AuthState> {
  return new Promise((resolve, reject) => {
    // 构建OAuth2授权URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_APP_CLIENT_ID!);
    authUrl.searchParams.set('redirect_uri', `${window.location.origin}${window.location.pathname}google-auth-callback.html`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', GOOGLE_SCOPES.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', Math.random().toString(36).substring(2));

    // 打开授权窗口
    const authWindow = window.open(
      authUrl.toString(),
      'google-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes',
    );

    if (!authWindow) {
      reject(new Error('Failed to open authorization window'));
      return;
    }

    // 监听授权窗口消息
    let authCompleted = false;

    const messageHandler = async (event: MessageEvent) => {
      console.log('Received message:', event.data);
      console.log('Message origin:', event.origin);

      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'google-oauth-code') {
        console.log('Authorization code received:', event.data.code);
        window.removeEventListener('message', messageHandler);
        authCompleted = true;

        try {
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: GOOGLE_APP_CLIENT_ID!,
              client_secret: GOOGLE_APP_CLIENT_SECRET!,
              code: event.data.code,
              grant_type: 'authorization_code',
              redirect_uri: `${window.location.origin}${window.location.pathname}google-auth-callback.html`,
            }),
          });

          if (!tokenResponse.ok) {
            throw new Error('Failed to exchange code for token');
          }

          const tokenData = await tokenResponse.json();

          const authState = {
            isLoggedIn: true,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            idToken: tokenData.id_token,
            grantedScopes: tokenData.scope,
            expiresAt: Date.now() + tokenData.expires_in * 1000,
          };

          setAuthState(authState);
          onLoginSuccess();
          resolve(authState);
        } catch (error) {
          reject(error);
        }
      } else if (event.data.type === 'google-oauth-error') {
        window.removeEventListener('message', messageHandler);
        authCompleted = true;
        reject(new Error(event.data.error || 'Authorization failed'));
      }
    };

    window.addEventListener('message', messageHandler);

    // 检查窗口是否被关闭
    const checkClosed = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        // 只有在认证未完成的情况下才触发错误
        if (!authCompleted) {
          reject(new Error('Authorization window was closed'));
        }
      }
    }, 1000);
  });
}

export const createAuthConfirmModal = (props: { onOk?: (accessToken: string) => void; onCancel?: () => void }) => {
  Modal.confirm({
    title: 'Google authorization',
    content: 'This service requires access to your Google Calendar.',
    okText: 'Confirm',
    cancelText: 'Cancel',
    onOk: () => {
      if (IS_ELECTRON) {
        console.log('window.electron', window.electron);
        console.log('googleLogin in preload:', window.electron?.googleLogin);
        window.electron!.googleLogin().then((res) => {
          const authState = {
            isLoggedIn: true,
            accessToken: res.access_token,
            idToken: res.id_token,
            grantedScopes: res.scope,
            expiresAt: res.expiry_date,
          };
          setAuthState(authState);
          props.onOk?.(res.access_token);
        }).catch((error) => {
          console.error('Google login failed:', error);
          showMessage.info('Google login failed');
        });
      } else {
        loginWithGoogle().then((authState) => {
          props.onOk?.(authState.accessToken!);
        }).catch((error) => {
          console.error('Google login failed:', error);
          showMessage.info('Google login failed');
        });
      }
    },
    onCancel: props?.onCancel,
  });
};

export interface ICreateMeetResponse {
  summary: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees: { email: string }[];
  reminders: {
    useDefault: boolean;
    overrides: { method: string; minutes: number }[];
  };
  conferenceData: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: { type: string };
    };
  };
  hangoutLink: string;
}
export const createGoogleMeet = ({
  title = 'Meeting Invitation',
  startDate,
  endDate,
  selectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  emails = [],
  googleToken,
}: {
  title?: string;
  startDate: Date;
  endDate: Date;
  selectedTimezone: string;
  emails: string[];
  googleToken: string;
}): Promise<ICreateMeetResponse> => {
  return new Promise((resolve, reject) => {
    const attendees = emails.map((email) => {
      return {
        email,
      };
    });
    const event = {
      summary: title,
      start: { dateTime: new Date(startDate), timeZone: selectedTimezone },
      end: { dateTime: new Date(endDate), timeZone: selectedTimezone },
      attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 30 },
          { method: 'popup', minutes: 10 },
        ],
      },
      conferenceData: {
        createRequest: {
          requestId: `test-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };
    fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&alt=json&key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleToken}`,
        },
        body: JSON.stringify(event),
      },
    )
      .then((response) => response.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getGoogleCalendarFreeBusy = (): Promise<{ start: string; end: string }[]> => {
  const auth = getAuthState();
  return new Promise((resolve, reject) => {
    const params = {
      timeMin: new Date().toISOString(), // 过去24小时
      timeMax: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 未来3天
      items: [{ id: 'primary' }], // 查询主日历
    };
    fetch(`https://www.googleapis.com/calendar/v3/freeBusy?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth?.accessToken}`,
      },
      body: JSON.stringify(params),
    }).then((res) => res.json())
      .then((res) => {
        resolve(res?.calendars.primary.busy || []);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
