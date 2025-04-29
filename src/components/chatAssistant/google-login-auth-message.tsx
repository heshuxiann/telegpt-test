/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { loadAuth2, loadGapiInsideDOM } from 'gapi-script';

import GoogleIcon from './assets/google.png';

const GoogleLoginAuthMessage = () => {
  const GOOGLE_APP_CLIENT_ID = useRef('847573679345-qq64ofbqhv7gg61e04dbrk8b92djf1fb.apps.googleusercontent.com');
  const [gapi, setGapi] = useState(null);
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const loadGapi = async () => {
      const newGapi = await loadGapiInsideDOM();
      setGapi(newGapi);
    };
    loadGapi();
  }, []);

  const attachSignin = useCallback((element:any, auth2:any) => {
    auth2.attachClickHandler(element, {}, (googleUser:any) => {
      updateUser(googleUser);
      updateToken(googleUser);
    }, (error:any) => {
      console.log(JSON.stringify(error));
    });
  }, []);

  useEffect(() => {
    if (!gapi) return;

    const setAuth2 = async () => {
      const auth2 = await loadAuth2(gapi, GOOGLE_APP_CLIENT_ID.current, 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.events.public.readonly');
      if (auth2.isSignedIn.get()) {
        updateUser(auth2.currentUser.get());
        updateToken(auth2.currentUser.get());
      } else {
        attachSignin(document.getElementById('authBtn'), auth2);
      }
    };
    setAuth2();
  }, [attachSignin, gapi]);

  useEffect(() => {
    if (!gapi) return;

    if (!user) {
      const setAuth2 = async () => {
        const auth2 = await loadAuth2(gapi, GOOGLE_APP_CLIENT_ID.current, 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.events.public.readonly');
        attachSignin(document.getElementById('authBtn'), auth2);
      };
      setAuth2();
    }
  }, [gapi, attachSignin, user]);

  const updateUser = (currentUser: any) => {
    const name = currentUser.getBasicProfile().getName();
    const profileImg = currentUser.getBasicProfile().getImageUrl();
    console.log(name, profileImg);
    setUser({ name, profileImg });
  };

  const updateToken = (currentUser: any) => {
    const token = currentUser.getAuthResponse().access_token;
    console.log(token);
  };
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
