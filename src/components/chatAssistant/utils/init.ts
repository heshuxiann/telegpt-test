import './firebase_analytics';

// import { getActions } from '../../../global';
// import { CHATAI_IDB_STORE } from '../../../util/browser/idb';
import { aiChatFoldersTask } from '../ai-task/ai-chatfolders-task';
import { globalSummaryTask } from '../ai-task/global-summary-task';
import { intelligentReplyTask } from '../ai-task/intelligent-reply-task';
import { urgentCheckTask } from '../ai-task/urgent-check-task';
import { TOOLS_SCHEDULE_MEETING_ID, TOOLS_SEARCH_GROUP_ID, TOOLS_SEARCH_USER_ID } from '../variables';
import { toolsEmbeddingStore } from '../vector-store';

export const initChatAI = () => {
  // init global summary
  globalSummaryTask.initTask();
  // init intelligent reply task
  intelligentReplyTask.initTask();
  // init urgent alert task
  urgentCheckTask.initTask();
  // check tools embedding
  toolsEmbeddingStore.getText(TOOLS_SCHEDULE_MEETING_ID).then((res:any) => {
    if (!res) {
      const meetingSentences = [
        '安排会议',
        '预定时间',
        '找时间开会',
        '创建会议链接',
        '什么时候方便开会',
        '约个会议时间',
        '预约视频会议',
        '定个会议时间',
        '开 Zoom 会',
        '安排 Google Meet',
        '和客户约时间沟通',
        '我想和你约个会议讨论一下',
        '我们找时间安排个会议',
        '是否可以和你约时间开会',
        '咱们什么时候方便开会',
        '想聊聊项目细节',
        'I’d like to schedule a meeting with you to discuss this',
        'Can we arrange a meeting?',
        '约个会',
        '开个会',
        '找时间聊',
        '咱们聊聊',
      ];
      toolsEmbeddingStore.addText(meetingSentences.join(', '), TOOLS_SCHEDULE_MEETING_ID, {});
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
