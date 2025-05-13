/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
import type { Message } from 'ai';

import type { StoreName } from './chatai-store';

import ChataiDB from './chatai-store';

export interface StoreMessage extends Message {
  chatId: string;
  timestamp: number;
}
class MessageStore extends ChataiDB {
  private storeName: StoreName = 'message';

  async storeMessage(message: StoreMessage): Promise<void> {
    let db: IDBDatabase;
    try {
      db = await this.getDB();
    } catch (error) {
      console.error('Error adding contact:', error);
      return;
    }

    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    const request = store.put(message);

    request.onsuccess = () => {
      console.log(`Message ${message.id} stored successfully`);
    };

    request.onerror = (event: Event) => {
      console.error(
        `Error storing message ${message.id}:`,
        (event.target as IDBRequest).error,
      );
    };
  }

  async storeMessages(messages: StoreMessage[]): Promise<void> {
    let db: IDBDatabase;
    try {
      db = await this.getDB();
    } catch (error) {
      console.error('Error adding contact:', error);
      return;
    }

    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    messages.forEach((message) => {
      const request = store.put(message);

      request.onsuccess = () => {
        console.log(`Message ${message.id} stored successfully`);
      };

      request.onerror = (event: Event) => {
        console.error(
          `Error storing message ${message.id}:`,
          (event.target as IDBRequest).error,
        );
      };
    });

    transaction.oncomplete = () => {
      console.log('All messages stored successfully');
    };

    transaction.onerror = (event: Event) => {
      console.error(
        'Error storing messages:',
        (event.target as IDBRequest).error,
      );
    };
  }

  /** 📌 分页查询某个房间的消息（按 `time` 倒序） */
  async getMessages(
    chatId: string,
    lastTime: number | undefined,
    pageSize: number,
  ): Promise<{ messages: any[]; lastTime: number | undefined ;hasMore:boolean }> {
    let db: IDBDatabase;
    try {
      db = await this.getDB();
    } catch (error) {
      console.error('Error adding contact:', error);
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
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
          newLastTime = cursor.value.timestamp; // 记录最后一条的时间
          count++;
          cursor.continue();
        } else {
          resolve({ messages, lastTime: newLastTime, hasMore: count === pageSize });
        }
      };

      request.onerror = () => reject(new Error('Failed to fetch messages'));
    });
  }

  async getAllMessages(): Promise<StoreMessage[]> {
    let db: IDBDatabase;
    try {
      db = await this.getDB();
    } catch (error) {
      console.error('Error adding contact:', error);
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => reject(new Error('Failed to fetch messages'));
    });
  }

  async delMessage(id: string): Promise<void> {
    let db: IDBDatabase;
    try {
      db = await this.getDB();
    } catch (error) {
      console.error('Error adding contact:', error);
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`Deleted record with key: ${id}`);
        resolve();
      };
      request.onerror = () => reject(new Error('Failed to delete record'));
    });
  }
}

export function parseMessage2StoreMessage(
  chatId: string,
  messages: Message[],
): StoreMessage[] {
  const copyedMessages = JSON.parse(JSON.stringify(messages));
  copyedMessages.forEach((message: Message) => {
    (message as StoreMessage).chatId = chatId;
    (message as StoreMessage).timestamp = new Date(
      message.createdAt as Date,
    ).getTime();
  });
  return copyedMessages as StoreMessage[];
}

export function parseStoreMessage2Message(messages: StoreMessage[]): Message[] {
  const copyedMessages = JSON.parse(JSON.stringify(messages));
  copyedMessages.forEach((message: StoreMessage) => {
    delete (message as any).chatId;
    delete (message as any).timestamp;
  });
  return copyedMessages as Message[];
}

export default MessageStore;
