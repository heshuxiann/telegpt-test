import React from 'react';
import { getGlobal } from '../../../global';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { selectUser } from '../../../global/selectors';
import buildClassName from '../../../util/buildClassName';
import {
  createIntroduceActionsMessage, createIntroduceMeetingMessage, createIntroduceSummaryMessage, createIntroduceTranslationMessage,
} from '../global-summary/summary-utils';
import { useScrollToBottom } from '../hook/use-scroll-to-bottom';
import { ChataiStores } from '../store';

import './global-intoduce-message.scss';
import styles from './global-intoduce-message.module.scss';

export const GlobalIntroduceMessage = () => {
  const global = getGlobal();
  const { currentUserId } = global;
  const currentUser = currentUserId ? selectUser(global, currentUserId) : undefined;
  const { scrollToBottom } = useScrollToBottom();
  const sendMeetingIntroduceMessage = () => {
    const message = createIntroduceMeetingMessage();
    ChataiStores.summary?.storeMessage(message);
    eventEmitter.emit(Actions.AddSummaryMessage, message);
    scrollToBottom();
  };
  const sendSmmaryIntroduceMessage = () => {
    const message = createIntroduceSummaryMessage();
    ChataiStores.summary?.storeMessage(message);
    eventEmitter.emit(Actions.AddSummaryMessage, message);
    scrollToBottom();
  };
  const sendActionsIntroduceMessage = () => {
    const message = createIntroduceActionsMessage();
    ChataiStores.summary?.storeMessage(message);
    eventEmitter.emit(Actions.AddSummaryMessage, message);
    scrollToBottom();
  };
  const sendTranslationIntroduceMessage = () => {
    const message = createIntroduceTranslationMessage();
    ChataiStores.summary?.storeMessage(message);
    eventEmitter.emit(Actions.AddSummaryMessage, message);
    scrollToBottom();
  };
  const handleSendMessage = (value: string) => {
    eventEmitter.emit(Actions.AskGlobalAI, value);
  };
  return (
    <div className="global-summary-introduce">
      <h3>
        Hi
        {[currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ')}
        {' '}
        👋
      </h3>
      <h3>How can I help you today！</h3>
      <div className="rounded-[16px] p-[15px] grid grid-cols-2 gap-[12px] w-[743px] mt-[10px] mb-[20px] bg-[var(--color-background)]">
        <div
          className={buildClassName(styles.introduceSummary, 'global-summary-introduce-item')}
          onClick={sendSmmaryIntroduceMessage}
        >
          <div className="text-[18px] font-bold mb-[10px] text-[var(--color-text)]">
            📝 AI Summary
          </div>
          <div className="text-[14px] leading-[18px] text-[var(--color-text-secondary)] pr-[120px]">
            Get instant, clear takeaways during the chat
          </div>
        </div>
        <div
          className={buildClassName(styles.introduceActions, 'global-summary-introduce-item')}
          onClick={sendActionsIntroduceMessage}
        >
          <div className="text-[18px] font-bold mb-[10px] text-[var(--color-text)]">
            ✅ Action Items
          </div>
          <div className="text-[14px] leading-[18px] text-[var(--color-text-secondary)] pr-[120px]">
            Automatically capture next steps and assignments.
          </div>
        </div>
        <div
          className={buildClassName(styles.introduceTranslation, 'global-summary-introduce-item')}
          onClick={sendTranslationIntroduceMessage}
        >
          <div className="text-[18px] font-bold mb-[10px] text-[var(--color-text)]">
            📚️ Translation & Grammar Check
          </div>
          <div className="text-[14px] leading-[18px] text-[var(--color-text-secondary)] pr-[120px]">
            Communicate effortlessly, in any language.
          </div>
        </div>
        <div
          className={buildClassName(styles.introduceSmartreply, 'global-summary-introduce-item')}
          onClick={sendMeetingIntroduceMessage}
        >
          <div className="text-[18px] font-bold mb-[10px] text-[var(--color-text)]">
            🚀 Meeting Scheduler
          </div>
          <div className="text-[14px] leading-[18px] text-[var(--color-text-secondary)] pr-[120px]">
            Book and organize meetings with ease.
          </div>
        </div>
      </div>
      <div>
        <h5 className="text-[16px] font-normal !mb-[12px]"> You can also ask me like this</h5>
        <div className="flex flex-row flex-wrap gap-[12px]">
          <div
            className="cursor-pointer p-[8px] rounded-[16px] text-[14px] text-[var(--color-text)] bg-[var(--color-background)]"
            onClick={() => handleSendMessage('What’s new today?')}
          >
            What’s new today?
          </div>
          <div
            className="cursor-pointer p-[8px] rounded-[16px] text-[14px] text-[var(--color-text)] bg-[var(--color-background)]"
            onClick={() => handleSendMessage('Summarize today’s crypto market highlights.')}
          >
            Summarize today’s crypto market highlights.
          </div>
        </div>
      </div>
    </div>
  );
};
