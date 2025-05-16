/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import type { Message } from 'ai';
import { loadAuth2, loadGapiInsideDOM } from 'gapi-script';

import eventEmitter, { Actions } from './lib/EventEmitter';
import { CHATAI_IDB_STORE } from '../../util/browser/idb';
import { checkHasAllNeededScopes } from './utils/google-api';

import GoogleIcon from './assets/google.png';

const GoogleLoginAuthMessage = ({ message }:{ message:Message }) => {
  const GOOGLE_APP_CLIENT_ID = useRef('847573679345-qq64ofbqhv7gg61e04dbrk8b92djf1fb.apps.googleusercontent.com');
  const [gapi, setGapi] = useState(null);
  useEffect(() => {
    const loadGapi = async () => {
      const newGapi = await loadGapiInsideDOM();
      setGapi(newGapi);
    };
    loadGapi();
  }, []);

  const updateToken = useCallback((authResponse: any) => {
    const token = authResponse.access_token;
    CHATAI_IDB_STORE.set('google-token', token);
    eventEmitter.emit(Actions.UpdateGoogleToken, {
      message,
      token,
    });
  }, [message]);

  const attachSignin = useCallback((auth2:any) => {
    const element = document.getElementById('authBtn');
    auth2.attachClickHandler(element, {}, (googleUser:any) => {
      const authResponse = googleUser.getAuthResponse();
      if (checkHasAllNeededScopes(authResponse.scope)) {
        updateToken(authResponse);
        eventEmitter.emit(Actions.GoogleAuthSuccess);
      }
    }, (error:any) => {
      console.log(JSON.stringify(error));
    });
  }, [updateToken]);

  useEffect(() => {
    if (!gapi) return;
    const setAuth2 = async () => {
      const auth2 = await loadAuth2(gapi, GOOGLE_APP_CLIENT_ID.current, 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.events.public.readonly');
      if (auth2.isSignedIn.get()) {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const authResponse = auth2.currentUser.get().getAuthResponse();
        if (checkHasAllNeededScopes(authResponse.scope)) {
          updateToken(authResponse);
        } else {
          attachSignin(auth2);
        }
      } else {
        attachSignin(auth2);
      }
    };
    setAuth2();
  }, [attachSignin, gapi, updateToken]);

  return (
    <div className="px-[12px]">
      <div className="p-[10px] border-solid border-[#D9D9D9] rounded-[16px] bg-white w-[316px]">
        <span>This service requires access to your Google Calendar.</span>
        <div id="authBtn" className="w-auto flex items-center cursor-pointer hover:opacity-80 gap-[8px] bg-[#F3F3F3] px-[12px] py-[10px] rounded-[6px]">
          <img src={GoogleIcon} alt="" />
          <span>Google authorization</span>
        </div>
      </div>
    </div>
  );
};

export default GoogleLoginAuthMessage;
