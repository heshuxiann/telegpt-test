import { v4 as uuidv4 } from 'uuid';
import { getGlobal } from '../../../global';

import type { StoreMessage } from '../store/messages-store';
import { MAIN_THREAD_ID } from '../../../api/types';
import { AIMessageType } from '../messages/types';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { selectChat, selectChatLastMessageId } from '../../../global/selectors';
import { ChataiStores } from '../store';
import { summaryMessage } from '../utils/chat-api';
import { fetchChatMessageByOffsetId, formateMessage2Summary } from '../utils/fetch-messages';

class RoomStorage {
  static get global() {
    return getGlobal();
  }

  public static getRoomLastFocusTime(chatId: string) {
    const roomAIData = localStorage.getItem('room-ai-data');
    return roomAIData ? JSON.parse(roomAIData)[chatId]?.lastFocusTime || 0 : 0;
  }

  public static getRoomLastSummaryId(chatId: string) {
    const roomAIData = localStorage.getItem('room-ai-data');
    return roomAIData ? JSON.parse(roomAIData)[chatId]?.lastSummaryId || 0 : 0;
  }

  public static getRoomUnreadCount(chatId: string) {
    const chat = selectChat(this.global, chatId);
    return chat ? chat.unreadCount || 0 : 0;
  }

  public static getRoomAIUnreadCount(chatId: string) {
    const roomAIData = localStorage.getItem('room-ai-data');
    return roomAIData ? JSON.parse(roomAIData)?.[chatId]?.unreadCount || 0 : 0;
  }

  public static getRoomAISummaryState(chatId: string) {
    const roomAIData = localStorage.getItem('room-ai-data');
    return roomAIData ? JSON.parse(roomAIData)?.[chatId]?.summaryState || false : false;
  }

  public static updateRoomAIData(chatId: string, type: string, value: any) {
    const roomAIData = localStorage.getItem('room-ai-data');
    const parsedData = roomAIData ? JSON.parse(roomAIData) : {};
    const currentData = parsedData[chatId] || {};
    currentData[type] = value;
    parsedData[chatId] = currentData;
    localStorage.setItem('room-ai-data', JSON.stringify(parsedData));
    if (type === 'unreadCount') {
      eventEmitter.emit(Actions.UpdateRoomAIUnreadCount, { chatId, count: value });
    } else if (type === 'summaryState') {
      eventEmitter.emit(Actions.UpdateRoomAISummaryState, { chatId, state: value });
    }
  }

  // 用户参与度数据存储方法
  public static getUserEngagementData(chatId: string): {
    messageCount: number;
    stayDuration: number;
    clickCount: number;
    lastActiveTime: number;
  } {
    const defaultData = {
      messageCount: 0,
      stayDuration: 0,
      clickCount: 0,
      lastActiveTime: 0,
    };
    const roomAIData = localStorage.getItem('room-ai-data');
    return roomAIData ? JSON.parse(roomAIData)?.[chatId]?.engagementData || defaultData : defaultData;
  }

  public static updateUserEngagementData(chatId: string, data: {
    messageCount?: number;
    stayDuration?: number;
    clickCount?: number;
    lastActiveTime?: number;
  }) {
    const currentData = this.getUserEngagementData(chatId);
    const updatedData = {
      ...currentData,
      ...data,
      lastActiveTime: data.lastActiveTime || Date.now(),
    };
    this.updateRoomAIData(chatId, 'engagementData', updatedData);
  }

  public static incrementMessageCount(chatId: string) {
    const currentData = this.getUserEngagementData(chatId);
    this.updateUserEngagementData(chatId, {
      messageCount: currentData.messageCount + 1,
    });
  }

  public static incrementClickCount(chatId: string) {
    const currentData = this.getUserEngagementData(chatId);
    this.updateUserEngagementData(chatId, {
      clickCount: currentData.clickCount + 1,
    });
  }

  public static addStayDuration(chatId: string, duration: number) {
    const currentData = this.getUserEngagementData(chatId);
    this.updateUserEngagementData(chatId, {
      stayDuration: currentData.stayDuration + duration,
    });
  }

  // 获取所有聊天的参与度数据，用于计算权重
  public static getAllEngagementData(): Record<string, {
    messageCount: number;
    stayDuration: number;
    clickCount: number;
    lastActiveTime: number;
  }> {
    const roomAIData = localStorage.getItem('room-ai-data');
    if (!roomAIData) return {};

    const parsedData = JSON.parse(roomAIData);
    const result: Record<string, any> = {};

    Object.keys(parsedData).forEach((chatId) => {
      if (parsedData[chatId]?.engagementData) {
        result[chatId] = parsedData[chatId].engagementData;
      }
    });

    return result;
  }

  public static increaseUnreadCount(chatId: string) {
    const count = this.getRoomAIUnreadCount(chatId) + 1;
    this.updateRoomAIData(chatId, 'unreadCount', count);
    eventEmitter.emit(Actions.UpdateRoomAIUnreadCount, { chatId, count });
  }

  public static async summary(chatId: string) {
    const { telyAiLanguage = 'en' } = this.global.settings.byKey;
    const lastFocusTime = this.getRoomLastFocusTime(chatId);
    const lastSummaryId = this.getRoomLastSummaryId(chatId);
    const unreadCount = this.getRoomUnreadCount(chatId);
    const lastMessageId = selectChatLastMessageId(this.global, chatId, 'all') || 0;
    if (unreadCount > 5 && lastMessageId - lastSummaryId > 5 && lastFocusTime < Date.now() - 1000 * 60 * 5) {
      const chat = selectChat(this.global, chatId);
      const summaryCount = Math.max(unreadCount, 20);
      if (chat) {
        // eslint-disable-next-line no-console
        console.log('开始总结');
        // 更新总结中的状态
        this.updateRoomAIData(chatId, 'summaryState', true);
        const messages = await fetchChatMessageByOffsetId({
          chat,
          offsetId: lastMessageId,
          addOffset: -1,
          sliceSize: 50,
          threadId: MAIN_THREAD_ID,
          maxCount: summaryCount,
        });
        const formateMessages = formateMessage2Summary(messages);
        if (!formateMessages.length) return;
        const summaryInfo = {
          summaryTime: new Date().getTime(),
          messageCount: formateMessages.length,
          userIds: Array.from(new Set(formateMessages.map((m) => m.senderId))),
        };
        summaryMessage({
          messages: formateMessages,
          language: new Intl.DisplayNames([telyAiLanguage], { type: 'language' }).of(telyAiLanguage),
        }).then((res: any) => {
          const content = {
            ...res.data,
            summaryInfo,
          };
          const newMessage: StoreMessage = {
            chatId,
            timestamp: new Date().getTime(),
            content: JSON.stringify(content),
            id: uuidv4(),
            createdAt: new Date(),
            role: 'teleai-system',
            type: AIMessageType.RoomSummary,
          };
          ChataiStores.message?.storeMessage(newMessage);
          eventEmitter.emit(Actions.AddRoomAIMessage, newMessage);
          this.increaseUnreadCount(chatId);
          this.updateRoomAIData(chatId, 'summaryState', false);
        }).catch((err) => {
          // eslint-disable-next-line no-console
          console.log(err);
          this.updateRoomAIData(chatId, 'summaryState', false);
        });
      }
    }
    this.updateRoomAIData(chatId, 'lastFocusTime', new Date().getTime());
  }
}

export default RoomStorage;
