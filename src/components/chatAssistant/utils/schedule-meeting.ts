/* eslint-disable no-null/no-null */
/* eslint-disable no-console */

import React from 'react';
import { DateTime, Interval } from 'luxon';
import { getActions, getGlobal } from '../../../global';

import type { ApiDraft, ApiMessage } from '../../../api/types';
import type { ICreateMeetResponse } from './google-api';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { getMessageContent, hasMessageText } from '../../../global/helpers';
import { selectCurrentChat } from '../../../global/selectors';
import { extractCalendlyLinks } from './util';
import { createMeetingTimeConfirmMessage } from '../room-ai/room-ai-utils';
import { ChataiStores } from '../store';
import { parseMessage2StoreMessage } from '../store/messages-store';
import { calendlyRanges, getHitToolsForMeeting } from './chat-api';
import {
  createAuthConfirmModal,
  createGoogleMeet,
  getGoogleCalendarFreeBusy,
} from './google-api';
import { getAuthState, isTokenValid } from './google-auth';
import { attachZoneWithTemporal, formatMeetingTimeRange, generateEventScreenshot } from './meeting-utils';

export const MEETING_INVITATION_TIP = 'I\'ll send you the meeting invitation later. [By TelyAI]';

export const ASK_MEETING_TIME = 'I’d like to set up a meeting with you. Could you let me know a time that works best for you? [By TelyAI]';
export const ASK_MEETING_TIMEZONE = 'Which time zone are you currently in? [By TelyAI]';
export const ASK_MEETING_EMAIL = 'Could you share your email address? If additional participants should be included, please provide their email addresses as well. [By TelyAI]';
const MEETING_TIME_UNAVAILABLE = 'The time you provided is not available. Could you please suggest another time? [By TelyAI]';

export type MeetingInformationSuggestType = 'time' | 'email' | 'both';

function getAvailableSlots(
  startTimes: string[],
  durationSeconds: number,
  busySlots: { start: string; end: string }[],
) {
  const result = [];

  for (const startTime of startTimes) {
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + durationSeconds * 1000);

    let hasConflict = false;

    for (const busySlot of busySlots) {
      const busyStart = new Date(busySlot.start);
      const busyEnd = new Date(busySlot.end);

      // 判断是否重叠
      if (startDate < busyEnd && endDate > busyStart) {
        hasConflict = true;
        break;
      }
    }

    if (!hasConflict) {
      result.push(startDate.toISOString());
    }
  }

  return result;
}

function suggestFreeTimes(
  busySlots: { start: string; end: string }[],
  durationMinutes = 30,
  count = 3,
) {
  const now = DateTime.local();
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

    // 确保从整点或半点开始
    let slotStart = dayStart;
    if (cursor.hasSame(now, 'day')) {
      // 如果是今天，需要从当前时间之后的下一个整点或半点开始
      const currentMinute = now.minute;
      if (currentMinute < 30) {
        slotStart = now.set({ minute: 30, second: 0, millisecond: 0 });
      } else {
        slotStart = now.plus({ hours: 1 }).set({ minute: 0, second: 0, millisecond: 0 });
      }
      // 确保不早于工作时间开始
      if (slotStart < dayStart) {
        slotStart = dayStart;
      }
    }

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

      // 每次递增30分钟，确保始终在整点或半点
      slotStart = slotStart.plus({ minutes: 30 });
    }
    cursor = cursor.plus({ days: 1 }).startOf('day');
  }
  return freeSlots;
}

