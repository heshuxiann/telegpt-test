import { getGlobal } from '../../../global';

import { SERVER_API_URL } from '../../../config';
import { getUserFullName } from '../../../global/helpers';
import { selectUser } from '../../../global/selectors';

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
export function TelegptFetch(path: string, method: 'POST' | 'GET' | 'DELETE', params: any) {
  const { userId, userName } = getCurrentUserInfo();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (userId) headers.userId = userId;
  if (userName) headers.userName = userName;
  return fetch(`${SERVER_API_URL}${path}`, {
    method,
    headers,
    body: JSON.stringify(params),
  });
}
