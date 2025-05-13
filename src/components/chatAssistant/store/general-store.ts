/* eslint-disable no-console */
// import { CONTACT_IDB_STORE } from './im-assistant-idb';

import type { StoreName } from './chatai-store';

import ChataiDB from './chatai-store';

export const SUMMARY_CHATS = 'summaryChats';
class GeneralStore extends ChataiDB {
  private storeName: StoreName = 'general';

  async get(key: string): Promise<any | undefined> {
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
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async set(key:string, value:any) {
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
      const request = store.put(value, key);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async delete(key:string) {
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
      const request = store.delete(key);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

export default GeneralStore;
