/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import { v4 as uuidv4 } from 'uuid';

import type { ApiMessage } from '../../../api/types/messages';
import type { StoreMessage } from '../store/messages-store';
import type { UrgentTopic } from '../store/urgent-topic-store';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { DefaultUrgentTopic } from '../prompt';
import { ChataiStores } from '../store';
import { URGENT_CHATS } from '../store/general-store';
import { sendGAEvent } from '../utils/analytics';

const GLOBAL_SUMMARY_CHATID = '777888';

function getStrongAlertPhoneNumber(
  data: Array<{
    chatId: string;
    messageId: string;
    content: string;
    matchUrgentTopicIds: string[];
  }>,
  topics: Array<UrgentTopic>,
) {
  if (data instanceof Array && data.length > 0) {
    const mergedUniqueTopicIds = Array.from(
      // eslint-disable-next-line @typescript-eslint/no-shadow
      new Set(data.flatMap((item) => item.matchUrgentTopicIds)),
    );
    const phoneNumber = topics.find(
      (topic) => mergedUniqueTopicIds.includes(topic.id) && topic.strongAlert,
    )?.phoneNumber;
    return phoneNumber || null;
  }
  return null;
}

class UrgentCheckTask {
  private static instance: UrgentCheckTask | undefined;

  private pendingMessages: ApiMessage[] = [];

  private urgentChats: string[] = [];

  private urgentChatsInitialized: boolean = false;

  initTask() {
    setInterval(() => {
      this.checkUrgentMessage();
    }, 1000 * 60 * 5); // 每5分钟检查一次
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
      topics.unshift(DefaultUrgentTopic);
      fetch('https://telegpt-three.vercel.app/urgent-message-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          urgentTopics: topics,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('urgent check response', data);
          const matchs = data?.data || [];
          if (matchs.length > 0) {
            const newMessage: StoreMessage = {
              chatId: GLOBAL_SUMMARY_CHATID,
              timestamp: new Date().getTime(),
              content: JSON.stringify(matchs),
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
              const strongAlertPhoneNumber = getStrongAlertPhoneNumber(matchs, topics);
              if (strongAlertPhoneNumber) {
                fetch(`https://telegpt-three.vercel.app/voice-call?phoneNumber=${strongAlertPhoneNumber}`, {
                  method: 'GET',
                });
                sendGAEvent('call_reminder');
              }
            } catch (e) {
              console.log('error', e);
            }
          }
        });
    });
    this.clearPendingMessages();
  }

  updateUrgentChats(chats: string[]) {
    this.urgentChats = chats;
    this.pendingMessages = this.pendingMessages.filter((item) => chats.includes(item.chatId));
    console.log('checkUrgentMessage', this.pendingMessages);
  }

  getUrgentChats(): Promise<string[]> {
    return new Promise((resolve) => {
      if (this.urgentChatsInitialized) {
        resolve(this.urgentChats);
      } else {
        this.urgentChatsInitialized = true;
        ChataiStores.general
          ?.get(URGENT_CHATS)
          .then((chats) => {
            this.urgentChats = chats || [];
            resolve(chats || []);
          })
          .catch(() => {
            resolve([]);
          });
      }
    });
  }

  async addNewMessage(message: ApiMessage) {
    const urgentChats = (await this.getUrgentChats()) || [];
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
