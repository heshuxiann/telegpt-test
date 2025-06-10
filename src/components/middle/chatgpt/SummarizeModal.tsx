/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react-hooks-static-deps/exhaustive-deps */
// import { useChat } from '@ai-sdk/react';
import React, { useEffect, useState } from '../../../lib/teact/teact';

import chatAIGenerate from '../../chatAssistant/utils/ChatApiGenerate';
import Modal from '../../ui/Modal';
import CopyIcon from './Icon/CopyIcon';
import RefreshIcon from './Icon/RefreshIcon';
import SkeletonScreen from './SkeletonScreen';
import StatusResponse from './StatusResponse';

import './SummarizeModal.scss';

interface SummarizeModalProps {
  isOpen?: boolean;
  text?: string;
  onClose: NoneToVoidFunction;
}
const SummarizeModal = (props: SummarizeModalProps) => {
  const { text, isOpen, onClose } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [summarizeResult, setSummarizeResult] = useState('');
  useEffect(() => {
    if (isOpen) {
      handleChat();
    }
  }, [isOpen]);
  const handleChat = () => {
    setIsLoading(true);
    chatAIGenerate({
      data: {
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes long texts into concise summaries.',
            id: '',
          },
          {
            role: 'user',
            content: `Please summarize the following text in target language ${navigator.language}: "${text}"`,
            id: '2',
          },
        ],
      },
      onResponse: (message) => {
        setIsLoading(false);
        setSummarizeResult(message);
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hasCloseButton
      className="summarize-modal"
      title="Summarize"
    >
      <div className="summarize-origin-text">{text}</div>
      {isLoading ? (
        <SkeletonScreen />
      ) : (
        <StatusResponse content={summarizeResult} />
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

export default SummarizeModal;
