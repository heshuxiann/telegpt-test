/* eslint-disable no-null/no-null */
import { getActions } from '../../global';

import type { ApiMessage } from '../../api/types/messages';

import eventEmitter, { Actions } from './lib/EventEmitter';
import { getIntelligentReplyByKnowledgePrompt } from './prompt';
import { ChataiKnowledgelStore } from './store';

export default function initGlobalAITask() {
  const pendingMessages: ApiMessage[] = [];
  eventEmitter.on(Actions.AddNewMessageToAiAssistant, (data: { message: ApiMessage }) => {
    const { message } = data;
    // eslint-disable-next-line no-console
    console.log('收到新消息', message);
    pendingMessages.push(message);
  });
  setInterval(() => {
    // eslint-disable-next-line no-console
    console.log('pendingMessages', pendingMessages);
  }, 1000);
}
interface ChatProps {
  data: any;
  onResponse: (message: string) => void;
  onFinish?: () => void;
}
const generateChatgpt = (props:ChatProps) => {
  fetch(`https://sdm-ai-api.vercel.app/generate?options=${JSON.stringify({ temperature: 0 })}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(props.data),
  }).then((res) => res.json())
    .then((res) => {
      props.onResponse(res.text);
    });
};

const extractContent = (content: string) => {
  const regex = /<!--\s*json-start\s*-->([\s\S]*?)<!--\s*json-end\s*-->/s;
  const match = content.match(regex);
  if (match) {
    try {
      const result = JSON.parse(match[1].trim());
      return result;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('JSON 解析错误:', error);
      return null;
    }
  }
  return null;
};

class GlobalAITask {
  private static instance: GlobalAITask | undefined;

  private knowledgeData: string = '';

  private pendingMessages: ApiMessage[] = [];

  constructor() {
    this.knowledgeData = '';
    this.pendingMessages = [];
    this.initAIKnowledgeBase();
    this.initReplyTask();
  }

  initReplyTask() {
    setInterval(() => {
      // eslint-disable-next-line no-console
      console.log('pendingMessages', this.pendingMessages);
      if (this.pendingMessages.length && this.knowledgeData) {
        this.intelligentResponse();
      }
    }, 1000);
  }

  initAIKnowledgeBase():Promise<string> {
    return new Promise(() => {
      let knowledgeData:string = '';
      ChataiKnowledgelStore.getAllKnowledge().then((knowledge) => {
        if (knowledge) {
          knowledge.forEach((item) => {
            knowledgeData += `${item.content}\n`;
          });
        }
        this.knowledgeData = knowledgeData;
      });
    });
  }

  updateKnowledgeData() {
    // eslint-disable-next-line no-console
    console.log('更新知识库');
    this.initAIKnowledgeBase();
  }

  async getKnowledgeData() {
    if (!this.knowledgeData) {
      this.knowledgeData = await this.initAIKnowledgeBase();
    }
    return this.knowledgeData;
  }

  async intelligentResponse() {
    let knowledgeData: string = '';
    if (this.knowledgeData) {
      knowledgeData = this.knowledgeData;
    } else {
      knowledgeData = await this.getKnowledgeData();
    }
    const messages = this.pendingMessages.map((item) => {
      return {
        chatId: item.chatId,
        senderId: item.senderId,
        messageId: item.id,
        content: item.content.text?.text,
      };
    });
    if (!messages.length || !knowledgeData) {
      return;
    }
    const prompt = getIntelligentReplyByKnowledgePrompt(knowledgeData);
    this.clearPendingMessages();
    generateChatgpt({
      data: {
        messages: [
          {
            role: 'system',
            content: prompt,
            id: '1',
          }, {
            role: 'user',
            content: `${JSON.stringify(messages)}\n你需要根据知识库回答用户的问题`,
          },
        ],
      },
      onResponse: (message) => {
        // eslint-disable-next-line no-console
        console.log('收到AI回复消息', message);
        const replyMessageList = extractContent(message);
        if (replyMessageList.length) {
          replyMessageList.forEach((item:any) => {
            if (item && item.chatId && item.messageId && item.replyContent) {
              const { chatId, messageId, replyContent } = item;
              const { updateDraftReplyInfo, sendMessage, clearDraft } = getActions();
              updateDraftReplyInfo({
                replyToMsgId: messageId,
                replyToPeerId: undefined,
                chatId,
              });
              sendMessage({
                messageList: {
                  chatId,
                  threadId: -1,
                  type: 'thread',
                },
                text: replyContent,
              });
              clearDraft({ chatId, isLocalOnly: true });
            }
          });
        }
      },
    });
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
    if (!GlobalAITask.instance) {
      GlobalAITask.instance = new GlobalAITask();
    }
    return GlobalAITask.instance;
  }
}

export const globalAITask = GlobalAITask.getInstance();
