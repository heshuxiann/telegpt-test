import { v4 as uuidv4 } from 'uuid';
import { getGlobal } from '../../../global';

import type { StoreMessage } from '../store/messages-store';
import { MAIN_THREAD_ID } from '../../../api/types';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { selectChat, selectChatLastMessageId } from '../../../global/selectors';
import { ChataiStores } from '../store';
import { summaryMessage } from '../utils/chat-api';
import { fetchChatMessageByOffsetId, formateMessage2Summary } from '../utils/fetch-messages';

class RoomAIAssistant {
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

  public static updateRoomAIData(chatId: string, type:string, value:any) {
    const roomAIData = localStorage.getItem('room-ai-data');
    const parsedData = roomAIData ? JSON.parse(roomAIData) : {};
    const currentData = parsedData[chatId] || {};
    currentData[type] = value;
    parsedData[chatId] = currentData;
    localStorage.setItem('room-ai-data', JSON.stringify(parsedData));
    if (type === 'unreadCount') {
      eventEmitter.emit(Actions.UpdateRoomAIUnreadCount, { chatId, count: value });
    }
  }

  public static increaseUnreadCount(chatId: string) {
    const count = this.getRoomAIUnreadCount(chatId) + 1;
    this.updateRoomAIData(chatId, 'unreadCount', count);
    eventEmitter.emit(Actions.UpdateRoomAIUnreadCount, { chatId, count });
  }

  public static async summary(chatId: string) {
    const lastFocusTime = RoomAIAssistant.getRoomLastFocusTime(chatId);
    const lastSummaryId = RoomAIAssistant.getRoomLastSummaryId(chatId);
    const unreadCount = RoomAIAssistant.getRoomUnreadCount(chatId);
    const lastMessageId = selectChatLastMessageId(this.global, chatId, 'all') || 0;
    if (unreadCount > 5 && lastMessageId - lastSummaryId > 5 && lastFocusTime < Date.now() - 1000 * 60 * 5) {
      // eslint-disable-next-line no-console
      console.log('开始总结');
      const chat = selectChat(this.global, chatId);
      const summaryCount = Math.max(unreadCount, 20);
      if (chat) {
        const messages = await fetchChatMessageByOffsetId({
          chat,
          offsetId: lastMessageId,
          addOffset: -1,
          sliceSize: 20,
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
        }).then((res:any) => {
          const content = {
            ...res.data,
            summaryInfo,
          };
          const newMessage = {
            chatId,
            timestamp: new Date().getTime(),
            content: JSON.stringify(content),
            id: uuidv4(),
            createdAt: new Date(),
            role: 'assistant',
            annotations: [{
              type: 'room-summary',
            }],
          };
          ChataiStores.message?.storeMessage(newMessage as StoreMessage);
          eventEmitter.emit(Actions.AddRoomAIMessage, newMessage);
          this.increaseUnreadCount(chatId);
        });
      }
    }
    this.updateRoomAIData(chatId, 'lastFocusTime', new Date().getTime());
  }
}

export default RoomAIAssistant;
