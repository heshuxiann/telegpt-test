/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-null/no-null */
import React, {
  memo, useEffect, useRef, useState,
} from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';

import { injectComponent } from '../../../lib/injectComponent';
import eventEmitter, { Actions } from '../lib/EventEmitter';
import { selectChat } from '../../../global/selectors';
import { CHATAI_IDB_STORE } from '../../../util/browser/idb';
import LanguageModal from '../component/language-select-modal';
import GlobalSummary from './global-summary';

import useLastCallback from '../../../hooks/useLastCallback';

const injectMessageAI = injectComponent(GlobalSummary);
const GlobalSummaryWrapper = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [summaryLanguage, setSummrayLanguage] = useState('en');
  useEffect(() => {
    let injected: { unmount: () => void } | undefined;
    if (containerRef.current) {
      injected = injectMessageAI(containerRef.current, {});
    }
    CHATAI_IDB_STORE.get('summary-language').then((language:any) => {
      if (language) {
        setSummrayLanguage(language as string);
      }
    });
    return () => {
      injected?.unmount();
    };
  }, []);
  useEffect(() => {
    eventEmitter.on(Actions.OpenSummaryLanguageModal, handleOpenModal);
    return () => {
      eventEmitter.off(Actions.OpenSummaryLanguageModal, handleOpenModal);
    };
  }, []);

  const handleOpenModal = () => {
    setLanguageModalOpen(true);
  };
  const handleCloseModal = useLastCallback(() => {
    setLanguageModalOpen(false);
  });

  const handleLanguageChange = useLastCallback((langCode:string) => {
    setSummrayLanguage(langCode);
    CHATAI_IDB_STORE.set('summary-language', langCode);
    eventEmitter.emit(Actions.SummaryLanguageChange, langCode);
  });
  return (
    <>
      <div className="flex w-full h-full overflow-hidden" ref={containerRef} />
      <LanguageModal
        isOpen={languageModalOpen}
        currentLanguageCode={summaryLanguage}
        onLanguageChange={handleLanguageChange}
        closeLanguageModal={handleCloseModal}
      />
    </>
  );
};

export default memo(withGlobal(
  (global) => {
    const memoSelectChat = (chatId: string) => {
      return selectChat(global, chatId);
    };
    return {
      memoSelectChat,
    };
  },
)(GlobalSummaryWrapper));
