import CryptoJS from 'crypto-js';
import { getGlobal } from '../../../global';

import { SERVER_API_URL } from '../../../config';
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

function generateKey(userId: string) {
  const timestamp = Date.now();
  const raw = `${userId}:${timestamp}`;

  const signature = CryptoJS.HmacSHA256(raw, SECRET).toString(CryptoJS.enc.Hex);

  return `${userId}:${timestamp}:${signature}`;
}

export function getApihHeaders() {
  const { userId, userName } = getCurrentUserInfo();
  const key = generateKey(userId!);
  const headers: Record<string, string> = {
    platform: 'web',
    version: '1.0.0',
  };
  if (userId) headers['x-auth-key'] = key;
  if (userName) headers['user-name'] = userName;
  return headers;
}

function objectToFormData(obj: Record<string, any>) {
  const formData = new FormData();
  for (const key in obj) {
    formData.append(key, obj[key]);
  }
  return formData;
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
    platform: 'web',
    version: '1.0.0',
  };
  if (userId) headers['x-auth-key'] = key;
  if (userName) headers['user-name'] = encodeURIComponent(userName);
  let mBody: any = undefined;
  if (method !== 'GET' && params) {
    if (contentType === 'application/json') {
      headers['Content-Type'] = 'application/json';
      mBody = params;
    } else if (contentType === 'multipart/form-data') {
      mBody = params instanceof FormData ? params : objectToFormData(params);
    }
  }
  return fetch(`${SERVER_API_URL}${path}`, {
    method,
    headers,
    body: mBody,
  }).then((response) => response.json())
    .then((res) => {
      return res;
    });
}
