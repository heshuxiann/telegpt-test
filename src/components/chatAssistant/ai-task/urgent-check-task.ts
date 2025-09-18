/* eslint-disable no-console */

import { v4 as uuidv4 } from 'uuid';
import { getGlobal } from '../../../global';

import type { ApiMessage } from '../../../api/types/messages';
import type { SummaryStoreMessage } from '../store/summary-store';

import { ALL_FOLDER_ID } from '../../../config';
import eventEmitter, { Actions } from '../lib/EventEmitter';
import { getOrderedIds } from '../../../util/folderManager';
import { getIdsFromEntityTypes, telegptSettings } from '../api/user-settings';
import RoomStorage from '../room-storage';
import { ChataiStores } from '../store';
import { urgentMessageCheck, urgentVoiceCall } from '../utils/chat-api';
import { GLOBAL_SUMMARY_CHATID } from '../variables';

class UrgentCheckTask {
  private static instance: UrgentCheckTask | undefined;

  private pendingMessages: ApiMessage[] = [];

  private timmer: NodeJS.Timeout | undefined;

  private orderedIds: string[] = [];

  initTask() {
    if (this.timmer) {
      clearInterval(this.timmer);
    }
    this.timmer = setInterval(() => {
      this.checkUrgentMessage();
    }, 1000 * 60 * 5); // 每5分钟检查一次
    this.orderedIds = getOrderedIds(ALL_FOLDER_ID) || [];
  }

  static getTextWithoutEntities(text: string, entities: any[]): string {
    const ranges = entities.map((entity) => ({
      start: entity.offset,
      length: entity.length,
    }));
    const sortedRanges = ranges.sort((a, b) => b.start - a.start);

    for (const { start, length } of sortedRanges) {
      text = text.slice(0, start) + text.slice(start + length);
    }
    return text;
  }

  checkUrgentMessage() {
    if (!this.pendingMessages.length) return;
    const { urgent_info } = telegptSettings.telegptSettings;
    if (!urgent_info?.length) return;

    const messages = this.pendingMessages.map((item) => {
      return {
        chatId: item.chatId,
        senderId: item.senderId,
        messageId: item.id,
        content: item.content.text?.text,
      };
    });
    const global = getGlobal();
    const { autoTranslateLanguage = 'en' } = global.settings.byKey;
    urgentMessageCheck({
      messages,
      urgentTopics: urgent_info,
      language: new Intl.DisplayNames([autoTranslateLanguage], { type: 'language' }).of(autoTranslateLanguage),
    }).then((res) => {
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
          const hasStrongAlert = urgent_info.find((item: any) => item.is_call);
          const { phone } = telegptSettings.telegptSettings;
          if (hasStrongAlert && phone) {
            urgentVoiceCall(phone);
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
    const { ignored_urgent_chat_ids } = telegptSettings.telegptSettings;
    const ignoredIds = getIdsFromEntityTypes(ignored_urgent_chat_ids);
    const selectUrgentChatIds = this.orderedIds.filter((id) => !ignoredIds.includes(id));
    if (selectUrgentChatIds.includes(message.chatId)) {
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
