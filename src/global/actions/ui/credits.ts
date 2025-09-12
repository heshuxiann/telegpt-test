import type { ActionReturnType } from '../../types';

import {
  addActionHandler,
  setGlobal,
} from '../../index';

addActionHandler('updateCredits', (global, actions, payload): ActionReturnType => {
  const { totalPoints, pointsHistory } = payload;

  // Update global credits state
  global = {
    ...global,
    credits: {
      totalPoints,
      pointsHistory: pointsHistory || global.credits?.pointsHistory,
    },
  };
  setGlobal(global);
  return global;
});
