import React from 'react';
import { getActions } from '../../../global';

import Icon from '../component/Icon';

import './upgrade-tip-message.scss';
const UpgradeTipMessage = () => {
  const { openPayPackageModal } = getActions();
  return (
    <div className="upgrade-tip-message">
      <div className="bg-[var(--color-background)] flex items-center justify-between gap-[8px] relative rounded-[10px] p-[20px]">
        <div className="headerBadge" />
        <div className="flex flex-col flex-1">
          <span className="text-[16px] font-bold text-[var(--color-text)]">Upgrade your plan</span>
          <span className="text-[14px]  text-[var(--color-text-secondary)]">
            You have reached the free usage limit. You are welcome to try TelyAI Pro for a higher usage limit.
          </span>
        </div>
        <div
          className="flex items-center justify-center gap-[8px] bg-[var(--color-primary)] text-white text-[14px] w-[95px] h-[40px] rounded-[12px] cursor-pointer"
          onClick={() => { openPayPackageModal(); }}
        >
          <span>Upgrade</span>
          <Icon name="arrow-right" />
        </div>
      </div>
    </div>
  );
};

export default UpgradeTipMessage;
