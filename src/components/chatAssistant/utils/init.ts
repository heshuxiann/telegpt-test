import { getActions } from '../../../global';

import { CHATAI_IDB_STORE } from '../../../util/browser/idb';
import { aiChatFoldersTask } from "../ai-task/ai-chatfolders-task"
import { globalSummaryTask } from '../ai-task/global-summary-task';
import { intelligentReplyTask } from '../ai-task/intelligent-reply-task';
import { urgentCheckTask } from '../ai-task/urgent-check-task';
import { TOOLS_SCHEDULE_MEETING_ID, TOOLS_SEARCH_GROUP_ID, TOOLS_SEARCH_USER_ID } from '../variables';
import { toolsEmbeddingStore } from '../vector-store';

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
  // check tools embedding
  toolsEmbeddingStore.getText(TOOLS_SCHEDULE_MEETING_ID).then((res:any) => {
    if (!res) {
      toolsEmbeddingStore.addText('约会，安排会议，创建会议，schedule meeting', TOOLS_SCHEDULE_MEETING_ID, {});
    }
  });
  toolsEmbeddingStore.getText(TOOLS_SEARCH_GROUP_ID).then((res:any) => {
    if (!res) {
      toolsEmbeddingStore.addText('searching for group/chanel/team/channel', TOOLS_SEARCH_GROUP_ID, {});
    }
  });
  toolsEmbeddingStore.getText(TOOLS_SEARCH_USER_ID).then((res:any) => {
    if (!res) {
      toolsEmbeddingStore.addText('searching for a user/person/peer', TOOLS_SEARCH_USER_ID, {});
    }
  });
  // init ai chat folders task
  aiChatFoldersTask.initTask();
};
