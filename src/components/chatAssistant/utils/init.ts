import { getActions } from '../../../global';

import { CHATAI_IDB_STORE } from '../../../util/browser/idb';

export const initChatAIData = () => {
  CHATAI_IDB_STORE.get('auto-translate-language').then((language) => {
    getActions().setSettingOption({ autoTranslateLanguage: language as string || 'en' });
    getActions().setSettingOption({ translationLanguage: language as string || 'en' });
  });
  CHATAI_IDB_STORE.get('auto-translate').then((value) => {
    getActions().setSettingOption({ autoTranslate: value as boolean || false });
  });
};
