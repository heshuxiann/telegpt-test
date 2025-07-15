/* eslint-disable max-len */
import React from 'react';

import ScheduleMeetBg from '../assets/summary-introduce/schedule-meeting.png';

const listStyle = 'text-[15px] text-[var(--color-text)]';
const IntroduceMeetingMessage = () => {
  return (
    <div className="rounded-[16px] w-[488px] bg-[var(--color-background)]">
      <img src={ScheduleMeetBg} alt="" className="w-[490px] h-[259px]" />
      <div className="py-[14px] px-[12px]">
        <h3>🔥 Meeting Scheduler 🔥</h3>
        <ul className="pl-[24px] list-disc">
          <li className={listStyle}>
            Automatic Detection & Smart Coordination
            The AI assistant instantly recognizes meeting-related messages, asks for time, participants, and other details—all through natural chat flow.
          </li>
          <li className={listStyle}>
            Instant Invite Delivery
            Once confirmed, it auto-generates and sends calendar invites, keeping everyone in sync without ever leaving the conversation.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default IntroduceMeetingMessage;
