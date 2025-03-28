import * as ContactStore from './contact-store';
import { GENERAL_IDB_STORE } from './im-assistant-idb';
import * as MessageStore from './messages-store';
import * as UsersStore from './user-store';

export const CHATAI_STORE = {
  ContactStore,
  UsersStore,
  MessageStore,
  GENERAL_IDB_STORE,
};

export const GLOBAL_SUMMARY_LAST_TIME = 'globalSummaryLastTime';
export const GLOBAL_SUMMARY_READ_TIME = 'globalSummaryReadTime';
