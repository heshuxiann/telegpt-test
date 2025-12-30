import { getGlobal, setGlobal } from '../../../global';

export interface RoomInputTranslateOptions {
  translateLanguage: string;
  translateLanguageName: string;
  autoTranslate: boolean;
}
export function updateRoomInputTranslateOptions(chatId: string, options: RoomInputTranslateOptions) {
  let global = getGlobal();
  global = {
    ...global,
    roomInputTranslateOptions: {
      ...global.roomInputTranslateOptions,
      [chatId]: options,
    },
  };
  setGlobal(global);
  localStorage.setItem('room-input-translate-config', JSON.stringify(global.roomInputTranslateOptions));
}
