/* eslint-disable no-console */
/* eslint-disable max-len */
import type { AuthState } from './google-auth';

import { setAuthState } from './google-auth';

// export const GOOGLE_APP_CLIENT_ID = '847573679345-qq64ofbqhv7gg61e04dbrk8b92djf1fb.apps.googleusercontent.com';
// export const GOOGLE_APP_CLIENT_ID_PRO = '166854276552-euk0006iphou9bvqplmgmpc0vde8v1in.apps.googleusercontent.com';
export const GOOGLE_APP_CLIENT_ID_DEV = '545055439232-l17p8a5fs7b5377726doqt2cpd9qfta4.apps.googleusercontent.com';
export const GOOGLE_API_KEY_DEV = 'AIzaSyAc7yi96E4qjF16-n40wDm-Wz0MPZnLLs8';
export const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
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
