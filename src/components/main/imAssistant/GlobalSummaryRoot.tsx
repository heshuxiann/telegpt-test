/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-null/no-null */
import React, {
  memo, useEffect, useRef, useState,
} from '../../../lib/teact/teact';
import { getGlobal, withGlobal } from '../../../global';

import type { ApiMessage } from '../../../api/types/messages';

import { injectComponent } from '../../../lib/injectComponent';
import { isChatGroup, isSystemBot } from '../../../global/helpers';
import { selectBot, selectChat } from '../../../global/selectors';
import { CHATAI_IDB_STORE } from '../../../util/browser/idb';
import { globalSummaryTask } from '../../chatAssistant/aiTask/global-summary-task';
import { intelligentReplyTask } from '../../chatAssistant/aiTask/intelligent-reply-task';
import { urgentCheckTask } from '../../chatAssistant/aiTask/urgent-check-task';
import LanguageModal from '../../chatAssistant/component/language-select-modal';
import GlobalSummary from '../../chatAssistant/globalSummary/global-summary';

import useLastCallback from '../../../hooks/useLastCallback';

import eventEmitter, { Actions } from '../../chatAssistant/lib/EventEmitter';

const injectMessageAI = injectComponent(GlobalSummary);
const GlobalSummaryRoot = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [summaryLanguage, setSummrayLanguage] = useState('en');
  useEffect(() => {
    if (containerRef.current) {
      injectMessageAI(containerRef.current, {});
    }
    CHATAI_IDB_STORE.get('summary-language').then((language:any) => {
      if (language) {
        setSummrayLanguage(language as string);
      }
    });
  }, []);
  useEffect(() => {
    eventEmitter.on(Actions.NewTextMessage, handleAddNewMessage);
    eventEmitter.on(Actions.OpenSummaryLanguageModal, handleOpenModal);
    return () => {
      eventEmitter.off(Actions.NewTextMessage, handleAddNewMessage);
      eventEmitter.off(Actions.OpenSummaryLanguageModal, handleOpenModal);
    };
  }, []);

  const handleOpenModal = () => {
    setLanguageModalOpen(true);
  };
  const handleCloseModal = useLastCallback(() => {
    setLanguageModalOpen(false);
  });

  const handleAddNewMessage = useLastCallback((payload: { message: ApiMessage }) => {
    const message = payload.message;
    const global = getGlobal();
    if (message.content.text) {
      const chatId = message.chatId;
      const chat = selectChat(global, chatId);
      const chatBot = !isSystemBot(chatId) ? selectBot(global, chatId) : undefined;
      if (chat && !chatBot) {
        // if (chat.membersCount && chat?.membersCount > 100) {
        //   return;
        // }
        // TODO 这里需要判断是否是紧急消息/知识库自动回复
        const { isRestricted } = chat;
        if (!message.isOutgoing && !isRestricted) {
          if (!isChatGroup(chat) || message.isMentioned) {
            intelligentReplyTask.addNewMessage(message);
          }
          urgentCheckTask.addNewMessage(message);
        }
        // TODO 添加到自动总结消息队列
        globalSummaryTask.addNewMessage(message);
      }
    }
  });
  const handleLanguageChange = useLastCallback((langCode:string) => {
    setSummrayLanguage(langCode);
    CHATAI_IDB_STORE.set('summary-language', langCode);
    eventEmitter.emit(Actions.SummaryLanguageChange, langCode);
  });
  return (
    <>
      <div className="w-[40px] h-[40px] ml-[0.625rem]" ref={containerRef} />
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
)(GlobalSummaryRoot));
