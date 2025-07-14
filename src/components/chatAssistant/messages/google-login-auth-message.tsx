/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, {
  useCallback,
} from 'react';
import { Button } from 'antd';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { loginWithGoogle } from '../utils/google-api';

import GoogleIcon from '../assets/google.png';

interface IProps {
  deleteMessage: () => void;
}

const GoogleLoginAuthMessage = (props:IProps) => {
  const { deleteMessage } = props;

  const handleAuth = useCallback(() => {
    loginWithGoogle().then((authState) => {
      console.log(authState);
      eventEmitter.emit(Actions.GoogleAuthSuccess);
      deleteMessage();
    }).catch((error) => {
      console.error('Google login failed:', error);
    });
  }, [deleteMessage]);

  return (
    <div className="px-[12px]">
      <div className="p-[10px] border-solid border-[#D9D9D9] rounded-[16px] w-[316px] bg-white dark:bg-[#292929]">
        <span>This service requires access to your Google Calendar.</span>
        <Button
          className="w-auto mt-[4px] flex items-center cursor-pointer hover:opacity-80 hover:!bg-[#F3F3F3]  gap-[8px] bg-[#F3F3F3] px-[12px] py-[10px] rounded-[6px] dark:bg-[var(--color-chat-hover)] h-[36px] border-none"
          onClick={handleAuth}
        >
          <img src={GoogleIcon} alt="" className="w-[16px] h-[16px]" />
          <span>Google authorization</span>
        </Button>
      </div>
    </div>
  );
};

export default GoogleLoginAuthMessage;
