/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import { v4 as uuidv4 } from 'uuid';

import type { ApiMessage } from '../../../api/types/messages';
import type { StoreMessage } from '../store/messages-store';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import generateChatgpt from '../lib/generate-chat';
import { formatUrgentCheckText } from '../globalSummary/formate-summary-text';
import { getUrgentTopicPrompt } from '../prompt';
import { ChataiStores } from '../store';
import { URGENT_CHATS } from '../store/general-store';

const GLOBAL_SUMMARY_CHATID = '777888';

function getStrongAlertPhoneNumber(
  data: Array<{
    chatId: string;
    messageId: string;
    content: string;
    matchUrgentTopics: any[];
  }>,
) {
  if (data instanceof Array && data.length > 0) {
    for (const item of data) {
      if (Array.isArray(item.matchUrgentTopics)) {
        for (const topic of item.matchUrgentTopics) {
          if (
            topic.strongAlert === true
            && typeof topic.phoneNumber === 'string'
            && topic.phoneNumber.trim() !== ''
          ) {
            return topic.phoneNumber.trim(); // 只返回第一个匹配的
          }
        }
      }
    }
    return null; // 没有找到符合条件的
  }
  return null;
}

class UrgentCheckTask {
  private static instance: UrgentCheckTask | undefined;

  private pendingMessages: ApiMessage[] = [];

  private urgentChats: string[] = [];

  private urgentChatsInitialized:boolean = false;

  initTask() {
    setInterval(() => {
      this.checkUrgentMessage();
    }, 1000 * 10);
  }

  static getTextWithoutEntities(text: string, entities: any[]): string {
    const ranges = entities.map((entity) => ({
      start: entity.offset,
      length: entity.length,
    }));
    const sortedRanges = ranges.sort((a, b) => b.start - a.start);

    // eslint-disable-next-line @typescript-eslint/no-shadow
    for (const { start, length } of sortedRanges) {
      text = text.slice(0, start) + text.slice(start + length);
    }
    return text;
  }

  checkUrgentMessage() {
    if (!this.pendingMessages.length) return;
    console.log('checkUrgentMessage', this.pendingMessages);
    const messages = this.pendingMessages.map((item) => {
      return {
        chatId: item.chatId,
        senderId: item.senderId,
        messageId: item.id,
        content: item.content.text?.text,
      };
    });
    ChataiStores.urgentTopic?.getAllUrgentTopic().then((topics) => {
      const urgentPrompts = getUrgentTopicPrompt(topics);
      generateChatgpt({
        data: {
          messages: [
            {
              role: 'system',
              content: urgentPrompts,
              id: '1',
            },
            {
              role: 'user',
              content: `分析一下消息列表,获取符合描述的消息:
                ${JSON.stringify(messages)}
              `,
              id: '2',
            },
          ],
        },
        onResponse: (response) => {
          console.log('response', response);
          const formatResponse = formatUrgentCheckText(response);
          if (formatResponse) {
            const newMessage: StoreMessage = {
              chatId: GLOBAL_SUMMARY_CHATID,
              timestamp: new Date().getTime(),
              content: JSON.stringify(formatResponse),
              id: uuidv4(),
              createdAt: new Date(),
              role: 'assistant',
              annotations: [
                {
                  type: 'urgent-message-check',
                },
              ],
            };
            ChataiStores.message?.storeMessage(newMessage);
            eventEmitter.emit(Actions.AddUrgentMessage, newMessage);
            // check strong alert
            try {
              const strongAlertPhoneNumber = getStrongAlertPhoneNumber(formatResponse);
              if (strongAlertPhoneNumber) {
                fetch(`https://telegpt-three.vercel.app/voice-call?phoneNumber=${strongAlertPhoneNumber}`, {
                  method: 'GET',
                });
              }
            } catch (e) {
              console.log('error', e);
            }
          }
        },
      });
    });
    this.clearPendingMessages();
  }

  updateUrgentChats(chats: string[]) {
    this.urgentChats = chats;
    this.pendingMessages = this.pendingMessages.filter((item) => chats.includes(item.chatId));
    console.log('checkUrgentMessage', this.pendingMessages);
  }

  getUrgentChats():Promise<string[]> {
    return new Promise((resolve) => {
      if (this.urgentChatsInitialized) {
        resolve(this.urgentChats);
      } else {
        this.urgentChatsInitialized = true;
        ChataiStores.general?.get(URGENT_CHATS).then((chats) => {
          this.urgentChats = chats || [];
          resolve(chats || []);
        }).catch(() => {
          resolve([]);
        });
      }
    });
  }

  async addNewMessage(message: ApiMessage) {
    const urgentChats = await this.getUrgentChats() || [];
    if (urgentChats.length === 0 || urgentChats.includes(message.chatId)) {
      this.pendingMessages.push(message);
    }
  }

  clearPendingMessages() {
    this.pendingMessages = [];
  }

  getPendingMessages() {
    return this.pendingMessages;
  }

  public static getInstance() {
    if (!UrgentCheckTask.instance) {
      UrgentCheckTask.instance = new UrgentCheckTask();
    }
    return UrgentCheckTask.instance;
  }
}

export const urgentCheckTask = UrgentCheckTask.getInstance();
