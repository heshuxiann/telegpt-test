/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import { v4 as uuidv4 } from 'uuid';

import type { ApiMessage } from '../../../api/types/messages';
import type { SummaryStoreMessage } from '../store/summary-store';
import type { UrgentTopic } from '../store/urgent-topic-store';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import RoomStorage from '../room-storage';
import { ChataiStores } from '../store';
import { URGENT_CHATS } from '../store/general-store';
import { sendGAEvent } from '../utils/analytics';
import { urgentMessageCheck } from '../utils/chat-api';
import { GLOBAL_SUMMARY_CHATID } from '../variables';

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

  private timmer: NodeJS.Timeout | undefined;

  initTask() {
    if (this.timmer) {
      clearInterval(this.timmer);
    }
    this.timmer = setInterval(() => {
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

  async checkUrgentMessage() {
    if (!this.pendingMessages.length) return;

    const urgentTopics = await ChataiStores.urgentTopic?.getAllUrgentTopic();
    if (!urgentTopics?.length) return;

    const messages = this.pendingMessages.map((item) => {
      return {
        chatId: item.chatId,
        senderId: item.senderId,
        messageId: item.id,
        content: item.content.text?.text,
      };
    });
    urgentMessageCheck({ messages, urgentTopics }).then((res) => {
      console.log('urgent check response', res);
      const matchs = res?.data || [];
      if (matchs.length > 0) {
        const newMessage: SummaryStoreMessage = {
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
        ChataiStores.summary?.storeMessage(newMessage);
        eventEmitter.emit(Actions.AddUrgentMessage, newMessage);
        RoomStorage.increaseUnreadCount(GLOBAL_SUMMARY_CHATID);
        // check strong alert
        try {
          const strongAlertPhoneNumber = getStrongAlertPhoneNumber(matchs, urgentTopics);
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
