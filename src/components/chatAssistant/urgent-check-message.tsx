/* eslint-disable max-len */
/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import React, { useEffect, useState } from 'react';
import type { Message } from 'ai';
import copy from 'copy-to-clipboard';
import { getActions } from '../../global';

import { formatTimestamp } from './utils/util';
import {
  CopyIcon, DeleteIcon, VoiceIcon, VoiceingIcon,
} from './icons';

import useOldLang from '../../hooks/useOldLang';

import DangerIcon from './assets/danger.png';
import SerenaLogoPath from './assets/serena.png';

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
  messages,
  deleteMessage,
}: {
  messages:UrgentMessage[];
  deleteMessage: () => void;
}) => {
  const lang = useOldLang();
  const { showNotification } = getActions();
  const [voicePlaying, setVoicePlaying] = useState(false);
  const handleCopy = () => {
    const copyText = `Urgent Alert\n${messages.map((item) => `${item.content}`).join('\n')}`;
    copy(copyText);
    showNotification({
      message: lang('TextCopied'),
    });
  };
  const handleVoicePlay = () => {
    const voiceText = `Urgent Alert\n${messages.map((item) => `${item.content}`).join('\n')}`;
    const utterance = new SpeechSynthesisUtterance(voiceText);
    window.speechSynthesis.speak(utterance);
    setVoicePlaying(true);
  };
  const handleVoiceStop = () => {
    window.speechSynthesis.cancel();
    setVoicePlaying(false);
  };
  return (
    <div className="flex items-center gap-[8px]">
      <div className="w-[24px] h-[24px] text-[#676B74] cursor-pointer" onClick={handleCopy}>
        <CopyIcon size={24} />
      </div>
      {voicePlaying ? (
        <div
          className="w-[24px] h-[24px] text-[#676B74] cursor-pointer"
          onClick={handleVoiceStop}
          title="Stop Voice"
        >
          <VoiceingIcon size={24} />
        </div>
      ) : (
        <div
          className="w-[24px] h-[24px] text-[#676B74] cursor-pointer"
          onClick={handleVoicePlay}
          title="Play Voice"
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
  useEffect(() => {
    const parsedMessage = JSON.parse(message.content);
    if (parsedMessage && typeof parsedMessage === 'object' && parsedMessage.length > 0) {
      setUrgentMessage(parsedMessage);
    }
  }, [message]);
  if (!urgentMessage || urgentMessage.length === 0) {
    return null;
  }
  return (
    <div className="mx-auto w-[693px] rounded-[10px] bg-[#FFF9F9] pl-[82px] pr-[25px] pt-[20px] pb-[25px] border-[1px] border-[#FFC7C7]">
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
            <li>{item.content}</li>
          );
        })}
      </ul>
      <ActionsItems messages={urgentMessage} deleteMessage={deleteMessage} />
    </div>
  );
};

export default UrgentCheckMessage;
