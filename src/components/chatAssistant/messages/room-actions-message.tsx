/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from 'react';
import type { Message } from 'ai';
import { getGlobal } from '../../../global';

import { isUserId } from '../../../global/helpers';
import { selectChat, selectUser } from '../../../global/selectors';
import { cn, formatTimestamp } from '../utils/util';
import MessageActionsItems from './message-actions-button';

import Avatar from '../component/Avatar';
import ErrorBoundary from '../ErrorBoundary';

import ActionsIcon from '../assets/actions.png';
import CalendarIcon from '../assets/calendar.png';
import CheckIcon from '../assets/check.png';
import MessageIcon from '../assets/message.png';
import UserIcon from '../assets/user.png';

interface IProps {
  message: Message;
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
        <span className="text-[15px]" data-readable>{pendingItem.summary}</span>
      </div>
    </ErrorBoundary>
  );
};

const ActionsItems = ({
  messageId,
}: {
  messageId: string;
}) => {
  return (
    <MessageActionsItems
      canCopy
      canVoice
      message={{ id: messageId } as Message}
    />
  );
};

const ActionInfoContent = ({ summaryInfo }:{ summaryInfo:ISummaryInfo }) => {
  return (
    <ErrorBoundary>
      <div>
        <p className="flex items-center gap-[8px] mb-[16px]">
          <span className="text-[18px] font-bold" data-readable>Actions Items</span>
          <img className="w-[16px] h-[16px]" src={ActionsIcon} alt="" />
        </p>
        <div className="flex items-center gap-[20px]">
          <p className="flex items-center gap-[8px]">
            <img className="w-[16px] h-[16px]" src={CalendarIcon} alt="" />
            <div className="flex items-center gap-[4px]">
              <span className="mr-[4px] font-bold text-[14px]" data-readable-inline>Time:</span>
              {summaryInfo?.summaryTime ? (
                <p className="text-[14px] text-[#A8A6AC]" data-readable-inline>{formatTimestamp(summaryInfo.summaryTime)}</p>
              ) : null}
            </div>
          </p>
          <p className="flex items-center gap-[8px]">
            <img className="w-[16px] h-[16px]" src={MessageIcon} alt="" />
            <div className="flex items-center gap-[4px]">
              <span className="font-bold text-[14px]" data-readable-inline>Messages:</span>
              {summaryInfo?.messageCount ? (
                <span data-readable-inline>{summaryInfo?.messageCount}</span>
              ) : null}
            </div>
          </p>
        </div>
        {summaryInfo?.userIds ? (
          <div className="flex items-center gap-[8px] mb-[18px]">
            <img className="w-[16px] h-[16px]" src={UserIcon} alt="" />
            <span className="font-bold text-[14px]" data-readable>Groups/friends: </span>
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
                <div className="w-[24px] h-[24px] rounded-full bg-[#979797] text-[12px] whitespace-nowrap flex items-center justify-center" data-readable>{summaryInfo.userIds.length - 10}+</div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </ErrorBoundary>
  );
};

const RoomActionMessage = (props: IProps) => {
  const { message } = props;
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
        <div className="mx-auto rounded-[10px] px-3 py-2 bg-white dark:bg-[#292929]" data-message-container>
          {/* summary info  */}
          {summaryInfo && <ActionInfoContent summaryInfo={summaryInfo} />}
          {/* pending actions  */}
          {pendingMatters.length > 0 && (
            <div>
              {pendingMatters.map((item) => (<SummaryPenddingItem pendingItem={item} />))}
            </div>
          )}
          {/* action buttons  */}
          <ActionsItems messageId={message.id} />
        </div>
      )}
    </div>
  );
};

export default RoomActionMessage;
