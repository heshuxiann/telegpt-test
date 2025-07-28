/* eslint-disable import/extensions */
// src/electron/google-oauth.ts
import { Blob } from 'blob-polyfill';
import log from 'electron-log';
import { FormData } from 'formdata-polyfill/esm.min.js';
import { OAuth2Client } from 'google-auth-library';
import http from 'http';
import net from 'net';
import fetch, { Headers, Request, Response } from 'node-fetch';
import open from 'open';
import destroyer from 'server-destroy';
import url from 'url';

import { initProxy } from './proxy';

(globalThis as any).fetch = fetch;
(globalThis as any).Headers = Headers;
(globalThis as any).Request = Request;
(globalThis as any).Response = Response;
(globalThis as any).net = net;
(globalThis as any).Blob = Blob;
(globalThis as any).FormData = FormData;

const PORT = 51217;
const keys = {
  client_id: '545055439232-bckq5vdtgnraldt5jkvaedf2ranv9md7.apps.googleusercontent.com',
  client_secret: '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',
  redirect_uris: [`http://localhost:${PORT}/oauth2callback`],
};
const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.freebusy',
  'https://www.googleapis.com/auth/calendar.freebusy',
];

function checkPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        tester.close();
        resolve(true);
      })
      .listen(port);
  });
}

export async function googleAuthFlow() {
  initProxy();
  const portAvailable = await checkPortAvailable(PORT);
  if (!portAvailable) {
    throw new Error(`端口 ${PORT} 已被占用，无法启动授权流程`);
  }
  return new Promise<any>((resolve, reject) => {
    const oAuth2Client = new OAuth2Client({
      clientId: keys.client_id,
      clientSecret: keys.client_secret,
      redirectUri: keys.redirect_uris[0],
    });

    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_SCOPES,
      prompt: 'consent',
    });
    log.info('authorizeUrl', authorizeUrl);
    let timeoutId: NodeJS.Timeout;
    const server = http.createServer(async (req, res) => {
      log.info('当前 HTTPS_PROXY', process.env.HTTPS_PROXY);
      if (req.url?.startsWith('/oauth2callback')) {
        try {
          const qs = new url.URL(req.url, `http://localhost:${PORT}`).searchParams;
          const code = qs.get('code');
          log.info('Received code:', code);
          res.end('Authentication successful! You can close this window.');
          server.destroy();

          log.info('开始调用 getToken');
          clearTimeout(timeoutId);
          server.destroy();

          const { tokens } = await oAuth2Client.getToken(code!);

          oAuth2Client.setCredentials(tokens);
          log.info('tokens', tokens);
          resolve(tokens);
        } catch (err) {
          log.error('Error getting tokens', err);
          reject(err);
          server.destroy();
        }
      }
    }).listen(PORT, () => {
      open(authorizeUrl, { wait: false }).then((cp) => cp.unref());
    });
    // 设置超时自动关闭 server 和 reject
    timeoutId = setTimeout(() => {
      log.error('授权超时');
      reject(new Error('授权超时'));
      server.destroy();
    }, 1000 * 60);

    destroyer(server);
  });
}

// export async function googleAuthFlow() {
//   initProxy();
//   const portAvailable = await checkPortAvailable(PORT);
//   if (!portAvailable) {
//     throw new Error(`端口 ${PORT} 已被占用，无法启动授权流程`);
//   }

//   return new Promise<any>((resolve, reject) => {
//     const oAuth2Client = new OAuth2Client({
//       clientId: keys.client_id,
//       clientSecret: keys.client_secret,
//       redirectUri: keys.redirect_uris[0],
//     });

//     const authorizeUrl = oAuth2Client.generateAuthUrl({
//       access_type: 'offline',
//       scope: GOOGLE_SCOPES,
//       prompt: 'consent',
//     });

//     let timeoutId: NodeJS.Timeout;
//     let authWindow: BrowserWindow | null = null;

//     const server = http.createServer(async (req, res) => {
//       if (req.url?.startsWith('/oauth2callback')) {
//         try {
//           const qs = new url.URL(req.url, `http://localhost:${PORT}`).searchParams;
//           const code = qs.get('code');
//           res.end('<html><body>认证成功，窗口即将关闭<script>window.close()</script></body></html>');

//           clearTimeout(timeoutId);
//           server.destroy();
//           authWindow?.close();

//           const { tokens } = await oAuth2Client.getToken(code!);
//           oAuth2Client.setCredentials(tokens);
//           resolve(tokens);
//         } catch (err) {
//           reject(err);
//           server.destroy();
//           authWindow?.close();
//         }
//       }
//     });

//     destroyer(server);
//     server.listen(PORT, () => {
//       authWindow = new BrowserWindow({
//         width: 500,
//         height: 600,
//         webPreferences: {
//           nodeIntegration: false,
//           contextIsolation: true,
//         },
//       });

//       authWindow.loadURL(authorizeUrl);
//       authWindow.setMenuBarVisibility(false);

//       authWindow.on('closed', () => {
//         clearTimeout(timeoutId);
//         reject(new Error('用户关闭了认证窗口'));
//         server.destroy();
//         authWindow = null;
//       });
//     });

//     timeoutId = setTimeout(() => {
//       reject(new Error('授权超时'));
//       server.destroy();
//       authWindow?.close();
//     }, 1000 * 60 * 5);
//   });
// }
