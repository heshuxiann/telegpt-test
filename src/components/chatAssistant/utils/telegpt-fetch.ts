import CryptoJS from 'crypto-js';
import { getGlobal } from '../../../global';

import { SERVER_API_URL } from '../../../config';
import { getUserFullName } from '../../../global/helpers';
import { selectUser } from '../../../global/selectors';
import { handlePaymentError } from '../../../util/paymentErrorHandler';

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
    'x-auth-key': key,
    platform: 'web',
    version: '1.0.0',
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
    version: '1.0.0',
  };
  if (userName) headers['user-name'] = userName;
  return fetch(`${SERVER_API_URL}${path}`, {
    method,
    headers,
    body: params,
  }).then((response) => response.json())
    .then((res) => {
      handlePaymentError(res);
      return res;
    });
}
