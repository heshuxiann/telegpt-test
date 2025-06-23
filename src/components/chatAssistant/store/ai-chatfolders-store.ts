
import type { StoreName } from './chatai-store';
import type ChataiDB from './chatai-store';

interface AIChatFoldersInfo {}

class AIChatFoldersStore {
  private storeName: StoreName = 'aIChatFolders';

  private db: IDBDatabase | null = null;

  private chataiStoreManager:ChataiDB;

  constructor(private dbManager: ChataiDB) {
    this.db = dbManager.db;
    this.chataiStoreManager = dbManager;
  }

  async getAllAIChatFolders(): Promise<any[]> {
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

  async getAIChatFolder(key: string): Promise<any | undefined> {
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
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async deleteAIChatFolder(key:string) {
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

  async addAIChatFolder(aiChatFolder: AIChatFoldersInfo) {
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
      const request = store.put(aiChatFolder);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

export default AIChatFoldersStore;
