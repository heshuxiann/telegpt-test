/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import type { Message } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { getGlobal } from '../../../global';

import { MAIN_THREAD_ID } from '../../../api/types';

import { selectChat, selectChatLastMessageId, selectUser } from '../../../global/selectors';
import { getActionItems, summaryMessage } from '../utils/chat-api';
import { fetchChatMessageByOffsetId, formateMessage2Summary } from '../utils/fetch-messages';
import { getAuthState, isTokenValid } from '../utils/google-auth';

export const createRoomDescriptionMessage = (chatId:string):Message => {
  return {
    role: 'assistant',
    id: uuidv4(),
    createdAt: new Date(),
    content: chatId,
    annotations: [{
      type: 'room-ai-description',
    }],
  };
};
export const createGoogleLoginMessage = ():Message => {
  return {
    role: 'assistant',
    id: uuidv4(),
    createdAt: new Date(),
    content: 'Please login first',
    annotations: [{
      type: 'google-auth',
    }],
  };
};

export const createGoogleMeetingMessage = ():Message => {
  return {
    role: 'assistant',
    id: uuidv4(),
    createdAt: new Date(),
    content: '',
    annotations: [{
      type: 'google-event-insert',
    }],
  };
};

export const scheduleGoogleMeeting = (insertMessage:(message:Message)=>void, callback?:()=>void) => {
  const auth = getAuthState();
  if (!auth || !isTokenValid(auth)) {
    insertMessage(createGoogleLoginMessage());
  } else {
    insertMessage(createGoogleMeetingMessage());
  }
  callback?.();
};

export const summaryRoomMessage = async (
  chatId:string,
  insertMessage:(message:Message)=>void,
  callback?:()=>void,
) => {
  const global = getGlobal();
  const { autoTranslateLanguage = 'en' } = global.settings.byKey;
  const chat = selectChat(global, chatId);
  const lastMessageId = selectChatLastMessageId(global, chatId, 'all') || 0;
  if (chat) {
    const messages = await fetchChatMessageByOffsetId({
      chat,
      offsetId: lastMessageId,
      addOffset: -1,
      sliceSize: 20,
      threadId: MAIN_THREAD_ID,
      maxCount: 20,
    });
    const formateMessages = formateMessage2Summary(messages);
    if (!formateMessages.length) return;
    const summaryInfo = {
      summaryTime: new Date().getTime(),
      messageCount: formateMessages.length,
      userIds: Array.from(new Set(formateMessages.map((m) => m.senderId))),
    };
    summaryMessage({
      messages: formateMessages,
      language: new Intl.DisplayNames([autoTranslateLanguage], { type: 'language' }).of(autoTranslateLanguage),
    }).then((res:any) => {
      const content = {
        ...res.data,
        summaryInfo,
      };
      const newMessage = {
        timestamp: new Date().getTime(),
        content: JSON.stringify(content),
        id: uuidv4(),
        createdAt: new Date(),
        role: 'assistant',
        annotations: [{
          type: 'room-summary',
        }],
      };
      insertMessage(newMessage as Message);
      callback?.();
    }).catch((err) => {
      console.log(err);
      callback?.();
    });
  }
};

export const generateRoomActionItems = async (
  chatId:string,
  insertMessage:(message:Message)=>void,
  callback?:()=>void,
) => {
  const global = getGlobal();
  const { autoTranslateLanguage } = global.settings.byKey;
  const chat = selectChat(global, chatId);
  const lastMessageId = selectChatLastMessageId(global, chatId, 'all') || 0;
  if (chat) {
    const messages = await fetchChatMessageByOffsetId({
      chat,
      offsetId: lastMessageId,
      addOffset: -1,
      sliceSize: 20,
      threadId: MAIN_THREAD_ID,
      maxCount: 20,
    });
    const formateMessages = messages.map((message) => {
      if (message.content.text?.text) {
        const peer = message.senderId ? selectUser(global, message.senderId) : undefined;
        return {
          senderId: message?.senderId || message?.chatId,
          senderName: peer ? `${peer.firstName || ''} ${peer.lastName || ''}` : '',
          date: message.date,
          messageId: Math.floor(message.id),
          content: message.content.text?.text ?? '',
        };
      }
      return null;
    }).filter(Boolean);
    if (!formateMessages.length) return;
    const summaryInfo = {
      summaryTime: new Date().getTime(),
      messageCount: formateMessages.length,
      userIds: Array.from(new Set(formateMessages.map((m) => m.senderId))),
    };
    getActionItems({
      messages: formateMessages,
      language: autoTranslateLanguage,
    }).then((res:any) => {
      const content = {
        ...res.data,
        summaryInfo,
      };
      const newMessage = {
        timestamp: new Date().getTime(),
        content: JSON.stringify(content),
        id: uuidv4(),
        createdAt: new Date(),
        role: 'assistant',
        annotations: [{
          type: 'room-actions',
        }],
      };
      insertMessage(newMessage as Message);
      callback?.();
    }).catch((err) => {
      console.log(err);
      callback?.();
    });
  }
};

export const createMeetingTimeConfirmMessage = ({
  chatId,
  date,
  email,
}:{
  chatId:string;
  date:{ start:string;end:string }[];
  email:string[] | null;
}):Message => {
  return {
    role: 'assistant',
    id: uuidv4(),
    createdAt: new Date(),
    content: JSON.stringify({ chatId, date, email }),
    annotations: [{
      type: 'google-meet-time-confirm',
    }],
  };
};

export const createMeetingMentionMessage = (chatId:string):Message => {
  return {
    role: 'assistant',
    id: uuidv4(),
    createdAt: new Date(),
    content: chatId,
    annotations: [{
      type: 'google-meet-mention',
    }],
  };
};
