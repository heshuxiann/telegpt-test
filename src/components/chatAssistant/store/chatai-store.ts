/* eslint-disable no-console */
import { getGlobal } from '../../../global';

/* eslint-disable no-null/no-null */
export type StoreName = 'message' | 'contact' | 'user' | 'general' | 'knowledge' | 'summaryTemplate';

type IndexConfig = [indexName: string, keyPath: string | string[]];

interface StoreConfig {
  keyPath?: string;
  autoIncrement?: boolean;
  indexes?: IndexConfig[];
}

type StoreConfigMap = Record<StoreName, StoreConfig>;

class ChataiDB {
  private DB_NAME: string | undefined;

  private USER_ID!: string;

  private VERSION: number;

  private db: IDBDatabase | null = null;

  private STORE_CONFIG:StoreConfigMap = {
    message: { keyPath: 'id', indexes: [['id', 'id'], ['chatId_timestamp', ['chatId', 'timestamp']]] },
    contact: { keyPath: 'id', autoIncrement: true },
    user: { keyPath: 'id', autoIncrement: true },
    general: { autoIncrement: true },
    knowledge: { keyPath: 'id', autoIncrement: true },
    summaryTemplate: { keyPath: 'id', autoIncrement: true },
  };

  constructor(VERSION: number) {
    this.VERSION = VERSION;
    this.initDB();
  }

  initDB() {
    // eslint-disable-next-line @typescript-eslint/quotes, no-console
    console.log("初始化indexdb", this.VERSION);
    const currentUserId = getGlobal().currentUserId;
    if (currentUserId) {
      const dbName = `tt-chatai-${currentUserId}`;
      this.DB_NAME = dbName;
      this.USER_ID = currentUserId;
      const request = indexedDB.open(dbName, this.VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // 遍历 STORE_CONFIG，确保所有表都被创建
        // if (db.objectStoreNames.contains('message')) {
        //   db.deleteObjectStore('message');
        //   // eslint-disable-next-line no-console
        //   console.log('messages 对象存储已删除');
        // }
        if (db.objectStoreNames.contains('knowledge')) {
          db.deleteObjectStore('knowledge');
          // eslint-disable-next-line no-console
          console.log('knowledge 对象存储已删除');
        }
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
      };

      // eslint-disable-next-line no-console
      request.onerror = () => console.log(new Error('Failed to open database'));
    }
  }

  getDB(): Promise<IDBDatabase> {
    const currentUserId = getGlobal().currentUserId;
    if (currentUserId) {
      if (currentUserId !== this.USER_ID || !this.db) {
        const dbName = `tt-chatai-${currentUserId}`;
        this.DB_NAME = dbName;
        this.USER_ID = currentUserId;
        return new Promise((resolve, reject) => {
          const request = indexedDB.open(dbName, this.VERSION);

          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            // 遍历 STORE_CONFIG，确保所有表都被创建
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
            resolve(this.db);
          };

          request.onerror = () => reject(new Error('Failed to open database'));
        });
      } else {
        return Promise.resolve(this.db); // 确保返回的是 Promise<IDBDatabase>
      }
    } else {
      console.log('User ID is not set');
      return Promise.reject();
    }
  }
}

export default ChataiDB;
