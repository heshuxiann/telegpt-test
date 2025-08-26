import React from '@teact';

import type { ApiUser } from '../../../api/types';
import type {
  UserPortraitMessageInfo,
  UserPortraitMessageStory,
} from '../../chatAssistant/store/user-portrait-message-store';

import SummaryActivity, { StoryActivity } from './SummaryActivity';

function ActivityMessage({
  user,
  data,
  isLast,
}: {
  user: ApiUser;
  data: UserPortraitMessageInfo | UserPortraitMessageStory;
  isLast: boolean;
}) {
  const isAiSummary = data.isSummary !== false;
  const isStory = !isAiSummary ? data?.id?.split('-')[1] === 'story' : false;
  return isAiSummary ? (
    <SummaryActivity data={data as UserPortraitMessageInfo} isLast={isLast} />
  ) : isStory ? (
    <StoryActivity data={data as UserPortraitMessageStory} isLast={isLast} user={user} />
  ) : (
    undefined
  );
}

export default ActivityMessage;
