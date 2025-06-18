/* eslint-disable max-len */
/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
export type StoreName = 'message' | 'contact' | 'user' | 'general' | 'knowledge' | 'summaryTemplate' | 'urgentTopic' | 'summary' | 'folder' | 'chatClassify';

type IndexConfig = [indexName: string, keyPath: string | string[]];

interface StoreConfig {
  keyPath?: string;
  autoIncrement?: boolean;
  indexes?: IndexConfig[];
}

type StoreConfigMap = Record<StoreName, StoreConfig>;

class ChataiStoreManager {
  private DB_NAME: string;

  private VERSION: number;

  public db: IDBDatabase | null = null;

  private STORE_CONFIG:StoreConfigMap = {
    summary: { keyPath: 'id', indexes: [['id', 'id'], ['timestamp', 'timestamp']] },
    message: { keyPath: 'id', indexes: [['id', 'id'], ['chatId_timestamp', ['chatId', 'timestamp']]] },
    contact: { keyPath: 'id', autoIncrement: true },
    user: { keyPath: 'id', autoIncrement: true },
    general: { autoIncrement: true },
    knowledge: { keyPath: 'id', autoIncrement: true },
    summaryTemplate: { keyPath: 'id', autoIncrement: true },
    urgentTopic: { keyPath: 'id', autoIncrement: false },
    folder: { keyPath: 'title', autoIncrement: true },
    chatClassify: { keyPath: 'id', autoIncrement: true }
  };

  constructor(VERSION: number, DB_NAME: string) {
    this.VERSION = VERSION;
    this.DB_NAME = DB_NAME;
  }

  initDB(): Promise<IDBDatabase> {
    // eslint-disable-next-line @typescript-eslint/quotes, no-console
    console.log("初始化indexdb", this.VERSION);
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // 遍历 STORE_CONFIG，确保所有表都被创建
        if (db.objectStoreNames.contains('message')) {
          db.deleteObjectStore('message');
          // eslint-disable-next-line no-console
          console.log('messages 对象存储已删除');
        }
        // if (db.objectStoreNames.contains('urgentTopic')) {
        //   db.deleteObjectStore('urgentTopic');
        //   // eslint-disable-next-line no-console
        //   console.log('urgentTopic 对象存储已删除');
        // }
        Object.entries(this.STORE_CONFIG).forEach(([storeName, config]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName,
              { keyPath: config.keyPath, autoIncrement: config.autoIncrement });

            if (config.indexes) {
              config.indexes.forEach(([indexName, keyPath]) => {
                store.createIndex(indexName, keyPath, { unique: false });
              });
            }
          }
        });
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      // eslint-disable-next-line no-console
      request.onerror = () => reject(new Error('Failed to open database'));
    });
  }

  async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      this.db = await this.initDB();
    }
    return this.db!;
  }
}

export default ChataiStoreManager;
