/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from 'react';
import type { Message } from 'ai';
import copy from 'copy-to-clipboard';
import { getActions, getGlobal } from '../../../global';

import { isUserId } from '../../../global/helpers';
import { selectChat, selectUser } from '../../../global/selectors';
import useOldLang from '../hook/useOldLang';
import {
  CopyIcon, DeleteIcon, VoiceIcon,
  VoiceingIcon,
} from '../icons';
import { cn, formatTimestamp } from '../utils/util';

import Avatar from '../component/Avatar';
import ErrorBoundary from '../ErrorBoundary';

import ActionsIcon from '../assets/actions.png';
import CalendarIcon from '../assets/calendar.png';
import CheckIcon from '../assets/check.png';
import MessageIcon from '../assets/message.png';
import UserIcon from '../assets/user.png';

interface IProps {
  message: Message;
  deleteMessage: () => void;
}
interface ISummaryInfo {
  summaryTime: number;
  messageCount: number;
  userIds: Array<string>;
}

interface ISummaryPendingItem {
  summary: string;
  relevantMessageIds: number[];
}

const ChatAvatar = ({
  chatId, classNames, size, style,
}: { chatId: string; classNames?: string; size:number;style?: { [key:string]:string } }) => {
  if (!chatId) return null;
  const global = getGlobal();
  let peer;
  if (isUserId(chatId)) {
    peer = selectUser(global, chatId);
  } else {
    peer = selectChat(global, chatId);
  }

  return (
    <Avatar
      style={style}
      key={chatId}
      className={cn(classNames, 'overlay-avatar inline-block cursor-pointer')}
      size={size}
      peer={peer}
    />
  );
};

const SummaryPenddingItem = ({ pendingItem }: { pendingItem: ISummaryPendingItem }) => {
  return (
    <ErrorBoundary>
      <div className="flex gap-[8px] my-[4px] cursor-pointer">
        <img className="w-[18px] h-[18px] mt-[2px]" src={CheckIcon} alt="" />
        <span className="text-[15px]">{pendingItem.summary}</span>
      </div>
    </ErrorBoundary>
  );
};

const ActionsItems = ({
  pendingMatters,
  deleteMessage,
}: {
  pendingMatters: ISummaryPendingItem[];
  deleteMessage: () => void;
}) => {
  const lang = useOldLang();
  const { showNotification } = getActions();
  const [voicePlaying, setVoicePlaying] = useState(false);
  const handleCopy = () => {
    const copyText = `Actions Items:\n${pendingMatters.map((item) => `${item.summary}`).join('\n')}\n\nAction Items:\n${pendingMatters.map((item) => `${item.summary}`).join('\n')}`;
    copy(copyText);
    showNotification({
      message: lang('TextCopied'),
    });
  };
  const handleVoicePlay = () => {
    const voiceText = `Actions Items:\n${pendingMatters.map((item) => `${item.summary}`).join('\n')}\n\nAction Items:\n${pendingMatters.map((item) => `${item.summary}`).join('\n')}`;
    if (!window.speechSynthesis) {
      console.error('Text-to-Speech is not supported in this browser.');
      return;
    }
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

const ActionInfoContent = ({ summaryInfo }:{ summaryInfo:ISummaryInfo }) => {
  return (
    <ErrorBoundary>
      <div>
        <p className="flex items-center gap-[8px] mb-[16px]">
          <span className="text-[18px] font-bold">Actions Items</span>
          <img className="w-[16px] h-[16px]" src={ActionsIcon} alt="" />
        </p>
        <div className="flex items-center gap-[20px]">
          <p className="flex items-center gap-[8px]">
            <img className="w-[16px] h-[16px]" src={CalendarIcon} alt="" />
            <div className="flex items-center gap-[4px]">
              <span className="mr-[4px] font-bold text-[14px]">Time:</span>
              {summaryInfo?.summaryTime ? (
                <p className="text-[14px] text-[#A8A6AC]">{formatTimestamp(summaryInfo.summaryTime)}</p>
              ) : null}
            </div>
          </p>
          <p className="flex items-center gap-[8px]">
            <img className="w-[16px] h-[16px]" src={MessageIcon} alt="" />
            <div className="flex items-center gap-[4px]">
              <span className="font-bold text-[14px]">Messages:</span>
              {summaryInfo?.messageCount ? (
                <span>{summaryInfo?.messageCount}</span>
              ) : null}
            </div>
          </p>
        </div>
        {summaryInfo?.userIds ? (
          <div className="flex items-center gap-[8px] mb-[18px]">
            <img className="w-[16px] h-[16px]" src={UserIcon} alt="" />
            <span className="font-bold text-[14px]">Groups/friends: </span>
            <div className="flex items-center">
              {summaryInfo.userIds.slice(0, 10).map((id: string, index: number) => {
                return (
                  <ChatAvatar
                    style={{ zIndex: `${String(summaryInfo.userIds.length - index)};` }}
                    chatId={id}
                    size={24}
                    classNames="summary-avatar-group !border-solid-[2px] !border-white ml-[-4px]"
                    key={id}
                  />
                );
              })}
              {summaryInfo.userIds.length > 10 ? (
                <div className="w-[24px] h-[24px] rounded-full bg-[#979797] text-[12px] whitespace-nowrap flex items-center justify-center">{summaryInfo.userIds.length - 10}+</div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </ErrorBoundary>
  );
};

const RoomActionMessage = (props: IProps) => {
  const { message, deleteMessage } = props;
  const [summaryInfo, setSummaryInfo] = useState<ISummaryInfo | null>(null);
  const [pendingMatters, setPendingMatters] = useState<ISummaryPendingItem[]>([]);
  const parseMessage = useCallback((messageContent: string) => {
    const messageObj = JSON.parse(messageContent);
    const { pendingMatters, summaryInfo } = messageObj;
    if (pendingMatters) {
      setPendingMatters(pendingMatters as ISummaryPendingItem[]);
    }
    if (summaryInfo) {
      setSummaryInfo(summaryInfo as ISummaryInfo);
    }
  }, []);
  useEffect(() => {
    try {
      parseMessage(message.content);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [message, parseMessage]);
  if (!summaryInfo) {
    return null;
  }
  return (
    <div className="px-[12px] w-full">
      {(!pendingMatters.length) ? null : (
        <div className="mx-auto rounded-[10px] bg-[var(--color-background)] px-3 py-2">
          {/* summary info  */}
          {summaryInfo && <ActionInfoContent summaryInfo={summaryInfo} />}
          {/* pending actions  */}
          {pendingMatters.length > 0 && (
            <div>
              {pendingMatters.map((item) => (<SummaryPenddingItem pendingItem={item} />))}
            </div>
          )}
          {/* action buttons  */}
          <ActionsItems pendingMatters={pendingMatters} deleteMessage={deleteMessage} />
        </div>
      )}
    </div>
  );
};

export default RoomActionMessage;
