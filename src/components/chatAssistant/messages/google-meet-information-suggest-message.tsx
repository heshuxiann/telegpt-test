/* eslint-disable max-len */
/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import type { Message } from 'ai';
import { getActions, getGlobal } from '../../../global';

import { getUserFullName } from '../../../global/helpers';
import { selectUser } from '../../../global/selectors';
import { ChataiStores } from '../store';
import { parseMessage2StoreMessage } from '../store/messages-store';
import { userInformationCollection } from '../utils/user-information-collection';

const GoogleMeetInformationSuggestMessage = ({ message }:{ message:Message }) => {
  const {
    chatId, messageId, senderId, emailConfirmed, calendlyConfirmed, suggestType,
  } = JSON.parse(message.content) || {};
  const [mergeEmailConfirmed, setMergeEmailConfirmed] = useState(emailConfirmed);
  const [mergeCalendlyConfirmed, setMergeCalendlyConfirmed] = useState(calendlyConfirmed);
  const { emails, calendlyUrls } = userInformationCollection.informations;
  const global = getGlobal();
  const peer = senderId ? selectUser(global, senderId) : undefined;
  const fullName = peer ? getUserFullName(peer) : '';
  const handleCalendlyUrlClick = (url:string) => {
    if (mergeCalendlyConfirmed) {
      return;
    }
    getActions().sendMessage({
      messageList: {
        chatId,
        threadId: '-1',
        type: 'thread',
      },
      text: url,
    });
    setMergeCalendlyConfirmed(true);
    message.content = JSON.stringify({
      chatId,
      messageId,
      emailConfirmed,
      calendlyConfirmed: true,
      suggestType,
    });
    ChataiStores?.message?.storeMessage(parseMessage2StoreMessage(chatId, [message])[0]);
  };

  const handleEmailClick = (email:string) => {
    if (mergeEmailConfirmed) {
      return;
    }
    getActions().sendMessage({
      messageList: {
        chatId,
        threadId: '-1',
        type: 'thread',
      },
      text: email,
    });
    setMergeEmailConfirmed(true);
    message.content = JSON.stringify({
      chatId,
      messageId,
      emailConfirmed: true,
      calendlyConfirmed,
      suggestType,
    });
    ChataiStores?.message?.storeMessage(parseMessage2StoreMessage(chatId, [message])[0]);
  };

  if (suggestType === 'both' && !calendlyUrls.length && !emails.length) {
    return undefined;
  } else if (suggestType === 'email' && !emails.length) {
    return undefined;
  } else if (suggestType === 'time' && !calendlyUrls.length) {
    return undefined;
  }

  return (
    <div className="px-[12px] text-[15px]">
      <div
        className="p-[10px] border border-solid border-[#D9D9D9] rounded-[16px] w-full bg-white dark:bg-[#292929] dark:border-[#292929]"
      >
        <p>
          🔔 I noticed that {fullName} wants to schedule a meeting with you. Would you like to send  the calendar and email?
        </p>
        <ul className="list-disc pl-[18px] mb-[4px]">
          {(suggestType === 'both' || suggestType === 'time') && calendlyUrls.length > 0 && (
            <>
              {calendlyUrls.map((url: any) => {
                return (
                  <li className="word-break break-all">
                    <b>Calendar:</b>{url}
                    {!mergeCalendlyConfirmed && (
                      <span
                        className="mx-[2px] outline-none border-none focus:outline-none focus:ring-0 underline decoration-2"
                        onClick={() => handleCalendlyUrlClick(url)}
                      >
                        Send👉
                      </span>
                    )}
                  </li>
                );
              })}
            </>
          )}
          {(suggestType === 'both' || suggestType === 'email') && emails.length > 0 && (
            <>
              {emails.map((email: any) => {
                return (
                  <li className="word-break break-all">
                    <b>Email:</b>{email}
                    {!mergeEmailConfirmed && (
                      <span
                        className="mx-[2px] outline-none border-none focus:outline-none focus:ring-0 underline decoration-2"
                        onClick={() => handleEmailClick(email)}
                      >
                        Send👉
                      </span>
                    )}

                  </li>
                );
              })}
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default GoogleMeetInformationSuggestMessage;
