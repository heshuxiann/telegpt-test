/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from 'react';
import type { Message } from 'ai';
import copy from 'copy-to-clipboard';
import { getActions, getGlobal } from '../../global';

import type { GlobalState } from '../../global/types';

import eventEmitter, { Actions } from './lib/EventEmitter';
import { isUserId } from '../../global/helpers';
import { selectChat, selectUser } from '../../global/selectors';
import { formatTimestamp, validateAndFixJsonStructure } from './utils/util';
import {
  CopyIcon, DeleteIcon, VoiceIcon,
  VoiceingIcon,
} from './icons';

import useOldLang from '../../hooks/useOldLang';

import Avatar from './ui/Avatar';

import ActionsIcon from './assets/actions.png';
import CalendarIcon from './assets/calendar.png';
import CheckIcon from './assets/check.png';
import MessageIcon from './assets/message.png';
import SerenaLogoPath from './assets/serena.png';
import UserIcon from './assets/user.png';
import WriteIcon from './assets/write.png';

interface IProps {
  isLoading: boolean;
  message: Message;
  deleteMessage: () => void;
}
interface ISummaryInfo {
  summaryMessageCount: number;
  summaryStartTime: number;
  summaryEndTime: number;
  summaryChatIds: Array<string>;
}

interface ISummaryTopicItem {
  topic: string;
  summaryChatIds: Array<string>;
  summaryItems: Array<{
    title: string;
    relevantMessages: Array<{
      chatId: string;
      messageIds: Array<number>;
    }>;
  }>;
}

interface ISummaryPendingItem {
  chatId: string;
  chatTitle: string;
  messageId: number;
  senderId: string;
  summary: string;
}
interface ISummaryGarbageItem {
  chatId: string;
  chatTitle: string;
  summary: string;
  level: 'high' | 'low';
  relevantMessageIds: number[];
}

