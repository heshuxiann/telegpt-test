/* eslint-disable no-null/no-null */
import type { ApiMessage } from '../../../api/types/messages';

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

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  tags?: string[];
}

class UserPortraitTask {
  private static instance: UserPortraitTask | undefined;

  private contacts:Contact[] = [];

  private pendingMessages: ApiMessage[] = [];

  constructor() {
    this.contacts = [];
    this.pendingMessages = [];
    this.initReplyTask();
  }

  initReplyTask() {
    setInterval(() => {
      if (this.pendingMessages.length && this.contacts.length) {
        this.generateUserPortrait();
      }
    }, 1000 * 60);
  }

  generateUserPortrait() {
    const messages = this.pendingMessages.map((item) => {
      return {
        chatId: item.chatId,
        senderId: item.senderId,
        messageId: item.id,
        content: item.content.text?.text,
      };
    });
    if (!messages.length) {
      return;
    }
    this.clearPendingMessages();
    generateChatgpt({
      data: {
        messages: [
          {
            role: 'system',
            content: '',
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
        // eslint-disable-next-line no-console
        console.log('replyMessageList', replyMessageList);
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
    if (!UserPortraitTask.instance) {
      UserPortraitTask.instance = new UserPortraitTask();
    }
    return UserPortraitTask.instance;
  }
}

export const userPortraitTask = UserPortraitTask.getInstance();
