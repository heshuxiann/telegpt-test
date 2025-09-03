/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
import type { StoreName } from './chatai-store';
import type ChataiDB from './chatai-store';

export interface TgStoreMessage {
  chatId: string;
  sender: string;
  messageId: number;
  content: string;
  chatType: 'private' | 'group';
  timestamp: number;
}

class TgMessageStore {
  private storeName: StoreName = 'tgMessage';

  private db: IDBDatabase | null = null;

  private chataiStoreManager: ChataiDB;

  constructor(private dbManager: ChataiDB) {
    this.db = dbManager.db;
    this.chataiStoreManager = dbManager;
  }

  async storeTgMessage(message: TgStoreMessage): Promise<void> {
    let db: IDBDatabase;
    try {
      db = await this.chataiStoreManager.getDB();
    } catch (error) {
      console.error('Error getting database:', error);
      return;
    }

    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    // 使用 messageId 作为唯一键
    const messageWithKey = { ...message, id: message.messageId };

    const request = store.put(messageWithKey);

    request.onsuccess = () => {
      console.log(`TG Message ${message.messageId} stored successfully`);
    };

    request.onerror = (event: Event) => {
      console.error(
        `Error storing TG message ${message.messageId}:`,
        (event.target as IDBRequest).error,
      );
    };
  }

  async storeTgMessages(messages: TgStoreMessage[]): Promise<void> {
    let db: IDBDatabase;
    try {
      db = await this.chataiStoreManager.getDB();
    } catch (error) {
      console.error('Error getting database:', error);
      return;
    }

    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    const promises = messages.map((message) => {
      return new Promise<void>((resolve, reject) => {
        const messageWithKey = { ...message, id: message.messageId };
        const request = store.put(messageWithKey);

        request.onsuccess = () => {
          console.log(`TG Message ${message.messageId} stored successfully`);
          resolve();
        };

        request.onerror = (event: Event) => {
          console.error(
            `Error storing TG message ${message.messageId}:`,
            (event.target as IDBRequest).error,
          );
          reject((event.target as IDBRequest).error);
        };
      });
    });

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Error storing multiple TG messages:', error);
    }
  }

  async getTgMessagesBySenderId(
    senderId: string,
    pageSize: number,
  ): Promise<{ messages: TgStoreMessage[]; hasMore: boolean }> {
    let db: IDBDatabase;
    try {
      db = await this.chataiStoreManager.getDB();
    } catch (error) {
      console.error('Error getting database:', error);
      return { messages: [], hasMore: false };
    }

    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    const messages: TgStoreMessage[] = [];

    return new Promise((resolve) => {
      const request = store.openCursor();
      let count = 0;

      request.onsuccess = (event: Event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor && count < pageSize) {
          const message = cursor.value as TgStoreMessage;

          // 过滤指定发送者的消息
          if (message.sender === senderId) {
            messages.push(message);
            count++;
          }

          cursor.continue();
        } else {
          // 按时间戳倒序排列（最新的在前）
          messages.sort((a, b) => b.timestamp - a.timestamp);
          const hasMore = count === pageSize;
          resolve({ messages, hasMore });
        }
      };

      request.onerror = () => {
        console.error('Error getting TG messages by senderId');
        resolve({ messages: [], hasMore: false });
      };
    });
  }

  async getTgMessagesBySenderIdAndChatId(
    senderId: string,
    chatId: string,
    pageSize: number,
  ): Promise<{ messages: TgStoreMessage[]; hasMore: boolean }> {
    let db: IDBDatabase;
    try {
      db = await this.chataiStoreManager.getDB();
    } catch (error) {
      console.error('Error getting database:', error);
      return { messages: [], hasMore: false };
    }

    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    const messages: TgStoreMessage[] = [];

    return new Promise((resolve) => {
      const request = store.openCursor();
      let count = 0;

      request.onsuccess = (event: Event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor && count < pageSize) {
          const message = cursor.value as TgStoreMessage;

          // 过滤指定发送者和聊天的消息
          if (message.sender === senderId && message.chatId === chatId) {
            messages.push(message);
            count++;
          }

          cursor.continue();
        } else {
          // 按时间戳倒序排列（最新的在前）
          messages.sort((a, b) => b.timestamp - a.timestamp);
          const hasMore = count === pageSize;
          resolve({ messages, hasMore });
        }
      };

      request.onerror = () => {
        console.error('Error getting TG messages by senderId and chatId');
        resolve({ messages: [], hasMore: false });
      };
    });
  }

  async getAllTgMessages(): Promise<TgStoreMessage[]> {
    let db: IDBDatabase;
    try {
      db = await this.chataiStoreManager.getDB();
    } catch (error) {
      console.error('Error getting database:', error);
      return [];
    }

    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        resolve(request.result as TgStoreMessage[]);
      };
      request.onerror = () => {
        console.error('Error getting all TG messages');
        resolve([]);
      };
    });
  }

  async deleteTgMessage(messageId: number): Promise<void> {
    let db: IDBDatabase;
    try {
      db = await this.chataiStoreManager.getDB();
    } catch (error) {
      console.error('Error getting database:', error);
      return;
    }

    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    const request = store.delete(messageId);

    request.onsuccess = () => {
      console.log(`TG Message ${messageId} deleted successfully`);
    };

    request.onerror = (event: Event) => {
      console.error(
        `Error deleting TG message ${messageId}:`,
        (event.target as IDBRequest).error,
      );
    };
  }
}

export default TgMessageStore;
