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
const dbVersion = 2;

export const GLOBAL_SUMMARY_LAST_TIME = 'globalSummaryLastTime';
export const GLOBAL_SUMMARY_READ_TIME = 'globalSummaryReadTime';

export const ChataiMessageStore = new MessageStore(getChataiDbname(), dbVersion);
export const ChataiContactStore = new ContactStore(getChataiDbname(), dbVersion);
export const ChataiUserStore = new UsersStore(getChataiDbname(), dbVersion);
export const ChataiGeneralStore = new GeneralStore(getChataiDbname(), dbVersion);
