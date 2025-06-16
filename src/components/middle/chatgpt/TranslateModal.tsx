/* eslint-disable react-hooks-static-deps/exhaustive-deps */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-shadow */
import React, { useCallback, useEffect, useState } from '../../../lib/teact/teact';

import { chatAIGenerate } from '../../chatAssistant/utils/chat-api';

import useLang from '../../../hooks/useLang';

import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import CopyIcon from './Icon/CopyIcon';
import DropDownIcon from './Icon/DropDownIcon';
import RefreshIcon from './Icon/RefreshIcon';
import SkeletonScreen from './SkeletonScreen';
import StatusResponse from './StatusResponse';

import './TranslateModal.scss';

interface TranslateModalProps {
  isOpen?: boolean;
  text?: string;
  onClose?: NoneToVoidFunction;
}

const LanguageSelect = ({ language, onSelect }:{ language: string; onSelect: (language: string) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  useEffect(() => {
    const handleOutsideClick = () => {
      setExpanded(false);
    };
    document.body.addEventListener('click', handleOutsideClick);
    return () => {
      document.body.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    onSelect(language);
  };
  return (
    <div className="translate-language-select" onClick={() => setExpanded(!expanded)}>
      {expanded && (
        <div className="translate-language-select-container">
          <div className="translate-language-select-item" onClick={() => handleLanguageSelect('中文')}>
            中文
          </div>
          <div className="translate-language-select-item" onClick={() => handleLanguageSelect('English')}>
            English
          </div>
        </div>
      )}
      <div className="translate-language-select-selected">{selectedLanguage}</div>
      <div className="translate-language-select-icon">
        <DropDownIcon />
      </div>
    </div>
  );
};
interface TranslateTitleProps {
  language: string;
  onSelect: (language:string) => void;
  onClose: NoneToVoidFunction;
}
const TranslateTitle = ({ language, onSelect, onClose }:TranslateTitleProps) => {
  const lang = useLang();
  return (
    <div className="translate-modal-title">
      <div className="translate-modal-title-text">Translate</div>
      <LanguageSelect language={language} onSelect={onSelect} />
      <Button
        round
        color="translucent"
        size="smaller"
        ariaLabel={lang('Close')}
        onClick={onClose}
        className="translate-modal-title-close"
      >
        <i className="icon icon-close" />
      </Button>
    </div>
  );
};
const TranslateModal = (props: TranslateModalProps) => {
  const { text, isOpen, onClose = () => {} } = props;
  const [selectLanguage, setSelectedLanguage] = useState('中文');
  const [translateResult, setTranslateResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChat = () => {
    setIsLoading(true);
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
            content: `Translate the following text to ${selectLanguage}: ${text}`,
            id: '3',
          },
        ],
      },
      onResponse: (message) => {
        setIsLoading(false);
        setTranslateResult(message);
      },
      onFinish: () => {
        console.log('Finish');
      },
    });
  };
  useEffect(() => {
    if (isOpen) {
      handleChat();
    }
  }, [isOpen]);

  const onSelectLanguage = useCallback((language: string) => {
    setSelectedLanguage(language);
    handleChat();
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hasCloseButton={false}
      className="translate-modal"
    >
      <TranslateTitle language={selectLanguage} onSelect={onSelectLanguage} onClose={onClose} />
      <div className="summarize-origin-text">{text}</div>
      {isLoading ? (
        <SkeletonScreen />
      ) : (
        <StatusResponse content={translateResult} showThinking={false} />
      )}
      <div className="summarize-footer">
        <div className="summarize-footer-btn">
          <CopyIcon size={16} fill="#676B74" />
        </div>
        <div className="summarize-footer-btn">
          <RefreshIcon size={16} fill="#676B74" />
        </div>
      </div>
    </Modal>
  );
};

export default TranslateModal;
