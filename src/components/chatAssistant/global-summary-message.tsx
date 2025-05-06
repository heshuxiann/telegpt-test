/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from 'react';
import type { Message } from 'ai';
import copy from 'copy-to-clipboard';
import { getActions, getGlobal } from '../../global';

import type { CustomSummaryTemplate } from './store/chatai-summary-template-store';

import eventEmitter, { Actions } from './lib/EventEmitter';
import { isUserId } from '../../global/helpers';
import { selectChat, selectUser } from '../../global/selectors';
import { RightPanelKey } from './rightPanel/right-header';
import { cn, formatTimestamp, formatTimestampRange } from './utils/util';
import {
  CopyIcon, DeleteIcon, VoiceIcon,
  VoiceingIcon,
} from './icons';

import useOldLang from '../../hooks/useOldLang';

import ErrorBoundary from './ErrorBoundary';
import Avatar from './ui/Avatar';

import ActionsIcon from './assets/actions.png';
import CalendarIcon from './assets/calendar.png';
import ChainTrendIcon from './assets/chain-trend.png';
import CheckIcon from './assets/check.png';
import KeyBusinessIcon from './assets/key-business.png';
import MessageIcon from './assets/message.png';
import SerenaLogoPath from './assets/serena.png';
import UserIcon from './assets/user.png';
import UserGroupIcon from './assets/user-group.png';
import VectorIcon from './assets/vector.png';
import WriteIcon from './assets/write.png';

interface IProps {
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
  title: string;
  summaryChatIds: Array<string>;
  summaryItems: Array<{
    subtitle: string;
    relevantMessages: Array<{
      chatId: string;
      messageIds: Array<number>;
    }>;
  }>;
}

interface ISummaryPendingItem {
  chatId: string;
  chatTitle: string;
  summary: string;
  relevantMessageIds: number[];
}
interface ISummaryGarbageItem {
  chatId: string;
  chatTitle: string;
  summary: string;
  level: 'high' | 'low';
  relevantMessageIds: number[];
}

const CustomizationTopicIcon = {
  'Most Discussed Coins': VectorIcon,
  'Most Active Users': UserGroupIcon,
  'Key business updates': KeyBusinessIcon,
  'On-Chain Trending Topics': ChainTrendIcon,
};

const ChatAvatar = ({
  chatId, classNames, size, style,
}: { chatId: string; classNames?: string; size:number;style?: { [key:string]:string } }) => {
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
  const { title, summaryItems, summaryChatIds } = topicItem;
  if (!summaryItems.length) return null;
  if (!title) return null;
  const showMessageDetail = (relevantMessages: Array<{ chatId: string; messageIds: number[] }>) => {
    if (!relevantMessages.length) return;
    eventEmitter.emit(Actions.ShowGlobalSummaryPanel, {
      rightPanelKey: RightPanelKey.OriginalMessages,
      rightPanelPayload: {
        relevantMessages,
      },
    });
  };
  return (
    <ErrorBoundary>
      <div>
        <div className="flex flex-row items-center flex-wrap">
          <span className="text-[16px] font-bold mr-[24px]">{index + 1}. {title}</span>
          {summaryChatIds ? (
            <>
              {
                summaryChatIds.slice(0, 10).map((chatId: string) => {
                  return (
                    <ChatAvatar size={20} chatId={chatId} />
                  );
                })
              }
            </>
          ) : null}
        </div>
        <ul className="list-disc pl-[2px] text-[16px] list-inside">
          {summaryItems.map((summaryItem: any) => {
            const { subtitle, relevantMessages } = summaryItem;
            if (!subtitle) return null;
            return (
              <li
                role="button"
                className="cursor-pointer text-[15px]"
                onClick={() => showMessageDetail(relevantMessages)}
              >
                {subtitle}
              </li>
            );
          })}
        </ul>
      </div>
    </ErrorBoundary>
  );
};

const SummaryPenddingItem = ({ pendingItem }: { pendingItem: ISummaryPendingItem }) => {
  const showMessageDetail = () => {
    eventEmitter.emit(Actions.ShowGlobalSummaryPanel, {
      rightPanelKey: RightPanelKey.OriginalMessages,
      rightPanelPayload: {
        relevantMessages: [{ chatId: pendingItem.chatId, messageIds: [pendingItem.relevantMessageIds] }],
      },
    });
  };
  return (
    <ErrorBoundary>
      <div
        className="flex gap-[8px] my-[4px] cursor-pointer"
        key={pendingItem.chatId}
        onClick={showMessageDetail}
      >
        <img className="w-[18px] h-[18px] mt-[2px]" src={CheckIcon} alt="" />
        <span className="text-[15px]">{pendingItem.summary}</span>
        <ChatAvatar size={20} chatId={pendingItem.chatId} />
      </div>
    </ErrorBoundary>
  );
};

