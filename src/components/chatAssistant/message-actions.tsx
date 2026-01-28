import React from 'react';
import type { Message } from './messages/types';
import copy from 'copy-to-clipboard';
import { getActions } from '../../global';

import { useSpeechPlayer } from './hook/useSpeechPlayer';
import {
  CopyIcon, VoiceIcon, VoiceingIcon,
} from './icons';

export const MessageActions = ({ message }: { message: Message }) => {
  const { showNotification } = getActions();
  const { isSpeaking, speak, stop } = useSpeechPlayer(message.id);
  const handleCopy = () => {
    copy(message.content);
    showNotification({
      message: 'TextCopied',
    });
  };
  const handleVoicePlay = () => {
    const voiceText = message.content;
    if (isSpeaking) {
      stop();
    } else {
      speak(voiceText);
    }
  };
  return (
    <div className="message-actions flex items-center gap-[8px]">
      <div className="w-[24px] h-[24px] text-[#676B74] cursor-pointer" onClick={handleCopy}>
        <CopyIcon size={24} />
      </div>
      {isSpeaking ? (
        <div
          className="w-[24px] h-[24px] text-[#676B74] cursor-pointer"
          onClick={stop}
        >
          <VoiceingIcon size={24} />
        </div>
      ) : (
        <div
          className="w-[24px] h-[24px] text-[#676B74] cursor-pointer"
          onClick={handleVoicePlay}
        >
          <VoiceIcon size={24} />
        </div>
      )}
    </div>
  );
};