async function isTimeSlotAvailable(proposedSlot: {
  start: string;
  end: string;
}): Promise<{ isAvailable: boolean; suggestions?: { start: string; end: string }[] }> {
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

export function getMeetParamsByAITools(message: string): Promise<any> {
  return new Promise((resolve, reject) => {
    getHitToolsForMeeting(message)
      .then((toolResults) => {
        let email: string[] | null = null;
        let startTime: string | null = null;
        let duration: number | null = null;
        let timeZone: string | null = null;
        if (toolResults && toolResults.length > 0) {
          toolResults.forEach((toolCall: any) => {
            if (toolCall.result) {
              if (toolCall.toolName === 'parseTime') {
                startTime = toolCall.result;
              } else if (toolCall.toolName === 'extractEmail') {
                email = toolCall.result || null;
              } else if (toolCall.toolName === 'parseTimeRange') {
                duration = toolCall.result.duration;
                startTime = toolCall.result.start;
              } else if (toolCall.toolName === 'extractTimeZone') {
                timeZone = toolCall.result.timeZone;
              }
            }
          });
          resolve({
            startTime,
            email,
            duration,
            timeZone,
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

function isPast(dateISOString: string): boolean {
  const inputTime = new Date(dateISOString).getTime(); // UTC 毫秒时间戳
  const now = Date.now(); // 当前时间（UTC 毫秒）
  return inputTime < now;
}

interface ScheduleMeetingParams {
  chatId: string;
  targetUserId?: string | undefined;
  email?: string[];
  startTime?: string[] | undefined;
  duration?: number;
  timeZone?: string;
}
class ScheduleMeeting {
  private static instances = new Map<string, ScheduleMeeting>();

  private chatId: string;

  private targetUserId: string;

  private email: string[];

  private startTime: string[] | undefined;

  private duration: number;

  private timeZone: string | undefined;

  public timeout: NodeJS.Timeout | undefined = undefined;

  private handlerRef: ({ message }: { message: ApiMessage }) => void;

  private messageId: number | undefined;

  private timeConfirmed: boolean = false;

  private authCheckTimeout: NodeJS.Timeout | undefined = undefined;

  constructor({
    chatId,
    targetUserId = '',
    email = [],
    startTime = undefined,
    duration = 1800,
    timeZone = undefined,
  }: ScheduleMeetingParams) {
    this.chatId = chatId;
    this.targetUserId = targetUserId;
    this.email = email;
    this.timeZone = timeZone;
    this.startTime = startTime;
    this.duration = duration;
    this.handlerRef = ({ message }) => this.handlerImMessage({ message });

    // 注册监听器
    eventEmitter.on(Actions.NewTextMessage, this.handlerRef);

    // 超时自动清理
    this.timeout = setTimeout(() => {
      this.cleanup();
      console.log('已超过五分钟未完成输入，工作流已结束。');
    }, 1000 * 60 * 5);
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

  public async timeConfirmCallback({ startTime, email, timeZone, duration, timeConfirmed = false }: {
    startTime: string[] | undefined;
    email: string[] | undefined;
    timeZone: string;
    duration: number;
    timeConfirmed?: boolean;
  }) {
    if (timeZone && !this.timeZone) {
      this.timeZone = timeZone;
    }
    if (startTime && startTime.length) {
      this.startTime = startTime;
    }
    if (email && email.length) {
      this.email = email;
    }
    if (duration) {
      this.duration = duration;
    }
    this.timeConfirmed = timeConfirmed;
    if (!this.timeConfirmed) {
      await this.handleTimeCheck();
    }
    if (this.email.length && this.startTime && this.timeZone && this.duration && this.timeConfirmed) {
      this.scheduleAuthCheck();
    } else {
      this.handleMeetingInfoAsk();
    }
  }

  private handleMeetingInfoAsk() {
    if (!this.startTime || this.startTime.length === 0) {
      this.sendMessage(ASK_MEETING_TIME);
      return;
    } else if (!this.timeZone) {
      this.sendMessage(ASK_MEETING_TIMEZONE);
      return;
    } else if (!this.email.length) {
      this.sendMessage(ASK_MEETING_EMAIL);
      return;
    }
  }

  public cleanup() {
    eventEmitter.off(Actions.NewTextMessage, this.handlerRef);
    if (this.timeout) clearTimeout(this.timeout);
    if (this.authCheckTimeout) clearTimeout(this.authCheckTimeout);
    ScheduleMeeting.instances.delete(this.chatId);
  }

  private resetAuthCheckTimer() {
    if (this.authCheckTimeout) {
      clearTimeout(this.authCheckTimeout);
      this.authCheckTimeout = undefined;
    }
  }

  private scheduleAuthCheck() {
    this.resetAuthCheckTimer();
    this.authCheckTimeout = setTimeout(() => {
      this.handleGoogleAuthCheck();
    }, 15000); // 15秒延迟
  }

  public async handleTargetMessage(message: ApiMessage) {
    const text = getMessageContent(message)?.text?.text || '';
    this.messageId = message.id;
    const { email, startTime, duration, timeZone } = await getMeetParamsByAITools(text);
    if (timeZone && !this.timeZone) {
      this.timeZone = timeZone;
    }
    if (startTime) {
      this.startTime = [startTime];
      if (this.timeZone) {
        this.startTime = [attachZoneWithTemporal(startTime, this.timeZone).utcInstant];
      }
    }
    if (email && email.length) {
      this.email = email;
    }
    if (duration) {
      this.duration = duration;
    }
    if (this.startTime && this.timeZone) {
      await this.handleTimeCheck();
    }
    if (this.email.length && this.startTime && this.timeZone && this.duration && this.timeConfirmed) {
      this.scheduleAuthCheck();
    } else {
      this.handleMeetingInfoAsk();
    }
  }

  private handlerImMessage({ message }: { message?: ApiMessage }) {
    // 只处理对方发过来的消息
    if (
      message
      && hasMessageText(message)
      && !message.isOutgoing
    ) {
      this.messageId = message.id;
      this.handler({
        chatId: message.chatId,
        senderId: message.senderId,
        messageId: message.id,
        text: getMessageContent(message).text?.text || '',
      });
    }
  }

  private async checkTimeAvailable(startTimes?: string[]): Promise<{ isAvailable: boolean; suggestions?: { start: string; end: string }[] }> {
    const timeToCheck = startTimes ? startTimes[0] : null;

    if (!timeToCheck) {
      return {
        isAvailable: false,
        suggestions: [],
      };
    }

    const originalTimeWasPast = isPast(timeToCheck);

    if (originalTimeWasPast) {
      // 如果原始时间是过去时间，直接返回不可用并提供推荐时间
      const myBusyTimes = await getGoogleCalendarFreeBusy();
      const suggestions = suggestFreeTimes(myBusyTimes);
      return {
        isAvailable: false,
        suggestions,
      };
    }

    const endTime = new Date(new Date(timeToCheck).getTime() + this.duration * 1000).toISOString();
    const dateRange = {
      start: timeToCheck,
      end: endTime,
    };

    const { isAvailable, suggestions } = await isTimeSlotAvailable(dateRange);

    return {
      isAvailable,
      suggestions,
    };
  }

  private async checkCalendlyLinks(text: string): Promise<string[]> {
    const calendlyUrl = extractCalendlyLinks(text)?.[0];
    if (calendlyUrl) {
      const { times, timeZone, email } = await calendlyRanges({ calendlyUrl });
      if (!this.timeZone && timeZone) {
        this.timeZone = timeZone;
      }
      if (email) {
        this.email.push(email);
      }
      const myBusyTimes = await getGoogleCalendarFreeBusy();
      const availableSolts = getAvailableSlots(times, this.duration, myBusyTimes);
      if (availableSolts.length === 0) {
        console.log('No available time slots found for the provided Calendly link.');
      }
      return availableSolts.slice(0, 3);
    }
    return [];
  }

  private async handleTimeCheck() {
    if (this.startTime && this.timeZone && !this.timeConfirmed) {
      const { isAvailable, suggestions } = await this.checkTimeAvailable(this.startTime);
      if (!isAvailable) {
        this.startTime = [];
        this.sendMessage(MEETING_TIME_UNAVAILABLE);
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
                  this.timeZone,
                  true,
                )}`,
            )
            .join('\n')} \n [By TelyAI]`,
        );
        return;
      } else {
        this.timeConfirmed = true;
      }
    }
  }

  private async handleCalendlyMatch(text: string) {
    // 尝试从Calendly链接获取可用时间
    const availableSlots = await this.checkCalendlyLinks(text);
    // 如果有可用时间，打开小助手让用户确认时间
    if (availableSlots && availableSlots.length > 0 && !this.timeConfirmed) {
      const meetingTimeConfirmMessage = createMeetingTimeConfirmMessage({
        chatId: this.chatId,
        startTime: availableSlots,
        duration: this.duration,
        timeZone: this.timeZone!,
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
  }

  public async handler(params?: {
    chatId: string;
    senderId?: string | undefined;
    messageId?: number | undefined;
    text: string;
  }) {
    const { text, chatId, senderId, messageId } = params || {};
    if (chatId && chatId !== this.chatId) {
      return;
    }
    if (this.targetUserId && senderId !== this.targetUserId) {
      return;
    }
    if (text?.trim() === '') {
      return;
    }
    this.messageId = messageId;
    try {
      // 先获取参数
      const { email, startTime, duration, timeZone } = await getMeetParamsByAITools(text!);

      // 检查是否命中任何必要参数
      if (email && email.length > 0) {
        this.email = this.email.concat(email);
      }
      if (timeZone && !this.timeZone) {
        this.timeZone = timeZone;
        if (this.startTime) {
          this.startTime = [attachZoneWithTemporal(this.startTime[0], timeZone).utcInstant];
        }
        this.timeConfirmed = false;
      }
      if (duration) {
        this.duration = duration;
      }
      if (startTime) {
        this.startTime = [startTime];
        if (this.timeZone) {
          this.startTime = [attachZoneWithTemporal(startTime, this.timeZone).utcInstant];
        }
        this.timeConfirmed = false;
      }
      // 当任意必要条件有更新时，重置定时器
      if (startTime || duration || timeZone || email) {
        this.resetAuthCheckTimer();
      }

      // 如果通过AI工具获取到了startTime和timeZone，且还未检查过时间可用性，则检查时间是否合理
      await this.handleTimeCheck();

      await this.handleCalendlyMatch(text!);

      // 只有当命中参数时才询问下一个必要条件
      if (startTime || duration || timeZone || email) {
        this.handleMeetingInfoAsk();
      }

      if (this.email.length && this.startTime && this.timeZone && this.duration && this.timeConfirmed) {
        this.scheduleAuthCheck();
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
    const startTime = this.startTime![0];
    createGoogleMeet({
      startDate: new Date(startTime),
      endDate: new Date(new Date(startTime).getTime() + this.duration * 1000),
      selectedTimezone: this.timeZone!,
      emails: this.email,
      googleToken: accessToken,
    })
      .then((createMeetResponse: ICreateMeetResponse) => {
        this.sendMessage(MEETING_INVITATION_TIP);
        if (createMeetResponse) {
          generateEventScreenshot(createMeetResponse, this.chatId);
        }
        setTimeout(() => {
          this.cleanup();
        }, 3000);
      })
      .catch((err) => {
        console.log(err);
        this.cleanup();
      });
  }

  private sendMessage(message: string) {
    if (this.targetUserId && this.messageId) {
      const replyInfo = {
        type: 'message',
        replyToMsgId: this.messageId,
        replyToPeerId: undefined,
      };
      getActions().saveReplyDraft({
        chatId: this.chatId,
        threadId: -1,
        draft: { replyInfo } as ApiDraft,
        isLocalOnly: true,
      });
    }
    getActions().sendMessage({
      messageList: {
        chatId: this.chatId,
        threadId: '-1',
        type: 'thread',
      },
      text: message,
    });
    if (this.targetUserId) {
      getActions().clearDraft({ chatId: this.chatId, isLocalOnly: true });
    }
  }
}

export default ScheduleMeeting;
