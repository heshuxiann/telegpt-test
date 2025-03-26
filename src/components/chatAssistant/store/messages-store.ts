import type { Message } from 'ai';

import { CHAT_IDB_STORE } from './im-assistant-idb';

// const isAuxiliary = (message:Message) => {
//   // eslint-disable-next-line max-len
//   return message?.annotations?.some((item) => item && typeof item === 'object' && 'isAuxiliary' in item && item.isAuxiliary === true) ?? false;
// };
export const addMessage = (chatId:string, messages:Message[]) => {
  // const filterMessage = messages.filter((item) => !isAuxiliary(item));
  const uniqueArr = [...new Map(messages.map((item) => [item.id, item])).values()];
  CHAT_IDB_STORE.set(chatId, uniqueArr);
};
export const getMessage = (chatId: string):Promise<Message[] | undefined> => {
  return CHAT_IDB_STORE.get(chatId);
};

export const updateMessage = (chatId: string, updater: (oldValue: Message[] | undefined) => Message[]) => {
  CHAT_IDB_STORE.update(chatId, updater);
};
// import type { IDBPDatabase } from 'idb';
// import { openDB } from 'idb';

// class IndexedDBHelper {
//   private dbName: string;

//   private version: number;

//   private dbInstance: Promise<IDBPDatabase>;

//   constructor(dbName: string, version: number, stores: { name: string; options: IDBObjectStoreParameters }[]) {
//     this.dbName = dbName;
//     this.version = version;
//     this.dbInstance = this.initDB(stores);
//   }

//   private initDB(stores: { name: string; options: IDBObjectStoreParameters }[]) {
//     return openDB(this.dbName, this.version, {
//       upgrade(db) {
//         stores.forEach(({ name, options }) => {
//           if (!db.objectStoreNames.contains(name)) {
//             db.createObjectStore(name, options);
//           }
//         });
//       },
//     });
//   }

//   async put(storeName: string, value: any, key?: IDBValidKey) {
//     const db = await this.dbInstance;
//     return db.put(storeName, value, key);
//   }

//   async get(storeName: string, key: IDBValidKey) {
//     const db = await this.dbInstance;
//     return db.get(storeName, key);
//   }

//   async delete(storeName: string, key: IDBValidKey) {
//     const db = await this.dbInstance;
//     return db.delete(storeName, key);
//   }

//   async getAll(storeName: string) {
//     const db = await this.dbInstance;
//     return db.getAll(storeName);
//   }

//   /**
//    * 倒序分页查询
//    * @param storeName 存储的表名
//    * @param limit 限制返回的条数
//    * @param offset 跳过的条数（适用于分页）
//    */
//   async getWithCursorDesc(storeName: string, limit: number, offset: number = 0) {
//     const db = await this.dbInstance;
//     const tx = db.transaction(storeName, 'readonly');
//     const store = tx.objectStore(storeName);

//     const result: any[] = [];
//     let cursor = await store.openCursor(undefined, 'prev'); // 倒序遍历
//     let count = 0;

//     while (cursor) {
//       if (count >= offset) {
//         result.push(cursor.value);
//       }
//       if (result.length >= limit) break; // 取够 limit 条数据，停止查询
//       cursor = await cursor.continue();
//       count++;
//     }

//     return result;
//   }
// }

// // 创建 IndexedDB 实例
// const MessageStore = new IndexedDBHelper('chat-ai-messages', 1, [
//   { name: 'messages', options: { keyPath: 'id', autoIncrement: true } },
// ]);

// export default MessageStore;
