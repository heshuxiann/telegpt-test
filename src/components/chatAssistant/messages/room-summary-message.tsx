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
import { useSpeechPlayer } from '../hook/useSpeechPlayer';
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
import WriteIcon from '../assets/write.png';

interface IProps {
  message: Message;
  deleteMessage: () => void;
}
interface ISummaryInfo {
  summaryTime: number;
  messageCount: number;
  userIds: Array<string>;
}

interface ISummaryTopicItem {
  title: string;
  summaryItems: Array<{
    content: string;
    relevantMessageIds: Array<number>;
  }>;
}

interface ISummaryPendingItem {
  summary: string;
  relevantMessageIds: number[];
}
interface ISummaryGarbageItem {
  summary: string;
  level: 'high' | 'low';
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

const SummaryTopicItem = ({ topicItem, index }: { topicItem: ISummaryTopicItem; index: number }) => {
  const { title, summaryItems } = topicItem;
  if (!summaryItems.length) return null;
  if (!title) return null;
  return (
    <ErrorBoundary>
      <div>
        <div className="flex flex-row items-center flex-wrap">
          <span className="text-[16px] font-bold mr-[24px]">{index + 1}. {title}</span>
        </div>
        <ul className="list-disc pl-[2px] text-[16px] list-inside">
          {summaryItems.map((summaryItem: any) => {
            const { content } = summaryItem;
            if (!content) return null;
            return (
              <li
                role="button"
                className="cursor-pointer text-[15px]"
              >
                {content}
              </li>
            );
          })}
        </ul>
      </div>
    </ErrorBoundary>
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

const SummaryGarbageItem = ({ garBageItem }: { garBageItem: ISummaryGarbageItem }) => {
  const { level, summary } = garBageItem;
  return (
    <ErrorBoundary>
      <div className="flex justify-start gap-[8px] my-[16px]">
        <div className="flex justify-start gap-[4px]">
          {level === 'high' ? (
            <span className="text-[#FF543D] text-[14px] whitespace-nowrap">🔴 High-Risk</span>
          ) : (
            <span className="text-[#FF9B05] text-[14px] whitespace-nowrap">🟡 Low-Risk</span>
          )}
          <span className="text-[14px] text-[var(--color-text-secondary)]">{summary}</span>
        </div>
      </div>
    </ErrorBoundary>
  );
};

const ActionsItems = ({
  messageId,
  summaryInfo,
  mainTopic,
  pendingMatters,
  deleteMessage,
}: {
  messageId: string;
  summaryInfo: ISummaryInfo | null;
  mainTopic: ISummaryTopicItem[];
  pendingMatters: ISummaryPendingItem[];
  deleteMessage: () => void;
}) => {
  const lang = useOldLang();
  const { showNotification } = getActions();
  const { isSpeaking, speak, stop } = useSpeechPlayer(messageId);
  const handleCopy = () => {
    const { summaryTime } = summaryInfo || {};
    const time = formatTimestamp(summaryTime!);
    const copyText = `Chat Summary\nTime: ${time}\n\nKey Topics:\n${mainTopic.map((item:ISummaryTopicItem) => `${item.title}:\n ${item.summaryItems.map((subItem) => subItem.content).join(';\n ')}`).join('\n')}\n\nActions Items:\n${pendingMatters.map((item) => `${item.summary}`).join('\n')}`;
    copy(copyText);
    showNotification({
      message: lang('TextCopied'),
    });
  };
  const handleVoicePlay = () => {
    const { summaryTime } = summaryInfo || {};
    const time = formatTimestamp(summaryTime!);
    const voiceText = `Chat Summary\nTime: ${time}\n\nKey Topics:\n${mainTopic.map((item:ISummaryTopicItem) => `${item.title}:\n ${item.summaryItems.map((subItem) => subItem.content).join(';\n ')}`).join('\n')}\n\nActions Items:\n${pendingMatters.map((item) => `${item.summary}`).join('\n')}`;
    if (isSpeaking) {
      stop();
    } else {
      speak(voiceText);
    }
  };
  return (
    <div className="flex items-center gap-[8px]">
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

const SummaryInfoContent = ({ summaryInfo }:{ summaryInfo:ISummaryInfo }) => {
  return (
    <ErrorBoundary>
      <div>
        <p className="text-[22px] font-bold mb-[16px]">Chat Summary</p>
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

const MainSummaryContent = ({
  messageId,
  summaryInfo,
  mainTopic,
  pendingMatters,
  deleteMessage,
}: {
  messageId:string;
  summaryInfo: ISummaryInfo | null;
  mainTopic: ISummaryTopicItem[];
  pendingMatters: ISummaryPendingItem[];
  deleteMessage: () => void;
}) => {
  return (
    <div className="mx-auto rounded-[10px] bg-[var(--color-background)] px-3 py-2">
      {/* summary info  */}
      {summaryInfo && <SummaryInfoContent summaryInfo={summaryInfo} />}
      {/* maintopic  */}
      {mainTopic.length > 0 && (
        <div>
          <p className="flex items-center gap-[8px] mb-[16px]">
            <span className="text-[18px] font-bold">Key Topics</span>
            <img className="w-[16px] h-[16px]" src={WriteIcon} alt="" />
          </p>
          {mainTopic.map((item, index) => (
            <SummaryTopicItem topicItem={item} index={index} />
          ))}
        </div>
      )}
      {/* pending actions  */}
      {pendingMatters.length > 0 && (
        <div>
          <p className="flex items-center gap-[8px] mb-[16px]">
            <span className="text-[18px] font-bold">Actions Items</span>
            <img className="w-[16px] h-[16px]" src={ActionsIcon} alt="" />
          </p>
          {pendingMatters.map((item) => (<SummaryPenddingItem pendingItem={item} />))}
        </div>
      )}
      {/* action buttons  */}
      <ActionsItems
        messageId={messageId}
        summaryInfo={summaryInfo}
        mainTopic={mainTopic}
        pendingMatters={pendingMatters}
        deleteMessage={deleteMessage}
      />
    </div>
  );
};
const RoomSummaryMessage = (props: IProps) => {
  const { message, deleteMessage } = props;
  const [summaryInfo, setSummaryInfo] = useState<ISummaryInfo | null>(null);
  const [mainTopic, setMainTopic] = useState<ISummaryTopicItem[]>([]);
  const [pendingMatters, setPendingMatters] = useState<ISummaryPendingItem[]>([]);
  const [garbageMessage, setGarbageMessage] = useState<ISummaryGarbageItem[]>([]);
  const parseMessage = useCallback((messageContent: string) => {
    const messageObj = JSON.parse(messageContent);
    const {
      mainTopic, pendingMatters, garbageMessage, summaryInfo,
    } = messageObj;
    if (mainTopic) {
      setMainTopic(mainTopic as ISummaryTopicItem[]);
    }
    if (pendingMatters) {
      setPendingMatters(pendingMatters as ISummaryPendingItem[]);
    }
    if (garbageMessage) {
      setGarbageMessage(garbageMessage as ISummaryGarbageItem[]);
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
      {(!mainTopic.length && !pendingMatters.length) ? null : (
        <MainSummaryContent
          messageId={message.id}
          summaryInfo={summaryInfo}
          mainTopic={mainTopic}
          pendingMatters={pendingMatters}
          deleteMessage={deleteMessage}
        />
      )}

      {garbageMessage && garbageMessage.length > 0 && (
        <div className="mx-auto px-3 py-2 rounded-[10px] bg-[var(--color-background)] mt-[10px]">
          <p className="text-[22px] font-bold mb-[16px]">Spam Filtering</p>
          <div className="flex items-center gap-[20px]">
            <p className="flex items-center gap-[8px]">
              <img className="w-[16px] h-[16px]" src={CalendarIcon} alt="" />
              <div className="flex items-center">
                <span className="mr-[4px]">Time:</span>
                {summaryInfo?.summaryTime ? (
                  <p className="text-[14px] text-[#A8A6AC]">{formatTimestamp(summaryInfo.summaryTime)}</p>
                ) : null}
              </div>
            </p>
          </div>
          {garbageMessage.map((item) => (<SummaryGarbageItem garBageItem={item} />))}
        </div>
      )}
    </div>
  );
};

export default RoomSummaryMessage;
