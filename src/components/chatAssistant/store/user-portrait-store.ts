/* eslint-disable */
import type { StoreName } from './chatai-store';
import type ChataiDB from './chatai-store';

export interface UserPortraitInfo {
  id: string;
  lastMsgId?: number;
  langs?: string[];
  tags?: string[];
  chatCount?: number;
  chatIds?: string[];
}

class UserPortraitStore {
  private storeName: StoreName = 'userPortrait';

  private db: IDBDatabase | null = null;

  private chataiStoreManager:ChataiDB;

  constructor(private dbManager: ChataiDB) {
    this.db = dbManager.db;
    this.chataiStoreManager = dbManager;
  }

  async getUserPortrait(key: string): Promise<any | undefined> {
    let db: IDBDatabase;
    try {
      db = await this.chataiStoreManager.getDB();
    } catch (error) {
      console.error('Error get userPortrait:', error);
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async deleteUserPortrait(key:string) {
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

  async addUserPortrait(userPortrait: UserPortraitInfo) {
    let db: IDBDatabase;
    try {
      db = await this.chataiStoreManager.getDB();
    } catch (error) {
      console.error('Error adding userPortrait:', error);
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(userPortrait);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

export default UserPortraitStore;
