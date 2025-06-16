/* eslint-disable max-len */
import React from 'react';

const actionItemClassName = 'h-[40px] w-fit px-[12px] py-[8px] rounded-[6px] bg-[#F5F1FF] text-[14px] text-[var(--color-text)]';

const RoomAIDescription = () => {
  return (
    <div className="px-[12px] pt-4">
      <div className="px-3 py-2 rounded-xl bg-[#fff]">
        <p className="text-[14px]">
          👋 Hi, welcome to 【BlockBeats Chats】!
          I’m Serena 🤖, your smart assistant in the group. This group mainly discusses topics related to cryptocurrency, mining, and more.
        </p>
        <div>
          <h3 className="mt-[0.5rem] text-[14px] font-semibold">🚀 Here’s what I can help you with:</h3>
          <div className="flex flex-col gap-[8px]">
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
        <div>
          <h3 className="mt-[0.5rem] text-[14px] font-semibold">📍 You can ask me things like:</h3>
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

export default RoomAIDescription;
