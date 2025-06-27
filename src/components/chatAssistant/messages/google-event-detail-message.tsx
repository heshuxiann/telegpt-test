/* eslint-disable max-len */
/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import React, { useEffect, useState } from 'react';
import type { Message } from 'ai';

import { FormLabel } from './google-event-create-messages';

const GoogleEventDetailMessage = ({ message }:{ message:Message }) => {
  const [messageContent, setMessageContent] = useState<any>(null);
  useEffect(() => {
    try {
      const parsedMessage = JSON.parse(message.content);
      setMessageContent(parsedMessage);
    } catch (error) {
      console.error('Error parsing message content:', error);
    }
  }, [message]);
  if (!messageContent) {
    return null;
  }
  return (
    <div className="px-[12px]">
      <div className="flex-col gap-[12px] p-[10px] border border-solid  border-[#D9D9D9] rounded-[16px] w-[326px]bg-white dark:bg-[#292929] dark:border-[#292929]">
        <div className="text-[14px] font-semibold">Event details</div>
        <div>
          <FormLabel lable="title" />
          <span className="text-[14px]">{messageContent?.summary}</span>
        </div>
        {messageContent?.attendees?.length > 0 && (
          <div>
            <FormLabel lable="guests" />
            {messageContent?.attendees?.map((attendee: any) => (
              <div className="text-[14px]" key={attendee.email}>{attendee.email}</div>
            ))}
          </div>
        )}
        <div>
          <FormLabel lable="time" />
          <div className="flex flex-col">
            <span className="text-[14px]">{messageContent.start.dateTime} - {messageContent.end.dateTime}</span>
            <span className="text-[14px] text-[#979797]">{messageContent.start.timeZone}</span>
          </div>
        </div>
        <div>
          <FormLabel lable="meet" />
          <span className="text-[14px]">{messageContent?.hangoutLink}</span>
        </div>
      </div>
    </div>
  );
};

export default GoogleEventDetailMessage;
