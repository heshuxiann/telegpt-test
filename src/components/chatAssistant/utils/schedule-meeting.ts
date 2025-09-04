/* eslint-disable no-null/no-null */
/* eslint-disable no-console */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { toBlob } from 'html-to-image';
import { DateTime, Interval } from 'luxon';
import { getActions, getGlobal } from '../../../global';

import type { ApiMessage } from '../../../api/types';
import type { ICreateMeetResponse } from './google-api';
import { MAIN_THREAD_ID } from '../../../api/types/messages';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { getMessageContent, hasMessageText } from '../../../global/helpers';
import { selectCurrentChat, selectUser } from '../../../global/selectors';
import { extractCalendlyLinks } from './util';
import buildAttachment from '../../middle/composer/helpers/buildAttachment';
import { createMeetingTimeConfirmMessage } from '../room-ai/room-ai-utils';
import { ChataiStores } from '../store';
import { parseMessage2StoreMessage } from '../store/messages-store';
import { calendlyRanges, getHitTools } from './chat-api';
import {
  createAuthConfirmModal,
  createGoogleMeet,
  getGoogleCalendarFreeBusy,
} from './google-api';
import { getAuthState, isTokenValid } from './google-auth';

import Avatar from '../component/Avatar';

import CalendarIcon from '../assets/calendar.png';
import GoogleMeetIcon from '../assets/google-meet.png';
import SerenaPath from '../assets/serena.png';
import ShareHeaderBg from '../assets/share-header-bg.png';
import UserIcon from '../assets/user.png';
import WriteIcon from '../assets/write.png';

export const ASK_MEETING_TIME_AND_EMAIL
  = 'Could you tell me what time would be good for you to have the meeting? Also, could I get your email address?';
export const ASK_MEETING_TIME
  = 'Could you tell me what time would be good for you to have the meeting?';
export const ASK_MEETING_EMAIL = 'Could you please share your email address?';
export const MEETING_INVITATION_TIP
  = 'I\'ll send you the meeting invitation later.';

export type MeetingInformationSuggestType = 'time' | 'email' | 'both';

export function formatMeetingTimeRange(
  startISO: string,
  endISO: string,
  timeZoneVisable?: boolean,
) {
  const startDate = new Date(startISO);
  const endDate = new Date(endISO);

  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });

  const formatTime = (date: Date) => {
    return timeFormatter.format(date).toLowerCase().replace(' ', '');
  };

  const dateStr = dayFormatter.format(startDate);
  const startTimeStr = formatTime(startDate);
  const endTimeStr = formatTime(endDate);

  // 方式一：取时区名称
  const timeZoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // 方式二：取 GMT 偏移
  // const offsetMinutes = startDate.getTimezoneOffset();
  // const sign = offsetMinutes <= 0 ? '+' : '-';
  // const absMinutes = Math.abs(offsetMinutes);
  // const hours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
  // const minutes = String(absMinutes % 60).padStart(2, '0');
  // const gmtOffset = `GMT${sign}${hours}:${minutes}`;

  // 任选一种
  const tzString = timeZoneName;
  // const tzString = gmtOffset;
  if (timeZoneVisable) {
    return `${dateStr}, ${startTimeStr}-${endTimeStr} ${tzString}`;
  } else {
    return `${dateStr}, ${startTimeStr}-${endTimeStr}`;
  }
}

async function getSuitableTime(calendlyUrl: string) {
  const timeRanges = await calendlyRanges({ calendlyUrl });
  const myBusyTimes = await getGoogleCalendarFreeBusy();
  const availableSolts = getAvailableSlots(timeRanges, myBusyTimes);
  return availableSolts;
}

