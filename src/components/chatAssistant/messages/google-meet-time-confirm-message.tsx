/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
import React from 'react';
import type { Message } from '@ai-sdk/react';
import { getActions } from '../../../global';

import type { ICreateMeetResponse } from '../utils/google-api';

import { createAuthConfirmModal, createGoogleMeet } from '../utils/google-api';
import { getAuthState, isTokenValid } from '../utils/google-auth';
import ScheduleMeeting, { formatMeetingTimeRange } from '../utils/schedule-meeting';

const GoogleMeetTimeConfirmMessage = ({ message }: { message: Message }) => {
  const { content } = message;
  const { chatId, date, email } = JSON.parse(content || '{}') || {};

  const handleCreateGoogleMeet = ({
    token,
    start,
    end,
    email,
  }: {
    token: string;
    start: string;
    end: string;
    email: string[];
  }) => {
    createGoogleMeet({
      startDate: new Date(start),
      endDate: new Date(end),
      selectedTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Add timezone
      emails: email,
      googleToken: token,
    }).then((createMeetResponse: ICreateMeetResponse) => {
      // console.log('createMeetResponse', createMeetResponse);
      if (createMeetResponse) {
        const eventMessage = `Event details \n📝 Title\n${createMeetResponse.summary}\n👥 Guests\n${createMeetResponse.attendees.map((attendee) => attendee.email).join('\\n')}\n📅 Time\n${formatMeetingTimeRange(createMeetResponse.start.dateTime, createMeetResponse.end.dateTime)}\n${createMeetResponse.start.timeZone}\n🔗 Meeting link\n${createMeetResponse.hangoutLink}
            `;
        getActions().sendMessage({
          messageList: {
            chatId,
            threadId: '-1',
            type: 'thread',
          },
          text: eventMessage,
        });
      }
    });
  };
  const handleTimeSelect = (time: { start: string; end: string }) => {
    if (email.length > 0) {
      const auth = getAuthState();
      if (!auth || !isTokenValid(auth)) {
        createAuthConfirmModal({
          onOk: (accessToken: string) => {
            handleCreateGoogleMeet({
              token: accessToken,
              start: time.start,
              end: time.end,
              email,
            });
          },
        });
      } else {
        handleCreateGoogleMeet({
          token: auth.accessToken!,
          start: time.start,
          end: time.end,
          email,
        });
      }
    } else {
      const scheduleMeeting = ScheduleMeeting.create({ chatId, date: [time], hasConfirmed: true });
      const auth = getAuthState();
      if (!auth || !isTokenValid(auth)) {
        createAuthConfirmModal({
          onOk: () => {
            scheduleMeeting.start();
          },
        });
      } else {
        scheduleMeeting.start();
      }
    }
  };

  return (
    <div className="px-[12px] text-[14px]">
      <div className="p-[10px] border border-solid border-[#D9D9D9] rounded-[16px] w-[326px] bg-white dark:bg-[#292929] dark:border-[#292929]">
        <div>
          📅 I’ve checked your calendar. Here are some available time slots in the coming days:
        </div>
        <ul className="list-decimal pl-[18px] mb-[4px]">
          {date && date.map((item: any) => {
            return (
              <li>
                <button
                  type="button"
                  className="underline decoration-2 font-semibold cursor-pointer hover:font-bold bg-transparent border-none p-0"
                  onClick={() => handleTimeSelect(item)}
                >
                  {formatMeetingTimeRange(item.start, item.end)}
                </button>
              </li>
            );
          })}
        </ul>
        <div>
          <span>Which time would you like to choose? Or 📆 </span>
          <a
            href="https://calendar.google.com/"
            target="_blank"
            className="underline decoration-2 font-semibold"
            rel="noreferrer"
          >
            View Full Calendar
          </a>
        </div>
      </div>
    </div>
  );
};

export default GoogleMeetTimeConfirmMessage;
