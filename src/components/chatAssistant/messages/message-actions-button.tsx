import React, { useCallback, useRef } from 'react';
import type { Message } from './types';
import { getActions } from '../../../global';

import { useSpeechPlayer } from '../hook/useSpeechPlayer';
import {
  CopyIcon, DeleteIcon, MessageShareIcon, VoiceIcon, VoiceingIcon,
} from '../icons';

interface OwnProps {
  message: Message;
  canCopy?: boolean;
  canVoice?: boolean;
  canShare?: boolean;
  canDelete?: boolean;
  onClickShare?: () => void;
  onDelete?: () => void;
}
const MessageActionsItems = ({
  message, canCopy, canVoice, canShare, canDelete, onClickShare, onDelete,
}: OwnProps) => {
  const { showNotification } = getActions();
  const { isSpeaking, speak, stop } = useSpeechPlayer(message.id);
  const containerRef = useRef<HTMLDivElement>(undefined);

  // 获取需要朗读的文本
  const getReadableText = useCallback(() => {
    if (!containerRef.current) return '';

    // 查找父容器
    const parentContainer = containerRef.current.closest('[data-message-container]');
    if (!parentContainer) return '';

    // 获取所有标记为需要朗读的元素
    const readableElements = parentContainer.querySelectorAll('[data-readable], [data-readable-inline]');
    const texts: string[] = [];
    let currentLine = '';

    readableElements.forEach((element) => {
      const text = element.textContent?.trim();
      if (text) {
        if (element.hasAttribute('data-readable-inline')) {
          // 内联文本，不换行，用空格连接
          if (currentLine) {
            currentLine = `${currentLine} ${text}`;
          } else {
            currentLine = text;
          }
        } else {
          // 普通文本，需要换行
          if (currentLine) {
            texts.push(currentLine);
            currentLine = '';
          }
          texts.push(text);
        }
      }
    });

    // 处理最后的内联文本
    if (currentLine) {
      texts.push(currentLine);
    }

    return texts.join('\n');
  }, []);

  const handleCopy = () => {
    const textToCopy = getReadableText();
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showNotification({ message: 'Copy successful' });
      }).catch(() => {
        showNotification({ message: 'Copy failed' });
      });
    } else {
      showNotification({ message: 'No text to copy' });
    }
  };

  const handleVoicePlay = () => {
    const voiceText = getReadableText();
    if (isSpeaking) {
      stop();
    } else if (voiceText) {
      try {
        speak(voiceText);
      } catch (error) {
        showNotification({ message: '语音播放失败' });
      }
    } else {
      showNotification({ message: '没有可播放的内容' });
    }
  };
  return (
    <div ref={containerRef} className="flex items-center gap-[8px] py-[6px]">
      {canCopy && (
        <div className="w-[24px] h-[24px] text-[#676B74] cursor-pointer" onClick={handleCopy}>
          <CopyIcon size={24} />
        </div>
      )}
      {canVoice && (
        <div
          className="w-[24px] h-[24px] text-[#676B74] cursor-pointer"
          onClick={handleVoicePlay}
        >
          {isSpeaking ? (
            <VoiceingIcon size={24} />
          ) : (
            <VoiceIcon size={24} />
          )}
        </div>
      )}
      {canShare && (
        <div className="w-[24px] h-[24px] text-[#676B74] cursor-pointer" onClick={onClickShare}>
          <MessageShareIcon size={24} />
        </div>
      )}
      {canDelete && (
        <div className="w-[20px] h-[20px] cursor-pointer" onClick={onDelete}>
          <DeleteIcon size={20} />
        </div>
      )}
    </div>
  );
};

export default MessageActionsItems;
