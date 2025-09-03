import { getActions } from '../../../global';

import type { ApiDraft } from '../../../api/types';
import type { ApiMessage } from '../../../api/types/messages';

import { getBestKnowledgeMatch } from '../utils/knowledge-match';

class IntelligentReplyTask {
  private static instance: IntelligentReplyTask | undefined;

  private pendingMessages: ApiMessage[] = [];

  private timmer: NodeJS.Timeout | undefined;

  initTask() {
    if (this.timmer) {
      clearInterval(this.timmer);
    }
    this.timmer = setInterval(() => {
      this.intelligentResponse();
    }, 1000 * 30);
  }

  static getTextWithoutEntities(text: string, entities: any[]): string {
    const ranges = entities.map((entity) => ({ start: entity.offset, length: entity.length }));
    const sortedRanges = ranges.sort((a, b) => b.start - a.start);

    for (const { start, length } of sortedRanges) {
      text = text.slice(0, start) + text.slice(start + length);
    }
    return text;
  }

  intelligentResponse() {
    if (!this.pendingMessages) return;
    const messages = this.pendingMessages.map((item) => {
      return {
        chatId: item.chatId,
        senderId: item.senderId,
        messageId: item.id,
        content: item.content.text?.text,
        entities: item.content.text?.entities,
      };
    });
    messages.forEach(async (item) => {
      const {
        chatId, messageId, entities,
      } = item;
      let content = item.content || '';
      if (content) {
        if (entities && entities?.length > 0) {
          content = IntelligentReplyTask.getTextWithoutEntities(content, entities);
        }
        if (!content.trim()) {
          return;
        }
        const bestMatch = await getBestKnowledgeMatch(content);
        if (bestMatch && bestMatch.score > 0.8) {
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
            text: bestMatch.answer,
          });
          getActions().clearDraft({ chatId, isLocalOnly: true });
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
