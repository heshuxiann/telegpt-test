import { v4 as uuidv4 } from 'uuid';

import { AIMessageType, Message } from '../messages/types';

export const createIntroduceMeetingMessage = (): Message => {
  return {
    timestamp: new Date().getTime(),
    content: '',
    id: uuidv4(),
    createdAt: new Date(),
    role: 'teleai-system',
    type: AIMessageType.MeetingIntroduce,
  };
};
export const createIntroduceSummaryMessage = (): Message => {
  return {
    timestamp: new Date().getTime(),
    content: '',
    id: uuidv4(),
    createdAt: new Date(),
    role: 'teleai-system',
    type: AIMessageType.SummaryIntroduce,
  };
};
export const createIntroduceTranslationMessage = (): Message => {
  return {
    timestamp: new Date().getTime(),
    content: '',
    id: uuidv4(),
    createdAt: new Date(),
    role: 'teleai-system',
    type: AIMessageType.TranslationIntroduce,
  };
};
export const createIntroduceActionsMessage = (): Message => {
  return {
    timestamp: new Date().getTime(),
    content: '',
    id: uuidv4(),
    createdAt: new Date(),
    role: 'teleai-system',
    type: AIMessageType.ActionsIntroduce,
  };
};

export const createGlobalIntroduceMessage = (): Message => {
  return {
    timestamp: new Date().getTime(),
    content: '',
    id: 'intro-message-global-summary', // 使用固定的特殊 ID
    createdAt: new Date(),
    role: 'teleai-system',
    type: AIMessageType.GlobalIntroduce,
  };
};
