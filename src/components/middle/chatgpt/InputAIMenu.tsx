/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
import type { FC } from '../../../lib/teact/teact';
import React, { useEffect, useState } from '../../../lib/teact/teact';

import type { Signal } from '../../../util/signals';

import { CHATAI_IDB_STORE } from '../../../util/browser/idb';
import TranslateIcon from '../../chatAssistant/assets/ai-translate.png';
import chatAILogoPath from '../../chatAssistant/assets/cgat-ai-logo.png';
import GrammerIcon from '../../chatAssistant/assets/grammar.png';
import { sendGAEvent } from '../../chatAssistant/utils/analytics';

import useFlag from '../../../hooks/useFlag';
import useLastCallback from '../../../hooks/useLastCallback';

import eventEmitter from '../../chatAssistant/lib/EventEmitter';
import chatAIGenerate from '../../chatAssistant/utils/ChatApiGenerate';
import Icon from '../../common/icons/Icon';
import Menu from '../../ui/Menu';
import MenuItem from '../../ui/MenuItem';
import InputLanguageModal from '../InputLanguageModal';

// import { THOUGHT_REGEX_COMPLETE } from './StatusResponse';
import './InputAIMenu.scss';

const InputAIMenu: FC = ({ getHtml }: { getHtml: Signal<string> }) => {
  const [isAIToolMenuOpen, openAIToolMenu, closeAIToolMenu] = useFlag();
  const [inputLanguageModalOpen, openInputLanguageModal, closeInputLanguageModal] = useFlag();
  const [currentLanguage, setCurrentLanguage] = useState({
    langCode: 'en',
    translatedName: 'English',
  });
  useEffect(() => {
    CHATAI_IDB_STORE.get('input-translate-language').then((langCode = 'en') => {
      const translatedNames = new Intl.DisplayNames([langCode as string], { type: 'language' });
      const translatedName = translatedNames.of(langCode as string)!;
      setCurrentLanguage({
        langCode: langCode ? langCode as string : 'en',
        translatedName,
      });
    });
  }, [isAIToolMenuOpen]);
  const handleToggleMenu = () => {
    if (isAIToolMenuOpen) {
      closeAIToolMenu();
    } else {
      openAIToolMenu();
    }
  };
  const handleTranslate = useLastCallback(() => {
    const text = getHtml().trim();
    if (!text) {
      return;
    }
    eventEmitter.emit('update-input-spiner', true);
    chatAIGenerate({
      data: {
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that translates text to the target language.',
            id: '1',
          },
          {
            role: 'system',
            content: 'give me the translated text only',
            id: '2',
          },
          {
            role: 'user',
            content: `Translate the following text to ${currentLanguage.langCode}: ${text}`,
            id: '3',
          },
        ],
      },
      onResponse: (message) => {
        eventEmitter.emit('update-input-text', message);
      },
      onFinish: () => {
        console.log('Finish');
      },
    });
    sendGAEvent('input_translate');
  });
  const handleGrammar = useLastCallback(() => {
    eventEmitter.emit('update-input-spiner', true);
    const text = getHtml().trim();
    chatAIGenerate({
      data: {
        messages: [
          {
            role: 'system',
            content: `你是一个文本优化助手,作为专业级文本优化引擎，您需同时承担以下角色：
                1. 语法纠错员（检测拼写/语法/标点错误）
                2. 风格雕塑师（调整正式/口语化/幽默等语体）
                3. 内容架构师（优化逻辑结构与信息密度）
                4. 读者体验官（评估可读性与情感共鸣）
                请使用${currentLanguage.langCode}语言进行回复，并直接给出优化后的文本
            `,
            id: '1',
          },
          {
            role: 'user',
            content: `请优化下面这段文本: ${text},直接返回优化后的文本`,
            id: '2',
          },
        ],
      },
      onResponse: (message) => {
        eventEmitter.emit('update-input-text', message);
      },
      onFinish: () => {
        console.log('Finish');
      },
    });
    sendGAEvent('input_grammar');
  });
  const onTranslationClick = useLastCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openInputLanguageModal();
  });

  return (
    <div className="chat-ai-menu flex-shrink-0">
      <button className="Button chat-ai-logo-button" onClick={handleToggleMenu}>
        <img src={chatAILogoPath} alt="Chat AI Logo" />
      </button>
      <Menu
        id="attach-menu-controls"
        isOpen={isAIToolMenuOpen}
        autoClose
        positionX="right"
        positionY="bottom"
        onClose={closeAIToolMenu}
        className="AttachMenu--menu fluid"
        onCloseAnimationEnd={closeAIToolMenu}
        ariaLabelledBy="attach-menu-button"
      >
        <MenuItem onClick={handleTranslate}>
          <div className="ai-tool-menu-item">
            <img src={TranslateIcon} alt="" className="w-[18px] h-[18px]" />
            <span>Translate</span>
            <div
              className="ai-tool-menu-language ml-auto flex flex-row items-center hover:text-[#3390EC]"
              onClick={onTranslationClick}
            >
              <Icon name="language" className="!mx-0 " />
              <span>{currentLanguage.translatedName}</span>
            </div>
          </div>
        </MenuItem>
        <MenuItem onClick={handleGrammar}>
          <div className="ai-tool-menu-item">
            <img src={GrammerIcon} alt="" className="w-[18px] h-[18px]" />
            <span>Grammar</span>
          </div>
        </MenuItem>
      </Menu>
      <InputLanguageModal isOpen={inputLanguageModalOpen} closeInputLanguageModal={closeInputLanguageModal} />
    </div>
  );
};

export default InputAIMenu;