const SummaryGarbageItem = ({ garBageItem }: { garBageItem: ISummaryGarbageItem }) => {
  const {
    chatId, chatTitle, level, summary, relevantMessageIds,
  } = garBageItem;
  const showMessageDetail = (chatId: string, relevantMessageIds: number[]) => {
    eventEmitter.emit(Actions.ShowGlobalSummaryPanel, {
      rightPanelKey: RightPanelKey.OriginalMessages,
      rightPanelPayload: {
        relevantMessages: [{ chatId, messageIds: relevantMessageIds }],
      },
    });
  };
  return (
    <ErrorBoundary>
      <div
        className="flex justify-start gap-[8px] my-[16px]"
        key={garBageItem.chatId}
        onClick={() => { showMessageDetail(chatId, relevantMessageIds); }}
      >
        <ChatAvatar chatId={chatId} size={44} />
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
    </ErrorBoundary>
  );
};

const ActionsItems = ({
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
  const lang = useOldLang();
  const { showNotification } = getActions();
  const [voicePlaying, setVoicePlaying] = useState(false);
  const handleCopy = () => {
    const { summaryStartTime, summaryEndTime } = summaryInfo || {};
    const timeRange = formatTimestampRange(summaryStartTime, summaryEndTime);
    const copyText = `Chat Summary\nTime Range: ${timeRange}\n\nKey Topics:\n${mainTopic.map((item:ISummaryTopicItem) => `${item.title}:\n ${item.summaryItems.map((subItem) => subItem.subtitle).join(';\n ')}`).join('\n')}\n\nActions Items:\n${pendingMatters.map((item) => `${item.chatTitle}: ${item.summary}`).join('\n')}\n\nAction Items:\n${pendingMatters.map((item) => `${item.chatTitle}: ${item.summary}`).join('\n')}`;
    copy(copyText);
    showNotification({
      message: lang('TextCopied'),
    });
  };
  const handleVoicePlay = () => {
    const { summaryStartTime, summaryEndTime } = summaryInfo || {};
    const timeRange = formatTimestampRange(summaryStartTime, summaryEndTime);
    const voiceText = `Chat Summary\nTime Range: ${timeRange}\n\nKey Topics:\n${mainTopic.map((item:ISummaryTopicItem) => `${item.title}:\n ${item.summaryItems.map((subItem) => subItem.subtitle).join(';\n ')}`).join('\n')}\n\nActions Items:\n${pendingMatters.map((item) => `${item.chatTitle}: ${item.summary}`).join('\n')}\n\nAction Items:\n${pendingMatters.map((item) => `${item.chatTitle}: ${item.summary}`).join('\n')}`;
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

const SummaryInfoContent = ({ summaryInfo }:{ summaryInfo:ISummaryInfo }) => {
  return (
    <ErrorBoundary>
      <div>
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
            <div className="flex items-center gap-[4px]">
              <span className="mr-[4px] font-bold text-[14px]">Time range:</span>
              {formatTimestampRange(summaryInfo?.summaryStartTime, summaryInfo?.summaryEndTime)}
            </div>
          </p>
          <p className="flex items-center gap-[8px]">
            <img className="w-[16px] h-[16px]" src={MessageIcon} alt="" />
            <div className="flex items-center gap-[4px]">
              <span className="font-bold text-[14px]">Messages:</span>
              {summaryInfo?.summaryMessageCount ? (
                <span>{summaryInfo?.summaryMessageCount}</span>
              ) : null}
            </div>
          </p>
        </div>
        {summaryInfo?.summaryChatIds ? (
          <div className="flex items-center gap-[8px] mb-[18px]">
            <img className="w-[16px] h-[16px]" src={UserIcon} alt="" />
            <span className="font-bold text-[14px]">Groups/friends: </span>
            <div className="flex items-center">
              {summaryInfo.summaryChatIds.slice(0, 10).map((id: string, index: number) => {
                return (
                  <ChatAvatar
                    style={{ zIndex: `${String(summaryInfo.summaryChatIds.length - index)};` }}
                    chatId={id}
                    size={24}
                    classNames="summary-avatar-group !border-solid-[2px] !border-white ml-[-4px]"
                    key={id}
                  />
                );
              })}
              {summaryInfo.summaryChatIds.length > 10 ? (
                <div className="w-[24px] h-[24px] rounded-full bg-[#979797] text-[12px] whitespace-nowrap flex items-center justify-center">{summaryInfo.summaryChatIds.length - 10}+</div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </ErrorBoundary>
  );
};

const MainSummaryContent = ({
  customizationTemplate,
  summaryInfo,
  customizationTopic,
  mainTopic,
  pendingMatters,
  deleteMessage,
}: {
  customizationTemplate:CustomSummaryTemplate | null;
  summaryInfo: ISummaryInfo | null;
  customizationTopic: ISummaryTopicItem[];
  mainTopic: ISummaryTopicItem[];
  pendingMatters: ISummaryPendingItem[];
  deleteMessage: () => void;
}) => {
  return (
    <div className="mx-auto w-[693px] rounded-[10px] bg-white pl-[82px] pr-[25px] pt-[20px] pb-[25px]">
      {/* summary info  */}
      {summaryInfo && <SummaryInfoContent summaryInfo={summaryInfo} />}
      {/* customization topic  */}
      {customizationTopic.length > 0 && customizationTemplate && (
        <div>
          <p className="flex items-center gap-[8px] mb-[16px]">
            <span className="text-[18px] font-bold">{customizationTemplate.title}</span>
            {
              CustomizationTopicIcon?.[customizationTemplate.title as keyof typeof CustomizationTopicIcon] ? (
                <img className="w-[16px] h-[16px]" src={CustomizationTopicIcon?.[customizationTemplate.title as keyof typeof CustomizationTopicIcon]} alt="" />
              ) : (
                <img className="w-[16px] h-[16px]" src={WriteIcon} alt="" />
              )
            }
          </p>
          {customizationTopic.map((item, index) => (
            <SummaryTopicItem topicItem={item} index={index} />
          ))}
        </div>
      )}
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
      <ActionsItems summaryInfo={summaryInfo} mainTopic={mainTopic} pendingMatters={pendingMatters} deleteMessage={deleteMessage} />
    </div>
  );
};
const SummaryContent = ({
  customizationTemplate,
  summaryInfo,
  customizationTopic,
  mainTopic,
  pendingMatters,
  garbageMessage,
  deleteMessage,
}:
{
  customizationTemplate:CustomSummaryTemplate | null;
  summaryInfo: ISummaryInfo | null;
  customizationTopic: ISummaryTopicItem[];
  mainTopic: ISummaryTopicItem[];
  pendingMatters: ISummaryPendingItem[];
  garbageMessage: ISummaryGarbageItem[];
  deleteMessage: () => void;
}) => {
  return (
    <>
      {(!mainTopic.length && !pendingMatters.length && !customizationTopic.length) ? null : (
        <MainSummaryContent
          customizationTemplate={customizationTemplate}
          customizationTopic={customizationTopic}
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
                {formatTimestampRange(summaryInfo?.summaryStartTime, summaryInfo?.summaryEndTime)}
              </div>
            </p>
          </div>
          {garbageMessage.map((item) => (<SummaryGarbageItem garBageItem={item} />))}
        </div>
      )}
    </>
  );
};
const GlobalSummaryMessage = (props: IProps) => {
  const { message, deleteMessage } = props;
  const [summaryInfo, setSummaryInfo] = useState<ISummaryInfo | null>(null);
  const [customizationTemplate, setCustomizationTemplate] = useState<CustomSummaryTemplate | null>(null);
  const [customizationTopic, setCustomizationTopic] = useState<ISummaryTopicItem[]>([]);
  const [mainTopic, setMainTopic] = useState<ISummaryTopicItem[]>([]);
  const [pendingMatters, setPendingMatters] = useState<ISummaryPendingItem[]>([]);
  const [garbageMessage, setGarbageMessage] = useState<ISummaryGarbageItem[]>([]);
  const parseMessage = useCallback((messageContent: string) => {
    const messageObj = JSON.parse(messageContent);
    const {
      mainTopic, pendingMatters, garbageMessage, customizationTopic, summaryInfo, customizationTemplate,
    } = messageObj;
    if (customizationTopic) {
      setCustomizationTopic(customizationTopic as ISummaryTopicItem[]);
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
    if (summaryInfo) {
      setSummaryInfo(summaryInfo as ISummaryInfo);
    }
    if (customizationTemplate) {
      setCustomizationTemplate(customizationTemplate);
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
    <SummaryContent
      customizationTopic={customizationTopic}
      customizationTemplate={customizationTemplate}
      summaryInfo={summaryInfo}
      mainTopic={mainTopic}
      pendingMatters={pendingMatters}
      garbageMessage={garbageMessage}
      deleteMessage={deleteMessage}
    />
  );
};

export default GlobalSummaryMessage;
