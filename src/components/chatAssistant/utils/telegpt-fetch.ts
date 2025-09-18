import CryptoJS from 'crypto-js';
import { getGlobal } from '../../../global';

import { getUserFullName } from '../../../global/helpers';
import { selectUser } from '../../../global/selectors';

const SECRET = 'telgpt-sha256-secret';
export const getCurrentUserInfo = () => {
  const global = getGlobal();
  const { currentUserId } = global;
  const user = selectUser(global, currentUserId!);
  const userName = getUserFullName(user);
  return {
    userId: currentUserId,
    userName,
  };
};

// function generateKey(userId: string) {
//   const timestamp = Date.now(); // 毫秒级时间戳
//   const raw = `${userId}:${timestamp}`;
//   const signature = crypto
//     .createHmac('sha256', SECRET)
//     .update(raw)
//     .digest('hex');

//   return {
//     key: `${userId}:${timestamp}:${signature}`, // 传给服务端的key
//   };
// }

function generateKey(userId: string) {
  const timestamp = Date.now();
  const raw = `${userId}:${timestamp}`;

  const signature = CryptoJS.HmacSHA256(raw, SECRET).toString(CryptoJS.enc.Hex);

  return `${userId}:${timestamp}:${signature}`;
}

// async function generateKey(userId: string) {
//   const timestamp = Date.now();
//   const raw = `${userId}:${timestamp}`;

//   const enc = new TextEncoder();
//   const keyData = enc.encode(SECRET);
//   const msg = enc.encode(raw);

//   const cryptoKey = await window.crypto.subtle.importKey(
//     'raw',
//     keyData,
//     { name: 'HMAC', hash: 'SHA-256' },
//     false,
//     ['sign'],
//   );

//   const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, msg);
//   const signatureArray = Array.from(new Uint8Array(signatureBuffer));
//   const signatureHex = signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');

//   return `${userId}:${timestamp}:${signatureHex}`;
// }

export function getApihHeaders() {
  const { userId, userName } = getCurrentUserInfo();
  const key = generateKey(userId!);
  const headers: Record<string, string> = {
    'x-auth-key': key,
    platform: 'web',
  };
  if (userName) headers['user-name'] = userName;
  return headers;
}
export function TelegptFetch(
  path: string,
  method: 'POST' | 'GET' | 'DELETE',
  params?: any,
  contentType = 'application/json',
) {
  const { userId, userName } = getCurrentUserInfo();
  const key = generateKey(userId!);
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'x-auth-key': key,
    platform: 'web',
  };
  if (userName) headers['user-name'] = userName;
  return fetch(`http://localhost:3000${path}`, {
    method,
    headers,
    body: params,
  });
}
