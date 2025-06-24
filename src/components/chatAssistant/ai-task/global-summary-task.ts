/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import { v4 as uuidv4 } from 'uuid';
import { getActions, getGlobal } from '../../../global';

import type { CustomSummaryTemplate } from '../store/chatai-summary-template-store';
import type { SummaryStoreMessage } from '../store/summary-store';
import { type ApiMessage, MAIN_THREAD_ID } from '../../../api/types/messages';

import { ALL_FOLDER_ID } from '../../../config';
import eventEmitter, { Actions } from '../lib/EventEmitter';
import { isSystemBot, isUserId } from '../../../global/helpers';
import {
  selectBot, selectChat, selectChatLastMessageId, selectFirstUnreadId, selectUser,
} from '../../../global/selectors';
import { CHATAI_IDB_STORE } from '../../../util/browser/idb';
import { getOrderedIds } from '../../../util/folderManager';
import GlobalSummaryBadge from '../globalSummary/global-summary-badge';
import {
  ChataiStores,
  GLOBAL_SUMMARY_LAST_TIME, GLOBAL_SUMMARY_READ_TIME,
} from '../store';
import { SUMMARY_CHATS } from '../store/general-store';
import { sendGAEvent } from '../utils/analytics';
import { fetchChatMessageByDeadline, fetchChatUnreadMessage } from '../utils/fetch-messages';
import { GLOBAL_SUMMARY_CHATID } from '../variables';

function getAlignedExecutionTimestamp(): number | null {
  const date = new Date();
  const hour = date.getHours();
  const minute = date.getMinutes();

  const toTimestamp = (h: number, m: number = 0) => {
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d.getTime();
  };

  // 09:00 - 12:00
  if (hour >= 9 && hour < 12) {
    const minutesAligned = Math.floor(minute / 30) * 30;
    return toTimestamp(hour, minutesAligned);
  }

  // 14:00 - 17:00
  if (hour >= 14 && hour < 17) {
    const minutesAligned = Math.floor(minute / 30) * 30;
    return toTimestamp(hour, minutesAligned);
  }

  // 17:00 - 23:00 每2小时执行一次
  if (hour >= 17 && hour < 23) {
    const baseHour = Math.floor((hour - 17) / 2) * 2 + 17;
    return toTimestamp(baseHour, 0);
  }

  // 不在执行时间内
  return null;
}

class GlobalSummaryTask {
  private static instance: GlobalSummaryTask | undefined;

  private pendingMessages: ApiMessage[] = [];

  private summaryChats: string[] = [];

  private customizationTemplate:CustomSummaryTemplate | undefined = undefined;

  private unreadSummaryCount = 0;

  private summaryChatsInitialized = false;

  private timmer: NodeJS.Timeout | undefined;

  initTask() {
    if (this.timmer) {
      clearInterval(this.timmer);
    }
    const executeTask = () => {
      const currentTime = new Date();
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      // eslint-disable-next-line no-console
      console.log('计时任务hours', hours);
      // eslint-disable-next-line no-console
      console.log('计时任务minutes', minutes);
      // 9:00 - 12:00 每30分钟执行一次
      if (hours >= 9 && hours < 12 && minutes % 30 === 0) {
        this.initSummaryChats();
      }

      // 14:00 - 17:00 每30分钟执行一次
      if (hours >= 14 && hours < 17 && minutes % 30 === 0) {
        this.initSummaryChats();
      }

      // 17:00 - 23:00 每2小时执行一次
      if (hours >= 17 && hours < 23 && (hours - 17) % 2 === 0 && minutes === 0) {
        this.initSummaryChats();
      }
    };

    // 每分钟执行一次来检查时间段
    this.timmer = setInterval(executeTask, 60000);
    eventEmitter.on(Actions.ChatAIStoreReady, async () => {
      await this.updateSummarySettings();
      const globalSummaryLastTime: number | undefined = await ChataiStores.general?.get(GLOBAL_SUMMARY_LAST_TIME);
      if (!globalSummaryLastTime) {
      // TODO 总结所有的未读消息
        this.summaryAllUnreadMessages();
      } else if (Date.now() - globalSummaryLastTime > 1000 * 60 * 60 * 10) {
      // TODO 获取所有未读消息
        this.summaryMessageByDeadline(globalSummaryLastTime);
      }
    });
  }