const SummaryTopicItem = ({ topicItem, index, global }: { topicItem: ISummaryTopicItem; index: number; global: GlobalState }) => {
  const { topic, summaryItems, summaryChatIds } = topicItem;
  if (!summaryItems.length) return undefined;
  const showMessageDetail = (relevantMessages: Array<{ chatId: string; relevantMessageIds: number[] }>) => {
    eventEmitter.emit(Actions.ShowGlobalSummaryMessagePanel, {
      relevantMessages,
    });
  };

  const renderChatAvatar = (chatId: string) => {
    let peer;
    if (isUserId(chatId)) {
      peer = selectUser(global, chatId);
    } else {
      peer = selectChat(global, chatId);
    }
    return (
      <Avatar
        key={chatId}
        className="overlay-avatar inline-block ml-[-4px] cursor-pointer"
        size={20}
        peer={peer}
        withStory
      />
    );
  };
  return (
    <div>
      <div className="flex flex-row items-center flex-wrap">
        <span className="text-[16px] font-bold mr-[24px]">{index + 1}.{topic}</span>
        {summaryChatIds ? (
          <>
            {
              summaryChatIds.slice(0, 10).map((chatId: string) => {
                return renderChatAvatar(chatId);
              })
            }
          </>
        ) : null}
      </div>
      <ul className="list-disc pl-[28px] text-[16px]">
        {summaryItems.map((summaryItem: any) => {
          const { title, relevantMessages } = summaryItem;
          return (
            <li
              role="button"
              className="cursor-pointer"
              onClick={() => showMessageDetail(relevantMessages)}
            >
              {title}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const SummaryPenddingItem = ({ pendingItem }: { pendingItem: ISummaryPendingItem }) => {
  return (
    <div className="flex items-center gap-[8px] my-[4px]" key={pendingItem.messageId}>
      <img className="w-[18px] h-[18px]" src={CheckIcon} alt="" />
      <span>{pendingItem.summary}</span>
    </div>
  );
};

const SummaryGarbageItem = ({ garBageItem, global }: { garBageItem: ISummaryGarbageItem; global: GlobalState }) => {
  const {
    chatId, chatTitle, level, summary, relevantMessageIds,
  } = garBageItem;
  let peer;
  if (isUserId(chatId)) {
    peer = selectUser(global, chatId);
  } else {
    peer = selectChat(global, chatId);
  }
  const showMessageDetail = (chatId: string, relevantMessageIds: number[]) => {
    eventEmitter.emit(Actions.ShowGlobalSummaryMessagePanel, {
      relevantMessages: [{ chatId, messageIds: relevantMessageIds }],
    });
  };
  return (
    <div
      className="flex justify-start gap-[8px] my-[16px]"
      key={garBageItem.chatId}
      onClick={() => { showMessageDetail(chatId, relevantMessageIds); }}
    >
      <Avatar
        key={chatId}
        className="overlay-avatar"
        size={44}
        peer={peer}
        withStory
      />
      <div>
        <p className="text-[16px] font-semibold leading-[20px] mb-[4px]">{chatTitle}</p>
        <div className="flex justify-start gap-[4px]">
          {level === 'high' ? (
            <span className="text-[#FF543D] text-[14px] whitespace-nowrap">🔴 High-Risk</span>
          ) : (
            <span className="text-[#FF9B05] text-[14px] whitespace-nowrap">🟡 Low-Risk</span>
          )}
          <span className="text-[14px] text-[#5E6272]">{summary}</span>
        </div>
      </div>
    </div>
  );
};

const ActionsItems = ({
  summaryInfo,
  mainTopic,
  pendingMatters,
  deleteMessage,
}:{
  summaryInfo: ISummaryInfo | null;
  mainTopic: ISummaryTopicItem[];
  pendingMatters: ISummaryPendingItem[];
  deleteMessage: () => void;
}) => {
  const lang = useOldLang();
  const { showNotification } = getActions();
  const [voicePlaying, setVoicePlaying] = useState(false);
  const handleCopy = () => {
    const { summaryStartTime, summaryEndTime } = summaryInfo || {};
    const timeRange = `${summaryStartTime ? `${formatTimestamp(summaryStartTime)}-` : ''}${summaryEndTime ? formatTimestamp(summaryEndTime) : ''}`;
    const copyText = `Chat Summary\nTime Range: ${timeRange}\n\nKey Topics:\n${mainTopic.map((item) => `${item.topic}:\n ${item.summaryItems.map((subItem) => subItem.title).join(';\n ')}`).join('\n')}\n\nNext Actions:\n${pendingMatters.map((item) => `${item.chatTitle}: ${item.summary}`).join('\n')}\n\nAction Items:\n${pendingMatters.map((item) => `${item.chatTitle}: ${item.summary}`).join('\n')}`;
    copy(copyText);
    showNotification({
      message: lang('TextCopied'),
    });
  };
  const handleVoicePlay = () => {
    const { summaryStartTime, summaryEndTime } = summaryInfo || {};
    const timeRange = `${summaryStartTime ? `${formatTimestamp(summaryStartTime)}-` : ''}${summaryEndTime ? formatTimestamp(summaryEndTime) : ''}`;
    const voiceText = `Chat Summary\nTime Range: ${timeRange}\n\nKey Topics:\n${mainTopic.map((item) => `${item.topic}:\n ${item.summaryItems.map((subItem) => subItem.title).join(';\n ')}`).join('\n')}\n\nNext Actions:\n${pendingMatters.map((item) => `${item.chatTitle}: ${item.summary}`).join('\n')}\n\nAction Items:\n${pendingMatters.map((item) => `${item.chatTitle}: ${item.summary}`).join('\n')}`;
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
const MainSummaryContent = ({
  summaryInfo,
  mainTopic,
  pendingMatters,
  deleteMessage,
}: {
  summaryInfo: ISummaryInfo | null;
  mainTopic: ISummaryTopicItem[];
  pendingMatters: ISummaryPendingItem[];
  deleteMessage: () => void;
}) => {
  const global = getGlobal();
  return (
    <div className="mx-auto w-[693px] rounded-[10px] bg-white pl-[82px] pr-[25px] pt-[20px] pb-[25px]">
      <div className="flex items-center gap-[8px]">
        <img className="w-[52px] h-[52px] rounded-full ml-[-60px]" src={SerenaLogoPath} alt="" />
        <div>
          <p className="text-[16px] font-semibold">Serena</p>
          {summaryInfo?.summaryEndTime ? (
            <p className="text-[14px] text-[#A8A6AC]">{formatTimestamp(summaryInfo.summaryEndTime)}</p>
          ) : null}
        </div>
      </div>
      <p className="text-[22px] font-bold mb-[16px]">Chat Summary</p>
      <div className="flex items-center gap-[20px]">
        <p className="flex items-center gap-[8px]">
          <img className="w-[16px] h-[16px]" src={CalendarIcon} alt="" />
          <div className="flex items-center">
            <span className="mr-[4px]">时间范围:</span>
            {summaryInfo?.summaryStartTime ? (
              <span>{formatTimestamp(summaryInfo.summaryStartTime)} - </span>
            ) : undefined}
            {summaryInfo?.summaryEndTime ? (
              <span>{formatTimestamp(summaryInfo?.summaryEndTime)}</span>
            ) : null}
          </div>
        </p>
        <p className="flex items-center gap-[8px]">
          <img className="w-[16px] h-[16px]" src={MessageIcon} alt="" />
          {summaryInfo?.summaryMessageCount ? (
            <span>{summaryInfo?.summaryMessageCount}</span>
          ) : null}
        </p>
      </div>
      {summaryInfo?.summaryChatIds ? (
        <div className="flex items-center gap-[8px] mb-[18px]">
          <img className="w-[16px] h-[16px]" src={UserIcon} alt="" />
          <span>聊天群组/人: </span>
          <div className="flex items-center">
            {summaryInfo.summaryChatIds.slice(0, 10).map((id: string, index: number) => {
              let peer;
              if (isUserId(id)) {
                peer = selectUser(global, id);
              } else {
                peer = selectChat(global, id);
              }
              return (
                <Avatar
                  key={id}
                  style={{ zIndex: String(summaryInfo.summaryChatIds.length - index) }}
                  className="summary-avatar-group !border-solid-[2px] !border-white ml-[-4px]"
                  size={24}
                  peer={peer}
                  withStory
                />
              );
            })}
            {summaryInfo.summaryChatIds.length > 10 ? (
              <div className="w-[24px] h-[24px] rounded-full bg-[#979797] text-[12px] whitespace-nowrap flex items-center justify-center">{summaryInfo.summaryChatIds.length - 10}+</div>
            ) : undefined}
          </div>
        </div>
      ) : null}

      {/* maintopic  */}
      {mainTopic.length > 0 && (
        <div>
          <p className="flex items-center gap-[8px] mb-[16px]">
            <img className="w-[16px] h-[16px]" src={WriteIcon} alt="" />
            <span className="text-[18px] font-bold">Key Topics</span>
          </p>
          {mainTopic.map((item, index) => (<SummaryTopicItem topicItem={item} global={global} index={index} />))}
        </div>
      )}
      {/* pending actions  */}
      {pendingMatters.length > 0 && (
        <div>
          <p className="flex items-center gap-[8px] mb-[16px]">
            <img className="w-[16px] h-[16px]" src={ActionsIcon} alt="" />
            <span className="text-[18px] font-bold">Next Actions</span>
          </p>
          {pendingMatters.map((item) => (<SummaryPenddingItem pendingItem={item} />))}
        </div>
      )}
      {/* action buttons  */}
      <ActionsItems summaryInfo={summaryInfo} mainTopic={mainTopic} pendingMatters={pendingMatters} deleteMessage={deleteMessage} />
    </div>
  );
};
const SummaryContent = ({
  summaryInfo, mainTopic, pendingMatters, garbageMessage, deleteMessage,
}:
{
  summaryInfo: ISummaryInfo | null;
  mainTopic: ISummaryTopicItem[];
  pendingMatters: ISummaryPendingItem[];
  garbageMessage: ISummaryGarbageItem[];
  deleteMessage: () => void;
}) => {
  const global = getGlobal();
  return (
    <>
      {(!mainTopic.length && !pendingMatters.length) ? undefined : (
        <MainSummaryContent
          summaryInfo={summaryInfo}
          mainTopic={mainTopic}
          pendingMatters={pendingMatters}
          deleteMessage={deleteMessage}
        />
      )}

      {garbageMessage && garbageMessage.length > 0 && (
        <div className="mx-auto w-[693px] rounded-[10px] bg-white pl-[82px] pr-[25px] pt-[20px] pb-[25px]">
          <div className="flex items-center gap-[8px]">
            <img className="w-[52px] h-[52px] rounded-full ml-[-60px]" src={SerenaLogoPath} alt="" />
            <div>
              <p className="text-[16px] font-semibold">Serena</p>
              {summaryInfo?.summaryEndTime ? (
                <p className="text-[14px] text-[#A8A6AC]">{formatTimestamp(summaryInfo.summaryEndTime)}</p>
              ) : null}
            </div>
          </div>
          <p className="text-[22px] font-bold mb-[16px]">Spam Filtering</p>
          <div className="flex items-center gap-[20px]">
            <p className="flex items-center gap-[8px]">
              <img className="w-[16px] h-[16px]" src={CalendarIcon} alt="" />
              <div className="flex items-center">
                <span className="mr-[4px]">时间范围:</span>
                {summaryInfo?.summaryStartTime ? (
                  <span>{formatTimestamp(summaryInfo.summaryStartTime)} - </span>
                ) : undefined}
                {summaryInfo?.summaryEndTime ? (
                  <span>{formatTimestamp(summaryInfo?.summaryEndTime)}</span>
                ) : null}
              </div>
            </p>
          </div>
          {garbageMessage.map((item) => (<SummaryGarbageItem garBageItem={item} global={global} />))}
        </div>
      )}
    </>
  );
};
const GlobalSummaryMessage = (props: IProps) => {
  const { isLoading, message, deleteMessage } = props;
  const [summaryInfo, setSummaryInfo] = useState<ISummaryInfo | null>(null);
  const [mainTopic, setMainTopic] = useState<ISummaryTopicItem[]>([]);
  const [pendingMatters, setPendingMatters] = useState<ISummaryPendingItem[]>([]);
  const [garbageMessage, setGarbageMessage] = useState<ISummaryGarbageItem[]>([]);
  const extractContent = (content: string, codeId: string): ISummaryInfo | ISummaryTopicItem[] | ISummaryPendingItem[] | ISummaryGarbageItem[] | null => {
    // const regex = new RegExp(
    //   `<!-- code-id: ${codeId} -->\\s*\\s*([\\s\\S]*?)\\s*<!-- end-code-id -->`,
    //   's',
    // );
    const regex = new RegExp(`<!--\\s*json-start:\\s*${codeId}\\s*-->([\\s\\S]*?)<!--\\s*json-end\\s*-->`, 's');
    const match = content.match(regex);
    if (match) {
      try {
        const result = validateAndFixJsonStructure(match[1].trim());
        if (result.valid) {
          console.log('修复后的 JSON:', result.fixedJson);
          if (result.fixedJson) {
            return JSON.parse(result.fixedJson);
          } else {
            console.error('JSON 修复失败:', result.error);
          }
        } else {
          console.error('JSON 修复失败:', result.error);
        }
      } catch (error) {
        console.error('JSON 解析错误:', error);
        return null;
      }
    }
    return null;
  };
  const parseMessage = useCallback((messageContent: string) => {
    const summaryInfo = extractContent(messageContent, 'summary-info');
    const mainTopic = extractContent(messageContent, 'main-topic');
    const pendingMatters = extractContent(messageContent, 'pending-matters');
    const garbageMessage = extractContent(messageContent, 'garbage-message');
    console.log(summaryInfo, '-----summaryInfo');
    console.log(mainTopic, '-----mainTopic');
    console.log(pendingMatters, '-----pendingMatters');
    console.log(garbageMessage, '-----garbageMessage');
    if (summaryInfo) {
      setSummaryInfo(summaryInfo as ISummaryInfo);
    }
    if (mainTopic) {
      setMainTopic(mainTopic as ISummaryTopicItem[]);
    }
    if (pendingMatters) {
      setPendingMatters(pendingMatters as ISummaryPendingItem[]);
    }
    if (garbageMessage) {
      setGarbageMessage(garbageMessage as ISummaryGarbageItem[]);
    }
  }, []);
  useEffect(() => {
    if (!isLoading) {
      try {
        // const messageContent = JSON.parse(message.content.replace(/^```json\n?/, '').replace(/```\n?$/, ''));
        // setParsedMessage(messageContent);
        parseMessage(message.content);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }
  }, [isLoading, message, parseMessage]);
  return (
    <SummaryContent
      summaryInfo={summaryInfo}
      mainTopic={mainTopic}
      pendingMatters={pendingMatters}
      garbageMessage={garbageMessage}
      deleteMessage={deleteMessage}
    />
  );
};

export default GlobalSummaryMessage;
