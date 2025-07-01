/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
import type { StoreName } from './chatai-store';
import type ChataiDB from './chatai-store';

export interface UrgentTopic {
  id: string;
  topicName: string;
  topicDescription: string;
  strongAlert: boolean;
  phoneNumber: string;
}

class UrgentTopicStore {
  private storeName: StoreName = 'urgentTopic';

  private db: IDBDatabase | null = null;

  private chataiStoreManager:ChataiDB;

  constructor(private dbManager: ChataiDB) {
    this.db = dbManager.db;
    this.chataiStoreManager = dbManager;
  }

  async getAllUrgentTopic(): Promise<UrgentTopic[]> {
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
      const request = store.getAll();
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getUrgentTopic(id: string): Promise<UrgentTopic> {
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

  async deleteUrgentTopic(id: string):Promise<void> {
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
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log(`Deleted record with key: ${id}`);
        resolve();
      };
      request.onerror = () => reject(new Error('Failed to delete record'));
    });
  }

  async addUrgentTopic(urgentTopic:UrgentTopic) {
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
      const request = store.put(urgentTopic);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async addUrgentTopics(urgentTopics: UrgentTopic[]): Promise<void> {
    let db: IDBDatabase;
    try {
      db = await this.chataiStoreManager.getDB();
    } catch (error) {
      console.error('Error adding contact:', error);
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      urgentTopics.forEach((urgentTopic) => {
        const request = store.put(urgentTopic);

        request.onsuccess = () => {
          console.log(`urgentTopic ${urgentTopic.id} stored successfully`);
        };

        request.onerror = (event: Event) => {
          console.error(
            `Error storing urgentTopic ${urgentTopic.id}:`,
            (event.target as IDBRequest).error,
          );
        };
      });

      transaction.oncomplete = () => {
        console.log('All urgentTopics stored successfully');
        resolve();
      };

      transaction.onerror = (event: Event) => {
        console.error(
          'Error storing urgentTopics:',
          (event.target as IDBRequest).error,
        );
        reject((event.target as IDBRequest).error);
      };
    });
  }
}

export default UrgentTopicStore;
