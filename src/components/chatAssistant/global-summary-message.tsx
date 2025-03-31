/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from 'react';
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
interface ISummaryInfo {
  summaryMessageCount: number;
  summaryStartTime: number;
  summaryEndTime: number;
  summaryChatIds: Array<string>;
}

interface ISummaryTopicItem {
  chatId: string;
  chatTitle: string;
  summaryItems: {
    topic: string;
    relevantMessage: {
      summary: string;
      relevantMessageIds: number[];
    }[];
  }[];
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

const SummaryTopicItem = ({ topicItem, global }: { topicItem: ISummaryTopicItem; global: GlobalState }) => {
  const { chatId, chatTitle, summaryItems } = topicItem;
  if (!summaryItems.length) return undefined;
  const showMessageDetail = (chatId: string, relevantMessageIds: number[]) => {
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
      {summaryItems.map((summaryItem: any, index: number) => {
        const { topic, relevantMessage } = summaryItem;
        return (
          <div>
            <div>
              <p className="text-[14px] font-semibold">{index + 1}. {topic}</p>
            </div>
            <ul className="list-disc pl-[28px] text-[16px]">
              {relevantMessage.map((message: any) => (
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
  summaryInfo,
  mainTopic,
  pendingMatters,
}: {
  summaryInfo: ISummaryInfo | null;
  mainTopic: ISummaryTopicItem[];
  pendingMatters: ISummaryPendingItem[];
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
const SummaryContent = ({
  summaryInfo, mainTopic, pendingMatters, garbageMessage,
}:
{
  summaryInfo: ISummaryInfo | null;
  mainTopic: ISummaryTopicItem[];
  pendingMatters: ISummaryPendingItem[];
  garbageMessage: ISummaryGarbageItem[];
}) => {
  const global = getGlobal();
  return (
    <>
      {(!mainTopic.length && !pendingMatters.length) ? undefined : (
        <MainSummaryContent
          summaryInfo={summaryInfo}
          mainTopic={mainTopic}
          pendingMatters={pendingMatters}
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
  const { isLoading, message } = props;
  // const [parsedMessage, setParsedMessage] = useState<IParsedMessage>({
  //   summaryMessageCount: 0,
  //   summaryStartTime: 0,
  //   summaryEndTime: 0,
  //   summaryChatIds: [],
  //   mainTopic: [],
  //   pendingMatters: [],
  //   garbageMessage: [],
  // });
  const [summaryInfo, setSummaryInfo] = useState<ISummaryInfo | null>(null);
  const [mainTopic, setMainTopic] = useState<ISummaryTopicItem[]>([]);
  const [pendingMatters, setPendingMatters] = useState<ISummaryPendingItem[]>([]);
  const [garbageMessage, setGarbageMessage] = useState<ISummaryGarbageItem[]>([]);
  const extractContent = (content: string, codeId: string): ISummaryInfo | ISummaryTopicItem[] | ISummaryPendingItem[] | ISummaryGarbageItem[] | null => {
    // const regex = new RegExp(
    //   `<!-- code-id: ${codeId} -->\\s*\\s*([\\s\\S]*?)\\s*<!-- end-code-id -->`,
    //   's',
    // );
    const regex = new RegExp(`<!--\\s*code-id:\\s*${codeId}\\s*-->([\\s\\S]*?)<!--\\s*end-code-id\\s*-->`, 's');
    const match = content.match(regex);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
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

    // const regex = /<!-- code-id: (\w+) -->\s*(.*?)\s*(?=<!-- end-code-id -->)/gs;
    // let match;
    // const result:{ [key:string]:any } = {};

    // // eslint-disable-next-line no-null/no-null, no-cond-assign
    // while ((match = regex.exec(message)) !== null) {
    //   const key = match[1]; // 'summary-info', 'main-topic', etc.
    //   const value = match[2].trim();
    //   result[key] = value;
    // }
    // // eslint-disable-next-line no-console
    // console.log(result, '-------result');
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
    />
  );
};

export default GlobalSummaryMessage;
