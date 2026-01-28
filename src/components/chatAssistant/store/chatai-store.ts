/* eslint-disable no-console */
/* eslint-disable no-null/no-null */

export type StoreName = 'message' | 'contact' | 'user' | 'general' | 'knowledge' | 'summaryTemplate' | 'urgentTopic' | 'summary' | 'folder' | 'aIChatFolders' | 'userPortrait' | 'userPortraitMessage' | 'tgMessage';

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

  private STORE_CONFIG: StoreConfigMap = {
    summary: { keyPath: 'id', indexes: [['id', 'id'], ['timestamp', 'timestamp']] },
    message: { keyPath: 'id', indexes: [['id', 'id'], ['chatId_timestamp', ['chatId', 'timestamp']]] },
    contact: { keyPath: 'id', autoIncrement: true },
    user: { keyPath: 'id', autoIncrement: true },
    general: { autoIncrement: true },
    knowledge: { keyPath: 'id', autoIncrement: true },
    summaryTemplate: { keyPath: 'id', autoIncrement: true },
    urgentTopic: { keyPath: 'id', autoIncrement: false },
    folder: { keyPath: 'title', autoIncrement: true },
    aIChatFolders: { keyPath: 'id', autoIncrement: true },
    userPortrait: { keyPath: 'id', autoIncrement: true },
    userPortraitMessage: { keyPath: 'id', indexes: [['senderId', 'senderId']] },
    tgMessage: { keyPath: 'id', indexes: [['chatId_timestamp', ['chatId', 'timestamp']]] },
  };

  constructor(VERSION: number, DB_NAME: string) {
    this.VERSION = VERSION;
    this.DB_NAME = DB_NAME;
  }

  initDB(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        // 版本 21: 清空 message 和 summary 表以适配新的 Message 类型
        if (oldVersion < 22) {
          console.log('[ChataiDB] Upgrading to v22: Clearing message and summary stores for new Message type');

          // 删除并重新创建 message store
          if (db.objectStoreNames.contains('message')) {
            db.deleteObjectStore('message');
            console.log('[ChataiDB] Deleted old message store');
          }

          // 删除并重新创建 summary store
          if (db.objectStoreNames.contains('summary')) {
            db.deleteObjectStore('summary');
            console.log('[ChataiDB] Deleted old summary store');
          }
        }

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

            console.log(`[ChataiDB] Created store: ${storeName}`);
          }
        });
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onerror = (err) => {
        console.error(err);
        reject(new Error('Failed to open database'));
      };
    });
  }

  async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      this.db = await this.initDB();
    }
    return this.db;
  }
}

export default ChataiStoreManager;
