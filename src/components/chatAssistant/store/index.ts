/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-null/no-null */

// eslint-disable-next-line import/no-cycle

import type AIChatFoldersStore from './ai-chatfolders-store';
import type ContactStore from './contact-store';
import type FolderStore from './folder-store';
import type GeneralStore from './general-store';
import type KnowledgeStore from './knowledge-store';
import type MessageStore from './messages-store';
import type SummaryStore from './summary-store';
import type UserPortraitMessageStore from './user-portrait-message-store';
import type UserPortraitStore from './user-portrait-store';
import type UsersStore from './user-store';

export const GLOBAL_SUMMARY_LAST_TIME = 'globalSummaryLastTime';
export const GLOBAL_AICHATFOLDERS_LAST_TIME = 'globalAiChatFoldersLastTime';
export const GLOBAL_AICHATFOLDERS_TIP_SHOW = 'globalAiChatFoldersTipShow';
export const GLOBAL_PRESET_TAG = 'globalPresetTag';
export const GLOBAL_AI_TAG = 'globalAITag';
export const USER_INFORMATION = 'userInformation';

export const ChataiStores = {
  summary: null as SummaryStore | null,
  message: null as MessageStore | null,
  contact: null as ContactStore | null,
  user: null as UsersStore | null,
  general: null as GeneralStore | null,
  knowledge: null as KnowledgeStore | null,
  folder: null as FolderStore | null,
  aIChatFolders: null as AIChatFoldersStore | null,
  userPortrait: null as UserPortraitStore | null,
  userPortraitMessage: null as UserPortraitMessageStore | null,
};
