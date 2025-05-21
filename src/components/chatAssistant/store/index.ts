/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-null/no-null */
import eventEmitter, { Actions } from "../lib/EventEmitter";
import ChataiStoreManager from "./chatai-store";
import SummaryTemplateStore from "./chatai-summary-template-store";
import ContactStore from "./contact-store";
import GeneralStore from "./general-store";
import KnowledgeStore from "./knowledge-store";
import MessageStore from "./messages-store";
import UrgentTopicStore from "./urgent-topic-store";
import UsersStore from "./user-store";

const dbVersion = 14;

export const GLOBAL_SUMMARY_LAST_TIME = "globalSummaryLastTime";
export const GLOBAL_SUMMARY_READ_TIME = "globalSummaryReadTime";

let currentUserId!: string;

let storeBuildState: boolean = false;

export const ChataiStores = {
  message: null as MessageStore | null,
  contact: null as ContactStore | null,
  user: null as UsersStore | null,
  general: null as GeneralStore | null,
  knowledge: null as KnowledgeStore | null,
  summaryTemplate: null as SummaryTemplateStore | null,
  urgentTopic: null as UrgentTopicStore | null,
};

export function setChataiStoreBuilderCurrentUserId(_currentUserId: string) {
  if (!currentUserId) {
    if (!storeBuildState) {
      initChataiStores(_currentUserId);
    }
  } else if (currentUserId != _currentUserId) {
    initChataiStores(_currentUserId);
  }
  currentUserId = _currentUserId;
}

export async function initChataiStores(_currentUserId: string) {
  storeBuildState = true;
  const dbName = `tt-chatai-${_currentUserId}`;
  const chataiStoreManager = new ChataiStoreManager(dbVersion, dbName);
  await chataiStoreManager.initDB();
  ChataiStores.message = new MessageStore(chataiStoreManager);
  ChataiStores.contact = new ContactStore(chataiStoreManager);
  ChataiStores.user = new UsersStore(chataiStoreManager);
  ChataiStores.general = new GeneralStore(chataiStoreManager);
  ChataiStores.knowledge = new KnowledgeStore(chataiStoreManager);
  ChataiStores.summaryTemplate = new SummaryTemplateStore(chataiStoreManager);
  ChataiStores.urgentTopic = new UrgentTopicStore(chataiStoreManager);
  eventEmitter.emit(Actions.ChatAIStoreReady);
  (window as any).downloadAllSummarys = () => {
    ChataiStores.message?.getAllMessages().then((res) => {
      const content = JSON.stringify(res);
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      // 3. 创建下载链接并触发点击
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "summarys.txt"; // 设置下载文件名
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    });
  };
  (window as any).ChataiMessageStore = ChataiStores.message;
}
