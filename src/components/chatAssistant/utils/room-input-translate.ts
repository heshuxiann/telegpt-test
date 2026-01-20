import { getGlobal, setGlobal } from '../../../global';

import { selectChat, selectSystemLanguage } from '../../../global/selectors';

export interface RoomInputTranslateOptions {
  tipCloseed?: boolean;
  translateLanguage: string;
  translateLanguageName: string;
  autoTranslate: boolean;
}
export function updateRoomInputTranslateOptions(
  chatId: string,
  options: RoomInputTranslateOptions,
) {
  let global = getGlobal();
  global = {
    ...global,
    roomInputTranslateOptions: {
      ...global.roomInputTranslateOptions,
      [chatId]: options,
    },
  };
  setGlobal(global);
  localStorage.setItem(
    'room-input-translate-config',
    JSON.stringify(global.roomInputTranslateOptions),
  );
}

// translate tip
function checkLanguageDiff(chatId: string) {
  const global = getGlobal();
  const systemLanguage = selectSystemLanguage(global);
  const baseLanguage = systemLanguage ? getBaseLanguage(systemLanguage) : getBaseLanguage();

  const chat = selectChat(global, chatId);
  const detectedLanguage = chat?.detectedLanguage;
  if (!detectedLanguage || !baseLanguage) return false;
  return detectedLanguage !== baseLanguage;
}
function getBaseLanguage(lang = navigator.language) {
  return lang.split('-')[0]; // 取 "-" 之前的部分
}

export function checkShouldShowInputTranslateTip(chatId: string) {
  const global = getGlobal();
  const inputTipClosedStatus = global.translateTip.inputTipClosedChats[chatId];
  if (inputTipClosedStatus) return false;
  const isDiff = checkLanguageDiff(chatId);
  if (!isDiff) return false;

  return true;
}

export function checkShouldShowHeaderTranslateTip(chatId: string) {
  const global = getGlobal();
  const headerTipClosedStatus = global.translateTip.headerTipClosed;
  if (headerTipClosedStatus) return false;
  const isDiff = checkLanguageDiff(chatId);
  if (!isDiff) return false;
  return true;
}

export function updateHeaderTranslateTipStatus(status: boolean) {
  let global = getGlobal();
  const newTranslateTipData = {
    ...global.translateTip,
    headerTipClosed: status,
  };
  global = {
    ...global,
    translateTip: newTranslateTipData,
  };
  setGlobal(global);
  localStorage.setItem('translate-tip', JSON.stringify(newTranslateTipData));
}

export function updateInputTranslateTipStatus(chatId: string, status: boolean) {
  let global = getGlobal();
  const newTranslateTipData = {
    ...global.translateTip,
    inputTipClosedChats: {
      ...global.translateTip.inputTipClosedChats,
      [chatId]: status,
    },
  };
  global = {
    ...global,
    translateTip: newTranslateTipData,
  };
  setGlobal(global);
  localStorage.setItem('translate-tip', JSON.stringify(newTranslateTipData));
}

export function toggleAutoTranslation(autoTranslate: boolean) {
  const global = getGlobal();
  global.chatAutoTranslate = autoTranslate;
  setGlobal(global);
}
