import React, { memo } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type { GlobalState } from '../../../global/types';
import type { ThemeKey } from '../../../types';

import { selectTheme } from '../../../global/selectors';

import AiChatFoldersBg from '../../../assets/chat_ai_folder.png';
import AiChatFoldersDarkBg from '../../../assets/chat_ai_folder_dark.png';
import SerenaPath from '../assets/serena.png';

type StateProps = {
  theme: ThemeKey;
  subscriptionInfo: GlobalState['subscriptionInfo'];
};
interface OwnProps {
  subscriptionType: string;
}
const UpgradeTip = (props: StateProps & OwnProps) => {
  const { theme, subscriptionType } = props;
  const { openPayPackageModal } = getActions();
  return (
    <div
      className="p-[12px] flex flex-row items-center relative gap-3"
      style={`background-image: url(${
        theme === 'dark' ? AiChatFoldersDarkBg : AiChatFoldersBg
      }); background-size: 100% 100%;`}
    >
      <img src={SerenaPath} alt="" className="w-[24px] h-[24px]" />
      {subscriptionType && (
        <span className="text-[var(--color-aichatfolders-tag-text)] text-[12px]">
          {subscriptionType === 'free' ? 'Unlock more power with TelyAI' : 'Go limitless with Pro.'}
        </span>
      )}
      <div
        className="bg-[var(--color-background)] h-[24px] px-[8px] text-[12px] font-medium text-[var(--color-text)] ml-auto rounded-[12px] leading-[24px] cursor-pointer"
        onClick={() => openPayPackageModal()}
      >
        Upgrade
      </div>
    </div>
  );
};

export default memo(
  withGlobal<OwnProps>((global) => {
    const {
      subscriptionInfo,
    } = global;
    return {
      theme: selectTheme(global),
      subscriptionInfo,
    };
  })(UpgradeTip),
);
