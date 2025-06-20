import { getGlobal } from '../../../global';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { selectCurrentChat } from '../../../global/selectors';
import { GLOBAL_SUMMARY_CHATID } from '../variables';

export default class GlobalSummaryBadge {
  static chatId = GLOBAL_SUMMARY_CHATID;

  public static updateRoomData(type: string, value: any) {
    const chatId = this.chatId;
    const roomAIData = localStorage.getItem('room-ai-data');
    const parsedData = roomAIData ? JSON.parse(roomAIData) : {};
    const currentData = parsedData[chatId] || {};
    currentData[type] = value;
    parsedData[chatId] = currentData;
    localStorage.setItem('room-ai-data', JSON.stringify(parsedData));
    if (type === 'unreadCount') {
      eventEmitter.emit(Actions.UpdateRoomAIUnreadCount, {
        chatId,
        count: value,
      });
    }
  }

  public static getUnreadCount() {
    const roomAIData = localStorage.getItem('room-ai-data');
    return roomAIData
      ? JSON.parse(roomAIData)?.[this.chatId]?.unreadCount || 0
      : 0;
  }

  public static increaseUnreadCount() {
    const global = getGlobal();
    const chat = selectCurrentChat(global);
    if (chat?.id !== this.chatId) {
      const count = this.getUnreadCount() + 1;
      this.updateRoomData('unreadCount', count);
    }
  }
}
