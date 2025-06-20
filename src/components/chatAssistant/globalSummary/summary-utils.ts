import { v4 as uuidv4 } from 'uuid';

import type { SummaryStoreMessage } from '../store/summary-store';

export const createIntroduceReplyMessage = ():SummaryStoreMessage => {
  return {
    timestamp: new Date().getTime(),
    content: '',
    id: uuidv4(),
    createdAt: new Date(),
    role: 'assistant',
    annotations: [{
      type: 'global-smartreply-introduce',
    }],
  };
};
export const createIntroduceSummaryMessage = ():SummaryStoreMessage => {
  return {
    timestamp: new Date().getTime(),
    content: '',
    id: uuidv4(),
    createdAt: new Date(),
    role: 'assistant',
    annotations: [{
      type: 'global-summary-introduce',
    }],
  };
};
export const createIntroduceTranslationMessage = ():SummaryStoreMessage => {
  return {
    timestamp: new Date().getTime(),
    content: '',
    id: uuidv4(),
    createdAt: new Date(),
    role: 'assistant',
    annotations: [{
      type: 'global-translation-introduce',
    }],
  };
};
export const createIntroducePortraitMessage = ():SummaryStoreMessage => {
  return {
    timestamp: new Date().getTime(),
    content: '',
    id: uuidv4(),
    createdAt: new Date(),
    role: 'assistant',
    annotations: [{
      type: 'global-portrait-introduce',
    }],
  };
};
