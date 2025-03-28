import type { Message } from 'ai';

// import type { UIMessage } from 'ai';
import { CHAT_IDB_STORE } from './im-assistant-idb';

// // const isAuxiliary = (message:Message) => {
// //   // eslint-disable-next-line max-len
// //   return message?.annotations?.some((item) => item && typeof item === 'object' && 'isAuxiliary' in item && item.isAuxiliary === true) ?? false;
// // };
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
// interface Message extends UIMessage {
//   chatId: string;
// }

// export function formateMessage(chatId: string, messages: UIMessage[]): Message[] {
//   const copyMessages = JSON.parse(JSON.stringify(messages));
//   copyMessages.forEach((message: UIMessage) => {
//     (message as Message).chatId = chatId;
//   });
//   return copyMessages;
// }

// class MessageStorage {
//   private dbName: string;

//   private storeName: string;

//   // eslint-disable-next-line no-null/no-null
//   private db: IDBDatabase | null = null;

//   constructor(dbName: string = 'chat-ai-message', storeName: string = 'messages') {
//     this.dbName = dbName;
//     this.storeName = storeName;
//     this.openDb();
//   }

//   // 打开数据库
//   private openDb(): void {
//     const request = indexedDB.open(this.dbName, 1);

//     request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
//       const db = (event.target as IDBRequest).result;

//       if (!db.objectStoreNames.contains(this.storeName)) {
//         const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
//         store.createIndex('chatId', 'chatId', { unique: false });
//       }
//     };

//     request.onerror = (event: Event) => {
//       console.error('Database error:', (event.target as IDBRequest).error);
//     };

//     request.onsuccess = (event: Event) => {
//       this.db = (event.target as IDBRequest).result;
//       console.log('Database opened successfully');
//     };
//   }

//   // 存储消息
//   public storeMessage(message:Message): void {
//     if (!this.db) {
//       console.error('Database is not initialized yet');
//       return;
//     }

//     const transaction = this.db.transaction([this.storeName], 'readwrite');
//     const store = transaction.objectStore(this.storeName);

//     const request = store.put(message);

//     request.onsuccess = () => {
//       console.log('Message stored successfully');
//     };

//     request.onerror = (event: Event) => {
//       console.error('Error storing message:', (event.target as IDBRequest).error);
//     };
//   }

//   public storeMessages(messages: Message[]): void {
//     if (!this.db) {
//       console.error('Database is not initialized yet');
//       return;
//     }

//     const transaction = this.db.transaction([this.storeName], 'readwrite');
//     const store = transaction.objectStore(this.storeName);

//     messages.forEach((message) => {
//       const request = store.put(message);

//       request.onsuccess = () => {
//         console.log(`Message ${message.id} stored successfully`);
//       };

//       request.onerror = (event: Event) => {
//         console.error(`Error storing message ${message.id}:`, (event.target as IDBRequest).error);
//       };
//     });

//     transaction.oncomplete = () => {
//       console.log('All messages stored successfully');
//     };

//     transaction.onerror = (event: Event) => {
//       console.error('Error storing messages:', (event.target as IDBRequest).error);
//     };
//   }

//   // 获取单个消息
//   public getMessage(chatId: string, id: string): void {
//     if (!this.db) {
//       console.error('Database is not initialized yet');
//       return;
//     }

//     const transaction = this.db.transaction([this.storeName], 'readonly');
//     const store = transaction.objectStore(this.storeName);

//     const request = store.get(id);

//     request.onsuccess = (event: Event) => {
//       const message = (event.target as IDBRequest).result;
//       if (message && message.chatId === chatId) {
//         console.log('Message found:', message);
//       } else {
//         console.log('Message not found or chatId mismatch');
//       }
//     };

//     request.onerror = (event: Event) => {
//       console.error('Error fetching message:', (event.target as IDBRequest).error);
//     };
//   }

//   // 获取某个 chatId 下的所有消息
//   public getMessagesByChatId(chatId: string): void {
//     if (!this.db) {
//       console.error('Database is not initialized yet');
//       return;
//     }

//     const transaction = this.db.transaction([this.storeName], 'readonly');
//     const store = transaction.objectStore(this.storeName);
//     const index = store.index('chatId');

//     const request = index.openCursor(IDBKeyRange.only(chatId));

//     const messages: Message[] = [];

//     request.onsuccess = (event: Event) => {
//       const cursor = (event.target as IDBRequest).result;
//       if (cursor) {
//         messages.push(cursor.value);
//         cursor.continue();
//       } else {
//         console.log('Messages for chatId:', chatId, messages);
//       }
//     };

//     request.onerror = (event: Event) => {
//       console.error('Error fetching messages by chatId:', (event.target as IDBRequest).error);
//     };
//   }
// }

// const MessageStore = new MessageStorage();
// export default MessageStore;
