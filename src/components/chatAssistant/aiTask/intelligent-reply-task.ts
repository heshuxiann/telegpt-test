/* eslint-disable no-null/no-null */
import { getActions } from '../../../global';

import type { ApiDraft } from '../../../api/types';
import type { ApiMessage } from '../../../api/types/messages';

import { knowledgeEmbeddingStore } from '../vector-store';

class IntelligentReplyTask {
  private static instance: IntelligentReplyTask | undefined;

  private pendingMessages: ApiMessage[] = [];

  constructor() {
    this.pendingMessages = [];
    this.initReplyTask();
  }

  initReplyTask() {
    setInterval(() => {
      if (this.pendingMessages.length) {
        this.intelligentResponse();
      }
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

  intelligentResponse() {
    const messages = this.pendingMessages.map((item) => {
      return {
        chatId: item.chatId,
        senderId: item.senderId,
        messageId: item.id,
        content: item.content.text?.text,
        entities: item.content.text?.entities,
      };
    });
    messages.map(async (item) => {
      const {
        chatId, messageId, entities,
      } = item;
      let content = item.content || '';
      if (content) {
        if (entities) {
          content = IntelligentReplyTask.getTextWithoutEntities(content, entities);
        }
        const vectorSearchResults = await knowledgeEmbeddingStore.similaritySearch({
          query: content,
          k: 1,
        });
        if (vectorSearchResults.similarItems) {
          const result:any = vectorSearchResults.similarItems[0];
          if (result && result.score > 0.8) {
            const threadId = -1; // Default to -1 for non-threaded messages
            const replyInfo = {
              type: 'message',
              replyToMsgId: messageId,
              replyToPeerId: undefined,
            };
            getActions().saveReplyDraft({
              chatId,
              threadId,
              draft: { replyInfo } as ApiDraft,
              isLocalOnly: true,
            });
            getActions().sendMessage({
              messageList: {
                chatId,
                threadId,
                type: 'thread',
              },
              text: result.metadata.answer,
            });
            getActions().clearDraft({ chatId, isLocalOnly: true });
          }
        }
      }
    });
    this.clearPendingMessages();
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
    if (!IntelligentReplyTask.instance) {
      IntelligentReplyTask.instance = new IntelligentReplyTask();
    }
    return IntelligentReplyTask.instance;
  }
}

export const intelligentReplyTask = IntelligentReplyTask.getInstance();
