/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useCallback } from 'react';

import { telegptSettings } from '../api/user-settings';
import { SettingIcon } from '../icons';

import { DrawerKey, useDrawerStore } from './DrawerContext';

const SummaryHeaderActions = () => {
  const { openDrawer } = useDrawerStore();
  const handleShowRightPanel = useCallback(() => {
    openDrawer(DrawerKey.PersonalizeSettings);
    telegptSettings.getGptSettings();
  }, [openDrawer]);

  return (
    <div className="cursor-pointer flex flex-row gap-[6px] items-center" onClick={handleShowRightPanel}>
      <span className="text-[var(--color-text-secondary)]">
        <SettingIcon />
      </span>
      <span className="text-[16px] font-semibold">Personalize</span>
    </div>
  );
};
export default SummaryHeaderActions;
