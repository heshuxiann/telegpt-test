/* eslint-disable */
import type { StoreName } from './chatai-store';
import type ChataiDB from './chatai-store';

export interface UserPortraitMessageInfo {
  id: string;
  senderId: string,
  time: string;
  timeRange: string;
  summaryTime: number;
  messageCount: number;
  chatGroups: {
    chatId: string;
    title: string;
    summaryItems: {
      content: string;
      relevantMessageIds: string[];
    }[]
  }[]
}

class UserPortraitMessageStore {
  private storeName: StoreName = 'userPortraitMessage';

  private db: IDBDatabase | null = null;

  private chataiStoreManager:ChataiDB;

  constructor(private dbManager: ChataiDB) {
    this.db = dbManager.db;
    this.chataiStoreManager = dbManager;
  }

  async getAllUserPortraitMessage(): Promise<any[]> {
    let db: IDBDatabase;
    try {
      db = await this.chataiStoreManager.getDB();
    } catch (error) {
      console.error('Error getting all aichatfolders:', error);
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    })
  }

  async searchMessageBySenderId(senderId: string): Promise<any | undefined> {
    let db: IDBDatabase;
    try {
      db = await this.chataiStoreManager.getDB();
    } catch (error) {
      console.error('Error get aichatfolder:', error);
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index('senderId');
      const request = index.getAll(senderId);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async deleteUserPortraitMessage(key:string) {
    let db: IDBDatabase;
    try {
      db = await this.chataiStoreManager.getDB();
    } catch (error) {
      console.error('Error deleting aichatfolder:', error);
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(key);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async addUserPortraitMessage(userPortraitMessage: UserPortraitMessageInfo) {
    let db: IDBDatabase;
    try {
      db = await this.chataiStoreManager.getDB();
    } catch (error) {
      console.error('Error adding aichatfolder:', error);
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(userPortraitMessage);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

export default UserPortraitMessageStore;
