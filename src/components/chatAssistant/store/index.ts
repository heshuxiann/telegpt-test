/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-null/no-null */
import eventEmitter, { Actions } from '../lib/EventEmitter';
// eslint-disable-next-line import/no-cycle
import { aiChatFoldersTask } from '../ai-task/ai-chatfolders-task';
import telegptSettings from '../api/user-settings';
import AIChatFoldersStore from './ai-chatfolders-store';
import ChataiStoreManager from './chatai-store';
import SummaryTemplateStore from './chatai-summary-template-store';
import ContactStore from './contact-store';
import FolderStore from './folder-store';
import GeneralStore from './general-store';
import KnowledgeStore from './knowledge-store';
import MessageStore from './messages-store';
import SummaryStore from './summary-store';
import UrgentTopicStore from './urgent-topic-store';
import UserPortraitMessageStore from './user-portrait-message-store';
import UserPortraitStore from './user-portrait-store';
import UsersStore from './user-store';

const dbVersion = 19;

export const GLOBAL_SUMMARY_LAST_TIME = 'globalSummaryLastTime';
export const GLOBAL_AICHATFOLDERS_LAST_TIME = 'globalAiChatFoldersLastTime';
export const GLOBAL_AICHATFOLDERS_TIP_SHOW = 'globalAiChatFoldersTipShow';
export const GLOBAL_PRESET_TAG = 'globalPresetTag';
export const GLOBAL_AI_TAG = 'globalAITag';

let currentUserId!: string;

export const ChataiStores = {
  summary: null as SummaryStore | null,
  message: null as MessageStore | null,
  contact: null as ContactStore | null,
  user: null as UsersStore | null,
  general: null as GeneralStore | null,
  knowledge: null as KnowledgeStore | null,
  summaryTemplate: null as SummaryTemplateStore | null,
  urgentTopic: null as UrgentTopicStore | null,
  folder: null as FolderStore | null,
  aIChatFolders: null as AIChatFoldersStore | null,
  userPortrait: null as UserPortraitStore | null,
  userPortraitMessage: null as UserPortraitMessageStore | null,
};

export function setChataiStoreBuilderCurrentUserId(_currentUserId: string) {
  if (_currentUserId && (!currentUserId || currentUserId !== _currentUserId)) {
    initChataiStores(_currentUserId);
    // 更新用户id,同步更新telegpt setting
    telegptSettings.userId = _currentUserId;
    telegptSettings.initGptSettings();
  }
  currentUserId = _currentUserId;
}

export async function initChataiStores(_currentUserId: string) {
  const dbName = `tt-chatai-${_currentUserId}`;
  const chataiStoreManager = new ChataiStoreManager(dbVersion, dbName);
  await chataiStoreManager.initDB();
  ChataiStores.summary = new SummaryStore(chataiStoreManager);
  ChataiStores.message = new MessageStore(chataiStoreManager);
  ChataiStores.contact = new ContactStore(chataiStoreManager);
  ChataiStores.user = new UsersStore(chataiStoreManager);
  ChataiStores.general = new GeneralStore(chataiStoreManager);
  ChataiStores.knowledge = new KnowledgeStore(chataiStoreManager);
  ChataiStores.summaryTemplate = new SummaryTemplateStore(chataiStoreManager);
  ChataiStores.urgentTopic = new UrgentTopicStore(chataiStoreManager);
  ChataiStores.folder = new FolderStore(chataiStoreManager);
  ChataiStores.aIChatFolders = new AIChatFoldersStore(chataiStoreManager);
  ChataiStores.userPortrait = new UserPortraitStore(chataiStoreManager);
  ChataiStores.userPortraitMessage = new UserPortraitMessageStore(chataiStoreManager);
  eventEmitter.emit(Actions.ChatAIStoreReady);

  // init ai chat folders task
  aiChatFoldersTask.initTask();

  (window as any).downloadAllSummarys = () => {
    ChataiStores.message?.getAllMessages().then((res) => {
      const content = JSON.stringify(res);
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      // 3. 创建下载链接并触发点击
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'summarys.txt'; // 设置下载文件名
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    });
  };
  (window as any).ChataiMessageStore = ChataiStores.message;
}
