import { getGlobal } from '../../../global';

import type { ApiMessage } from '../../../api/types';

import { isChatGroup, isSystemBot } from '../../../global/helpers';
import { selectBot, selectChat } from '../../../global/selectors';
import { globalSummaryTask } from './global-summary-task';
import { intelligentReplyTask } from './intelligent-reply-task';
import { urgentCheckTask } from './urgent-check-task';

class ChatAIMessageQuene {
  static add(message: ApiMessage) {
    // eslint-disable-next-line no-console
    console.log('[ChatAIMessageQuene] add', message.id);
    const global = getGlobal();
    if (message.content.text) {
      const chatId = message.chatId;
      const chat = selectChat(global, chatId);
      const chatBot = !isSystemBot(chatId) ? selectBot(global, chatId) : undefined;
      if (chat && !chatBot) {
        // TODO 这里需要判断是否是紧急消息/知识库自动回复
        const { isRestricted } = chat;
        if (!message.isOutgoing && !isRestricted) {
          if (!isChatGroup(chat) || message.isMentioned) {
            intelligentReplyTask.addNewMessage(message);
          }
          urgentCheckTask.addNewMessage(message);
        }
        // TODO 添加到自动总结消息队列
        globalSummaryTask.addNewMessage(message);
      }
    }
  }
}

export default ChatAIMessageQuene;
