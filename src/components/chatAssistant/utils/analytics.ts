/* eslint-disable no-console */
// utils/analytics.ts

import { getGlobal } from '../../../global';

import { getUserFullName } from '../../../global/helpers';
import { selectUser } from '../../../global/selectors';

export const sendGAEvent = (
  eventName: string,
  params?: Record<string, any>,
): void => {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    const global = getGlobal();
    const { currentUserId } = global;
    const user = selectUser(global, currentUserId!);
    const name = getUserFullName(user);
    params = {
      ...params,
      userId: currentUserId,
      name,
    };
    (window as any).gtag('event', eventName, params || {});
  } else {
    console.warn('gtag is not defined');
  }
};