  async initSummaryChats() {
    const globalSummaryLastTime: number | undefined = await ChataiStores.general?.get(GLOBAL_SUMMARY_LAST_TIME);
    if (!globalSummaryLastTime) {
      // TODO 总结所有的未读消息
      this.summaryAllUnreadMessages();
    } else {
      this.summaryMessageByDeadline(globalSummaryLastTime);
    }
  }

  async updateSummarySettings() {
    try {
      this.customizationTemplate = await ChataiStores.general?.get('lastDefinedPrompt');
      this.summaryChats = await ChataiStores.general?.get(SUMMARY_CHATS) || [];
    } catch (e) {
      console.log(e);
    }
  }

  public updateSummaryDefineTemplate(template: CustomSummaryTemplate | undefined) {
    this.customizationTemplate = template;
  }

  public updateSummaryChats(chats:string[]) {
    this.summaryChats = chats;
  }

  async startSummary(chats: Record<string, ApiMessage[]>, callback?:()=>void) {
    const global = getGlobal();
    const { autoTranslateLanguage } = global.settings.byKey;
    const globalSummaryLastTime = await ChataiStores.general?.get(GLOBAL_SUMMARY_LAST_TIME) || 0;
    const summaryTime = getAlignedExecutionTimestamp();
    if (!Object.keys(chats).length) return;
    const summaryChats:any[] = [];
    Object.keys(chats).forEach((chatId) => {
      const chat = chatId ? selectChat(global, chatId) : undefined;
      const chatType = isUserId(chatId) ? 'private' : 'group';
      const messages = chats[chatId].map((message) => {
        if (message.content.text?.text) {
          const peer = message.senderId ? selectUser(global, message.senderId) : undefined;
          return {
            senderId: message.senderId,
            senderName: peer ? `${peer.firstName || ''} ${peer.lastName || ''}` : '',
            date: message.date,
            messageId: Math.floor(message.id),
            content: message.content.text?.text ?? '',
          };
        }
        return null;
      }).filter(Boolean);
      if (messages.length > 0) {
        summaryChats.push({
          chatId,
          chatName: chat?.title ?? 'Unknown',
          chatType,
          messages,
        });
      }
    });
    if (!summaryChats.length) return;
    const summaryInfo = {
      summaryStartTime: globalSummaryLastTime || null,
      summaryEndTime: summaryTime,
      summaryMessageCount: Object.values(chats).reduce(
        (sum, messages) => sum + messages.length,
        0,
      ),
      summaryChatIds: Object.keys(chats),
    };
    fetch('https://telegpt-three.vercel.app/global-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: summaryChats,
        language: autoTranslateLanguage,
        definePrompt: this.customizationTemplate?.prompt || '',
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('summary response', data);
        const content = {
          ...data.data,
          summaryInfo,
          customizationTemplate: this.customizationTemplate,
        };
        const newMessage: SummaryStoreMessage = {
          timestamp: new Date().getTime(),
          content: JSON.stringify(content),
          id: uuidv4(),
          createdAt: new Date(),
          role: 'assistant',
          annotations: [{
            type: 'global-summary',
          }],
        };
        ChataiStores.summary?.storeMessage(newMessage);
        ChataiStores.general?.set(GLOBAL_SUMMARY_LAST_TIME, summaryTime);
        eventEmitter.emit(Actions.AddSummaryMessage, newMessage);
        GlobalSummaryBadge.increaseUnreadCount();
        window.Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            const notification = new Notification('Chat Summary', {
              body: 'You have received a new Chat Summary',
            });
            notification.onclick = () => {
              getActions().openChat({ id: GLOBAL_SUMMARY_CHATID });
              sendGAEvent('summary_view');
            };
            setTimeout(() => notification.close(), 5000);
          }
        });
        callback?.();
      });
    this.clearPendingMessages();
  }

  summaryAllUnreadMessages = async () => {
    const unreadMessages: Record<string, ApiMessage[]> = {};
    const global = getGlobal();
    const orderedIds = getOrderedIds(ALL_FOLDER_ID) || [];
    const summaryChatIds = this.summaryChats.length ? this.summaryChats : orderedIds;
    for (let i = 0; i < summaryChatIds.length; i++) {
      const chatId = summaryChatIds[i];
      const chat = selectChat(global, chatId);
      const chatBot = !isSystemBot(chatId) ? selectBot(global, chatId) : undefined;
      if (chat && chat.unreadCount && !chatBot) {
        const firstUnreadId = selectFirstUnreadId(global, chatId, MAIN_THREAD_ID) || chat.lastReadInboxMessageId;
        const roomUnreadMsgs = await fetchChatUnreadMessage({
          chat,
          offsetId: firstUnreadId || 0,
          addOffset: -30,
          sliceSize: 30,
          threadId: MAIN_THREAD_ID,
          unreadCount: chat.unreadCount,
          maxCount: 100,
        });
        if (roomUnreadMsgs.length > 0) {
          unreadMessages[chatId] = roomUnreadMsgs;
        }
      }
    }
    if (Object.keys(unreadMessages).length) {
      this.startSummary(unreadMessages);
    }
  };

  async summaryMessageByDeadline(deadline: number) {
    const unreadMessages: Record<string, ApiMessage[]> = {};
    const global = getGlobal();
    const orderedIds = getOrderedIds(ALL_FOLDER_ID) || [];
    const summaryChatIds = this.summaryChats.length ? this.summaryChats : orderedIds;
    for (let i = 0; i < summaryChatIds.length; i++) {
      const chatId = summaryChatIds[i];
      const chat = selectChat(global, chatId);
      const chatBot = !isSystemBot(chatId) ? selectBot(global, chatId) : undefined;
      const chatLastMessageId = selectChatLastMessageId(global, chatId) || 0;
      if (chat && chat.unreadCount && !chatBot && chatLastMessageId) {
        const roomUnreadMsgs = await fetchChatMessageByDeadline({
          chat,
          deadline: deadline / 1000,
          offsetId: chatLastMessageId,
          addOffset: -30,
          sliceSize: 30,
          threadId: MAIN_THREAD_ID,
          maxCount: 100,
        });
        unreadMessages[chatId] = roomUnreadMsgs;
      }
    }
    if (Object.keys(unreadMessages).length) {
      this.startSummary(unreadMessages);
    }
  }

  async mergeUnreadSummarys() {
    const lastReadTime: number | undefined = await ChataiStores.general?.get(GLOBAL_SUMMARY_READ_TIME);
    if (lastReadTime && this.unreadSummaryCount > 2) {
      this.summaryMessageByDeadline(lastReadTime);
    }
    ChataiStores.general?.set(GLOBAL_SUMMARY_READ_TIME, new Date().getTime());
    this.unreadSummaryCount = 0;
  }

  getSummaryChats():Promise<string[]> {
    return new Promise((resolve) => {
      if (this.summaryChatsInitialized) {
        resolve(this.summaryChats);
      } else {
        this.summaryChatsInitialized = true;
        ChataiStores.general?.get(SUMMARY_CHATS).then((chats) => {
          this.summaryChats = chats || [];
          resolve(chats || []);
        }).catch(() => {
          resolve([]);
        });
      }
    });
  }

  async addNewMessage(message: ApiMessage) {
    const summaryChats = await this.getSummaryChats() || [];
    const chatId = message.chatId;
    if (summaryChats.length === 0 || summaryChats.includes(chatId)) {
      this.pendingMessages.push(message);
      console.log('待总结的消息', this.pendingMessages);
    }
  }

  clearPendingMessages() {
    this.pendingMessages = [];
  }

  getPendingMessages() {
    return this.pendingMessages;
  }

  public static getInstance() {
    if (!GlobalSummaryTask.instance) {
      GlobalSummaryTask.instance = new GlobalSummaryTask();
    }
    return GlobalSummaryTask.instance;
  }
}

export const globalSummaryTask = GlobalSummaryTask.getInstance();
