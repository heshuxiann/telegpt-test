/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react-hooks-static-deps/exhaustive-deps */
/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import type { FC } from '../../../lib/teact/teact';
import React, { useCallback, useRef, useState } from '../../../lib/teact/teact';

import type { ApiMessage } from '../../../api/types';

import { getMessageContent } from '../../../global/helpers';

import useFlag from '../../../hooks/useFlag';

import Menu from '../../ui/Menu';
import MenuItem from '../../ui/MenuItem';
import aiSdkService from './ChatApiService';
import eventEmitter from './EventEmitter';
import SmartReply from './Icon/SmartReply';
import Summarize from './Icon/Summarize';
import Translate from './Icon/Translate';
import SummarizeModal from './SummarizeModal';
import TranslateModal from './TranslateModal';

import './MessageAIToolBar.scss';

import chatAILogoPath from '../../../assets/cgat-ai-logo.png';

const MessageAIToolBar: FC = ({ message }: { message: ApiMessage }) => {
  // eslint-disable-next-line no-null/no-null
  const messageText = getMessageContent(message).text?.text;
  const messageAIToolRef = useRef<HTMLDivElement>(null);
  const [isAIToolMenuOpen, openAIToolMenu, closeAIToolMenu] = useFlag();
  const [isTranslateModalOpen, openTranslateModal, closeTranslateModal] = useFlag();
  const [isSummarizeModalOpen, openSummarizeModal, closeSummarizeModal] = useFlag();
  const [positionY, setPositionY] = useState<'top' | 'bottom'>('top');
  const handleToggleMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    const client = (e.target as HTMLButtonElement).getBoundingClientRect();
    if (client.top > window.innerHeight - 268) {
      setPositionY('bottom');
    } else {
      setPositionY('top');
    }
    if (isAIToolMenuOpen) {
      closeAIToolMenu();
    } else {
      openAIToolMenu();
    }
  };
  const handleContextTranslate = useCallback(() => {
    openTranslateModal();
  }, [openTranslateModal]);
  const handleContextSummarize = useCallback(() => {
    openSummarizeModal();
  }, [openSummarizeModal]);
  const handleContextSmartReply = useCallback(() => {
    aiSdkService.useChat({
      data: {
        messages: [
          {
            role: 'system',
            content: 'You are a friendly and supportive assistant.',
            id: '1',
          },
          {
            role: 'user',
            content: messageText,
            id: '2',
          },
        ],
      },
      onResponse: (message) => {
        eventEmitter.emit('update-input-text', { text: message.content });
      },
      onFinish: () => {
        console.log('Finish');
      },
    });
  }, []);
  return (
    <div ref={messageAIToolRef} className="message-ai-tool-bar">
      <button className="chat-ai-logo-button Button" onClick={handleToggleMenu}>
        <img src={chatAILogoPath} alt="Chat AI Logo" />
      </button>
      <Menu
        id="attach-menu-controls"
        isOpen={isAIToolMenuOpen}
        autoClose
        positionX="left"
        positionY={positionY}
        onClose={closeAIToolMenu}
        className="fluid AttachMenu--message-chat-ai-menu"
        onCloseAnimationEnd={closeAIToolMenu}
        ariaLabelledBy="attach-menu-button"
      >
        <MenuItem onClick={handleContextSummarize}>
          <div className="ai-tool-menu-item">
            <Summarize size={18} />
            <span>Summarize</span>
          </div>
        </MenuItem>
        <MenuItem onClick={handleContextSmartReply}>
          <div className="ai-tool-menu-item">
            <SmartReply size={18} />
            <span>Smart Reply</span>
          </div>
        </MenuItem>
        <MenuItem onClick={handleContextTranslate}>
          <div className="ai-tool-menu-item">
            <Translate size={18} />
            <span>Translate</span>
          </div>
        </MenuItem>
      </Menu>
      <TranslateModal isOpen={isTranslateModalOpen} text={messageText} onClose={closeTranslateModal} />
      <SummarizeModal isOpen={isSummarizeModalOpen} text={messageText} onClose={closeSummarizeModal} />
    </div>
  );
};

export default MessageAIToolBar;
