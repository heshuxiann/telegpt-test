import { getGlobal } from '../../../global';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { selectChat } from '../../../global/selectors';

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

  public static getRoomTranslateLanguage(chatId: string) {
    const roomAIData = localStorage.getItem('room-ai-data');
    return roomAIData ? JSON.parse(roomAIData)?.[chatId]?.translateLanguage || '' : '';
  }

  public static updateRoomTranslateLanguage(chatId: string, language: string) {
    const roomAIData = localStorage.getItem('room-ai-data');
    const data = roomAIData ? JSON.parse(roomAIData) : {};
    data[chatId] = {
      ...data[chatId],
      translateLanguage: language,
    };
    localStorage.setItem('room-ai-data', JSON.stringify(data));
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
}

export default RoomStorage;
