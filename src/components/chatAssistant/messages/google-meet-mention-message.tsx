/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import type { Message } from './types';
import cx from 'classnames';
import { getGlobal } from '../../../global';

import { getUserFullName } from '../../../global/helpers';
import { selectChatMessage, selectUser } from '../../../global/selectors';
import { ChataiStores } from '../store';
import { parseMessage2StoreMessage } from '../store/messages-store';
import { createAuthConfirmModal } from '../utils/google-api';
import { getAuthState, isTokenValid } from '../utils/google-auth';
import ScheduleMeeting from '../utils/schedule-meeting';

const GoogleMeetMentionMessage = ({ message }: { message: Message }) => {
  const { chatId, messageId, isConfirmed } = JSON.parse(message.content) || {};
  const [mergeConfirmed, setMergeConfirmed] = useState(isConfirmed);

  const renderName = () => {
    const global = getGlobal();
    const user = selectUser(global, chatId);
    const fullName = user ? getUserFullName(user) : '';
    return fullName;
  };

  const handleConfirm = () => {
    // TODO: get meeting info from recent message
    const scheduleMeeting = ScheduleMeeting.create({ chatId });
    const global = getGlobal();
    const targetMessage = selectChatMessage(global, chatId, Number(messageId));
    scheduleMeeting.handleTargetMessage(targetMessage!);
    setMergeConfirmed(true);
    message.content = JSON.stringify({
      chatId,
      messageId,
      isConfirmed: true,
    });
    ChataiStores?.message?.storeMessage(parseMessage2StoreMessage(chatId, [message])[0]);
  };
  const handleClick = async () => {
    if (mergeConfirmed) {
      return;
    }
    if (!chatId || !messageId) {
      return;
    }

    const auth = getAuthState();
    if (!auth || !(await isTokenValid(auth))) {
      createAuthConfirmModal({
        onOk: () => {
          handleConfirm();
        },
      });
    } else {
      handleConfirm();
    }
  };

  return (
    <div className="px-[12px] text-[15px]">
      <div
        className="p-[10px] border border-solid border-[#D9D9D9] rounded-[16px] w-full bg-white dark:bg-[#292929] dark:border-[#292929]"
      >
        <div>
          🔔 I noticed that
          {' '}
          {renderName()}
          {' '}
          wants to schedule a meeting with you. Would you like me to help set it up?
        </div>
        <div>
          👉 Click
          <span
            className={cx('cursor-pointer mx-[2px] outline-none border-none focus:outline-none focus:ring-0', {
              'underline decoration-2': !mergeConfirmed,
            })}
            onClick={handleClick}
          >
            "Yes"
          </span>
          to proceed, or ignore this message.
        </div>
      </div>
    </div>
  );
};

export default GoogleMeetMentionMessage;
