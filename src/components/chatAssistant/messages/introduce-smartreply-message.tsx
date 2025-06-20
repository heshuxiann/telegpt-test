/* eslint-disable max-len */
import React from 'react';

import SmartReplyBg from '../assets/summary-introduce/smartreply.png';

const listStyle = 'text-[15px] text-[var(--color-text)]';
const IntroduceSmartreplyMessage = () => {
  return (
    <div className="rounded-[16px] bg-[var(--color-background)] w-[488px]">
      <img src={SmartReplyBg} alt="" className="w-[490px] h-[259px]" />
      <div className="py-[14px] px-[12px]">
        <h3>🔥 Smart Replies, Smarter Conversations 🔥</h3>
        <ul className="pl-[24px] list-disc">
          <li className={listStyle}>
            Say goodbye to repetitive typing—let AI handle your frequently used messages.
          </li>
          <li className={listStyle}>
            Through intelligent semantic recognition in chat scenarios, the system automatically matches and sends preset responses, enabling fast and efficient communication.
          </li>
          <li className={listStyle}>
            Whether it's customer inquiries, daily collaboration, or information confirmation, Smart Replies help you save time and boost response efficiency.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default IntroduceSmartreplyMessage;
