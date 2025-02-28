/* eslint-disable no-console */
import type { FC } from '../../../lib/teact/teact';
import React from '../../../lib/teact/teact';

import type { Signal } from '../../../util/signals';

import useFlag from '../../../hooks/useFlag';
import useLastCallback from '../../../hooks/useLastCallback';

import Menu from '../../ui/Menu';
import MenuItem from '../../ui/MenuItem';
import generateChatgpt from './ChatApiGenerate';
// import aiSdkService from './ChatApiService';
import eventEmitter from './EventEmitter';
import Grammar from './Icon/Grammar';
import Translate from './Icon/Translate';

// import { THOUGHT_REGEX_COMPLETE } from './StatusResponse';
import './InputAIMenu.scss';

import chatAILogoPath from '../../../assets/cgat-ai-logo.png';

const InputAIMenu: FC = ({ getHtml }: { getHtml: Signal<string> }) => {
  const [isAIToolMenuOpen, openAIToolMenu, closeAIToolMenu] = useFlag();
  const handleToggleMenu = () => {
    if (isAIToolMenuOpen) {
      closeAIToolMenu();
    } else {
      openAIToolMenu();
    }
  };
  const handleTranslate = useLastCallback(() => {
    eventEmitter.emit('update-input-spiner', true);
    const text = getHtml().trim();
    generateChatgpt({
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
            content: `Translate the following text to ${navigator.language}: ${text}`,
            id: '3',
          },
        ],
      },
      onResponse: (message) => {
        // const content = message.content;
        // let msgToRender = '';
        // if (content.match(THOUGHT_REGEX_COMPLETE)) {
        //   msgToRender = content.replace(THOUGHT_REGEX_COMPLETE, '').replace(/\\n/g, '\n').trim();
        // }
        // if (msgToRender) {
        //   eventEmitter.emit('update-input-text', msgToRender);
        // }
        eventEmitter.emit('update-input-text', message);
      },
      onFinish: () => {
        console.log('Finish');
      },
    });
  });
  const handleGrammar = useLastCallback(() => {
    eventEmitter.emit('update-input-spiner', true);
    const text = getHtml().trim();
    generateChatgpt({
      data: {
        messages: [
          {
            role: 'system',
            content: 'You are an assistant that helps improve the clarity, grammar, and style of text.',
            id: '1',
          },
          {
            role: 'system',
            content: `Please respond in ${navigator.language}`,
            id: '2',
          },
          {
            role: 'user',
            content: `Please improve the following text: ${text}`,
            id: '3',
          },
        ],
      },
      onResponse: (message) => {
        // const content = message.content;
        // let msgToRender = '';
        // if (content.match(THOUGHT_REGEX_COMPLETE)) {
        //   msgToRender = content.replace(THOUGHT_REGEX_COMPLETE, '').replace(/\\n/g, '\n').trim();
        // }
        // if (msgToRender) {
        //   eventEmitter.emit('update-input-text', msgToRender);
        // }
        eventEmitter.emit('update-input-text', message);
      },
      onFinish: () => {
        console.log('Finish');
      },
    });
  });
  return (
    <div className="chat-ai-menu">
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
            <Translate size={18} />
            <span>Translate</span>
          </div>
        </MenuItem>
        <MenuItem onClick={handleGrammar}>
          <div className="ai-tool-menu-item">
            <Grammar size={18} />
            <span>Grammar</span>
          </div>
        </MenuItem>
      </Menu>
    </div>
  );
};

export default InputAIMenu;
