/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import type { Message } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { getGlobal } from '../../../global';

import type { MeetingInformationSuggestType } from '../utils/schedule-meeting';
import { MAIN_THREAD_ID } from '../../../api/types';

import { selectChat, selectChatLastMessageId, selectUser } from '../../../global/selectors';
import { getActionItems, summaryMessage } from '../utils/chat-api';
import { fetchChatMessageByOffsetId, formateMessage2Summary } from '../utils/fetch-messages';
import { getAuthState, isTokenValid } from '../utils/google-auth';

export const createRoomDescriptionMessage = (chatId: string): Message => {
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
export const createGoogleLoginMessage = (): Message => {
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

export const createGoogleMeetingMessage = (): Message => {
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

export const scheduleGoogleMeeting = async (insertMessage: (message: Message) => void, callback?: () => void) => {
  const auth = getAuthState();
  if (!auth || !(await isTokenValid(auth))) {
    insertMessage(createGoogleLoginMessage());
  } else {
    insertMessage(createGoogleMeetingMessage());
  }
  callback?.();
};

export const summaryRoomMessage = async (
  chatId: string,
  insertMessage: (message: Message) => void,
  callback?: () => void,
) => {
  const global = getGlobal();
  const { telyAiLanguage = 'en' } = global.settings.byKey;
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
    if (!formateMessages.length) {
      callback?.();
      const newMessage = {
        timestamp: new Date().getTime(),
        content: 'No significant topics or valid data detected. We will continue monitoring.',
        id: uuidv4(),
        createdAt: new Date(),
        role: 'assistant',
      };
      insertMessage(newMessage as Message);
      return;
    }
    const summaryInfo = {
      summaryTime: new Date().getTime(),
      messageCount: formateMessages.length,
      userIds: Array.from(new Set(formateMessages.map((m) => m.senderId))),
    };
    summaryMessage({
      messages: formateMessages,
      language: new Intl.DisplayNames([telyAiLanguage], { type: 'language' }).of(telyAiLanguage),
    }).then((res: any) => {
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
      const newMessage = {
        timestamp: new Date().getTime(),
        content: 'Summarization failed. Try again later.',
        id: uuidv4(),
        createdAt: new Date(),
        role: 'assistant',
      };
      insertMessage(newMessage as Message);
    });
  }
};

export const generateRoomActionItems = async (
  chatId: string,
  insertMessage: (message: Message) => void,
  callback?: () => void,
) => {
  const global = getGlobal();
  const { telyAiLanguage } = global.settings.byKey;
  const chat = selectChat(global, chatId);
  const lastMessageId = selectChatLastMessageId(global, chatId) || 0;
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
        // eslint-disable-next-line tt-multitab/must-update-global-after-await
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
      language: telyAiLanguage,
    }).then((res: any) => {
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
  startTime,
  duration,
  email,
  timeZone,
}: {
  chatId: string;
  startTime: string[];
  duration: number;
  email: string[] | null;
  timeZone: string;
}): Message => {
  return {
    role: 'assistant',
    id: uuidv4(),
    createdAt: new Date(),
    content: JSON.stringify({
      chatId, startTime, duration, email, timeZone, isConfirmed: false,
    }),
    annotations: [{
      type: 'google-meet-time-confirm',
    }],
  };
};

export const createMeetingMentionMessage = (data: {
  chatId: string;
  senderId: string | undefined;
  messageId: number;
  messageText: string | undefined;
}): Message => {
  return {
    role: 'assistant',
    id: uuidv4(),
    createdAt: new Date(),
    content: JSON.stringify({
      ...data,
      isConfirmed: false,
    }),
    annotations: [{
      type: 'google-meet-mention',
    }],
  };
};

export const createMeetingInformationSuggestMessage = (data: {
  chatId: string;
  messageId: number;
  senderId: string | undefined;
  suggestType: MeetingInformationSuggestType;
}): Message => {
  return {
    role: 'assistant',
    id: uuidv4(),
    createdAt: new Date(),
    content: JSON.stringify({
      ...data,
      emailConfirmed: false,
      calendlyConfirmed: false,
    }),
    annotations: [{
      type: 'google-meet-information-suggest',
    }],
  };
};

export const createUserPortraitMessage = (name: string): Message => {
  const usersById = getGlobal().users.byId;
  let userId = null;
  Object.values(usersById).forEach((user) => {
    if (user.firstName?.toLowerCase() === name?.toLowerCase()
      || user.lastName?.toLowerCase() === name?.toLowerCase()
      || (`${user.firstName} ${user.lastName}`)?.toLowerCase() === name?.toLowerCase()
    ) {
      userId = user.id;
    }
  });
  return {
    role: 'assistant',
    id: uuidv4(),
    createdAt: new Date(),
    content: userId ?? '',
    annotations: [{
      type: 'user-portrait',
    }],
  };
};

export const createNewFeatureReminderMessage = (tip = 'Comming soon!'): Message => {
  return {
    role: 'assistant',
    id: uuidv4(),
    createdAt: new Date(),
    content: tip,
    annotations: [{
      type: 'new-feature-reminder',
    }],
  };
};

export const createUpgradeTipMessage = (): Message => {
  return {
    role: 'assistant',
    id: uuidv4(),
    createdAt: new Date(),
    content: 'Upgrade to Room AI Pro to unlock more features.',
    annotations: [{
      type: 'upgrade-tip',
    }],
  };
};
