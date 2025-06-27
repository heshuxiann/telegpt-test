/* eslint-disable max-len */
import React from 'react';
import type { Message } from '@ai-sdk/react';
import { getGlobal } from '../../../global';

import { selectChat } from '../../../global/selectors';

const actionItemClassName = 'h-[40px] w-fit px-[12px] py-[8px] rounded-[6px] bg-[#F5F1FF] text-[14px] text-[var(--color-text)] dark:bg-[#383838]';

const RoomAIDescriptionMessage = ({ message }:{ message:Message }) => {
  const { content: chatId } = message;
  const global = getGlobal();
  const chat = selectChat(global, chatId);
  return (
    <div className="px-[12px]">
      <div className="px-3 py-2 rounded-xl text-[var(--color-text)] bg-white dark:bg-[#292929]">
        <p className="text-[14px]">
          👋 Hi, welcome to 【{chat?.title}】!
          I’m Serena 🤖, your smart assistant in the group.
        </p>
        <div className="mt-[0.5rem]">
          <h3 className="text-[14px] font-semibold">🚀 Here’s what I can help you with:</h3>
          <div className="flex flex-col gap-[8px] mt-[0.5rem]">
            <div className={actionItemClassName}>
              🧠 Summarize key conversations
            </div>
            <div className={actionItemClassName}>
              📅 Schedule meetings
            </div>
            <div className={actionItemClassName}>
              ✅ Action Items
            </div>
            <div className={actionItemClassName}>
              🔍 Group search
            </div>
            <div className={actionItemClassName}>
              👮 User Portrait
            </div>
            <div className={actionItemClassName}>
              🎯 Project tracking
            </div>
          </div>
        </div>
        <div className="mt-[0.5rem]">
          <h3 className="text-[14px] font-semibold">📍 You can ask me things like:</h3>
          <ul className="list-disc pl-[24px] text-[14px] text-[var(--color-text)]">
            <li>What was discussed in the group yesterday?</li>
            <li>
              Has there been any mention of client  . feedback in the group?
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RoomAIDescriptionMessage;
