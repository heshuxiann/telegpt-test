/* eslint-disable no-null/no-null */
import { getActions } from '../../../global';

import type { ApiMessage } from '../../../api/types/messages';

import { knowledgeEmbeddingStore } from '../vector-store';

const { updateDraftReplyInfo, sendMessage, clearDraft } = getActions();
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
            updateDraftReplyInfo({
              replyToMsgId: messageId, replyToPeerId: undefined,
            });
            setTimeout(() => {
              sendMessage({
                messageList: {
                  chatId,
                  threadId: -1,
                  type: 'thread',
                },
                text: result.metadata.answer,
              });
            });
            setTimeout(() => { clearDraft({ chatId, isLocalOnly: true }); });
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
