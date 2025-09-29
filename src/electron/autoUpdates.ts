import {
  app,
  BrowserWindow, ipcMain, net,
} from 'electron';
import log from 'electron-log';
import type { UpdateInfo } from 'electron-updater';
import { autoUpdater } from 'electron-updater';

import type { WindowState } from './windowState';
import { ElectronAction, ElectronEvent } from '../types/electron';

import { SERVER_API_URL } from '../config';
import { pause } from '../util/schedulers';
import {
  forceQuit, IS_MAC_OS, IS_PREVIEW, IS_WINDOWS, store,
} from './utils';

export const AUTO_UPDATE_SETTING_KEY = 'autoUpdate';

const CHECK_UPDATE_INTERVAL = 5 * 60 * 1000;

let isUpdateCheckStarted = false;

export default function setupAutoUpdates(state: WindowState) {
  if (isUpdateCheckStarted) {
    log.info('Auto-update already initialized, skipping setup');
    return;
  }

  log.info('Initializing auto-update system...');
  log.info('Current app version: 0.0.15');

  isUpdateCheckStarted = true;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  // autoUpdater.forceDevUpdateConfig = true;

  // Set up auto-updater event listeners with logging
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    log.info('Update available:', {
      version: info.version,
      releaseDate: info.releaseDate,
      downloadedPercent: 0,
    });
  });

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    log.info('Update not available. Current version is up-to-date:', {
      version: info.version,
    });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    log.info('Download progress:', {
      bytesPerSecond: progressObj.bytesPerSecond,
      percent: Math.round(progressObj.percent),
      transferred: progressObj.transferred,
      total: progressObj.total,
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    log.info('Update downloaded successfully:', {
      version: info.version,
      releaseDate: info.releaseDate,
    });

    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(ElectronEvent.UPDATE_AVAILABLE, info);
    });
  });

  autoUpdater.on('error', (error: Error) => {
    log.error('Auto-updater error:', {
      message: error.message,
      stack: error.stack,
    });

    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(ElectronEvent.UPDATE_ERROR, error);
    });
  });

  checkForUpdates();

  ipcMain.handle(ElectronAction.INSTALL_UPDATE, () => {
    log.info('Installing update and restarting application...');
    state.saveLastUrlHash();

    if (IS_MAC_OS || IS_WINDOWS) {
      forceQuit.enable();
    }

    return autoUpdater.quitAndInstall();
  });
}

export function getIsAutoUpdateEnabled() {
  return !IS_PREVIEW && store.get(AUTO_UPDATE_SETTING_KEY);
}

async function checkForUpdates(): Promise<void> {
  log.info('Starting update check loop...');
  log.info(`Update check interval: ${(CHECK_UPDATE_INTERVAL / 1000 / 60).toString()} minutes`);

  while (true) {
    if (await shouldPerformAutoUpdate()) {
      if (getIsAutoUpdateEnabled()) {
        log.info('Triggering update check...');
        try {
          await autoUpdater.checkForUpdates();
        } catch (error) {
          log.error('Error during update check:', error);
        }
      } else {
        log.info('Auto-update disabled, sending mock update available event');
        BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send(ElectronEvent.UPDATE_AVAILABLE);
        });
      }
    }
    log.info(`Waiting ${(CHECK_UPDATE_INTERVAL / 1000 / 60).toString()} minutes before next update check...`);
    await pause(CHECK_UPDATE_INTERVAL);
  }
}

export function shouldPerformAutoUpdate(): Promise<boolean> {
  log.info('Checking if auto-update should be performed...', SERVER_API_URL);
  return new Promise((resolve) => {
    const request = net.request(`${SERVER_API_URL}/app-version`);

    request.on('response', (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk.toString();
      });

      response.on('end', () => {
        try {
          const res = JSON.parse(data);
          log.info(`get app-version res: ${JSON.stringify(res)}`);
          if (res.code === 0) {
            const webVersion = res.data.web.version;
            const currentVersion = app.getVersion();
            log.info('app newVersion:', webVersion);
            log.info('app currentVersion:', currentVersion);
            const compareRes = compareVersion(currentVersion, webVersion);
            if (compareRes === -1) {
              resolve(true);
            } else {
              resolve(false);
            }
          } else {
            resolve(false);
          }
        } catch (parseError) {
          log.error('JSON parse error:', parseError);
          resolve(false);
        }
      });
    });

    request.on('error', (err) => {
      log.error('checkUpdate error:', err);
      resolve(false);
    });

    request.end();
  });
}

function compareVersion(version1: any, version2: any) {
  const arr1 = version1.split('.');
  const arr2 = version2.split('.');
  const len = Math.max(arr1.length, arr2.length);

  while (arr1.length < len) {
    arr1.push('0');
  }
  while (arr2.length < len) {
    arr2.push('0');
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(arr1[i] || 0, 10);
    const num2 = parseInt(arr2[i] || 0, 10);
    if (num1 > num2) {
      return 1; // version1 > version2
    } else if (num1 < num2) {
      return -1; // version1 < version2
    }
  }
  return 0; // version1 == version2
}
