import { getActions } from '../../../global';

import { CHATAI_IDB_STORE } from '../../../util/browser/idb';
import { classifyChatTask } from "../ai-task/classify-chat-task"
import { globalSummaryTask } from '../ai-task/global-summary-task';
import { intelligentReplyTask } from '../ai-task/intelligent-reply-task';
import { urgentCheckTask } from '../ai-task/urgent-check-task';

export const initChatAI = () => {
  // init data
  CHATAI_IDB_STORE.get('auto-translate-language').then((language) => {
    getActions().setSettingOption({ autoTranslateLanguage: language as string || 'en' });
    getActions().setSettingOption({ translationLanguage: language as string || 'en' });
  });
  CHATAI_IDB_STORE.get('auto-translate').then((value) => {
    getActions().setSettingOption({ autoTranslate: value as boolean || false });
  });
  // init global summary
  globalSummaryTask.initTask();
  // init intelligent reply task
  intelligentReplyTask.initTask();
  // init urgent alert task
  urgentCheckTask.initTask();
  // init classify chat task
  classifyChatTask.initTask();
};
