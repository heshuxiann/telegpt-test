/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, {
  useCallback,
} from 'react';
import type { Message } from 'ai';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { CHATAI_IDB_STORE } from '../../../util/browser/idb';
import { loginWithGoogle } from '../utils/google-api';

import GoogleIcon from '../assets/google.png';

const GoogleLoginAuthMessage = ({ message }:{ message:Message }) => {
  const updateToken = useCallback((accessToken:string) => {
    CHATAI_IDB_STORE.set('google-token', accessToken);
    eventEmitter.emit(Actions.UpdateGoogleToken, {
      message,
      token: accessToken,
    });
    eventEmitter.emit(Actions.GoogleAuthSuccess);
  }, [message]);

  const handleLogin = () => {
    loginWithGoogle().then(({ accessToken }) => {
      updateToken(accessToken);
    });
  };

  return (
    <div className="px-[12px]">
      <div className="p-[10px] border-solid border-[#D9D9D9] rounded-[16px] w-[316px] bg-white dark:bg-[#292929]">
        <span>This service requires access to your Google Calendar.</span>
        <div
          className="w-auto flex items-center cursor-pointer hover:opacity-80 gap-[8px] bg-[#F3F3F3] px-[12px] py-[10px] rounded-[6px]"
          onClick={handleLogin}
        >
          <img src={GoogleIcon} alt="" />
          <span>Google authorization</span>
        </div>
      </div>
    </div>
  );
};

export default GoogleLoginAuthMessage;
