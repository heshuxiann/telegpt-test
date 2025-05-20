/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
import type { StoreName } from './chatai-store';
import type ChataiDB from './chatai-store';

interface UserInfo {
  id: string;
  name?: string;
  avatar?: string;
  phoneNumber?: string;
  tags?: string;
}
class ContactStore {
  private storeName: StoreName = 'contact';

  private db: IDBDatabase | null = null;

  private chataiStoreManager:ChataiDB;

  constructor(private dbManager: ChataiDB) {
    this.db = dbManager.db;
    this.chataiStoreManager = dbManager;
  }

  async getContact(id: string): Promise<UserInfo | undefined> {
    let db: IDBDatabase;
    try {
      db = await this.chataiStoreManager.getDB();
    } catch (error) {
      console.error('Error adding contact:', error);
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(id);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async addContact(contact: UserInfo) {
    let db: IDBDatabase;
    try {
      db = await this.chataiStoreManager.getDB();
    } catch (error) {
      console.error('Error adding contact:', error);
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(contact);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

export default ContactStore;
