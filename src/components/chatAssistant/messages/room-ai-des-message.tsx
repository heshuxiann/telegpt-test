/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable @stylistic/jsx-quotes */
import React from 'react';
import type { Message } from '@ai-sdk/react';
import { getGlobal } from '../../../global';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { selectChat } from '../../../global/selectors';

const actionItemClassName = 'h-[40px] w-fit px-[12px] py-[8px] rounded-[6px] bg-[#F5F1FF] text-[14px] text-[var(--color-text)] dark:bg-[#383838]';

const RoomAIDescriptionMessage = ({ message }: { message: Message }) => {
  const { content: chatId } = message;
  const global = getGlobal();
  const chat = selectChat(global, chatId);
  const handleSummarize = () => {
    eventEmitter.emit(Actions.RoomAIActions, {
      chatId,
      action: 'summary',
    });
  };
  const handleScheduleMeeting = () => {
    eventEmitter.emit(Actions.RoomAIActions, {
      chatId,
      action: 'schedule-meet',
    });
  };
  const handleActionItems = () => {
    eventEmitter.emit(Actions.RoomAIActions, {
      chatId,
      action: 'todo',
    });
  };
  const handleNewFeature = () => {
    eventEmitter.emit(Actions.RoomAIActions, {
      chatId,
      action: 'new-feature',
    });
  };
  const handleSendMessage = (value: string) => {
    eventEmitter.emit(Actions.AskRoomAI, value);
  };
  return (
    <div className="px-[12px]">
      <div className="px-3 py-2 rounded-xl text-[var(--color-text)] bg-white dark:bg-[#292929]">
        <p className="text-[14px]">
          👋 Hi, welcome to 【
          {chat?.title}
          】!
          I’m TelyAI 🤖, your smart assistant here.
        </p>
        <div className="mt-[1rem]">
          <h3 className="text-[14px] font-semibold">🚀 Here’s what I can help you with:</h3>
          <div className="flex flex-row flex-wrap gap-[8px] mt-[0.5rem]">
            <div className={actionItemClassName} onClick={handleSummarize}>
              🧠 Chat Summary
            </div>
            <div className={actionItemClassName} onClick={handleActionItems}>
              ✅ Action Items
            </div>
            <div className={actionItemClassName} onClick={handleNewFeature}>
              🔍 Group Search
            </div>
            <div className={actionItemClassName} onClick={handleNewFeature}>
              👮 User Portrait
            </div>
            <div className={actionItemClassName} onClick={handleScheduleMeeting}>
              📅 Schedule Meeting
            </div>
          </div>
        </div>
        <div className="mt-[1rem]">
          <h3 className="text-[14px] font-semibold !mb-[10px]">📍 You can ask me things like:</h3>
          <ul className="list-disc pl-[24px] text-[14px] text-[var(--color-text)]">
            <li className='cursor-pointer mb-[10px]' onClick={() => handleSendMessage('What’s new today?')}>What’s new today?</li>
            <li className='cursor-pointer' onClick={() => handleSendMessage('Summarize today’s crypto market highlights.')}>
              Summarize today’s crypto market highlights.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RoomAIDescriptionMessage;
