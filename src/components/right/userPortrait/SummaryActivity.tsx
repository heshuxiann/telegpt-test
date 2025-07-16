import dayjs from 'dayjs';
import React from '../../../lib/teact/teact';
import { getActions } from '../../../global';

import type { ApiUser } from '../../../api/types';
import type {
  UserPortraitMessageInfo, UserPortraitMessageStory,
} from '../../chatAssistant/store/user-portrait-message-store';

import buildClassName from '../../../util/buildClassName';
import CalendarIcon from '../../chatAssistant/assets/calendar.png';
import MessageIcon from '../../chatAssistant/assets/message.png';
import SerenaPath from '../../chatAssistant/assets/serena.png';

import MediaStory from '../../story/MediaStory';
import UserPortraitAvatar from './UserPortraitAvatar';

const SummaryTopicItem = ({
  topicItem,
  index,
  chatId,
}: {
  topicItem: any;
  index: number;
  chatId?: string;
}) => {
  const { title, summaryItems } = topicItem;
  // if (!summaryItems.length) return undefined;
  if (!title || !chatId) return undefined;

  const { focusMessage } = getActions();

  function openMessageDetail(msgIds: number[]) {
    if (!chatId) return;
    const minId = Math.min(...msgIds);
    if (minId) {
      focusMessage({
        chatId,
        messageId: minId,
      });
    }
  }

  return (
    <div className="px-3">
      <div className="flex flex-row items-center flex-wrap">
        <span className="font-[700] mr-[14px]">
          {index + 1}. {title}
        </span>
        <UserPortraitAvatar chatId={chatId} />
      </div>
      <ul className="list-disc pl-1 list-inside">
        {summaryItems.map((summaryItem: any) => {
          const { content, relevantMessageIds } = summaryItem;
          if (!content) return undefined;
          return (
            <li
              role="button"
              className="cursor-pointer break-words"
              onClick={() => openMessageDetail(relevantMessageIds)}
            >
              {content}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const SummaryActivity = ({
  data,
  isLast,
}: {
  data: UserPortraitMessageInfo;
  isLast: boolean;
}) => {
  return (
    <div className={
      buildClassName('flex flex-col border-b-[1px]', isLast ? 'border-[transparent]' : 'border-[#EDEDED]')
    }
    >
      <div className="flex items-center justify-between gap-1 px-3">
        <div className="flex items-center gap-2">
          <img src={SerenaPath} className="w-[22px] h-[22px]" alt="" />
          <div className="font-[600]">Serena AI</div>
        </div>
        <div className="text-[12px] text-[#979797]">
          {dayjs(data?.time).format('MMM D')}, {data?.timeRange?.split('-')?.[1]}
        </div>
      </div>
      <div className="my-2 px-3">
        <div className="flex items-center gap-[8px]">
          <img className="w-[16px] h-[16px]" src={CalendarIcon} alt="" />
          <div className="flex items-center gap-[4px]">
            <span className="mr-[4px] font-bold text-[14px]">Time range: </span>
            {dayjs(data?.time).format('MMM D')}, {data?.timeRange}
          </div>
        </div>
        <div className="flex items-center gap-[8px]">
          <img className="w-[16px] h-[16px]" src={MessageIcon} alt="" />
          <div className="flex items-center gap-[4px]">
            <span className="font-bold text-[14px]">Messages: </span>
            {data?.messageCount ? <span>{data?.messageCount}</span> : undefined}
          </div>
        </div>
      </div>
      {data?.chatGroups?.map((chatGroup, index) => (
        <SummaryTopicItem
          key={chatGroup?.chatId}
          chatId={chatGroup?.chatId}
          topicItem={chatGroup}
          index={index}
        />
      ))}
    </div>
  );
};
export default SummaryActivity;

export const StoryActivity = ({
  user,
  data,
  isLast,
}: {
  user: ApiUser;
  data: UserPortraitMessageStory;
  isLast: boolean;
}) => {
  return (
    <div className={
      buildClassName('flex flex-col pb-3 border-b-[1px]', isLast ? 'border-[transparent]' : 'border-[#EDEDED]')
    }
    >
      <div className="flex items-center justify-between gap-1 px-3">
        <div className="flex items-center gap-2">
          <img src={SerenaPath} className="w-[22px] h-[22px]" alt="" />
          <div className="font-[600]">Serena AI</div>
        </div>
        <div className="text-[12px] text-[#979797]">
          {dayjs(data?.time).format('MMM D, HH:mm')}
        </div>
      </div>
      <div className="ml-[25px] mt-2 px-3">
        <div className="mb-1">
          <span className="font-[600]">{user?.firstName || ''} {user?.lastName || ''}</span>Post a Story
        </div>
        <MediaStory
          story={(data as UserPortraitMessageStory).message}
          isArchive={false}
        />
      </div>
    </div>
  );
};
