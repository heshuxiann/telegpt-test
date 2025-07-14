import dayjs from 'dayjs';
import React from '../../../lib/teact/teact';

import type {
  UserPortraitMessageInfo,
  UserPortraitMessageStory,
} from '../../chatAssistant/store/user-portrait-message-store';

import buildClassName from '../../../util/buildClassName';

import MediaStory from '../../story/MediaStory';
import SummaryActivity from './SummaryActivity';
import UserPortraitAvatar from './UserPortraitAvatar';

function ActivityMessage({
  userId,
  data,
  isLast,
}: {
  userId: string;
  data: UserPortraitMessageInfo | UserPortraitMessageStory;
  isLast: boolean;
}) {
  const isAiSummary = data.isSummary !== false;
  const isStory = !isAiSummary ? data?.id?.split('-')[1] === 'story' : false;
  return isAiSummary ? (
    <SummaryActivity data={data as UserPortraitMessageInfo} isLast={isLast} />
  ) : isStory ? (
    <div className={
      buildClassName('flex flex-col pb-3 border-b-[1px]', isLast ? 'border-[transparent]' : 'border-[#EDEDED]')
    }
    >
      <div className="flex items-center justify-between gap-1 mb-2">
        <UserPortraitAvatar
          chatId={userId}
        />
        <div className="text-[12px] text-[#979797]">
          {dayjs(data?.time).format('MMM D, HH:mm')}
        </div>
      </div>
      <MediaStory
        story={(data as UserPortraitMessageStory).message}
        isArchive={false}
      />
    </div>
  ) : (
    undefined
  );
}

export default ActivityMessage;
