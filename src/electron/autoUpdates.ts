import {
  BrowserWindow, ipcMain,
} from 'electron';
import type { UpdateInfo } from 'electron-updater';
import { autoUpdater } from 'electron-updater';
import { initializeApp } from 'firebase/app';
import {
  fetchAndActivate,
  getRemoteConfig,
  getValue,
} from 'firebase/remote-config';

import type { WindowState } from './windowState';
import { ElectronAction, ElectronEvent } from '../types/electron';

import { pause } from '../util/schedulers';
import { UPDATE_DEFER_KEY } from '../components/chatAssistant/utils/firebase_analytics';
import { compareVersion } from '../components/chatAssistant/utils/util';
import {
  forceQuit, IS_MAC_OS, IS_PREVIEW, IS_WINDOWS, store,
} from './utils';

export const AUTO_UPDATE_SETTING_KEY = 'autoUpdate';

const CHECK_UPDATE_INTERVAL = 5 * 60 * 1000;

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDRc-Q0RzBJ6PnN88XQSlfJIy5JiA4Eamo',
  authDomain: 'im-copilot.firebaseapp.com',
  projectId: 'im-copilot',
  storageBucket: 'im-copilot.firebasestorage.app',
  messagingSenderId: '496967575175',
  appId: '1:496967575175:web:07741a144cc34882153a22',
  measurementId: 'G-PTEQ411L8P',
};

let isUpdateCheckStarted = false;
let remoteConfig: any;

export default function setupAutoUpdates(state: WindowState) {
  if (isUpdateCheckStarted) {
    return;
  }

  isUpdateCheckStarted = true;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  remoteConfig = getRemoteConfig(app);
  remoteConfig.settings = {
    minimumFetchIntervalMillis: 0,
    fetchTimeoutMillis: 60000,
  };

  checkForUpdates();

  ipcMain.handle(ElectronAction.INSTALL_UPDATE, () => {
    state.saveLastUrlHash();

    if (IS_MAC_OS || IS_WINDOWS) {
      forceQuit.enable();
    }

    return autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', (error: Error) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(ElectronEvent.UPDATE_ERROR, error);
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(ElectronEvent.UPDATE_AVAILABLE, info);
    });
  });
}

export function getIsAutoUpdateEnabled() {
  return !IS_PREVIEW && store.get(AUTO_UPDATE_SETTING_KEY);
}

async function checkForUpdates(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Checking for updates...', getIsAutoUpdateEnabled());
  while (true) {
    if (await shouldPerformAutoUpdate()) {
      if (getIsAutoUpdateEnabled()) {
        autoUpdater.checkForUpdates();
      } else {
        BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send(ElectronEvent.UPDATE_AVAILABLE);
        });
      }
    }

    await pause(CHECK_UPDATE_INTERVAL);
  }
}

function shouldPerformAutoUpdate(): Promise<boolean> {
  return new Promise((resolve) => {
    fetchAndActivate(remoteConfig)
      .then(() => {
        const configKey = 'web_force_update_config';
        const webFireBase = getValue(remoteConfig, configKey).asString();
        if (webFireBase) {
          try {
            const { force_update_current_version } = JSON.parse(webFireBase);
            const [version] = JSON.parse(localStorage.getItem(UPDATE_DEFER_KEY) || '["0.0.0",0]');
            const compareRes = compareVersion(version, force_update_current_version);
            // eslint-disable-next-line no-console
            console.log('版本比对', compareRes);
            resolve(compareRes === -1);
          } catch (e) {
            resolve(false);
          }
        } else {
          resolve(false);
        }
      })
      .catch(() => {
        resolve(false);
      });
  });
}
