/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import type { Message } from 'ai';
import { getGlobal } from '../../global';

import type { GlobalState } from '../../global/types';

import eventEmitter, { Actions } from './lib/EventEmitter';
import { isUserId } from '../../global/helpers';
import { selectChat, selectUser } from '../../global/selectors';
import { formatTimestamp } from './utils/util';

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
}

interface ISummaryTopicItem {
  chatId: string;
  chatTitle: string;
  summaryItems:{
    topic:string;
    relevantMessage:{
      summary:string;
      relevantMessageIds:number[];
    }[];
  }[];
}
interface IPendingItem {
  chatId: string;
  chatTitle: string;
  messageId:number;
  senderId:string;
  summary:string;
}
interface IGarbageItem {
  chatId: string;
  chatTitle: string;
  summary:string;
  level:'high' | 'low';
  relevantMessageIds:number[];
}
interface IParsedMessage {
  summaryMessageCount: number;
  summaryStartTime: number;
  summaryEndTime: number;
  summaryChatIds: Array<string>;
  mainTopic: ISummaryTopicItem[];
  pendingMatters: IPendingItem[];
  garbageMessage: IGarbageItem[];
}

const SummaryTopicItem = ({ topicItem, global }:{ topicItem:ISummaryTopicItem;global:GlobalState }) => {
  const { chatId, chatTitle, summaryItems } = topicItem;
  if (!summaryItems.length) return undefined;
  const showMessageDetail = (chatId:string, relevantMessageIds:number[]) => {
    eventEmitter.emit(Actions.ShowGlobalSummaryMessagePanel, {
      chats: [{ chatId, messageIds: relevantMessageIds }],
    });
  };
  let peer;
  if (isUserId(chatId)) {
    peer = selectUser(global, chatId);
  } else {
    peer = selectChat(global, chatId);
  }
  return (
    <div key={chatId}>
      <div className="pb-[10px] border-b-[1px] border-[#EEEEEE] flex items-center gap-[4px]">
        <Avatar
          key={chatId}
          className="overlay-avatar"
          size={20}
          peer={peer}
          withStory
        />
        <span>{chatTitle}</span>
      </div>
      {summaryItems.map((summaryItem:any, index:number) => {
        const { topic, relevantMessage } = summaryItem;
        return (
          <div>
            <p className="text-[14px] font-semibold">{index + 1}. {topic}</p>
            <ul className="list-disc pl-[28px] text-[16px]">
              {relevantMessage.map((message:any) => (
                <li
                  role="button"
                  className="cursor-pointer"
                  onClick={() => showMessageDetail(chatId, message.relevantMessageIds)}
                >
                  {message.summary}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

const SummaryPenddingItem = ({ pendingItem }:{ pendingItem:IPendingItem }) => {
  return (
    <div className="flex items-center gap-[8px] my-[4px]" key={pendingItem.messageId}>
      <img className="w-[18px] h-[18px]" src={CheckIcon} alt="" />
      <span>{pendingItem.summary}</span>
    </div>
  );
};

const SummaryGarbageItem = ({ garBageItem, global }:{ garBageItem:IGarbageItem ;global:GlobalState }) => {
  const {
    chatId, chatTitle, level, summary, relevantMessageIds,
  } = garBageItem;
  let peer;
  if (isUserId(chatId)) {
    peer = selectUser(global, chatId);
  } else {
    peer = selectChat(global, chatId);
  }
  const showMessageDetail = (chatId:string, relevantMessageIds:number[]) => {
    eventEmitter.emit(Actions.ShowGlobalSummaryMessagePanel, {
      chats: [{ chatId, messageIds: relevantMessageIds }],
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
const MainSummaryContent = ({
  summaryMessageCount,
  summaryStartTime,
  summaryEndTime,
  summaryChatIds,
  mainTopic,
  pendingMatters,
}:{
  summaryMessageCount:number;
  summaryStartTime:number;
  summaryEndTime:number;
  summaryChatIds:string[];
  mainTopic:ISummaryTopicItem[];
  pendingMatters:IPendingItem[];
}) => {
  const global = getGlobal();
  return (
    <div className="mx-auto w-[693px] rounded-[10px] bg-white pl-[82px] pr-[25px] pt-[20px] pb-[25px]">
      <div className="flex items-center gap-[8px]">
        <img className="w-[52px] h-[52px] rounded-full ml-[-60px]" src={SerenaLogoPath} alt="" />
        <div>
          <p className="text-[16px] font-semibold">Serena</p>
          <p className="text-[14px] text-[#A8A6AC]">{formatTimestamp(summaryEndTime)}</p>
        </div>
      </div>
      <p className="text-[22px] font-bold mb-[16px]">Chat Summary</p>
      <div className="flex items-center gap-[20px]">
        <p className="flex items-center gap-[8px]">
          <img className="w-[16px] h-[16px]" src={CalendarIcon} alt="" />
          <div className="flex items-center">
            <span className="mr-[4px]">时间范围:</span>
            {summaryStartTime ? (<span>{formatTimestamp(summaryStartTime)} - </span>) : undefined}
            <span>{formatTimestamp(summaryEndTime)}</span>
          </div>
        </p>
        <p className="flex items-center gap-[8px]">
          <img className="w-[16px] h-[16px]" src={MessageIcon} alt="" />
          <span>{summaryMessageCount}</span>
        </p>
      </div>
      <div className="flex items-center gap-[8px] mb-[18px]">
        <img className="w-[16px] h-[16px]" src={UserIcon} alt="" />
        <span>聊天群组/人: </span>
        <div className="flex items-center">
          {summaryChatIds.map((id, index) => {
            let peer;
            if (isUserId(id)) {
              peer = selectUser(global, id);
            } else {
              peer = selectChat(global, id);
            }
            return (
              <Avatar
                key={id}
                style={{ zIndex: String(summaryChatIds.length - index) }}
                className="summary-avatar-group !border-solid-[2px] !border-white ml-[-4px]"
                size={24}
                peer={peer}
                withStory
              />
            );
          })}
        </div>
      </div>
      {/* maintopic  */}
      {mainTopic.length > 0 && (
        <div>
          <p className="flex items-center gap-[8px] mb-[16px]">
            <img className="w-[16px] h-[16px]" src={WriteIcon} alt="" />
            <span className="text-[18px] font-bold">Key Topics</span>
          </p>
          {mainTopic.map((item) => (<SummaryTopicItem topicItem={item} global={global} />))}
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
    </div>
  );
};
const SummaryContent = ({ message }: { message: IParsedMessage }) => {
  const {
    summaryMessageCount, summaryChatIds, summaryStartTime, summaryEndTime, mainTopic, pendingMatters, garbageMessage,
  } = message;
  const global = getGlobal();
  return (
    <>
      {(!mainTopic.length && !pendingMatters.length) ? undefined : (
        <MainSummaryContent
          summaryStartTime={summaryStartTime}
          summaryEndTime={summaryEndTime}
          summaryMessageCount={summaryMessageCount}
          summaryChatIds={summaryChatIds}
          mainTopic={mainTopic}
          pendingMatters={pendingMatters}
        />
      ) }

      {garbageMessage && garbageMessage.length > 0 && (
        <div className="mx-auto w-[693px] rounded-[10px] bg-white pl-[82px] pr-[25px] pt-[20px] pb-[25px]">
          <div className="flex items-center gap-[8px]">
            <img className="w-[52px] h-[52px] rounded-full ml-[-60px]" src={SerenaLogoPath} alt="" />
            <div>
              <p className="text-[16px] font-semibold">Serena</p>
              <p className="text-[14px] text-[#A8A6AC]">{summaryEndTime}</p>
            </div>
          </div>
          <p className="text-[22px] font-bold mb-[16px]">Spam Filtering</p>
          <div className="flex items-center gap-[20px]">
            <p className="flex items-center gap-[8px]">
              <img className="w-[16px] h-[16px]" src={CalendarIcon} alt="" />
              <div className="flex items-center">
                <span className="mr-[4px]">时间范围:</span>
                {summaryStartTime ? (<span>{formatTimestamp(summaryStartTime)} - </span>) : undefined}
                <span>{formatTimestamp(summaryEndTime)}</span>
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
  const { isLoading, message } = props;
  const [parsedMessage, setParsedMessage] = useState<IParsedMessage>({
    summaryMessageCount: 0,
    summaryStartTime: 0,
    summaryEndTime: 0,
    summaryChatIds: [],
    mainTopic: [],
    pendingMatters: [],
    garbageMessage: [],
  });
  useEffect(() => {
    if (!isLoading) {
      try {
        const messageContent = JSON.parse(message.content.replace(/^```json\n?/, '').replace(/```\n?$/, ''));
        setParsedMessage(messageContent);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }
  }, [isLoading, message]);
  return parsedMessage ? <SummaryContent message={parsedMessage} /> : undefined;
};

export default GlobalSummaryMessage;
