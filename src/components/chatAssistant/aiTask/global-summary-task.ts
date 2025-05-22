/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import { v4 as uuidv4 } from 'uuid';
import { getGlobal } from '../../../global';

import type { StoreMessage } from '../store/messages-store';
import { type ApiMessage, MAIN_THREAD_ID } from '../../../api/types/messages';

import { ALL_FOLDER_ID } from '../../../config';
import eventEmitter, { Actions } from '../lib/EventEmitter';
import generateChatgpt from '../lib/generate-chat';
import { isSystemBot, isUserId } from '../../../global/helpers';
import {
  selectBot, selectChat, selectChatLastMessageId, selectFirstUnreadId, selectUser,
} from '../../../global/selectors';
import { getOrderedIds } from '../../../util/folderManager';
import { formatSummaryText } from '../globalSummary/formate-summary-text';
import defaultSummaryPrompt, { getGlobalSummaryPrompt } from '../globalSummary/summary-prompt';
import {
  ChataiStores,
  GLOBAL_SUMMARY_LAST_TIME, GLOBAL_SUMMARY_READ_TIME,
} from '../store';
import { SUMMARY_CHATS } from '../store/general-store';
import { fetchChatMessageByDeadline, fetchChatUnreadMessage } from '../utils/fetch-messages';

interface SummaryMessage {
  chatId: string;
  chatTitle: string;
  senderName: string;
  senderId: string | undefined;
  date: number;
  messageId: number;
  content: string;
}

const GLOBAL_SUMMARY_CHATID = '777888';

class GlobalSummaryTask {
  private static instance: GlobalSummaryTask | undefined;

  private pendingMessages: ApiMessage[] = [];

  private summaryChats: string[] = [];

  private globalSummaryPrompt:string = defaultSummaryPrompt;

  private customizationTemplate:{ title: string; prompt: string } | null = null;

  private unreadSummaryCount = 0;

  private summaryChatsInitialized = false;

  initTask() {
    this.updateSummaryTemplate();
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
        this.summaryPendingMessages();
      }

      // 14:00 - 17:00 每30分钟执行一次
      if (hours >= 14 && hours < 17 && minutes % 30 === 0) {
        this.summaryPendingMessages();
      }

