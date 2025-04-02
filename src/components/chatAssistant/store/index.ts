import { getGlobal } from '../../../global';

import ContactStore from './contact-store';
import GeneralStore from './general-store';
// import { GENERAL_IDB_STORE } from './im-assistant-idb';
import MessageStore from './messages-store';
import UsersStore from './user-store';

// export const CHATAI_STORE = {
//   ContactStore,
//   UsersStore,
//   MessageStore,
//   GENERAL_IDB_STORE,
// };

function getChataiDbname() {
  const global = getGlobal();
  const { currentUserId } = global;
  const DB_NAME = currentUserId ? `tt-chatai-${currentUserId}` : 'tt-chatai';
  return DB_NAME;
}

export const GLOBAL_SUMMARY_LAST_TIME = 'globalSummaryLastTime';
export const GLOBAL_SUMMARY_READ_TIME = 'globalSummaryReadTime';

export const ChataiMessageStore = new MessageStore(getChataiDbname(), 1);
export const ChataiContactStore = new ContactStore(getChataiDbname(), 1);
export const ChataiUserStore = new UsersStore(getChataiDbname(), 1);
export const ChataiGeneralStore = new GeneralStore(getChataiDbname(), 1);
