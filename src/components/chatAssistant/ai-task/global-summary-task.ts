/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import { v4 as uuidv4 } from 'uuid';
import { getActions, getGlobal } from '../../../global';

import type { SummaryStoreMessage } from '../store/summary-store';
import { type ApiMessage, MAIN_THREAD_ID } from '../../../api/types/messages';
import { LoadMoreDirection } from '../../../types';

import { ALL_FOLDER_ID } from '../../../config';
import eventEmitter, { Actions } from '../lib/EventEmitter';
import { loadChats } from '../../../global/actions/api/chats';
import { isSystemBot } from '../../../global/helpers';
import {
  selectBot, selectChat, selectChatLastMessageId, selectUser,
} from '../../../global/selectors';
import { isUserId } from '../../../util/entities/ids';
import { getOrderedIds } from '../../../util/folderManager';
import { getIdsFromEntityTypes, telegptSettings } from '../api/user-settings';
import RoomStorage from '../room-storage';
import {
  ChataiStores,
  GLOBAL_SUMMARY_LAST_TIME,
} from '../store';
import { globalSummary } from '../utils/chat-api';
import { fetchChatMessageByDeadline, loadTextMessages } from '../utils/fetch-messages';
import { GLOBAL_SUMMARY_CHATID } from '../variables';

function getSummaryInfo({
  startTime,
  endTime,
  chats,
}: {
  startTime: number | null;
  endTime: number;
  chats: Record<string, ApiMessage[]>;
}) {
  const summaryInfo = {
    summaryStartTime: startTime,
    summaryEndTime: endTime,
    summaryMessageCount: Object.values(chats).reduce(
      (sum, messages) => sum + messages.length,
      0,
    ),
    summaryChatIds: Object.keys(chats),
  };
  return summaryInfo;
}

function getAllChatIds(): Promise<string[] | undefined> {
  return new Promise((resolve) => {
    (async () => {
      const orderedIds = getOrderedIds(ALL_FOLDER_ID) || [];
      if (orderedIds.length === 0) {
        await loadChats('active', true);
        await loadChats('archived', true);
      }
      resolve(getOrderedIds(ALL_FOLDER_ID));
    })();
  });
}

const FREE_SUMMARY_INTERVAL = 24 * 60 * 60 * 1000;
const VIP_SUMMARY_INTERVAL = 8 * 60 * 60 * 1000;

class GlobalSummaryTask {
  private static instance: GlobalSummaryTask | undefined;

  private timmer: NodeJS.Timeout | undefined;

  private lastSummaryTime: number = 0;

  initTask() {
    if (this.timmer) {
      clearInterval(this.timmer);
    }
    const executeTask = async () => {
      const { subscription_info } = telegptSettings.telegptSettings;
      let summaryInterval = FREE_SUMMARY_INTERVAL;
      if ((subscription_info.subscription_type === 'basic' || subscription_info.subscription_type === 'plus' || subscription_info.subscription_type === 'pro') && !subscription_info.is_expirated) {
        summaryInterval = VIP_SUMMARY_INTERVAL;
      }
      const currentTime = new Date().getTime();
      let lastSummaryTime = this.lastSummaryTime;
      if (!lastSummaryTime) {
        lastSummaryTime = await ChataiStores.general?.get(GLOBAL_SUMMARY_LAST_TIME) || 0;
      }
      if (!lastSummaryTime) {
        this.initFirstSummary();
      } else if (currentTime - lastSummaryTime > summaryInterval) {
        this.summaryMessageByDeadline(lastSummaryTime);
      }
    };
    this.timmer = setInterval(executeTask, 60000);
  }

