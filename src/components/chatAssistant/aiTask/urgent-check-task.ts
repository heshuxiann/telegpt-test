/* eslint-disable no-null/no-null */
import type { ApiMessage } from '../../../api/types/messages';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import generateChatgpt from '../lib/generate-chat';
import { getUrgentTopicPrompt } from '../prompt';
import { ChataiGeneralStore, ChataiUrgentTopicStore } from '../store';
import { URGENT_CHATS } from '../store/general-store';

class UrgentCheckTask {
  private static instance: UrgentCheckTask | undefined;

  private pendingMessages: ApiMessage[] = [];

  private urgentChats: string[] = [];

  initTask() {
    ChataiGeneralStore.get(URGENT_CHATS).then((res) => {
      this.urgentChats = res || [];
    });
    setInterval(() => {
      this.checkUrgentMessage();
    }, 1000 * 30);
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
    if (!this.pendingMessages.length) return;
    console.log('checkUrgentMessage', this.pendingMessages);
    const messages = this.pendingMessages.map((item) => {
      return {
        chatId: item.chatId,
        senderId: item.senderId,
        messageId: item.id,
        content: item.content.text?.text,
      };
    });
    ChataiUrgentTopicStore.getAllUrgentTopic().then((topics) => {
      const urgentPrompts = getUrgentTopicPrompt(topics);
      generateChatgpt({
        data: {
          messages: [
            {
              role: 'system',
              content: urgentPrompts,
              id: '1',
            },
            {
              role: 'user',
              content: `分析一下消息列表,获取符合描述的消息:
                ${JSON.stringify(messages)}
              `,
              id: '2',
            },
          ],
        },
        onResponse: (response) => {
          console.log('response', response);
          eventEmitter.emit(Actions.AddUrgentMessage, response);
        },
      });
    });
    this.clearPendingMessages();
  }

  updateUrgentChats(chats: string[]) {
    this.urgentChats = chats;
    this.pendingMessages = this.pendingMessages.filter((item) => chats.includes(item.chatId));
    console.log('checkUrgentMessage', this.pendingMessages);
  }

  addNewMessage(message: ApiMessage) {
    if (this.urgentChats.includes(message.chatId)) {
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
