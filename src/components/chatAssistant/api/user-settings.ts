import bigInt from 'big-integer';
import { getActions } from '../../../global';

import { buildApiPeerId } from '../../../api/gramjs/apiBuilders/peers';
import { buildMtpPeerId, getEntityTypeById } from '../../../api/gramjs/gramjsBuilders';
import { deleteSummarize, deleteUrgent, getUserSetting, updateSummarize, updateUrgent, updateUserSetting } from '../utils/telegpt-api';

// Define the entity types
type EntityType = 'user' | 'chat' | 'channel';

// Create a mapping object
export const ENTITY_TYPE_TO_NUMBER: Record<EntityType, number> = {
  user: 0,
  chat: 1,
  channel: 2,
} as const;

// Create a reverse mapping
export const NUMBER_TO_ENTITY_TYPE: Record<number, EntityType> = {
  0: 'user',
  1: 'chat',
  2: 'channel',
} as const;

export const buildEntityTypeFromIds = (ids: string[]) => {
  const entityTypes = ids.map((id: string) => {
    const type = getEntityTypeById(id);
    const intId = buildMtpPeerId(id, type);
    return {
      id: Number(intId),
      type: ENTITY_TYPE_TO_NUMBER[type],
    };
  });
  return entityTypes;
};

export const getIdsFromEntityTypes = (entityTypes: { id: number; type: number }[]) => {
  const ids = entityTypes.map((item) => {
    if (typeof item === 'object') {
      const entityType = NUMBER_TO_ENTITY_TYPE[item.type];
      const id = buildApiPeerId(bigInt(item.id), entityType);
      return id;
    } else {
      return false;
    }
  }).filter(Boolean);
  return ids;
};

export interface ISummaryTemplate {
  id?: string;
  topic: string;
  prompt: string;
  user_id: string;
  created_at?: string;
}
export interface IUrgentTopic {
  id?: string;
  user_id: string;
  topic: string;
  prompt: string;
  is_open: boolean;
  is_call: boolean;
  created_at?: string;
}

export interface SubscriptionInfo {
  user_id: string;
  type: string;
  expirate: string;
  is_expirated: boolean;
}

interface ITelegptSettings {
  [key: string]: any;
  user_id: string;
  curious_info: ISummaryTemplate[];
  curious_id: string[];
  urgent_info: IUrgentTopic[];
  summary_chat_ids: { id: number; type: number }[];
  ignored_summary_chat_ids: { id: number; type: number }[];
  urgent_chat_ids: { id: number; type: number }[];
  ignored_urgent_chat_ids: { id: number; type: number }[];
  fanorite_chat_ids: string[];
  block_chat_ids: string[];
  chat_ids: string[];
  phone: string;
  autotranslate: boolean;
  autotranslatelanguage: string;
  subscription_info: {
    pro: SubscriptionInfo | undefined;
    plus: SubscriptionInfo | undefined;
  };
}
const defaultSettings: ITelegptSettings = {
  user_id: '',
  curious_info: [],
  curious_id: [],
  urgent_info: [],
  summary_chat_ids: [],
  ignored_summary_chat_ids: [],
  urgent_chat_ids: [],
  ignored_urgent_chat_ids: [],
  fanorite_chat_ids: [],
  block_chat_ids: [],
  chat_ids: [],
  phone: '',
  autotranslate: false,
  autotranslatelanguage: 'en',
  subscription_info: {
    pro: undefined,
    plus: undefined,
  },
};

const POKE_RATE_MS = 600000;
class TelegptSettings {
  private settings: ITelegptSettings = defaultSettings;

  private user_id: string = '';

  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    this.intervalUpdate();
  }

  intervalUpdate() {
    const loclaSettings = localStorage.getItem('telegpt-settings');
    this.settings = loclaSettings ? JSON.parse(loclaSettings) : defaultSettings;
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => {
      this.getGptSettings();
    }, POKE_RATE_MS);
  }

  getGptSettings() {
    if (!this.user_id) return;
    getUserSetting(this.user_id).then((res) => {
      if (res.code === 0 && res.data) {
        this.settings = res.data;
        localStorage.setItem('telegpt-settings', JSON.stringify(this.settings));
        this.setGlobalSettings(res.data);
      }
    });
  }

  updateGptSettings(callback?: (res: any) => void) {
    updateUserSetting(this.user_id, {
      user_id: this.user_id,
      settings: this.settings,
    }).then((res) => {
      callback?.(res);
    });
  }

  set userId(user_id: string) {
    this.user_id = user_id;
    this.settings.user_id = user_id;
  }

  get telegptSettings() {
    return this.settings;
  }

  setSettingOption(newSettings: Partial<ITelegptSettings>, callback?: (res: any) => void) {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };
    localStorage.setItem('telegpt-settings', JSON.stringify(this.settings));
    this.setGlobalSettings(newSettings);
    this.updateGptSettings(callback);
  }

  setGlobalSettings(newSettings: Partial<ITelegptSettings>) {
    const { autotranslate, autotranslatelanguage } = newSettings;
    getActions().setSettingOption({ autoTranslate: autotranslate || false });
    getActions().setSettingOption({ autoTranslateLanguage: autotranslatelanguage || 'en' });
    getActions().setSettingOption({ translationLanguage: autotranslatelanguage || 'en' });
  }

  updateSummarizeTemplate(template: Partial<ISummaryTemplate>) {
    return new Promise((resolve, reject) => {
      updateSummarize({
        ...template,
        user_id: this.user_id,
      }).then((res) => {
        if (res.code === 0 && res.data) {
          if (template.id) {
            this.settings.curious_info = this.settings.curious_info.map((item: any) => {
              if (item.id === template.id) {
                return res.data;
              }
              return item;
            });
          } else {
            this.settings.curious_info.push(res.data);
          }
        }
        resolve(res);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  deleteSummarizeTemplate(id: string) {
    return new Promise((resolve, reject) => {
      deleteSummarize(this.user_id, id).then((res) => {
        if (res.code === 0 && res.data) {
          this.settings.curious_info = this.settings.curious_info.filter((item) => item.id !== id);
        }
        resolve(res);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  updateUrgentTopic(template: Partial<IUrgentTopic>) {
    return new Promise((resolve, reject) => {
      updateUrgent({
        ...template,
        user_id: this.user_id,
      }).then((res) => {
        if (res.code === 0 && res.data) {
          if (template.id) {
            this.settings.urgent_info = this.settings.urgent_info.map((item: any) => {
              if (item.id === template.id) {
                return res.data;
              }
              return item;
            });
          } else {
            this.settings.urgent_info.push(res.data);
          }
        }
        resolve(res);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  deleteUrgentTopic(id: string) {
    return new Promise((resolve, reject) => {
      deleteUrgent(this.user_id, id).then((res) => {
        if (res.code === 0 && res.data) {
          this.settings.urgent_info = this.settings.urgent_info.filter((item) => item.id !== id);
        }
        resolve(res);
      }).catch((err) => {
        reject(err);
      });
    });
  }
}
export const telegptSettings = new TelegptSettings();
