/* eslint-disable max-len */
import { loadAuth2, loadGapiInsideDOM } from 'gapi-script';

const GOOGLE_APP_CLIENT_ID = '847573679345-qq64ofbqhv7gg61e04dbrk8b92djf1fb.apps.googleusercontent.com';
const authScopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];
export const checkHasAllNeededScopes = (scopes:string) => {
  const scopesArray = scopes.split(' ');
  const hasAllScopes = authScopes.every((scope) => scopesArray.includes(scope));
  return hasAllScopes;
};
export const checkGoogleAuthStatus = async () => {
  const gapi = await loadGapiInsideDOM();
  const auth2 = await loadAuth2(gapi, GOOGLE_APP_CLIENT_ID, 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.events.public.readonly');
  if (auth2.isSignedIn.get()) {
    const authResponse = auth2.currentUser.get().getAuthResponse();
    if (checkHasAllNeededScopes(authResponse.scope)) {
      return true;
    } else {
      return false;
    }
  }
  return false;
};
