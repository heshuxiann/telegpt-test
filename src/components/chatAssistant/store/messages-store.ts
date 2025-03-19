import type { Message } from 'ai';

import { CHAT_IDB_STORE } from './im-assistant-idb';

const isAuxiliary = (message:Message) => {
  // eslint-disable-next-line max-len
  return message?.annotations?.some((item) => item && typeof item === 'object' && 'isAuxiliary' in item && item.isAuxiliary === true) ?? false;
};
export const addMessage = (chatId:string, messages:Message[]) => {
  const filterMessage = messages.filter((item) => !isAuxiliary(item));
  const uniqueArr = [...new Map(filterMessage.map((item) => [item.id, item])).values()];
  CHAT_IDB_STORE.set(chatId, uniqueArr);
};
export const getMessage = (chatId: string):Promise<Message[] | undefined> => {
  return CHAT_IDB_STORE.get(chatId);
};

export const updateMessage = (chatId: string, updater: (oldValue: Message[] | undefined) => Message[]) => {
  CHAT_IDB_STORE.update(chatId, updater);
};
