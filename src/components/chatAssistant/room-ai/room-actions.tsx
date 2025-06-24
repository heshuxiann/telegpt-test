/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React from 'react';
import type { Message } from 'ai';

import { generateRoomActionItems, scheduleGoogleMeeting, summaryRoomMessage } from './room-ai-utils';

import './room-ai.scss';

const actionItemClassName = 'py-[6px] px-[12px] border-[1px] border-[#E4E4E4] rounded-[8px] whitespace-nowrap cursor-pointer';

interface OwnProps {
  chatId: string | undefined;
  insertMessage: (message: Message) => void;
  setIsLoading: (isLoading: boolean) => void;
}
const RoomActions = ({ chatId, insertMessage, setIsLoading }:OwnProps) => {
  const handleScheduleMeeting = () => {
    setIsLoading(true);
    scheduleGoogleMeeting(insertMessage, () => setIsLoading(false));
  };

  const handleSummarize = () => {
    if (chatId) {
      setIsLoading(true);
      summaryRoomMessage(chatId, insertMessage, () => setIsLoading(false));
    }
  };

  const handleActionItems = () => {
    if (chatId) {
      setIsLoading(true);
      generateRoomActionItems(chatId, insertMessage, () => setIsLoading(false));
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
