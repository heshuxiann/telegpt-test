/* eslint-disable no-console */
/* eslint-disable max-len */
import { message as showMessage, Modal } from 'antd';

import type { AuthState } from './google-auth';

import { IS_ELECTRON } from '../../../util/browser/windowEnvironment';
import { getAuthState, setAuthState } from './google-auth';

export const GOOGLE_APP_CLIENT_ID_DEV = '545055439232-l17p8a5fs7b5377726doqt2cpd9qfta4.apps.googleusercontent.com';
export const GOOGLE_API_KEY_DEV = 'AIzaSyAc7yi96E4qjF16-n40wDm-Wz0MPZnLLs8';
export const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.freebusy',
  'https://www.googleapis.com/auth/calendar.freebusy',
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

export async function loginWithGoogle():Promise<AuthState> {
  if (!window.google?.accounts?.oauth2) {
    await loadGoogleSdk();
  }
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_APP_CLIENT_ID_DEV,
      scope: GOOGLE_SCOPES.join(' '),
      prompt: 'consent',
      ux_mode: 'popup',
      callback: (resp) => {
        if (resp?.error) {
          reject(resp.error);
        }
        const authState = {
          isLoggedIn: true,
          accessToken: resp.access_token,
          idToken: resp.id_token,
          grantedScopes: resp.scope,
          expiresAt: Date.now() + resp.expires_in * 1000,
        };
        setAuthState(authState);
        resolve(authState);
      },
    });

    client.requestAccessToken();
  });
}

export const createAuthConfirmModal = (props:{ onOk?:(accessToken:string)=>void;onCancel?:()=>void }) => {
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
          props.onOk?.(res.access_token!);
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
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&alt=json&key=${GOOGLE_API_KEY_DEV}`,
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

export const getGoogleCalendarFreeBusy = ():Promise<{ start:string; end:string }[]> => {
  const auth = getAuthState();
  return new Promise((resolve, reject) => {
    const params = {
      timeMin: new Date().toISOString(), // 过去24小时
      timeMax: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 未来3天
      items: [{ id: 'primary' }], // 查询主日历
    };
    fetch(`https://www.googleapis.com/calendar/v3/freeBusy?key=${GOOGLE_API_KEY_DEV}`, {
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
