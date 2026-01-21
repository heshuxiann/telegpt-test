/* eslint-disable no-console */
import 'v8-compile-cache';

import { app, ipcMain, nativeImage } from 'electron';
import contextMenu from 'electron-context-menu';
import path from 'path';

import { initDeeplink } from './deeplink';
import { googleAuthFlow } from './google-oauth';
import { initProxy } from './proxy';
import { IS_MAC_OS, IS_PRODUCTION, IS_WINDOWS } from './utils';
import { createWindow, setupCloseHandlers, setupElectronActionHandlers } from './window';

initProxy();

initDeeplink();
// import electronDragClick from 'electron-drag-click';

initDeeplink();
// if (IS_MAC_OS) {
//   electronDragClick();
// }

contextMenu({
  showLearnSpelling: false,
  showLookUpSelection: false,
  showSearchWithGoogle: false,
  showCopyImage: false,
  showSelectAll: true,
  showInspectElement: !IS_PRODUCTION,
});

app.on('ready', () => {
  if (IS_MAC_OS) {
    app.dock!.setIcon(nativeImage.createFromPath(path.resolve(__dirname, '../public/icon-electron-macos.png')));
  }

  if (IS_WINDOWS) {
    app.setAppUserModelId(app.getName());
  }

  createWindow();
  setupElectronActionHandlers();
  setupCloseHandlers();
});

ipcMain.handle('google-login', async () => {
  try {
    const tokens = await googleAuthFlow();
    return tokens;
  } catch (e) {
    console.error(e);
    throw e;
  }
});
