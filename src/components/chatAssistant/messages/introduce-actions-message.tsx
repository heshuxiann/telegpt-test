/* eslint-disable max-len */
import React from 'react';

import ActionsBg from '../assets/summary-introduce/actions.png';

const listStyle = 'text-[15px] text-[var(--color-text)]';
const IntroduceActionsMessage = () => {
  return (
    <div className="rounded-[16px] w-[488px] bg-[var(--color-background)]">
      <img src={ActionsBg} alt="" className="w-[490px] h-[259px]" />
      <div className="py-[14px] px-[12px]">
        <h3>✅  Action Items</h3>
        <p className={listStyle}>
          During message summarization, the AI assistant automatically identifies actionable tasks and follow-ups from your chats. No need to take notes—your to-do list is generated in real time, helping you stay organized and never miss a beat.
        </p>
      </div>
    </div>
  );
};

export default IntroduceActionsMessage;
