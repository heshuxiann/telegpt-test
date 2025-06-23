/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useCallback, useEffect, useState } from 'react';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { CHATAI_IDB_STORE } from '../../../util/browser/idb';
import { globalSummaryTask } from '../ai-task/global-summary-task';
import { LanguageIcon, SettingIcon } from '../icons';

import { DrawerKey, useDrawerStore } from './DrawerContext';

const SummaryHeaderActions = () => {
  const { openDrawer } = useDrawerStore();
  const [summaryLanguage, setSummrayLanguage] = useState('en');

  useEffect(() => {
    CHATAI_IDB_STORE.get('summary-language').then((language:any) => {
      if (language) {
        handleLanguageChange(language);
      }
    });
    eventEmitter.on(Actions.SummaryLanguageChange, handleLanguageChange);
    return () => {
      eventEmitter.off(Actions.SummaryLanguageChange, handleLanguageChange);
    };
  }, []);

  const handleShowRightPanel = useCallback(() => {
    openDrawer(DrawerKey.PersonalizeSettings);
  }, [openDrawer]);

  const handleOpenLanguageModal = useCallback(() => {
    eventEmitter.emit(Actions.OpenSummaryLanguageModal);
  }, []);

  const handleLanguageChange = (langCode:string) => {
    const translatedNames = new Intl.DisplayNames([langCode], { type: 'language' });
    const translatedName = translatedNames.of(langCode)!;
    setSummrayLanguage(translatedName);
    globalSummaryTask.updateSummaryLanguage(translatedName);
  };

  return (
    <>
      <div className="cursor-pointer flex flex-row gap-[6px] items-center" onClick={handleOpenLanguageModal}>
        <span className="text-[var(--color-text-secondary)]">
          <LanguageIcon />
        </span>
        <span className="text-[16px] font-semibold">{summaryLanguage}</span>
      </div>
      <div className="cursor-pointer flex flex-row gap-[6px] items-center" onClick={handleShowRightPanel}>
        <span className="text-[var(--color-text-secondary)]">
          <SettingIcon />
        </span>
        <span className="text-[16px] font-semibold">Personalize</span>
      </div>
    </>
  );
};
export default SummaryHeaderActions;
