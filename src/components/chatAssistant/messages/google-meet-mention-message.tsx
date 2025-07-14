/* eslint-disable max-len */
/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import type { Message } from 'ai';
import { getGlobal } from '../../../global';

import { getMessageContent, getUserFullName, hasMessageText } from '../../../global/helpers';
import { selectChatLastMessageId, selectChatMessage, selectUser } from '../../../global/selectors';
import { createAuthConfirmModal } from '../utils/google-api';
import { getAuthState, isTokenValid } from '../utils/google-auth';
import ScheduleMeeting from '../utils/schedule-meeting';

const GoogleMeetMentionMessage = ({ message }:{ message:Message }) => {
  const { chatId, messageId } = JSON.parse(message.content) || {};

  const renderName = () => {
    const global = getGlobal();
    const user = selectUser(global, chatId);
    const fullName = user ? getUserFullName(user) : '';
    return fullName;
  };
  const handleConfirm = () => {
    if (!chatId || !messageId) {
      return;
    }
    const global = getGlobal();
    // TODO: get meeting info from recent message
    let messageString = '';
    const chatLastMessageId = selectChatLastMessageId(global, chatId) || 0;
    for (let i = messageId; i <= chatLastMessageId; i++) {
      const messageItem = selectChatMessage(global, chatId, i);
      if (messageItem && hasMessageText(messageItem) && !messageItem.isOutgoing) {
        const text = getMessageContent(messageItem).text?.text;
        messageString += `;${text}`;
      }
    }
    const scheduleMeeting = ScheduleMeeting.create({ chatId });
    const auth = getAuthState();
    if (!auth || !isTokenValid(auth)) {
      createAuthConfirmModal({
        onOk: () => {
          scheduleMeeting.start({
            chatId,
            text: messageString,
          });
        },
      });
    } else {
      scheduleMeeting.start({
        chatId,
        text: messageString,
      });
    }
  };
  return (
    <div className="px-[12px] text-[14px]">
      <div className="p-[10px] border border-solid border-[#D9D9D9] rounded-[16px] w-[326px] bg-white dark:bg-[#292929] dark:border-[#292929]">
        <div>
          🔔 I noticed that {renderName()} wants to schedule a meeting with you. Would you like me to help set it up?
        </div>
        <div>
          👉 Click <button className="underline decoration-2" onClick={handleConfirm}>"Yes"</button> to proceed, or ignore this message.
        </div>
      </div>
    </div>
  );
};

export default GoogleMeetMentionMessage;
