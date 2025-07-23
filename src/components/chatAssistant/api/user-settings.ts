/* eslint-disable no-console */
interface ITelegptSettings {
  [key: string]: any;
  user_id: string;
  curious_info: any[];
  curious_id: [];
  urgent_info: [];
  summary_chat_ids: [];
  urgent_chat_ids: [];
  fanorite_chat_ids: [];
  block_chat_ids: [];
  chat_ids: [];
  phone: string;
  autoTranslate: false;
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
  autoTranslateLanguage: '',
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
        }
      });
  }

  set userId(user_id: string) {
    this.user_id = user_id;
    this.settings.user_id = user_id;
  }

  get telegptSettings() {
    return this.settings;
  }

  set telegptSettings(settings: ITelegptSettings) {
    this.settings = settings;
  }
}
const telegptSettings = new TelegptSettings();
export default telegptSettings;
