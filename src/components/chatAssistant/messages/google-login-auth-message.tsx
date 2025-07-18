/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, {
  useCallback,
} from 'react';
import { Button } from 'antd';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { IS_ELECTRON } from '../../../util/browser/windowEnvironment';
import { loginWithGoogle } from '../utils/google-api';
import { setAuthState } from '../utils/google-auth';

import GoogleIcon from '../assets/google.png';

interface IProps {
  deleteMessage: () => void;
}

const GoogleLoginAuthMessage = (props:IProps) => {
  const { deleteMessage } = props;

  const handleAuth = useCallback(() => {
    if (IS_ELECTRON) {
      window.electron!.googleLogin().then((res) => {
        const authState = {
          isLoggedIn: true,
          accessToken: res.access_token,
          idToken: res.id_token,
          grantedScopes: res.scope,
          expiresAt: res.expiry_date,
        };
        setAuthState(authState);
        eventEmitter.emit(Actions.GoogleAuthSuccess);
        deleteMessage();
      }).catch((error) => {
        console.error('Google login failed:', error);
      });
    } else {
      loginWithGoogle().then((authState) => {
        console.log(authState);
        eventEmitter.emit(Actions.GoogleAuthSuccess);
        deleteMessage();
      }).catch((error) => {
        console.error('Google login failed:', error);
      });
    }
  }, [deleteMessage]);

  return (
    <div className="px-[12px]">
      <div className="p-[10px] border-solid border-[#D9D9D9] rounded-[16px] w-[316px] bg-white dark:bg-[#292929]">
        <span>This service requires access to your Google Calendar.</span>
        <Button
          className="w-auto mt-[4px] flex items-center cursor-pointer hover:opacity-80 hover:!bg-[#F3F3F3]  gap-[8px] bg-[#F3F3F3] px-[12px] py-[10px] rounded-[6px] dark:!bg-[#383838] h-[36px] border-none"
          onClick={handleAuth}
        >
          <img src={GoogleIcon} alt="" className="w-[16px] h-[16px]" />
          <span className="text-[var(--color-text)]">Google authorization</span>
        </Button>
      </div>
    </div>
  );
};

export default GoogleLoginAuthMessage;
