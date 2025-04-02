/* eslint-disable no-null/no-null */
export type StoreName = 'message' | 'contact' | 'user' | 'general';

type IndexConfig = [indexName: string, keyPath: string | string[]];

interface StoreConfig {
  keyPath?: string;
  autoIncrement?: boolean;
  indexes?: IndexConfig[];
}

type StoreConfigMap = Record<StoreName, StoreConfig>;

class ChataiDB {
  private DB_NAME: string;

  private VERSION: number;

  private db: IDBDatabase | null = null;

  private STORE_CONFIG:StoreConfigMap = {
    message: { keyPath: 'id', indexes: [['id', 'id'], ['chatId_timestamp', ['chatId', 'timestamp']]] },
    contact: { keyPath: 'id', autoIncrement: true },
    user: { keyPath: 'id', autoIncrement: true },
    general: { autoIncrement: true },
  };

  constructor(DB_NAME: string, VERSION: number) {
    this.DB_NAME = DB_NAME;
    this.VERSION = VERSION;
  }

  getDB(): Promise<IDBDatabase> {
    if (this.db) {
      return Promise.resolve(this.db); // 确保返回的是 Promise<IDBDatabase>
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);

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
  }

  // 获取事务
  protected getTransaction(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error('Database is not initialized');
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }
}

export default ChataiDB;
