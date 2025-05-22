/* eslint-disable no-console */
/* eslint-disable max-len */
import { gapi, loadAuth2 } from 'gapi-script';

const GOOGLE_APP_CLIENT_ID = '847573679345-qq64ofbqhv7gg61e04dbrk8b92djf1fb.apps.googleusercontent.com';
const authScopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');
export const checkHasAllNeededScopes = (scopes:string) => {
  const scopesArray = scopes.split(' ');
  const hasAllScopes = authScopes.every((scope) => scopesArray.includes(scope));
  return hasAllScopes;
};
export const checkGoogleAuthStatus = async () => {
  let auth2 = await loadAuth2(gapi, GOOGLE_APP_CLIENT_ID, SCOPES);
  if (!auth2) {
    auth2 = await loadAuth2(gapi, GOOGLE_APP_CLIENT_ID, SCOPES);
  }
  if (auth2.isSignedIn.get()) {
    const authResponse = auth2.currentUser.get().getAuthResponse();
    if (checkHasAllNeededScopes(authResponse.scope)) {
      return authResponse.access_token;
    } else {
      return false;
    }
  }
  return false;
};

// 初始化并登录
export async function loginWithGoogle() {
  const auth2 = await loadAuth2(gapi, GOOGLE_APP_CLIENT_ID, SCOPES);

  if (!auth2.isSignedIn.get()) {
    const user = await auth2.signIn();
    const profile = user.getBasicProfile();
    const accessToken = user.getAuthResponse().access_token;

    console.log('✅ 登录成功');
    console.log('👤 用户名:', profile.getName());
    console.log('📧 邮箱:', profile.getEmail());
    console.log('🔑 AccessToken:', accessToken);

    return { profile, accessToken };
  } else {
    console.log('🔁 已登录');
    return {
      profile: auth2.currentUser.get().getBasicProfile(),
      accessToken: auth2.currentUser.get().getAuthResponse().access_token,
    };
  }
}
export const signOutGoogle = async () => {
  const auth2 = await loadAuth2(gapi, GOOGLE_APP_CLIENT_ID, SCOPES);
  if (auth2.isSignedIn.get()) {
    auth2.signOut();
  }
};

interface ICreateMeetResponse {
  summary: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees: { email: string }[];
  reminders: { useDefault: boolean; overrides: { method: string; minutes: number }[] };
  conferenceData: { createRequest: { requestId: string; conferenceSolutionKey: { type: string } } };
  hangoutLink:string;
}
export const createGoogleMeet = ({
  startDate,
  endDate,
  selectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  emails = [],
  googleToken,
}:{
  startDate:Date;
  endDate:Date;
  selectedTimezone:string;
  emails:string[];
  googleToken:string;
}):Promise<ICreateMeetResponse> => {
  return new Promise((resolve, reject) => {
    const attendees = emails.map((email) => {
      return {
        email,
      };
    });
    const event = {
      summary: '会议预定',
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
    fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&alt=json&key=AIzaSyAtEl_iCCVN7Gv-xs1kfpcGCfD9IYO-UhU', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${googleToken}`,
      },
      body: JSON.stringify(event),
    }).then((response) => response.json()).then((res) => {
      resolve(res);
    }).catch((err) => {
      reject(err);
    });
  });
};
