/* eslint-disable max-len */
import React from 'react';

import PortraitBg from '../assets/summary-introduce/portrait.png';

const listStyle = 'text-[15px] text-[var(--color-text)]';
const IntroducePortraitMessage = () => {
  return (
    <div className="rounded-[16px] bg-[var(--color-background)] w-[488px]">
      <img src={PortraitBg} alt="" className="w-[490px] h-[259px]" />
      <div className="py-[14px] px-[12px]">
        <h3>🧠 User Profiling Feature Overview</h3>
        <p className={listStyle}>
          Serena AI intelligently analyzes user behavior and content patterns in Telegram to build a rich, multi-dimensional profile that powers precision operations and smart recommendations.
        </p>
        <h3>🔑 Key Highlights:</h3>
        <ul className="pl-[24px] list-disc">
          <li className={listStyle}>
            <b>Automatic Behavior Recognition</b>
            <p>
              Detects user message frequency, content themes, and published Story-type updates across different Telegram groups.
            </p>
          </li>
          <li className={listStyle}>
            <b>Topic & Group Pattern Mining</b>
            <p>
              Extracts high-frequency discussion topics and active group participation to generate personalized, explainable user tags.
            </p>
          </li>
          <li className={listStyle}>
            <b>Structured Multi-Group Profiling</b>
            <p>
              Presents a comprehensive user profile with basic info, tag classification, dynamic content stream, and cross-group behavioral timeline.
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default IntroducePortraitMessage;
