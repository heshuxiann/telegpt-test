/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import type { Message } from 'ai';
import { toBlob } from 'html-to-image';
import { getGlobal } from '../../../global';

import { isUserId } from '../../../global/helpers';
import {
  selectChat, selectCurrentMessageList, selectUser,
} from '../../../global/selectors';
import { cn, formatTimestamp } from '../utils/util';
import MessageActionsItems from './message-actions-button';

import Avatar from '../component/Avatar';
import ErrorBoundary from '../ErrorBoundary';

import ActionsIcon from '../assets/actions.png';
import CalendarIcon from '../assets/calendar.png';
import CheckIcon from '../assets/check.png';
import MessageIcon from '../assets/message.png';
import SerenaPath from '../assets/serena.png';
import ShareHeaderBg from '../assets/share-header-bg.png';
import UserIcon from '../assets/user.png';
import WriteIcon from '../assets/write.png';

interface IProps {
  message: Message;
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
          <span className="text-[16px] font-bold mr-[24px]" data-readable>{index + 1}. {title}</span>
        </div>
        <ul className="list-disc pl-[2px] text-[16px] list-inside">
          {summaryItems.map((summaryItem: any) => {
            const { content } = summaryItem;
            if (!content) return null;
            return (
              <li
                role="button"
                className="cursor-pointer text-[15px] break-words"
                data-readable
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
        <span className="text-[15px]" data-readable>{pendingItem.summary}</span>
      </div>
    </ErrorBoundary>
  );
};

const SummaryInfoContent = ({
  summaryInfo,
  title = <>Chat Summary</>,
}:{
  summaryInfo: ISummaryInfo;
  title?: any;
}) => {
  return (
    <ErrorBoundary>
      <div>
        <p className="text-[22px] font-bold mb-[16px]" data-readable>{title}</p>
        <div className="flex items-center flex-wrap">
          <p className="flex items-center gap-[8px] pr-[20px]">
            <img className="w-[16px] h-[16px]" src={CalendarIcon} alt="" />
            <div className="flex items-center gap-[4px]">
              <span className="mr-[4px] font-bold text-[14px]" data-readable-inline>Time:</span>
              {summaryInfo?.summaryTime ? (
                <p className="text-[14px] text-[#A8A6AC] whitespace-nowrap" data-readable-inline>
                  {formatTimestamp(summaryInfo.summaryTime)}
                </p>
              ) : null}
            </div>
          </p>
          <p className="flex items-center gap-[8px]">
            <img className="w-[16px] h-[16px]" src={MessageIcon} alt="" />
            <div className="flex items-center gap-[4px]">
              <span className="font-bold text-[14px]" data-readable data-readable-inline>Messages:</span>
              {summaryInfo?.messageCount ? (
                <span data-readable data-readable-inline>{summaryInfo?.messageCount}</span>
              ) : null}
            </div>
          </p>
        </div>
        {summaryInfo?.userIds ? (
          <div className="flex items-center gap-[8px] mb-[18px]">
            <img className="w-[16px] h-[16px]" src={UserIcon} alt="" />
            <span className="font-bold text-[14px]">Main speakers: </span>
            <div className="flex items-center">
              {summaryInfo.userIds.slice(0, 5).map((id: string, index: number) => {
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
}: {
  messageId:string;
  summaryInfo: ISummaryInfo | null;
  mainTopic: ISummaryTopicItem[];
  pendingMatters: ISummaryPendingItem[];
}) => {
  const [capturing, setCapturing] = useState(false);
  const global = getGlobal();
  const { chatId } = selectCurrentMessageList(global) || {};
  const chat = selectChat(global, chatId!);

  return (
    <div className="mx-auto rounded-[10px] px-3 py-2 dark:bg-[#292929] bg-white" data-message-container>
      {/* summary info  */}
      {summaryInfo && (
        <SummaryInfoContent summaryInfo={summaryInfo} />
      )}
      {/* maintopic  */}
      {mainTopic.length > 0 && (
        <div>
          <p className="flex items-center gap-[8px] mb-[16px]">
            <span className="text-[18px] font-bold" data-readable>Key Topics</span>
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
            <span className="text-[18px] font-bold" data-readable>Actions Items</span>
            <img className="w-[16px] h-[16px]" src={ActionsIcon} alt="" />
          </p>
          {pendingMatters.map((item) => (<SummaryPenddingItem pendingItem={item} />))}
        </div>
      )}
      {/* action buttons  */}
      <MessageActionsItems
        canCopy
        canVoice
        canShare
        message={{ id: messageId } as Message}
        // eslint-disable-next-line react/jsx-no-bind
        onClickShare={() => {
          setCapturing(true);
        }}
      />
      <ShareCard
        capturing={capturing}
        // eslint-disable-next-line react/jsx-no-bind
        captureCallback={() => {
          setCapturing(false);
        }}
      >
        {summaryInfo && (
          <SummaryInfoContent
            summaryInfo={summaryInfo}
            title={(
              <>
                Chat Summary
                <span className="ml-2 text-xs text-[#979797]">[{chat?.title}]</span>
              </>
            )}
          />
        )}
        {/* maintopic  */}
        {mainTopic.length > 0 && (
          <div>
            <p className="flex items-center gap-[8px]">
              <span className="text-[18px] font-bold" data-readable>Key Topics</span>
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
            <p className="flex items-center gap-[8px]">
              <span className="text-[18px] font-bold" data-readable>Actions Items</span>
              <img className="w-[16px] h-[16px]" src={ActionsIcon} alt="" />
            </p>
            {pendingMatters.map((item) => (<SummaryPenddingItem pendingItem={item} />))}
          </div>
        )}
      </ShareCard>
    </div>
  );
};
const RoomSummaryMessage = (props: IProps) => {
  const { message } = props;
  const [summaryInfo, setSummaryInfo] = useState<ISummaryInfo | null>(null);
  const [mainTopic, setMainTopic] = useState<ISummaryTopicItem[]>([]);
  const [pendingMatters, setPendingMatters] = useState<ISummaryPendingItem[]>([]);
  const parseMessage = useCallback((messageContent: string) => {
    const messageObj = JSON.parse(messageContent);
    const {
      mainTopic, pendingMatters, summaryInfo,
    } = messageObj;
    if (mainTopic) {
      setMainTopic(mainTopic as ISummaryTopicItem[]);
    }
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
      {(!mainTopic.length && !pendingMatters.length) ? null : (
        <MainSummaryContent
          messageId={message.id}
          summaryInfo={summaryInfo}
          mainTopic={mainTopic}
          pendingMatters={pendingMatters}
        />
      )}
    </div>
  );
};

function ShareCard({
  capturing = false,
  children,
  captureCallback = () => {},
}: {
  capturing: boolean;
  children?: any;
  captureCallback?: () => void;
}) {
  const domRef = useRef<HTMLDivElement>();
  const global = getGlobal();
  const { currentUserId } = global;
  const currentUser = selectUser(global, currentUserId!);

  useEffect(() => {
    if (domRef.current) {
      setTimeout(() => {
        toBlob(domRef.current!, {
          pixelRatio: 2, // Higher pixel ratio for better quality
          quality: 1, // Maximum quality
        })
          .then((blob) => {
            const file = new File([blob!], 'telegpt.org.png', { type: 'image/png' });
            // @ts-ignore
            globalThis?.p__handleFileSelect?.([file], true);
            captureCallback();
          });
      }, 100);
    }
  }, [capturing, captureCallback]);

  if (!capturing) return null;

  return (
    <div className="fixed top-0 left-0 translate-x-[-1000000px] translate-y-[-100000px]">
      <div
        ref={domRef}
        className="relative w-[390px] box-content overflow-hidden bg-white text-black"
      >
        <div className="absolute top-0 left-0 w-full blur-xl pointer-events-none">
          <img src={ShareHeaderBg} alt="" className="w-full" />
        </div>
        <div className="relative py-3 px-4 flex flex-col gap-2">
          <div className="flex flex-row justify-end items-center gap-2 text-xs text-[#979797]">
            <Avatar
              className="w-[20px] h-[20px]"
              peer={currentUser}
            />
            <span>{currentUser?.firstName}</span>
            <span>{currentUser?.lastName}</span>
          </div>

          {children}
        </div>
        <section className="flex flex-row gap-1 items-center justify-center py-2 text-xs bg-[#F7FAFF]">
          <img className="inline w-[20px] h-[20px] rounded-full" src={SerenaPath} alt="Serena" />
          Powered by
          <span className="text-[#2996FF]">telepgt.org</span>
        </section>
      </div>
    </div>

  );
}

export default RoomSummaryMessage;
