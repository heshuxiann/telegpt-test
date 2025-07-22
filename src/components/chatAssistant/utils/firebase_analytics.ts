/* eslint-disable no-null/no-null */
import { initializeApp } from "firebase/app";
import {
  fetchAndActivate,
  getRemoteConfig,
  getValue,
} from "firebase/remote-config";
import eventEmitter, { Actions } from "../lib/EventEmitter";

const firebaseConfig = {
  apiKey: "AIzaSyDRc-Q0RzBJ6PnN88XQSlfJIy5JiA4Eamo",
  authDomain: "im-copilot.firebaseapp.com",
  projectId: "im-copilot",
  storageBucket: "im-copilot.firebasestorage.app",
  messagingSenderId: "496967575175",
  appId: "1:496967575175:web:07741a144cc34882153a22",
  measurementId: "G-PTEQ411L8P",
};

const app = initializeApp(firebaseConfig);
const remoteConfig = getRemoteConfig(app);
remoteConfig.settings = {
  minimumFetchIntervalMillis: 0,
  fetchTimeoutMillis: 60000,
};
export const UPDATE_DEFER_KEY = "telegpt_defer_update";
const POKE_RATE_MS = 3600000;

class FireBaseAnalytics {
  looper!: ReturnType<typeof setInterval> | null;
  constructor() {
    this.looFireBase();
  }

  looFireBase() {
    this.fetchAppVersion(true);
    if (this.looper) {
      window.clearInterval(this.looper);
    }
    this.looper = setInterval(() => {
      this.fetchAppVersion();
    }, POKE_RATE_MS);
  }

  fetchAppVersion(isFirstTime = false) {
    fetchAndActivate(remoteConfig)
      .then(() => {
        const configKey = "web_force_update_config";
        const webFireBase = getValue(remoteConfig, configKey).asString();
        if (webFireBase) {
          if (isFirstTime) {
            const { force_update_current_version } = JSON.parse(webFireBase);
            this.deferUpdate(force_update_current_version);
          } else {
            eventEmitter.emit(Actions.UpdateFirebaseConfig, {
              webFireBase: JSON.parse(webFireBase),
            });
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
  /**
   * Ignore the pending update and don't prompt about this version
   * until the next morning (8am).
   */
  deferUpdate(newVersion: string) {
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
    date.setHours(8, 0, 0, 0); // set to next 8am
    localStorage.setItem(
      UPDATE_DEFER_KEY,
      JSON.stringify([newVersion, date.getTime()])
    );
  }
}

export const fireBaseAnalytics = new FireBaseAnalytics();
