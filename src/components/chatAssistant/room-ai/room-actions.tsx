/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, { useEffect } from 'react';
import type { Message } from 'ai';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { useScrollToBottom } from '../hook/use-scroll-to-bottom';
import {
  createNewFeatureReminderMessage, generateRoomActionItems, scheduleGoogleMeeting, summaryRoomMessage,
} from './room-ai-utils';

import './room-ai.scss';

const actionItemClassName = 'py-[6px] px-[12px] border-[1px] border-[#E4E4E4] rounded-[8px] whitespace-nowrap cursor-pointer dark:border-[#292929]';

interface OwnProps {
  chatId: string | undefined;
  insertMessage: (message: Message) => void;
  setIsLoading: (isLoading: boolean) => void;
}
const RoomActions = ({ chatId, insertMessage, setIsLoading }:OwnProps) => {
  const { scrollToBottom } = useScrollToBottom();

  const handleScheduleMeeting = () => {
    setIsLoading(true);
    scheduleGoogleMeeting(insertMessage, () => setIsLoading(false));
    scrollToBottom();
  };

  const handleSummarize = () => {
    if (chatId) {
      setIsLoading(true);
      summaryRoomMessage(chatId, insertMessage, () => setIsLoading(false));
      scrollToBottom();
    }
  };

  const handleActionItems = () => {
    if (chatId) {
      setIsLoading(true);
      generateRoomActionItems(chatId, insertMessage, () => setIsLoading(false));
      scrollToBottom();
    }
  };

  const handleNewFeature = () => {
    const newFeatureMessage: Message = createNewFeatureReminderMessage();
    insertMessage(newFeatureMessage);
  };

  const handleActions = (payload:any) => {
    const { action } = payload;
    if (payload.chatId === chatId) {
      switch (action) {
        case 'summary':
          handleSummarize();
          break;
        case 'schedule-meet':
          handleScheduleMeeting();
          break;
        case 'todo':
          handleActionItems();
          break;
        case 'new-feature':
          handleNewFeature();
          break;
        default:
          break;
      }
    }
  };

  useEffect(() => {
    eventEmitter.on(Actions.RoomAIActions, handleActions);
    return () => {
      eventEmitter.off(Actions.RoomAIActions, handleActions);
    };
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [chatId]);

  return (
    <div className="flex flex-row gap-[6px] mb-[8px] px-[12px] w-full overflow-x-auto scrollbar-none text-[14px] text-[var(--color-text)]">
      <div className={actionItemClassName} onClick={handleSummarize}>
        🧠 Chat Summary
      </div>
      <div className={actionItemClassName} onClick={handleScheduleMeeting}>
        📅 Schedule meeting
      </div>
      <div className={actionItemClassName} onClick={handleActionItems}>
        ✅ Action Items
      </div>
    </div>
  );
};

export default RoomActions;
