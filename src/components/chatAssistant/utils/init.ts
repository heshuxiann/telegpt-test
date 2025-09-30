import './firebase_analytics';

import { aiChatFoldersTask } from '../ai-task/ai-chatfolders-task';
import { globalSummaryTask } from '../ai-task/global-summary-task';
import { intelligentReplyTask } from '../ai-task/intelligent-reply-task';
import { urgentCheckTask } from '../ai-task/urgent-check-task';

export const initChatAI = () => {
  // init global summary
  globalSummaryTask.initTask();
  // init intelligent reply task
  intelligentReplyTask.initTask();
  // init urgent alert task
  urgentCheckTask.initTask();

  aiChatFoldersTask.initTask();
};
