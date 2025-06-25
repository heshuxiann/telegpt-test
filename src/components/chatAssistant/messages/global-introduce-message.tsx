/* eslint-disable max-len */
import React from 'react';
import { useSWRConfig } from 'swr';
import { getGlobal } from '../../../global';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { selectUser } from '../../../global/selectors';
import buildClassName from '../../../util/buildClassName';
import {
  createIntroducePortraitMessage, createIntroduceReplyMessage, createIntroduceSummaryMessage, createIntroduceTranslationMessage,
} from '../globalSummary/summary-utils';
import { ChataiStores } from '../store';

import './global-intoduce-message.scss';
import styles from './global-intoduce-message.module.scss';

export const GlobalIntroduceMessage = () => {
  const { mutate } = useSWRConfig();
  const global = getGlobal();
  const { currentUserId } = global;
  const currentUser = currentUserId ? selectUser(global, currentUserId) : undefined;
  const sendSmartreplyIntroduceMessage = () => {
    const message = createIntroduceReplyMessage();
    ChataiStores.summary?.storeMessage(message);
    eventEmitter.emit(Actions.AddSummaryMessage, message);
    mutate('messages:should-scroll', 'smooth');
  };
  const sendSmmaryIntroduceMessage = () => {
    const message = createIntroduceSummaryMessage();
    ChataiStores.summary?.storeMessage(message);
    eventEmitter.emit(Actions.AddSummaryMessage, message);
    mutate('messages:should-scroll', 'smooth');
  };
  const sendPortraitIntroduceMessage = () => {
    const message = createIntroducePortraitMessage();
    ChataiStores.summary?.storeMessage(message);
    eventEmitter.emit(Actions.AddSummaryMessage, message);
    mutate('messages:should-scroll', 'smooth');
  };
  const sendTranslationIntroduceMessage = () => {
    const message = createIntroduceTranslationMessage();
    ChataiStores.summary?.storeMessage(message);
    eventEmitter.emit(Actions.AddSummaryMessage, message);
    mutate('messages:should-scroll', 'smooth');
  };
  return (
    <div className="global-summary-introduce">
      <h3>Hi {[currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ')} 👋</h3>
      <h3>How can I help you today！</h3>
      <div className="bg-[var(--color-background)] rounded-[16px] p-[15px] grid grid-cols-2 gap-[12px] w-[743px] mt-[10px] mb-[20px]">
        <div
          className={buildClassName(styles.introduceSummary, 'global-summary-introduce-item')}
          onClick={sendSmmaryIntroduceMessage}
        >
          <div className="text-[18px] font-bold mb-[10px] text-[var(--color-text)]">
            📝 AI Summarize
          </div>
          <div className="text-[14px] leading-[18px] text-[var(--color-text-secondary)]">
            Auto-summarizes your messages and to-dos, and reports on demand.
          </div>
        </div>
        <div
          className={buildClassName(styles.introducePortrait, 'global-summary-introduce-item')}
          onClick={sendPortraitIntroduceMessage}
        >
          <div className="text-[18px] font-bold mb-[10px] text-[var(--color-text)]">
            📚️ AI Portrait
          </div>
          <div className="text-[14px] leading-[18px] text-[var(--color-text-secondary)]">
            AI reads your chats to build a smart, personalized profile—instantly.
          </div>
        </div>
        <div
          className={buildClassName(styles.introduceTranslation, 'global-summary-introduce-item')}
          onClick={sendTranslationIntroduceMessage}
        >
          <div className="text-[18px] font-bold mb-[10px] text-[var(--color-text)]">
            📚️ Translation &Grammar
          </div>
          <div className="text-[14px] leading-[18px] text-[var(--color-text-secondary)]">
            Real-time Translation &Grammar Check
          </div>
        </div>
        <div
          className={buildClassName(styles.introduceSmartreply, 'global-summary-introduce-item')}
          onClick={sendSmartreplyIntroduceMessage}
        >
          <div className="text-[18px] font-bold mb-[10px] text-[var(--color-text)]">
            🚀 Smart Reply
          </div>
          <div className="text-[14px] leading-[18px] text-[var(--color-text-secondary)]">
            Generate personalized replies using conversation context and knowledge base.
          </div>
        </div>
      </div>
      <div>
        <h5 className="text-[16px] font-normal mb-[16px]"> You can also ask me like this</h5>
        <div className="flex flex-row flex-wrap gap-[12px]">
          <div className="p-[8px] rounded-[16px] text-[14px] text-[var(--color-text)] bg-[var(--color-background)]">
            Summarize unread messages
          </div>
          <div className="p-[8px] rounded-[16px] text-[14px] text-[var(--color-text)] bg-[var(--color-background)]">
            What are the most discussed crypto today?
          </div>
          <div className="p-[8px] rounded-[16px] text-[14px] text-[var(--color-text)] bg-[var(--color-background)]">
            Help me schedule a meeting for 10 AM tomorrow
          </div>
        </div>
      </div>
    </div>
  );
};
