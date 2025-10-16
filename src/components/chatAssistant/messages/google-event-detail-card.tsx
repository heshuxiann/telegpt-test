/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import React, { useEffect, useState } from 'react';
import type { Message } from 'ai';
import { getGlobal } from '../../../global';

import { getUserFullName } from '../../../global/helpers';
import { selectUser } from '../../../global/selectors';
import { formatMeetingTimeRange, formatTimeZone } from '../utils/meeting-utils';

import Avatar from '../component/Avatar';

import MeetCalendarIcon from '../assets/meeting/meet-calendar-icon.png';
import MeetGuestIcon from '../assets/meeting/meet-guest-icon.png';
import MeetLinkIcon from '../assets/meeting/meet-link-icon.png';
import MeetTitleIcon from '../assets/meeting/meet-title-icon.png';
import SerenaPath from '../assets/serena.png';
import ShareHeaderBg from '../assets/share-header-bg.png';

const GoogleEventDetailMessage = ({ message }: { message: Message }) => {
  const [messageContent, setMessageContent] = useState<any>(null);

  useEffect(() => {
    try {
      const parsedMessage = JSON.parse(message.content);
      setMessageContent(parsedMessage.eventData);
    } catch (error) {
      console.error('Error parsing message content:', error);
    }
  }, [message]);
  const global = getGlobal();
  const { currentUserId } = global;
  const currentUser = selectUser(global, currentUserId!);
  const userFullName = getUserFullName(currentUser);
  if (!messageContent) {
    return null;
  }

  return (
    <div className="rounded-[20px] w-[330px] bg-white">
      {/* header  */}
      <div className="h-[48px] flex justify-end items-center px-[20px]">
        <img className="absolute l-0 t-0 blur-[22px]" src={ShareHeaderBg} alt="" />
        <div className="flex items-center gap-[8px]">
          <Avatar peer={currentUser} className="w-[20px] h-[20px]" />
          <span className="text-[#979797]">{userFullName}</span>
        </div>
      </div>
      {/* content  */}
      <div className="flex flex-col gap-[12px] px-[20px]">
        <div className="text-[18px] font-bold mb-[8px]" data-readable>Meeting Invitation</div>
        <div className="flex gap-[8px] bg-[#F8FAFC] px-[8px] py-[10px] rounded-[6px]">
          <img src={MeetTitleIcon} className="w-[20px] h-[20px]" alt="" />
          <span className="text-[14px] font-semibold" data-readable>{messageContent?.summary}</span>
        </div>
        <div className="flex gap-[8px] bg-[#F8FAFC] px-[8px] py-[10px] rounded-[6px]">
          <img src={MeetCalendarIcon} className="w-[20px] h-[20px]" alt="" />
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold" data-readable>
              {formatMeetingTimeRange(messageContent.start.dateTime, messageContent.end.dateTime)}
            </span>
            <span className="text-[14px] text-[#979797]" data-readable>
              {formatTimeZone(messageContent.start.timeZone)}
            </span>
          </div>
        </div>
        <div className="flex gap-[8px] bg-[#F8FAFC] px-[8px] py-[10px] rounded-[6px]">
          <img src={MeetGuestIcon} className="w-[20px] h-[20px]" alt="" />
          <div className="flex flex-col text-[14px] gap-[4px] flex-1 overflow-hidden">
            <div className="font-semibold">Guests</div>
            <div>
              <span className="break-all mr-[8px]">
                {messageContent.creator.email}
              </span>
              <span className="bg-[#E9EDFF] px-[4px] leading-[18px] rounded-[4px] text-[#3F6EFF]">Organizer</span>
            </div>
            {messageContent?.attendees?.map((attendee: any) => (
              <div className="text-[14px] break-all" key={attendee.email} data-readable>
                {attendee.email}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-[8px] bg-[#F8FAFC] px-[8px] py-[10px] rounded-[6px]">
          <img src={MeetLinkIcon} className="w-[20px] h-[20px]" alt="" />
          <span className="text-[14px] font-semibold" data-readable>{messageContent?.hangoutLink}</span>
        </div>
      </div>
      {/* footer  */}
      <div className="h-[48px] mt-[24px] text-[12px] font-semibold w-full flex items-center justify-center bg-[#F7FAFF]">
        <img src={SerenaPath} className="w-[20px] h-[20px] mr-[6px] mt-[-2px]" alt="" />
        <span className="text-[#5E6272]">Powered by </span>
        <span className="text-[#2996FF]">telyai.org</span>
      </div>
    </div>
  );
};

export default GoogleEventDetailMessage;