      // 17:00 - 23:00 每2小时执行一次
      if (hours >= 17 && hours < 23 && (hours - 17) % 2 === 0 && minutes === 0) {
        this.summaryPendingMessages();
      }
    };

    // 每分钟执行一次来检查时间段
    setInterval(executeTask, 60000);
  }

  summaryPendingMessages() {
    this.startSummary(this.pendingMessages, () => {
      this.unreadSummaryCount++;
    });
  }

  updateSummaryTemplate() {
    getGlobalSummaryPrompt().then((res) => {
      if (res) {
        this.globalSummaryPrompt = res.prompt;
      }
      if (res.customizationTemplate) {
        this.customizationTemplate = res.customizationTemplate;
      }
    });
  }

  async initUnSummary() {
    const globalSummaryLastTime: number | undefined = await ChataiStores.general?.get(GLOBAL_SUMMARY_LAST_TIME);
    if (!globalSummaryLastTime) {
      // TODO 总结所有的未读消息
      this.summaryAllUnreadMessages();
    } else if (globalSummaryLastTime < Date.now() - 1000 * 60 * 60 * 10) {
      this.summaryMessageByDeadline(globalSummaryLastTime);
    }
  }

  async startSummary(messages:ApiMessage[], callback?:()=>void) {
    // eslint-disable-next-line no-console
    console.log('开始总结', messages);
    const global = getGlobal();
    const globalSummaryLastTime = await ChataiStores.general?.get(GLOBAL_SUMMARY_LAST_TIME) || 0;
    const summaryTime = new Date().getTime();
    if (!messages.length) return;
    const summaryMessages: SummaryMessage[] = messages.map((message) => {
      if (message.content.text?.text) {
        const peer = message.senderId ? selectUser(global, message.senderId) : undefined;
        const chatId = message.chatId;
        const chat = chatId ? selectChat(global, chatId) : undefined;
        return {
          chatId,
          chatTitle: chat?.title ?? 'Unknown',
          chatType: isUserId(chatId) ? 'private' : 'group',
          senderId: message.senderId,
          senderName: peer ? `${peer.firstName || ''} ${peer.lastName || ''}` : '',
          date: message.date,
          messageId: Math.floor(message.id),
          content: message.content.text?.text ?? '',
        };
      }
      return null;
    }).filter(Boolean);
    if (!summaryMessages.length) return;
    const summaryMessageContent = {
      messageList: summaryMessages,
    };
    const summaryInfo = {
      summaryStartTime: globalSummaryLastTime || null,
      summaryEndTime: summaryTime,
      summaryMessageCount: summaryMessages.length,
      summaryChatIds: messages.map((item) => item.chatId),
    };
    generateChatgpt({
      data: {
        messages: [{
          id: uuidv4(),
          role: 'user',
          content: `${this.globalSummaryPrompt}\n\n${JSON.stringify(summaryMessageContent)}`,
        }],
      },
      onResponse: (response) => {
        console.log('response', response);
        ChataiStores.general?.set(GLOBAL_SUMMARY_LAST_TIME, new Date().getTime());
        const formatResponse = formatSummaryText(response);
        if (formatResponse) {
          const content = {
            ...formatResponse,
            summaryInfo,
            customizationTemplate: this.customizationTemplate,
          };
          const newMessage: StoreMessage = {
            chatId: GLOBAL_SUMMARY_CHATID,
            timestamp: new Date().getTime(),
            content: JSON.stringify(content),
            id: uuidv4(),
            createdAt: new Date(),
            role: 'assistant',
            annotations: [{
              type: 'global-summary',
            }],
          };
          ChataiStores.message?.storeMessage(newMessage);
          eventEmitter.emit(Actions.AddSummaryMessage, newMessage);
          callback?.();
        }
      },
    });
    this.clearPendingMessages();
  }

  summaryAllUnreadMessages = async () => {
    let unreadMessages: ApiMessage[] = [];
    const global = getGlobal();
    const orderedIds = getOrderedIds(ALL_FOLDER_ID) || [];
    for (let i = 0; i < orderedIds.length; i++) {
      const chatId = orderedIds[i];
      const chat = selectChat(global, chatId);
      const chatBot = !isSystemBot(chatId) ? selectBot(global, chatId) : undefined;
      if (chat && chat.unreadCount && !chatBot) {
        // if (chat?.membersCount && chat?.membersCount > 100) {
        //   continue;
        // }
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
          unreadMessages = roomUnreadMsgs;
        }
      }
    }
    if (unreadMessages.length) {
      this.startSummary(unreadMessages);
    }
  };

  async summaryMessageByDeadline(deadline: number) {
    let unreadMessages: ApiMessage[] = [];
    const global = getGlobal();
    const orderedIds = getOrderedIds(ALL_FOLDER_ID) || [];
    for (let i = 0; i < orderedIds.length; i++) {
      const chatId = orderedIds[i];
      const chat = selectChat(global, chatId);
      const chatBot = !isSystemBot(chatId) ? selectBot(global, chatId) : undefined;
      const chatLastMessageId = selectChatLastMessageId(global, chatId) || 0;
      if (chat && chat.unreadCount && !chatBot && chatLastMessageId) {
        // if (chat?.membersCount && chat?.membersCount > 100) {
        //   continue;
        // }
        const roomUnreadMsgs = await fetchChatMessageByDeadline({
          chat,
          deadline: deadline / 1000,
          offsetId: chatLastMessageId,
          addOffset: -30,
          sliceSize: 30,
          threadId: MAIN_THREAD_ID,
          maxCount: 100,
        });
        unreadMessages = roomUnreadMsgs;
      }
    }
    if (unreadMessages.length) {
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

  static getTextWithoutEntities(text: string, entities: any[]): string {
    const ranges = entities.map((entity) => ({ start: entity.offset, length: entity.length }));
    const sortedRanges = ranges.sort((a, b) => b.start - a.start);

    // eslint-disable-next-line @typescript-eslint/no-shadow
    for (const { start, length } of sortedRanges) {
      text = text.slice(0, start) + text.slice(start + length);
    }
    return text;
  }

  updateSummaryChats(chats: string[]) {
    this.summaryChats = chats;
    this.pendingMessages = this.pendingMessages.filter((item) => chats.includes(item.chatId));
    // console.log('checkUrgentMessage', this.pendingMessages);
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
