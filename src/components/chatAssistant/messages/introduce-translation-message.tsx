/* eslint-disable max-len */
import React from 'react';

import SummaryBg from '../assets/summary-introduce/summarize.png';

const listStyle = 'text-[15px] text-[var(--color-text)]';
const IntroduceTranslationMessage = () => {
  return (
    <div className="rounded-[16px] w-[488px] bg-white dark:bg-[#292929]">
      <img src={SummaryBg} alt="" className="w-[490px] h-[259px]" />
      <div className="py-[14px] px-[12px]">

        <h3>🔥 Real-time Translation 🔥</h3>
        <ul className="pl-[24px] list-disc">
          <li className={listStyle}>
            <b>Instant Translation While Typing:</b> Automatically detects the source language and translates it into the target language in real time.
          </li>
          <li className={listStyle}>
            <b>Multi-language Support:</b> Covers major languages, including English, Chinese, Japanese, French, German, Spanish, and more.
          </li>
          <li className={listStyle}>
            <b>Context-aware Translation:</b> Enhances accuracy and fluency by leveraging message context and chat history.
          </li>
        </ul>
        <h3>🔥 Grammar & Style Check 🔥</h3>
        <ul className="pl-[24px] list-disc">
          <li className={listStyle}>
            <b>Automatic Error Detection:</b> Identifies spelling, grammar, and sentence structure issues.
          </li>
          <li className={listStyle}>
            <b>Expression Optimization:</b> Suggests more natural and professional phrasing suitable for business or formal messages.
          </li>
          <li className={listStyle}>
            <b>Multilingual Correction:</b> Supports grammar checks not only in English but also in other languages, such as Chinese.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default IntroduceTranslationMessage;
