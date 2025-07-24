import { getActions } from '../../../global';

export interface ISummaryTemplate {
  id: string;
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

/* eslint-disable no-console */
interface ITelegptSettings {
  [key: string]: any;
  user_id: string;
  curious_info: ISummaryTemplate[];
  curious_id: string[];
  urgent_info: IUrgentTopic[];
  summary_chat_ids: string[];
  urgent_chat_ids: string[];
  fanorite_chat_ids: string[];
  block_chat_ids: string[];
  chat_ids: string[];
  phone: string;
  autoTranslate: boolean;
  autoTranslateLanguage: string;
}
const defaultSettings: ITelegptSettings = {
  user_id: '',
  curious_info: [],
  curious_id: [],
  urgent_info: [],
  summary_chat_ids: [],
  urgent_chat_ids: [],
  fanorite_chat_ids: [],
  block_chat_ids: [],
  chat_ids: [],
  phone: '',
  autoTranslate: false,
  autoTranslateLanguage: 'en',
};
class TelegptSettings {
  private settings: ITelegptSettings = defaultSettings;

  private user_id:string = '';

  initGptSettings() {
    const loclaSettings = localStorage.getItem('telegpt-settings');
    this.settings = loclaSettings ? JSON.parse(loclaSettings) : defaultSettings;
    fetch(`https://telegpt-three.vercel.app/settings/personalized-settings?user_id=${this.user_id}`, {
      method: 'GET',
    })
      .then((res) => res.json())
      .then((res) => {
        console.log('res', res);
        if (res.code === 0 && res.data) {
          this.settings = res.data;
          localStorage.setItem('telegpt-settings', JSON.stringify(this.settings));
          this.setGlobalSettings(res.data);
        }
      });
  }

  updateGptSettings() {
    fetch(`https://telegpt-three.vercel.app/settings/personalized-settings?user_id=${this.user_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: this.user_id,
        settings: this.settings,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        console.log('settings', res);
      });
  }

  set userId(user_id: string) {
    this.user_id = user_id;
    this.settings.user_id = user_id;
  }

  get telegptSettings() {
    return this.settings;
  }

  setSettingOption(newSettings: Partial<ITelegptSettings>) {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };
    localStorage.setItem('telegpt-settings', JSON.stringify(this.settings));
    this.setGlobalSettings(newSettings);
    this.updateGptSettings();
  }

  // eslint-disable-next-line class-methods-use-this
  setGlobalSettings(newSettings: Partial<ITelegptSettings>) {
    const { autoTranslate, autoTranslateLanguage } = newSettings;
    if (autoTranslate) {
      getActions().setSettingOption({ autoTranslate: autoTranslate || false });
    }
    if (autoTranslateLanguage) {
      getActions().setSettingOption({ autoTranslateLanguage: autoTranslateLanguage || 'en' });
      getActions().setSettingOption({ translationLanguage: autoTranslateLanguage || 'en' });
    }
  }

  updateSummarizeTemplate(template:Partial<ISummaryTemplate>) {
    return new Promise((resolve, reject) => {
      fetch('https://telegpt-three.vercel.app/settings/update-summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...template,
          user_id: this.user_id,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.code === 0 && res.data) {
            if (template.id) {
              this.settings.curious_info = this.settings.curious_info.map((item:any) => {
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
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  deleteSummarizeTemplate(id: string) {
    return new Promise((resolve, reject) => {
      fetch(`https://telegpt-three.vercel.app/settings/update-summarize?id=${id}&user_id=${this.user_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.code === 0 && res.data) {
            this.settings.curious_info = this.settings.curious_info.filter((item) => item.id !== id);
          }
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  updateUrgentTopic(template:Partial<IUrgentTopic>) {
    return new Promise((resolve, reject) => {
      fetch('https://telegpt-three.vercel.app/settings/update-urgent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...template,
          user_id: this.user_id,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.code === 0 && res.data) {
            if (template.id) {
              this.settings.urgent_info = this.settings.urgent_info.map((item:any) => {
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
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  deleteUrgentTopic(id: string) {
    return new Promise((resolve, reject) => {
      fetch(`https://telegpt-three.vercel.app/settings/update-urgent?id=${id}&user_id=${this.user_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.code === 0 && res.data) {
            this.settings.urgent_info = this.settings.urgent_info.filter((item) => item.id !== id);
          }
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
const telegptSettings = new TelegptSettings();
export default telegptSettings;
