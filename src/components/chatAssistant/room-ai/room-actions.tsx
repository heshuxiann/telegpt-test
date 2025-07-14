/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React from 'react';
import type { Message } from 'ai';

import { useScrollToBottom } from '../hook/use-scroll-to-bottom';
import { generateRoomActionItems, scheduleGoogleMeeting, summaryRoomMessage } from './room-ai-utils';

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

  return (
    <div className="flex flex-row gap-[6px] mb-[8px] px-[12px] w-full overflow-x-auto scrollbar-none text-[14px] text-[var(--color-text)]">
      <div className={actionItemClassName} onClick={handleSummarize}>
        🧠 Chat Summarize
      </div>
      <div className={actionItemClassName} onClick={handleScheduleMeeting}>
        📅 Schedule meeting
      </div>
      <div className={actionItemClassName} onClick={handleActionItems}>
        ✅ To-do list
      </div>
    </div>
  );
};

export default RoomActions;
