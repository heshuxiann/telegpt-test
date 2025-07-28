import eventEmitter, { Actions } from '../lib/EventEmitter';
import { aiChatFoldersTask } from '../ai-task/ai-chatfolders-task';
import { telegptSettings } from '../api/user-settings';
import { userInformationCollection } from '../utils/user-information-collection';
import AIChatFoldersStore from './ai-chatfolders-store';
import ChataiStoreManager from './chatai-store';
import ContactStore from './contact-store';
import FolderStore from './folder-store';
import GeneralStore from './general-store';
import KnowledgeStore from './knowledge-store';
import MessageStore from './messages-store';
import SummaryStore from './summary-store';
import UserPortraitMessageStore from './user-portrait-message-store';
import UserPortraitStore from './user-portrait-store';
import UsersStore from './user-store';
import { ChataiStores } from '.';

let currentUserId!: string;
const dbVersion = 19;
export function setChataiStoreBuilderCurrentUserId(_currentUserId: string) {
  if (_currentUserId && (!currentUserId || currentUserId !== _currentUserId)) {
    initChataiStores(_currentUserId);
    // 更新用户id,同步更新telegpt setting
    telegptSettings.userId = _currentUserId;
    telegptSettings.getGptSettings();
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
  ChataiStores.folder = new FolderStore(chataiStoreManager);
  ChataiStores.aIChatFolders = new AIChatFoldersStore(chataiStoreManager);
  ChataiStores.userPortrait = new UserPortraitStore(chataiStoreManager);
  ChataiStores.userPortraitMessage = new UserPortraitMessageStore(chataiStoreManager);
  eventEmitter.emit(Actions.ChatAIStoreReady);
  // init local user info
  userInformationCollection.initLocalInformation();

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
