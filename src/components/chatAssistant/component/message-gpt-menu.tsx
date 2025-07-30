import React, { memo } from '../../../lib/teact/teact';

import {
  AIReplyIcon, AITranslateIcon, MeetingIcon, SummarizeIcon,
} from '../utils/icons';

import './message-gpt-menu.scss';

import SerenaPath from '../assets/serena.png';

const menuItemClass = 'w-[20px] h-[20px] text-[16px] cursor-pointer flex items-center justify-center';

const MessageGptMenu = memo(() => {
  return (
    <div className="message-gpt-menu">
      <div className={menuItemClass}>
        <img className="w-[20px] h-[20px]" src={SerenaPath} alt="" />
      </div>
      <div className={menuItemClass}>
        <AITranslateIcon width={20} height={20} />
      </div>
      <div className={menuItemClass}>
        <MeetingIcon width={20} height={20} />
      </div>
      <div className={menuItemClass}>
        <SummarizeIcon width={20} height={20} />
      </div>
      <div className={menuItemClass}>
        <AIReplyIcon width={20} height={20} />
      </div>
    </div>
  );
});
export default MessageGptMenu;