function getAvailableSlots(
  aFreeSlots: { start: string; end: string }[],
  bBusySlots: { start: string; end: string }[],
) {
  const result = [];

  for (const aSlot of aFreeSlots) {
    const aStart = new Date(aSlot.start);
    const aEnd = new Date(aSlot.end);

    let hasConflict = false;

    for (const bSlot of bBusySlots) {
      const bStart = new Date(bSlot.start);
      const bEnd = new Date(bSlot.end);

      // 判断是否重叠
      if (aStart < bEnd && aEnd > bStart) {
        hasConflict = true;
        break;
      }
    }

    if (!hasConflict) {
      result.push({
        start: aStart.toISOString(),
        end: aEnd.toISOString(),
      });
    }
  }

  return result;
}

function suggestFreeTimes(
  busySlots: { start: string; end: string }[],
  durationMinutes = 30,
  count = 3,
) {
  const now = DateTime.utc();
  const endRange = now.plus({ days: 3 });

  // 转成 Interval[]
  const busyIntervals = busySlots.map((slot) =>
    Interval.fromDateTimes(
      DateTime.fromISO(slot.start),
      DateTime.fromISO(slot.end),
    ),
  );

  const freeSlots: { start: string; end: string }[] = [];

  let cursor = now;
  let done = false;
  while (cursor < endRange && !done) {
    const dayStart = cursor.set({
      hour: 9,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const dayEnd = cursor.set({
      hour: 18,
      minute: 0,
      second: 0,
      millisecond: 0,
    });

    let slotStart = dayStart;
    while (slotStart.plus({ minutes: durationMinutes }) <= dayEnd) {
      const slotEnd = slotStart.plus({ minutes: durationMinutes });

      const slotInterval = Interval.fromDateTimes(slotStart, slotEnd);

      const overlap = busyIntervals.some((b) => b.overlaps(slotInterval));
      const slotPassed = slotEnd < now;

      if (!overlap && !slotPassed) {
        freeSlots.push({
          start: slotStart.toISO(),
          end: slotEnd.toISO(),
        });
        if (freeSlots.length >= count) {
          done = true;
          break;
        }
      }

      slotStart = slotStart.plus({ minutes: durationMinutes });
    }
    cursor = cursor.plus({ days: 1 }).startOf('day');
  }
  return freeSlots;
}

async function isTimeSlotAvailable(proposedSlot: {
  start: string;
  end: string;
}) {
  const myBusyTimes = await getGoogleCalendarFreeBusy();
  const proposedStart = new Date(proposedSlot.start).getTime();
  const proposedEnd = new Date(proposedSlot.end).getTime();

  for (const busy of myBusyTimes) {
    const busyStart = new Date(busy.start).getTime();
    const busyEnd = new Date(busy.end).getTime();

    if (proposedStart < busyEnd && busyStart < proposedEnd) {
      // 有重叠
      const suggestions = suggestFreeTimes(myBusyTimes);
      return {
        isAvailable: false,
        suggestions,
      };
    }
  }
  // 没有重叠
  return { isAvailable: true };
}

function getMeetParamsByAITools(message: string): Promise<any> {
  return new Promise((resolve, reject) => {
    getHitTools(message, Intl.DateTimeFormat().resolvedOptions().timeZone)
      .then((toolResults) => {
        let email: string[] = [];
        let date: string | null = null;
        if (toolResults && toolResults.length > 0) {
          toolResults.forEach((toolCall: any) => {
            if (toolCall.toolName === 'parseTime') {
              date = toolCall.result;
            } else if (toolCall.toolName === 'extractEmail') {
              email = toolCall.result || [];
            }
          });
          resolve({
            date,
            email,
          });
        } else {
          resolve({});
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function generateEventScreenshot(eventData: any, chatId: string) {
  const global = getGlobal();
  const { currentUserId } = global;
  const currentUser = selectUser(global, currentUserId!);
  // Create a temporary container with proper positioning
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.transform = 'translateX(-1000000px) translateY(-1000000px)';
  container.style.zIndex = '-9999';

  // Create the main card element that will be captured
  const cardElement = document.createElement('div');
  cardElement.style.cssText = `
      position: relative;
      width: 330px;
      box-sizing: content-box;
      overflow: hidden;
      background-color: white;
      color: black;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

  // Create the background blur element
  const bgElement = document.createElement('div');
  bgElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      filter: blur(12px);
      pointer-events: none;
    `;
  const bgImage = document.createElement('img');
  bgImage.src = ShareHeaderBg;
  bgImage.alt = '';
  bgImage.style.cssText = `
      width: 100%;
    `;
  bgElement.appendChild(bgImage);

  // Create the content container
  const contentElement = document.createElement('div');
  contentElement.style.cssText = `
      position: relative;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

  // Create user info section
  const userSection = document.createElement('div');
  userSection.style.cssText = `
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #979797;
    `;

  // Create avatar container for React component
  const avatarContainer = document.createElement('div');
  avatarContainer.style.cssText = `
      width: 20px;
      height: 20px;
    `;

  // Render Avatar component using React
  const root = createRoot(avatarContainer);
  root.render(
    React.createElement(Avatar, {
      className: 'w-[20px] h-[20px]',
      peer: currentUser,
    }),
  );

  const firstName = document.createElement('span');
  firstName.textContent = currentUser?.firstName || 'User';
  const lastName = document.createElement('span');
  lastName.textContent = currentUser?.lastName || '';
  userSection.appendChild(avatarContainer);
  userSection.appendChild(firstName);
  userSection.appendChild(lastName);
  // Create card title
  const cardTitleSection = document.createElement('div');
  cardTitleSection.textContent = 'Meeting Invitation';
  cardTitleSection.style.cssText = `
      font-size: 20px;
      font-weight: 600;
    `;

  // Create title section
  const titleSection = document.createElement('div');
  const titleLabel = document.createElement('div');
  titleLabel.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    `;
  const writeIcon = document.createElement('img');
  writeIcon.src = WriteIcon;
  writeIcon.style.cssText = `
      width: 12px;
      height: 12px;
    `;
  titleLabel.appendChild(writeIcon);
  const titleText = document.createElement('span');
  titleText.textContent = 'Title';
  titleLabel.appendChild(titleText);
  const titleValue = document.createElement('span');
  titleValue.style.fontSize = '14px';
  titleValue.textContent = eventData.summary || '';
  titleSection.appendChild(titleLabel);
  titleSection.appendChild(titleValue);

  // Create guests section if attendees exist
  let guestsSection: HTMLDivElement | null = null;
  if (eventData.attendees && eventData.attendees.length > 0) {
    guestsSection = document.createElement('div');
    const guestsLabel = document.createElement('div');
    guestsLabel.style.cssText = `
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
      `;
    const userIcon = document.createElement('img');
    userIcon.src = UserIcon;
    userIcon.style.cssText = `
        width: 12px;
        height: 12px;
      `;
    guestsLabel.appendChild(userIcon);
    const guestsText = document.createElement('span');
    guestsText.textContent = 'Guests';
    guestsLabel.appendChild(guestsText);
    guestsSection.appendChild(guestsLabel);
    eventData.attendees.forEach((attendee: any) => {
      const guestDiv = document.createElement('div');
      guestDiv.style.fontSize = '14px';
      guestDiv.textContent = attendee.email;
      guestsSection!.appendChild(guestDiv);
    });
  }

  // Create time section
  const timeSection = document.createElement('div');
  const timeLabel = document.createElement('div');
  timeLabel.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    `;
  const calendarIcon = document.createElement('img');
  calendarIcon.src = CalendarIcon;
  calendarIcon.style.cssText = `
      width: 12px;
      height: 12px;
    `;
  timeLabel.appendChild(calendarIcon);
  const timeText = document.createElement('span');
  timeText.textContent = 'Time';
  timeLabel.appendChild(timeText);
  const timeContainer = document.createElement('div');
  timeContainer.style.cssText = `
      display: flex;
      flex-direction: column;
    `;
  const timeValue = document.createElement('span');
  timeValue.style.fontSize = '14px';
  timeValue.textContent = formatMeetingTimeRange(
    eventData.start.dateTime,
    eventData.end.dateTime,
  );
  const timeZone = document.createElement('span');
  timeZone.style.cssText = `
      font-size: 14px;
      color: #979797;
    `;
  timeZone.textContent = eventData.start.timeZone;
  timeContainer.appendChild(timeValue);
  timeContainer.appendChild(timeZone);
  timeSection.appendChild(timeLabel);
  timeSection.appendChild(timeContainer);

  // Create meet section
  const meetSection = document.createElement('div');
  const meetLabel = document.createElement('div');
  meetLabel.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    `;
  const googleMeetIcon = document.createElement('img');
  googleMeetIcon.src = GoogleMeetIcon;
  googleMeetIcon.style.cssText = `
      width: 12px;
      height: 12px;
    `;
  meetLabel.appendChild(googleMeetIcon);
  const meetText = document.createElement('span');
  meetText.textContent = 'Meeting link';
  meetLabel.appendChild(meetText);
  const meetValue = document.createElement('span');
  meetValue.style.fontSize = '14px';
  meetValue.textContent = eventData.hangoutLink || '';
  meetSection.appendChild(meetLabel);
  meetSection.appendChild(meetValue);

  // Create footer section
  const footerSection = document.createElement('section');
  footerSection.style.cssText = `
      display: flex;
      flex-direction: row;
      gap: 4px;
      align-items: center;
      justify-content: center;
      padding: 8px;
      font-size: 12px;
      background-color: #F7FAFF;
    `;
  const footerIcon = document.createElement('img');
  footerIcon.style.cssText = `
      display: inline;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      margin-top: -2px;
    `;
  footerIcon.src = SerenaPath;
  footerIcon.alt = 'Serena';
  const footerText1 = document.createElement('span');
  footerText1.textContent = 'Powered by';
  const footerText2 = document.createElement('span');
  footerText2.style.color = '#2996FF';
  footerText2.textContent = 'telepgt.org';
  footerSection.appendChild(footerIcon);
  footerSection.appendChild(footerText1);
  footerSection.appendChild(footerText2);

  // Assemble the card
  cardElement.appendChild(bgElement);
  contentElement.appendChild(userSection);
  contentElement.appendChild(cardTitleSection);
  contentElement.appendChild(titleSection);
  if (guestsSection) {
    contentElement.appendChild(guestsSection);
  }
  contentElement.appendChild(timeSection);
  contentElement.appendChild(meetSection);
  cardElement.appendChild(contentElement);
  cardElement.appendChild(footerSection);
  container.appendChild(cardElement);
  document.body.appendChild(container);

  // Wait for DOM to render and then capture
  setTimeout(() => {
    toBlob(cardElement, {
      backgroundColor: 'white',
      width: 330,
      pixelRatio: 2, // Higher pixel ratio for better quality
      quality: 1, // Maximum quality
    })
      .then(async (blob) => {
        if (blob) {
          try {
            // Create attachment from blob
            const attachment = await buildAttachment(
              `event-details-${chatId}.png`,
              blob,
            );

            // Get current chat and send message with attachment
            const currentGlobal = getGlobal();
            const chat = selectCurrentChat(currentGlobal);

            if (chat) {
              getActions().sendMessage({
                messageList: {
                  chatId: chat.id,
                  threadId: MAIN_THREAD_ID,
                  type: 'thread',
                },
                attachments: [attachment],
              });
            }
          } catch (error) {
            console.error('Error sending image:', error);
          }
        }
        // Clean up the temporary element
        document.body.removeChild(container);
      })
      .catch((error) => {
        console.error('Error generating screenshot:', error);
        // Clean up the temporary element even on error
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      });
  }, 200);
}

interface ScheduleMeetingParams {
  chatId: string;
  email?: string[];
  date?: { start: string; end: string }[];
  isMeetingInitiator?: boolean;
  hasConfirmed?: boolean;
}
class ScheduleMeeting {
  private static instances = new Map<string, ScheduleMeeting>();

  private chatId: string;

  private hasConfirmed: boolean;

  private email: string[];

  private date: { start: string; end: string }[];

  public isMeetingInitiator: boolean;

  public timeout: NodeJS.Timeout | undefined = undefined;

  private handlerRef: ({ message }: { message: ApiMessage }) => void;

  constructor({
    chatId,
    email = [],
    date = [],
    hasConfirmed = false,
    isMeetingInitiator = false,
  }: ScheduleMeetingParams) {
    this.chatId = chatId;
    this.email = email;
    this.date = date;
    this.isMeetingInitiator = isMeetingInitiator;
    this.hasConfirmed = hasConfirmed;
    this.handlerRef = ({ message }) => this.handlerImMessage({ message });
  }

  /**
   * 创建或获取 ScheduleMeeting 实例
   */
  public static create(params: ScheduleMeetingParams): ScheduleMeeting {
    const existing = ScheduleMeeting.instances.get(params.chatId);
    if (existing) {
      return existing;
    } else {
      const instance = new ScheduleMeeting(params);
      ScheduleMeeting.instances.set(params.chatId, instance);
      return instance;
    }
  }

  /**
   * 根据 chatId 获取 ScheduleMeeting 实例
   */
  public static get(chatId: string): ScheduleMeeting | undefined {
    return ScheduleMeeting.instances.get(chatId);
  }

  public start(params?: { text: string; chatId: string }) {
    // 注册监听器
    eventEmitter.on(Actions.NewTextMessage, this.handlerRef);

    // 超时自动清理
    this.timeout = setTimeout(() => {
      this.cleanup();
      console.log('已超过五分钟未完成输入，工作流已结束。');
    }, 1000 * 60 * 5);

    if (!this.isMeetingInitiator) {
      this.handler(params);
    }
  }

  public cleanup() {
    eventEmitter.off(Actions.NewTextMessage, this.handlerRef);
    clearTimeout(this.timeout);
    ScheduleMeeting.instances.delete(this.chatId);
  }

  private handlerImMessage({ message }: { message?: ApiMessage }) {
    // 只处理对方发过来的消息
    if (
      message
      && hasMessageText(message)
      && !this.isMeetingInitiator
      && !message.isOutgoing
    ) {
      this.handler({
        chatId: message.chatId,
        text: getMessageContent(message).text?.text || '',
      });
    }
  }

  private async handler(params?: { text: string; chatId: string }) {
    const { text, chatId } = params || {};
    if (chatId && chatId !== this.chatId) {
      return;
    }
    if (this.email.length && this.date.length && this.hasConfirmed) {
      this.handleGoogleAuthCheck();
      return;
    }
    try {
      if (text && chatId === this.chatId) {
        if (!this.date.length) {
          const calendlyUrl = extractCalendlyLinks(text)?.[0];
          if (calendlyUrl) {
            const suitableDates = await getSuitableTime(calendlyUrl);
            if (suitableDates.length === 0) {
              console.log(
                'No available time slots found for the provided Calendly link.',
              );
            }
            this.date = suitableDates.slice(0, 3);
          }
        }
        const toolCheckRes = await getMeetParamsByAITools(text);
        if (toolCheckRes.email && toolCheckRes.email.length > 0) {
          this.email = toolCheckRes.email;
        }
        if (!this.date.length && toolCheckRes.date) {
          const dateRange = {
            start: toolCheckRes.date,
            end: new Date(
              new Date(toolCheckRes.date).getTime() + 30 * 60 * 1000,
            ).toISOString(),
          };
          const { isAvailable, suggestions } = await isTimeSlotAvailable(
            dateRange,
          );
          if (isAvailable) {
            this.date = [dateRange];
            this.hasConfirmed = true; // 如果有时间回执，设置为已确认
          } else {
            this.sendMessage(
              'The time you provided is not available. Could you please suggest another time?',
            );
            // 根据自己日历的时间，给出时间建议
            await new Promise<void>((res) => {
              void setTimeout(res, 1000);
            });
            this.sendMessage(
              `Here are some available time slots you can choose from: \n ${suggestions!
                .map(
                  (slot, index) =>
                    `${index + 1}.${formatMeetingTimeRange(
                      slot.start,
                      slot.end,
                      true,
                    )}`,
                )
                .join('\n')}`,
            );
            return;
          }
        }
      }
      // 打开小助手，用户时间回执
      if (this.date.length > 0 && !this.hasConfirmed) {
        const meetingTimeConfirmMessage = createMeetingTimeConfirmMessage({
          chatId: this.chatId,
          date: this.date,
          email: this.email,
        });
        ChataiStores?.message?.storeMessage(
          parseMessage2StoreMessage(this.chatId, [meetingTimeConfirmMessage])[0],
        );
        this.cleanup();
        // TODO: add meeting time confirm message and open ai room
        const global = getGlobal();
        const currentChat = selectCurrentChat(global);
        if (currentChat && currentChat.id === this.chatId) {
          eventEmitter.emit(
            Actions.AddRoomAIMessage,
            meetingTimeConfirmMessage,
          );
          getActions().openChatAIWithInfo({ chatId: this.chatId });
        }
        return;
      }
      if (!this.email.length && !this.date.length) {
        this.sendMessage(ASK_MEETING_TIME_AND_EMAIL);
        return;
      } else if (!this.email.length) {
        this.sendMessage(ASK_MEETING_EMAIL);
        return;
      } else if (!this.date.length) {
        this.sendMessage(ASK_MEETING_TIME);
        return;
      }
      if (this.email.length && this.date.length) {
        this.handleGoogleAuthCheck();
      }
    } catch (e) {
      console.log(e);
      this.cleanup();
    }
  }

  private async handleGoogleAuthCheck() {
    this.cleanup();
    const auth = getAuthState();
    if (!auth || !(await isTokenValid(auth))) {
      createAuthConfirmModal({
        onOk: (accessToken: string) => {
          this.handleCreateGoogleMeet(accessToken);
        },
        onCancel: () => {
          this.cleanup();
        },
      });
    } else {
      this.handleCreateGoogleMeet(auth.accessToken!);
    }
  }

  public handleCreateGoogleMeet(accessToken: string) {
    const date = this.date[0];
    createGoogleMeet({
      startDate: new Date(date.start),
      endDate: new Date(date.end),
      selectedTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Add timezone
      emails: this.email,
      googleToken: accessToken,
    })
      .then((createMeetResponse: ICreateMeetResponse) => {
        this.sendMessage(MEETING_INVITATION_TIP);
        if (createMeetResponse) {
          // const eventMessage = `Event details \n📝 Title\n${
          //   createMeetResponse.summary
          // }\n👥 Guests\n${createMeetResponse.attendees
          //   .map((attendee) => attendee.email)
          //   .join('\\n')}\n📅 Time\n${formatMeetingTimeRange(
          //   createMeetResponse.start.dateTime,
          //   createMeetResponse.end.dateTime,
          // )}\n${createMeetResponse.start.timeZone}\n🔗 Meeting link\n${
          //   createMeetResponse.hangoutLink
          // }
          //     `;
          // this.sendMessage(eventMessage);
          generateEventScreenshot(createMeetResponse, this.chatId);
          this.cleanup();
        }
        this.cleanup();
      })
      .catch((err) => {
        console.log(err);
        this.cleanup();
      });
  }

  private sendMessage(message: string) {
    getActions().sendMessage({
      messageList: {
        chatId: this.chatId,
        threadId: '-1',
        type: 'thread',
      },
      text: message,
    });
  }
}

export default ScheduleMeeting;
