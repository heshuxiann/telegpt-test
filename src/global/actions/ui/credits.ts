import type { ActionReturnType } from '../../types';

import {
  addActionHandler,
  setGlobal,
} from '../../index';

addActionHandler('updateSubscriptionInfo', (global, actions, payload): ActionReturnType => {
  const { subscriptionType,
    creditBalance,
    createdAt,
    subscriptionExpiresAt,
    isExpirated,
  } = payload;

  // Update global credits state
  global = {
    ...global,
    subscriptionInfo: {
      subscriptionType,
      creditBalance,
      createdAt,
      subscriptionExpiresAt,
      isExpirated,
    },
  };
  setGlobal(global);
  return global;
});
