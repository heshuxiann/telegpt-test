import React, { useState } from 'react';
import type { Message } from '@ai-sdk/react';
import cx from 'classnames';
import { getActions } from '../../../global';

import type { ICreateMeetResponse } from '../utils/google-api';

import { ChataiStores } from '../store';
import { parseMessage2StoreMessage } from '../store/messages-store';
import { createAuthConfirmModal, createGoogleMeet } from '../utils/google-api';
import { getAuthState, isTokenValid } from '../utils/google-auth';
import {
  generateEventScreenshot,
} from '../utils/meeting-utils';
import ScheduleMeeting, {
  MEETING_INVITATION_TIP,
} from '../utils/schedule-meeting';

// 格式化会议时间，返回相对日期和时间范围
function formatMeetingTime(startTime: string, duration: number = 1800): string {
  const startDate = new Date(startTime);
  const endDate = new Date(new Date(startTime).getTime() + duration * 1000);

  // 获取当前日期
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 获取明天日期
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 格式化时间
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const startTimeStr = timeFormatter.format(startDate);
  const endTimeStr = timeFormatter.format(endDate);

  // 格式化日期
  let datePrefix = '';
  const startDateCopy = new Date(startDate);
  startDateCopy.setHours(0, 0, 0, 0);

  if (startDateCopy.getTime() === today.getTime()) {
    datePrefix = 'Today';
  } else if (startDateCopy.getTime() === tomorrow.getTime()) {
    datePrefix = 'Tomorrow';
  } else {
    // 检查是否在当前周内
    const dayDiff = Math.floor((startDateCopy.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    if (dayDiff >= 0 && dayDiff < 7) {
      // 如果在当前周内，显示星期几
      const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long' });
      datePrefix = weekdayFormatter.format(startDate);
    } else {
      // 如果不是当前周内的日期，则使用月份和日期
      const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });
      datePrefix = `${monthFormatter.format(startDate)} ${startDate.getDate()}`;
    }
  }

  return `${datePrefix} ${startTimeStr}–${endTimeStr}`;
}

const GoogleMeetTimeConfirmMessage = ({ message }: { message: Message }) => {
  const { content } = message;
  const {
    chatId, startTime, duration, email, timeZone, isConfirmed,
  } = JSON.parse(content || '{}') || {};
  const [mergeConfirmed, setMergeConfirmed] = useState(isConfirmed);
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
    getActions().sendMessage({
      messageList: {
        chatId,
        threadId: '-1',
        type: 'thread',
      },
      text: MEETING_INVITATION_TIP,
    });
    createGoogleMeet({
      startDate: new Date(start),
      endDate: new Date(end),
      selectedTimezone: timeZone, // Add timezone
      emails: email,
      googleToken: token,
    }).then((createMeetResponse: ICreateMeetResponse) => {
      // console.log('createMeetResponse', createMeetResponse);
      if (createMeetResponse) {
        generateEventScreenshot(createMeetResponse, chatId);
      }
    });
  };
  const handleTimeSelect = async (time: string) => {
    if (mergeConfirmed) {
      return;
    }
    if (email.length > 0 && timeZone && duration) {
      const auth = getAuthState();
      const createMeetParams = {
        token: auth?.accessToken || '',
        start: time,
        end: new Date(new Date(time).getTime() + duration * 1000).toISOString(),
        email,
      };
      if (!auth || !(await isTokenValid(auth))) {
        createAuthConfirmModal({
          onOk: (accessToken: string) => {
            createMeetParams.token = accessToken!;
            handleCreateGoogleMeet(createMeetParams);
          },
        });
      } else {
        handleCreateGoogleMeet(createMeetParams);
      }
    } else {
      const scheduleMeeting = ScheduleMeeting.create({ chatId });
      const confirmParams = {
        startTime: [time],
        email,
        timeZone,
        duration,
        timeConfirmed: true,
      };
      const auth = getAuthState();
      if (!auth || !(await isTokenValid(auth))) {
        createAuthConfirmModal({
          onOk: () => {
            scheduleMeeting.timeConfirmCallback(confirmParams);
          },
        });
      } else {
        scheduleMeeting.timeConfirmCallback(confirmParams);
      }
    }
    message.content = JSON.stringify({
      chatId,
      startTime,
      email,
      isConfirmed: true,
    });
    ChataiStores?.message?.storeMessage(parseMessage2StoreMessage(chatId, [message])[0]);
    setMergeConfirmed(true);
  };

  return (
    <div className="px-[12px] text-[14px]">
      <div className="p-[10px] border border-solid border-[#D9D9D9] rounded-[16px] w-[326px] bg-white dark:bg-[#292929] dark:border-[#292929]">
        <div>
          📅 I’ve checked your calendar. Here are some available time slots in the coming days:
        </div>
        <ul className="list-decimal pl-[18px] mb-[4px]">
          {startTime && startTime.map((item: any, index: number) => {
            return (
              <li key={index}>
                <div
                  className={cx('font-semibold cursor-pointer bg-transparent border-none p-0', {
                    'underline decoration-2': !mergeConfirmed,
                  })}
                  onClick={() => handleTimeSelect(item)}
                >
                  {formatMeetingTime(item, duration)}
                </div>
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
