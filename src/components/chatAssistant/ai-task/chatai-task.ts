import { getActions, getGlobal } from '../../../global';

import type { ApiMessage } from '../../../api/types';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { isChatGroup, isSystemBot } from '../../../global/helpers';
import { selectBot, selectChat, selectCurrentChat } from '../../../global/selectors';
import { createMeetingInformationSuggestMessage } from '../room-ai/room-ai-utils';
import { ChataiStores } from '../store';
import { parseMessage2StoreMessage } from '../store/messages-store';
import { ASK_MEETING_EMAIL, ASK_MEETING_TIME, ASK_MEETING_TIME_AND_EMAIL } from '../utils/schedule-meeting';
import { userInformationCollection } from '../utils/user-information-collection';
import { intelligentReplyTask } from './intelligent-reply-task';
import { urgentCheckTask } from './urgent-check-task';

class ChatAIMessageQuene {
  static add(message: ApiMessage) {
    // eslint-disable-next-line no-console
    console.log('[ChatAIMessageQuene] add', message.id);
    const global = getGlobal();
    const messageText = message.content.text?.text;
    if (messageText) {
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
      }

      // 是否是询问约会相关的信息
      const currentChat = selectCurrentChat(global);
      const { emails, calendlyUrls } = userInformationCollection.informations;
      if (currentChat?.id === message.chatId && !message.isOutgoing) {
        if (messageText === ASK_MEETING_TIME_AND_EMAIL && (emails.length || calendlyUrls.length)) {
          const suggestMessage = createMeetingInformationSuggestMessage({
            chatId: message.chatId,
            messageId: message.id,
            senderId: message.senderId,
            suggestType: 'both',
          });
          ChataiStores?.message?.storeMessage(
            parseMessage2StoreMessage(currentChat.id, [suggestMessage])[0],
          );
          getActions().openChatAIWithInfo({ chatId: message.chatId });
          eventEmitter.emit(Actions.AddRoomAIMessage, suggestMessage);
        } else if (messageText === ASK_MEETING_TIME && calendlyUrls.length) {
          const suggestMessage = createMeetingInformationSuggestMessage({
            chatId: message.chatId,
            messageId: message.id,
            senderId: message.senderId,
            suggestType: 'time',
          });
          ChataiStores?.message?.storeMessage(
            parseMessage2StoreMessage(currentChat.id, [suggestMessage])[0],
          );
          getActions().openChatAIWithInfo({ chatId: message.chatId });
          eventEmitter.emit(Actions.AddRoomAIMessage, suggestMessage);
        } else if (messageText === ASK_MEETING_EMAIL && emails.length) {
          const suggestMessage = createMeetingInformationSuggestMessage({
            chatId: message.chatId,
            messageId: message.id,
            senderId: message.senderId,
            suggestType: 'email',
          });
          ChataiStores?.message?.storeMessage(
            parseMessage2StoreMessage(currentChat.id, [suggestMessage])[0],
          );
          getActions().openChatAIWithInfo({ chatId: message.chatId });
          eventEmitter.emit(Actions.AddRoomAIMessage, suggestMessage);
        }
      }
    }
  }
}

export default ChatAIMessageQuene;
