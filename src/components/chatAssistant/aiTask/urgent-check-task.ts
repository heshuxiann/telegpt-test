/* eslint-disable no-null/no-null */
import type { ApiMessage } from '../../../api/types/messages';

class UrgentCheckTask {
  private static instance: UrgentCheckTask | undefined;

  private pendingMessages: ApiMessage[] = [];

  private urgentChats: string[] = [];

  initTask() {
    setInterval(() => {
      this.checkUrgentMessage();
    }, 1000 * 10);
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

  checkUrgentMessage() {
    const messages = this.pendingMessages.map((item) => {
      return {
        chatId: item.chatId,
        senderId: item.senderId,
        messageId: item.id,
        content: item.content.text?.text,
        entities: item.content.text?.entities,
      };
    });
    this.clearPendingMessages();
  }

  updateUrgentMessage(message: ApiMessage) {
    this.pendingMessages.push(message);
  }

  addNewMessage(message: ApiMessage) {
    this.pendingMessages.push(message);
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
