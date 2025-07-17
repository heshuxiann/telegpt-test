/* eslint-disable max-len */
/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import React, { useEffect, useState } from 'react';
import type { Message } from 'ai';
import copy from 'copy-to-clipboard';
import { getActions } from '../../../global';

import useOldLang from '../hook/useOldLang';
import { useSpeechPlayer } from '../hook/useSpeechPlayer';
import {
  CopyIcon, DeleteIcon, VoiceIcon, VoiceingIcon,
} from '../icons';
import { formatTimestamp } from '../utils/util';

import ChatAvatar from '../component/ChatAvatar';
import { DrawerKey, useDrawerStore } from '../global-summary/DrawerContext';

import DangerIcon from '../assets/danger.png';
import SerenaLogoPath from '../assets/serena.png';

interface IProps {
  message: Message;
  deleteMessage: () => void;
}

interface UrgentMessage {
  chatId: string;
  messageId:number;
  content:string;
}

const ActionsItems = ({
  messageId,
  messages,
  deleteMessage,
}: {
  messageId:string;
  messages:UrgentMessage[];
  deleteMessage: () => void;
}) => {
  const lang = useOldLang();
  const { showNotification } = getActions();
  const { isSpeaking, speak, stop } = useSpeechPlayer(messageId);
  const handleCopy = () => {
    const copyText = `Urgent Alert\n${messages.map((item) => `${item.content}`).join('\n')}`;
    copy(copyText);
    showNotification({
      message: lang('TextCopied'),
    });
  };
  const handleVoicePlay = () => {
    const voiceText = `Urgent Alert\n${messages.map((item) => `${item.content}`).join('\n')}`;
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
      <div className="w-[20px] h-[20px] cursor-pointer" onClick={deleteMessage}>
        <DeleteIcon size={20} />
      </div>
    </div>
  );
};
const UrgentCheckMessage = (props:IProps) => {
  const { message, deleteMessage } = props;
  const [urgentMessage, setUrgentMessage] = useState<UrgentMessage[]>([]);
  const { openDrawer } = useDrawerStore();
  useEffect(() => {
    const parsedMessage = JSON.parse(message.content);
    if (parsedMessage && typeof parsedMessage === 'object' && parsedMessage.length > 0) {
      setUrgentMessage(parsedMessage);
    }
  }, [message]);
  if (!urgentMessage || urgentMessage.length === 0) {
    return null;
  }
  const showMessageDetail = (item:UrgentMessage) => {
    openDrawer(DrawerKey.OriginalMessages, { relevantMessages: [{ chatId: item.chatId, messageIds: [item.messageId] }] });
  };
  return (
    <div className="w-max-[693px] rounded-[10px] bg-[var(--color-urgent-message-bg)] pl-[82px] pr-[25px] pt-[20px] pb-[25px] border-[1px] border-[#FFC7C7] dark:border-none">
      <div className="flex items-center gap-[8px]">
        <img className="w-[52px] h-[52px] rounded-full ml-[-60px]" src={SerenaLogoPath} alt="" />
        <div>
          <p className="text-[16px] font-semibold">Serena</p>
          {message.createdAt && (
            <p className="text-[14px] text-[#A8A6AC]">{formatTimestamp(new Date(message.createdAt).getTime())}</p>
          )}
        </div>
      </div>
      <div className="flex flex-row items-center gap-[8px] mb-[10px]">
        <img src={DangerIcon} alt="" className="w-[26px] h-[26px]" />
        <span className="text-[20px] text-[#FF543D] font-bold">Urgent Alert</span>
      </div>
      <ul className="list-disc pl-[24px]">
        {urgentMessage.map((item) => {
          return (
            <li className="flex flex-row items-top gap-[8px]">
              <span className="text-[15px] break-words" onClick={() => showMessageDetail(item)}>{item.content}</span>
              <ChatAvatar size={20} chatId={item.chatId} />
            </li>
          );
        })}
      </ul>
      <ActionsItems messageId={message.id} messages={urgentMessage} deleteMessage={deleteMessage} />
    </div>
  );
};

export default UrgentCheckMessage;
