/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
import type { Message, UIMessage } from 'ai';

interface StoreMessage extends Message {
  chatId: string;
  timestamp: number;
}
// import { CHAT_IDB_STORE } from './im-assistant-idb';

// // const isAuxiliary = (message:Message) => {
// //   // eslint-disable-next-line max-len
// //   return message?.annotations?.some((item) => item && typeof item === 'object' && 'isAuxiliary' in item && item.isAuxiliary === true) ?? false;
// // };
// export const addMessage = (chatId:string, messages:Message[]) => {
//   // const filterMessage = messages.filter((item) => !isAuxiliary(item));
//   const uniqueArr = [...new Map(messages.map((item) => [item.id, item])).values()];
//   CHAT_IDB_STORE.set(chatId, uniqueArr);
// };
// export const getMessage = (chatId: string):Promise<Message[] | undefined> => {
//   return CHAT_IDB_STORE.get(chatId);
// };

// export const updateMessage = (chatId: string, updater: (oldValue: Message[] | undefined) => Message[]) => {
//   CHAT_IDB_STORE.update(chatId, updater);
// };
// interface Message extends UIMessage {
//   chatId: string;
// }

// export function formateMessage(chatId: string, messages: UIMessage[]): Message[] {
//   const copyMessages = JSON.parse(JSON.stringify(messages));
//   copyMessages.forEach((message: UIMessage) => {
//     (message as Message).chatId = chatId;
//   });
//   return copyMessages;
// }

class MessageStore {
  // eslint-disable-next-line no-null/no-null
  private static db: IDBDatabase | null = null;

  private static DB_NAME = 'chat-ai-message';

  private static STORE_NAME = 'messages';

  private static VERSION = 1;

  /** 📌 获取数据库实例（单例模式） */
  static getDB(): Promise<IDBDatabase> {
    if (this.db) {
      return Promise.resolve(this.db); // 确保返回的是 Promise<IDBDatabase>
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });

          // 🔥 创建索引（支持多列查询）
          store.createIndex('id', 'id', { unique: false });
          store.createIndex('chatId_timestamp', ['chatId', 'timestamp'], { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => reject(new Error('Failed to open database'));
    });
  }

  static async storeMessages(messages: StoreMessage[]): Promise<void> {
    const db = await this.getDB();

    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);

    messages.forEach((message) => {
      const request = store.put(message);

      request.onsuccess = () => {
        console.log(`Message ${message.id} stored successfully`);
      };

      request.onerror = (event: Event) => {
        console.error(`Error storing message ${message.id}:`, (event.target as IDBRequest).error);
      };
    });

    transaction.oncomplete = () => {
      console.log('All messages stored successfully');
    };

    transaction.onerror = (event: Event) => {
      console.error('Error storing messages:', (event.target as IDBRequest).error);
    };
  }

  /** 📌 分页查询某个房间的消息（按 `time` 倒序） */
  static async getMessages(
    chatId: string,
    lastTime: number | undefined,
    pageSize: number,
  ): Promise<{ messages: any[]; lastTime: number | undefined }> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const index = store.index('chatId_timestamp');

      // 🔥 查询指定房间的消息，按 `time` 倒序
      const range = lastTime !== undefined
        ? IDBKeyRange.bound([chatId, 0], [chatId, lastTime], false, true) // 限制 chatId，从 lastTime 之前查
        : IDBKeyRange.bound([chatId, 0], [chatId, Number.MAX_SAFE_INTEGER]); // 查询全部

      const request = index.openCursor(range, 'prev'); // 🔥 逆序取数据
      const messages: any[] = [];
      let count = 0;
      let newLastTime: number | undefined;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && count < pageSize) {
          messages.unshift(cursor.value);
          newLastTime = cursor.value.time; // 记录最后一条的时间
          count++;
          cursor.continue();
        } else {
          resolve({ messages, lastTime: newLastTime });
        }
      };

      request.onerror = () => reject(new Error('Failed to fetch messages'));
    });
  }
}

export function parseMessage2StoreMessage(chatId: string, messages: Message[]):StoreMessage[] {
  const copyedMessages = JSON.parse(JSON.stringify(messages));
  copyedMessages.forEach((message:Message) => {
    (message as StoreMessage).chatId = chatId;
    (message as StoreMessage).timestamp = new Date(message.createdAt as Date).getTime();
  });
  return copyedMessages as StoreMessage[];
}

export function parseStoreMessage2Message(messages: StoreMessage[]):Message[] {
  const copyedMessages = JSON.parse(JSON.stringify(messages));
  copyedMessages.forEach((message:StoreMessage) => {
    delete (message as any).chatId;
    delete (message as any).timestamp;
  });
  return copyedMessages as Message[];
}

export default MessageStore;
