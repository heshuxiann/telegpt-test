import { getGlobal } from '../../../global';

import SummaryTemplateStore from './chatai-summary-template-store';
import ContactStore from './contact-store';
import GeneralStore from './general-store';
import KnowledgeStore from './knowledge-store';
import MessageStore from './messages-store';
import UsersStore from './user-store';

function getChataiDbname() {
  const global = getGlobal();
  const { currentUserId } = global;
  const DB_NAME = currentUserId ? `tt-chatai-${currentUserId}` : 'tt-chatai';
  return DB_NAME;
}
const dbVersion = 6;

export const GLOBAL_SUMMARY_LAST_TIME = 'globalSummaryLastTime';
export const GLOBAL_SUMMARY_READ_TIME = 'globalSummaryReadTime';

export const ChataiMessageStore = new MessageStore(getChataiDbname(), dbVersion);
export const ChataiContactStore = new ContactStore(getChataiDbname(), dbVersion);
export const ChataiUserStore = new UsersStore(getChataiDbname(), dbVersion);
export const ChataiGeneralStore = new GeneralStore(getChataiDbname(), dbVersion);
export const ChataiKnowledgelStore = new KnowledgeStore(getChataiDbname(), dbVersion);
export const ChataiSummaryTemplateStore = new SummaryTemplateStore(getChataiDbname(), dbVersion);