  startSummary(
    chats: Record<string, ApiMessage[]>,
    summaryInfo: {
      summaryStartTime: number | null;
      summaryEndTime: number;
      summaryMessageCount: number;
      summaryChatIds: string[];
    },
  ) {
    const global = getGlobal();
    const { autoTranslateLanguage = 'en' } = global.settings.byKey;
    if (!Object.keys(chats).length) return;
    const summaryChats: any[] = [];
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
    const customTopics = this.getCustomTopic();
    globalSummary({
      messages: summaryChats,
      language: new Intl.DisplayNames([autoTranslateLanguage], { type: 'language' }).of(autoTranslateLanguage),
      customTopics,
    }).then((res: any) => {
      const content = {
        ...res.data,
        summaryInfo,
        customTopics,
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
      ChataiStores.general?.set(GLOBAL_SUMMARY_LAST_TIME, summaryInfo.summaryEndTime);
      this.lastSummaryTime = summaryInfo.summaryEndTime;
      eventEmitter.emit(Actions.AddSummaryMessage, newMessage);
      RoomStorage.increaseUnreadCount(GLOBAL_SUMMARY_CHATID);
      window.Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          const notification = new Notification('Chat Summary', {
            body: 'You have received a new Chat Summary',
          });
          notification.onclick = () => {
            getActions().openChat({ id: GLOBAL_SUMMARY_CHATID });
          };
          setTimeout(() => notification.close(), 5000);
        }
      });
    });
  }

  getCustomTopic = () => {
    const { curious_info, curious_id } = telegptSettings.telegptSettings;
    const customTopics = curious_info.filter((item: any) => curious_id.includes(item.id)).map((item) => {
      return {
        topicName: item.topic,
        topicDescription: item.prompt,
      };
    });
    return customTopics;
  };

  // 处理聊天消息的公共方法
  private async processChatMessages(
    summaryChatIds: string[],
    getMessageFunction: (chat: any, chatLastMessageId: number) => Promise<ApiMessage[]>,
    summaryStartTime: number | null,
    summaryEndTime: number,
  ) {
    let unreadMessages: Record<string, ApiMessage[]> = {};
    let totalLength = 0;
    let summaryCount = 0; // 添加计数器
    const global = getGlobal();
    const MAX_SUMMARY_COUNT = 3; // 设置最大总结次数

    for (let i = 0; i < summaryChatIds.length; i++) {
      try {
        const chatId = summaryChatIds[i];
        const chat = selectChat(global, chatId);
        const chatBot = !isSystemBot(chatId) ? selectBot(global, chatId) : undefined;
        const chatLastMessageId = selectChatLastMessageId(global, chatId) || 0;

        if (chat && !chatBot && chatLastMessageId) {
          const messages = await getMessageFunction(chat, chatLastMessageId);

          if (messages.length > 0) {
            let tempMsgs: ApiMessage[] = [];

            for (const msg of messages) {
              const text = msg?.content?.text?.text || '';
              const msgLength = text.length;

              if (totalLength + msgLength > 40000) {
                // 先将当前 tempMsgs 存到 unreadMessages
                if (!unreadMessages[chatId]) {
                  unreadMessages[chatId] = [];
                }
                unreadMessages[chatId].push(...tempMsgs);

                // 检查是否已达到最大总结次数
                if (summaryCount < MAX_SUMMARY_COUNT) {
                  // 执行 summary
                  const summaryInfo = getSummaryInfo({
                    startTime: summaryStartTime,
                    endTime: summaryEndTime,
                    chats: unreadMessages,
                  });
                  this.startSummary(unreadMessages, summaryInfo);
                  summaryCount++;
                } else {
                  // 已达到最大总结次数，结束循环
                  console.log('已达到最大总结次数，结束处理');
                  return;
                }

                // 清空
                unreadMessages = {};
                totalLength = 0;
                tempMsgs = [];
              }

              tempMsgs.push(msg);
              totalLength += msgLength;
            }

            // 当前 chatId 处理完，把 tempMsgs 加到 unreadMessages
            if (tempMsgs.length > 0) {
              if (!unreadMessages[chatId]) {
                unreadMessages[chatId] = [];
              }
              unreadMessages[chatId].push(...tempMsgs);
            }
          }
        }
      } catch (err) {
        console.log('Fetch message error---->', err);
        continue;
      }
    }

    // 如果还有未处理消息且未达到最大总结次数，仍需执行一次
    if (Object.keys(unreadMessages).length > 0 && summaryCount < MAX_SUMMARY_COUNT) {
      const summaryInfo = getSummaryInfo({
        startTime: summaryStartTime,
        endTime: summaryEndTime,
        chats: unreadMessages,
      });
      this.startSummary(unreadMessages, summaryInfo);
      summaryCount++;
    } else if (summaryCount >= MAX_SUMMARY_COUNT) {
      console.log('已达到最大总结次数，剩余消息不再处理');
    }
  }

  async initFirstSummary() {
    const orderedIds = await getAllChatIds() || [];
    const { ignored_summary_chat_ids } = telegptSettings.telegptSettings;
    const ignoredIds = getIdsFromEntityTypes(ignored_summary_chat_ids);
    const summaryChatIds = orderedIds.filter((id) => !ignoredIds.includes(id));
    const summaryEndTime = Date.now();

    await this.processChatMessages(
      summaryChatIds,
      (chat, chatLastMessageId) => loadTextMessages({
        chat,
        sliceSize: 50,
        threadId: MAIN_THREAD_ID,
        offsetId: chatLastMessageId,
        direction: LoadMoreDirection.Backwards,
        maxCount: 50,
      }),
      null,
      summaryEndTime,
    );
  };

  async summaryMessageByDeadline(deadline: number) {
    const orderedIds = await getAllChatIds() || [];
    const { ignored_summary_chat_ids } = telegptSettings.telegptSettings;
    const ignoredIds = getIdsFromEntityTypes(ignored_summary_chat_ids);
    const summaryChatIds = orderedIds.filter((id) => !ignoredIds.includes(id));
    const summaryTime = new Date().getTime();
    await this.processChatMessages(
      summaryChatIds,
      (chat, chatLastMessageId) => fetchChatMessageByDeadline({
        chat,
        deadline: deadline / 1000,
        offsetId: chatLastMessageId,
        addOffset: -1,
        sliceSize: 30,
        threadId: MAIN_THREAD_ID,
        maxCount: 100,
      }),
      deadline,
      summaryTime,
    );
  }

  public static getInstance() {
    if (!GlobalSummaryTask.instance) {
      GlobalSummaryTask.instance = new GlobalSummaryTask();
    }
    return GlobalSummaryTask.instance;
  }
}

export const globalSummaryTask = GlobalSummaryTask.getInstance();
