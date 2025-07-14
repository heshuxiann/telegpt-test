/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
/* eslint-disable max-len */
import { DateTime, Interval } from 'luxon';
import { getActions, getGlobal } from '../../../global';

import type { ApiMessage } from '../../../api/types';
import type { ICreateMeetResponse } from './google-api';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { getMessageContent, hasMessageText } from '../../../global/helpers';
import { selectCurrentChat } from '../../../global/selectors';
import { extractCalendlyLinks } from './util';
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
  const busyIntervals = busySlots.map((slot) => Interval.fromDateTimes(
    DateTime.fromISO(slot.start),
    DateTime.fromISO(slot.end),
  ));

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

interface ScheduleMeetingParams {
  chatId: string;
  email?: string[];
  date?: { start: string; end: string }[];
  hasConfirmed?: boolean;
}
class ScheduleMeeting {
  private static instances: Map<string, ScheduleMeeting> = new Map();

  private chatId: string;

  private hasConfirmed: boolean;

  private email: string[];

  private date: { start: string; end: string }[];

  public timeout: NodeJS.Timeout | undefined = undefined;

  private handlerRef: ({ message }: { message: ApiMessage }) => void;

  constructor({
    chatId,
    email = [],
    date = [],
    hasConfirmed = false,
  }: ScheduleMeetingParams) {
    this.chatId = chatId;
    this.email = email;
    this.date = date;
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

    this.handler(params);
  }

  private cleanup() {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    eventEmitter.off(Actions.NewTextMessage, this.handlerRef);
    clearTimeout(this.timeout);
    ScheduleMeeting.instances.delete(this.chatId);
  }

  private handlerImMessage({ message }: { message?: ApiMessage }) {
    if (message && hasMessageText(message) && !message.isOutgoing) {
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
                  (slot, index) => `${index + 1}.${formatMeetingTimeRange(
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
        this.sendMessage(
          'Could you tell me what time would be good for you to have the meeting? Also, could I get your email address?',
        );
        return;
      } else if (!this.email.length) {
        this.sendMessage('Could you please share your email address?');
        return;
      } else if (!this.date.length) {
        this.sendMessage(
          'Could you tell me what time would be good for you to have the meeting?',
        );
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

  private handleGoogleAuthCheck() {
    this.cleanup();
    const auth = getAuthState();
    if (!auth || !isTokenValid(auth)) {
      createAuthConfirmModal({
        onOk: (accessToken: string) => {
          this.handleCreateGoogleMeet(accessToken!);
        },
      });
    } else {
      this.handleCreateGoogleMeet(auth.accessToken!);
    }
  }

  public handleCreateGoogleMeet(accessToken: string) {
    this.sendMessage("I'll send you the meeting invitation later.");
    const date = this.date[0];
    createGoogleMeet({
      startDate: new Date(date.start),
      endDate: new Date(date.end),
      selectedTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Add timezone
      emails: this.email!,
      googleToken: accessToken as string,
    }).then((createMeetResponse: ICreateMeetResponse) => {
      console.log('createMeetResponse', createMeetResponse);
      if (createMeetResponse) {
        const eventMessage = `Event details \n📝 Title\n${
          createMeetResponse.summary
        }\n👥 Guests\n${createMeetResponse.attendees
          .map((attendee) => attendee.email)
          .join('\\n')}\n📅 Time\n${formatMeetingTimeRange(
          createMeetResponse.start.dateTime,
          createMeetResponse.end.dateTime,
        )}\n${createMeetResponse.start.timeZone}\n🔗 Meeting link\n${
          createMeetResponse.hangoutLink
        }
            `;
        this.sendMessage(eventMessage);
      }
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
