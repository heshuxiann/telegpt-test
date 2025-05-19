import { getActions } from '../../../global';

import { CHATAI_IDB_STORE } from '../../../util/browser/idb';
import { intelligentReplyTask } from '../aiTask/intelligent-reply-task';

export const initChatAI = () => {
  // init data
  CHATAI_IDB_STORE.get('auto-translate-language').then((language) => {
    getActions().setSettingOption({ autoTranslateLanguage: language as string || 'en' });
    getActions().setSettingOption({ translationLanguage: language as string || 'en' });
  });
  CHATAI_IDB_STORE.get('auto-translate').then((value) => {
    getActions().setSettingOption({ autoTranslate: value as boolean || false });
  });
  // init intelligent reply task
  intelligentReplyTask.initTask();
};
