/* eslint-disable max-len */
import React from 'react';

import SummaryBg from '../assets/summary-introduce/summarize.png';

const listStyle = 'text-[15px] text-[var(--color-text)]';
const IntroduceSummaryMessage = () => {
  return (
    <div className="rounded-[16px] bg-[var(--color-background)] w-[488px]">
      <img src={SummaryBg} alt="" className="w-[490px] h-[259px]" />
      <div className="py-[14px] px-[12px]">
        <h3>🔥 Message Summarization 🔥</h3>
        <p className={listStyle}>
          The Message Summarization feature uses AI to automatically extract key content from IM conversations and periodically generate summary reports. It helps users efficiently grasp important group updates, improve information retrieval, and avoid missing critical messages.
        </p>
        <h3>🔑 Key Capabilities:</h3>
        <ul className="pl-[24px] list-disc">
          <li className={listStyle}>
            🔍 Automatically extracts topics, key figures, time references, and user insights from chat messages
          </li>
          <li className={listStyle}>
            🧠 Intelligently identifies and groups content by chat, ensuring clarity and structure
          </li>
          <li className={listStyle}>
            🕒 Automatically generates summary reports during active hours, adapting to peak and off-peak periods
          </li>
          <li className={listStyle}>
            🎯 Supports personalized summary customization, allowing users to focus on specific chats or content types
          </li>
        </ul>
      </div>
    </div>
  );
};

export default IntroduceSummaryMessage;
