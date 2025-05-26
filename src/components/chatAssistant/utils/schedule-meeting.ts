/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
/* eslint-disable max-len */
import { Modal } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { getActions } from '../../../global';

import type { ApiMessage } from '../../../api/types';
import type { ICreateMeetResponse } from './google-api';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { checkGoogleAuthStatus, createGoogleMeet, loginWithGoogle } from './google-api';

function formatTimeRange(startISO:string, endISO:string) {
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
    hour12: true,
  });

  // 格式化时间（去掉空格和 AM/PM 小写）
  const formatTime = (date:Date) => {
    return timeFormatter.format(date)
      .toLowerCase()
      .replace(' ', '');
  };

  const dateStr = dayFormatter.format(startDate);
  const startTimeStr = formatTime(startDate);
  const endTimeStr = formatTime(endDate);

  return `${dateStr} ${startTimeStr}-${endTimeStr}`;
}

class ScheduleMeeting {
  private chatId:string;

  constructor(chatId:string) {
    this.chatId = chatId;
  }

  public start(originalMessage: ApiMessage) {
    let email: string[] | null = null;
    let date: string | null = null;

    let timeout: NodeJS.Timeout;

    const cleanup = () => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      eventEmitter.off(Actions.NewTextMessage, handler);
      clearTimeout(timeout);
      console.log('[🔁 清理监听器]');
    };
    const handler = async ({ message }:{ message: ApiMessage }) => {
      if (message.content.text && message.chatId === this.chatId && !message.isOutgoing) {
        const { text } = message.content.text;
        const toolCheckRes = await ScheduleMeeting.getMeetParamsByAITools(text);
        if (toolCheckRes.email) email = toolCheckRes.email;
        if (toolCheckRes.date) date = toolCheckRes.date;
        if (!email && !date) {
          this.sendMessage('I\'d like to schedule a meeting with you. Could you tell me what time would be good for you to have the meeting? Also, could I get your email address?');
          return;
        } else if (!email) {
          this.sendMessage('Could you please share your email address?');
          return;
        } else if (!date) {
          this.sendMessage('Could you tell me what time would be good for you to have the meeting?');
          return;
        }
        if (email && date) {
          cleanup();
          console.log('[✅ 工作流完成]:', { date, email });
          this.handleGoogleAuthCheck({ date, email });
        }
      }
    };

    // 注册监听器
    eventEmitter.on(Actions.NewTextMessage, handler);

    // 超时自动清理
    timeout = setTimeout(() => {
      cleanup();
      console.log('已超过五分钟未完成输入，工作流已结束。');
    }, 1000 * 60 * 5);

    // this.sendMessage('你好，请告诉我你的约会时间和邮箱。');
    handler({ message: originalMessage });
  }

  private static getMeetParamsByAITools(message:string): Promise<any> {
    return new Promise((resolve, reject) => {
      fetch('https://telegpt-three.vercel.app/tool-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            id: uuidv4(),
            content: message,
            role: 'user',
          }],
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      }).then((res) => res.json()).then((toolResults) => {
        let email: string[] | null = null;
        let date: string | null = null;
        if (toolResults && toolResults.length > 0) {
          toolResults.forEach((toolCall: any) => {
            if (toolCall.toolName === 'parseTime') {
              date = toolCall.result;
            } else if (toolCall.toolName === 'extractEmail') {
              email = toolCall.result;
            }
          });
          resolve({
            date,
            email,
          });
        } else {
          resolve({});
        }
      }).catch((err) => {
        reject(err);
      });
    });
  }

  private async handleGoogleAuthCheck({ date, email }:{ date:string;email:string[] }) {
    const accessToken = await checkGoogleAuthStatus();
    if (accessToken) {
      this.handleCreateGoogleMeet({ date, email, accessToken });
    } else {
      Modal.confirm({
        title: 'Google authorization',
        content: 'This service requires access to your Google Calendar.',
        okText: 'Confirm',
        cancelText: 'Cancel',
        onOk: () => {
          // eslint-disable-next-line @typescript-eslint/no-shadow
          loginWithGoogle().then(({ accessToken }) => {
            this.handleCreateGoogleMeet({ date, email, accessToken });
          });
        },
        onCancel() {
          console.log('用户点击了取消');
        },
      });
    }
  }

  public handleCreateGoogleMeet({ date, email, accessToken }:{ date:string;email:string[];accessToken:string }) {
    this.sendMessage('I\'ll send you the meeting invitation later.');
    createGoogleMeet({
      startDate: new Date(date),
      endDate: new Date(new Date(date).getTime() + 30 * 60 * 1000),
      selectedTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Add timezone
      emails: email,
      googleToken: accessToken as string,
    }).then((createMeetResponse:ICreateMeetResponse) => {
      console.log('createMeetResponse', createMeetResponse);
      if (createMeetResponse) {
        const eventMessage = `Event details \n📝 Title\n${createMeetResponse.summary}\n👥 Guests\n${createMeetResponse.attendees.map((attendee) => attendee.email).join('\\n')}\n📅 Time\n${formatTimeRange(createMeetResponse.start.dateTime,createMeetResponse.end.dateTime)}\n${createMeetResponse.start.timeZone}\n🔗 Meeting link\n${createMeetResponse.hangoutLink}
            `;
        this.sendMessage(eventMessage);
      }
    });
  }

  private sendMessage(message:string) {
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
