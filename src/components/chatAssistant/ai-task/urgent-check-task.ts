/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import { v4 as uuidv4 } from 'uuid';

import type { ApiMessage } from '../../../api/types/messages';
import type { SummaryStoreMessage } from '../store/summary-store';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import telegptSettings from '../api/user-settings';
import RoomStorage from '../room-storage';
import { ChataiStores } from '../store';
import { sendGAEvent } from '../utils/analytics';
import { urgentMessageCheck } from '../utils/chat-api';
import { GLOBAL_SUMMARY_CHATID } from '../variables';

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

  checkUrgentMessage() {
    if (!this.pendingMessages.length) return;

    const urgentTopics = telegptSettings.telegptSettings.urgent_info;
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
          const hasStrongAlert = urgentTopics.find((item:any) => item.is_call);
          const strongAlertPhoneNumber = telegptSettings.telegptSettings.phone;
          if (hasStrongAlert && strongAlertPhoneNumber) {
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
    this.pendingMessages = this.pendingMessages.filter((item) => chats.includes(item.chatId));
  }

  addNewMessage(message: ApiMessage) {
    const urgentChats = telegptSettings.telegptSettings.urgent_chat_ids;
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
