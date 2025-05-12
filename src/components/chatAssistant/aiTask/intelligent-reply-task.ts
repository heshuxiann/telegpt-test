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
    }, 1000 * 60);
  }

  intelligentResponse() {
    const messages = this.pendingMessages.map((item) => {
      return {
        chatId: item.chatId,
        senderId: item.senderId,
        messageId: item.id,
        content: item.content.text?.text,
      };
    });
    messages.map(async (item) => {
      const { content, chatId, messageId } = item;
      if (content) {
        const vectorSearchResults = await knowledgeEmbeddingStore.similaritySearch({
          query: content,
          k: 1,
        });
        if (vectorSearchResults.similarItems) {
          const result:any = vectorSearchResults.similarItems[0];
          if (result.score > 0.8) {
            updateDraftReplyInfo({
              replyToMsgId: messageId, replyToPeerId: undefined, quoteText: undefined, quoteOffset: undefined,
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
              clearDraft({ chatId, isLocalOnly: true });
            });
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
