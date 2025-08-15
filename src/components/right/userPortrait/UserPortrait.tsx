/* eslint-disable max-len */
import dayjs from 'dayjs';
import { uniq } from 'lodash';
import type { FC } from '../../../lib/teact/teact';
import React, { memo, useEffect, useRef } from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';

import type { ApiUser } from '../../../api/types';
import type { ThemeKey } from '../../../types';

import {
  selectTabState,
  selectTheme,
  selectUser,
} from '../../../global/selectors';
import buildClassName from '../../../util/buildClassName';

import useOldLang from '../../../hooks/useOldLang';
import usePortrait from '../hooks/usePortrait';

import Avatar from '../../common/Avatar';
import FullNameTitle from '../../common/FullNameTitle';
import InfiniteScroll from '../../ui/InfiniteScroll';
import Spinner from '../../ui/Spinner';
import ActivityMessage from './ActivityMessage';
import UserPortraitAvatar from './UserPortraitAvatar';

import './UserPortrait.scss';
import roomAistyles from '../../chatAssistant/room-ai/room-ai.module.scss';
import styles from '../../common/ProfileInfo.module.scss';

type StateProps = {
  theme: ThemeKey;
  user?: ApiUser;
};

type OwnProps = {
  userId: string;
};

export const PortraitTagColors = [
  '#E5D9FF',
  '#CCD6FF',
  '#B6FFCE',
  '#FFD9D9',
  '#FFD9FF',
];

const UserPortrait: FC<StateProps & OwnProps> = ({ theme, userId, user }) => {
  const {
    loading, userPortraitInfo, chatTags, portraitMessage,
  } = usePortrait({
    userId,
  });
  // eslint-disable-next-line no-null/no-null
  const containerRef = useRef<HTMLDivElement>(null);
  const lang = useOldLang();

  function renderBasicInfo() {
    return (
      <>
        <div className="flex flex-col gap-2 items-center justify-center">
          <Avatar
            peer={user}
            className={styles.fallbackPhotoAvatar}
            size="giant"
          />
          <FullNameTitle peer={user!} canCopyTitle />
        </div>
        <div className="rounded-[16px] bg-[var(--color-ai-room-media-bg)] p-3 text-[14px]">
          <div className="text-[16px] font-[700] mb-2">Basic Description</div>
          <div className="flex flex-col gap-1">
            {user?.usernames?.[0]?.username && (
              <div>
                <span className="font-[600]">Username: </span>
                {user?.usernames?.[0]?.username}
              </div>
            )}
            <div>
              <span className="font-[600]">Alias/Nickname: </span>
              {user?.firstName} {user?.lastName}
            </div>
            {userPortraitInfo?.langs && (
              <div>
                <span className="font-[600]">Language: </span>
                {`${
                  userPortraitInfo?.langs?.[0]
                    ? `${userPortraitInfo?.langs?.[0]}(Primary)`
                    : ''
                } ${
                  userPortraitInfo?.langs?.[1]
                    ? `, ${userPortraitInfo?.langs?.[1]}(Secondary)`
                    : ''
                }`}
              </div>
            )}
            {userPortraitInfo?.tags && userPortraitInfo?.tags?.length > 0 && (
              <>
                <div>
                  <span className="font-[600]">Tags: </span>
                </div>
                <div className="flex flex-row flex-wrap items-center gap-2">
                  {userPortraitInfo?.tags?.map((tag, index) => (
                    <div
                      className="flex items-center justify-center px-2 rounded-[4px] h-[28px] text-[12px] font-[500] text-black"
                      style={`background: ${PortraitTagColors[index]}`}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  function renderBehaGroup() {
    return (
      <div className="rounded-[16px] bg-[var(--color-ai-room-media-bg)] p-3 text-[14px]">
        <div className="text-[16px] font-[700] mb-2">
          Behavioral Features & Group Participation
        </div>
        {userPortraitInfo?.chatCount && userPortraitInfo?.chatCount > 0 && (
          <div>
            <div className="font-[600]">Group Coverage</div>
            <div>
              Participates in {userPortraitInfo?.chatCount} TG groups{' '}
              {chatTags?.length > 0 && chatTags?.filter(Boolean).length > 0 && `(${uniq(chatTags).join(',')})`}
            </div>
          </div>
        )}
        {userPortraitInfo?.chatIds?.length && (
          <div className="mt-2">
            <div className="font-[600]">Key Groups</div>
            <div className="flex flex-col gap-2 mt-2">
              {userPortraitInfo?.chatIds?.map((item) => {
                return (
                  <UserPortraitAvatar
                    key={item}
                    chatId={item}
                    size={24}
                    showName
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderActivity() {
    return (
      <div className="rounded-[16px] bg-[var(--color-ai-room-media-bg)] text-[14px]">
        <div className="
          rounded-t-[16px] text-[16px] font-[700] p-3
          sticky top-[-10px] z-10
          bg-[var(--color-ai-room-media-bg)]
        "
        >
          Activity Stream
        </div>
        {loading && (
          <div className="flex items-center justify-center p-3">
            <Spinner
              className="w-[18px] h-[18px] ml-2"
              color={theme === 'dark' ? 'white' : 'black'}
            />
          </div>
        )}
        {portraitMessage?.length && user ? (
          <div className="flex flex-col gap-2">
            {portraitMessage?.sort((a:any, b:any) => {
              return (
                dayjs(b?.isSummary === false ? b?.time : `${b?.time} ${b?.timeRange?.split('-')[1]}`).unix())
                  - (dayjs(a?.isSummary === false ? a?.time : `${a?.time} ${a?.timeRange?.split('-')[1]}`).unix());
            })
              ?.map((item, index) => (
                <ActivityMessage
                  user={user}
                  data={item}
                  isLast={index === portraitMessage.length - 1}
                  key={item?.id}
                />
              ))}
          </div>
        ) : (
          !loading && (
            <div className="empty">
              {lang('NoMessages')}
            </div>
          )
        )}
      </div>
    );
  }

  useEffect(() => {
    containerRef?.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [userId]);

  return (
    <InfiniteScroll
      ref={containerRef}
      className={buildClassName(
        roomAistyles.rightPanelBg,
        'Portrait custom-scroll',
      )}
      noFastList
    >
      {renderBasicInfo()}
      {userPortraitInfo ? renderBehaGroup() : undefined}
      {renderActivity()}
    </InfiniteScroll>
  );
};

export default memo(
  withGlobal((global): StateProps => {
    const { userPortraitUserId } = selectTabState(global);
    const user = userPortraitUserId
      ? selectUser(global, userPortraitUserId)
      : undefined;

    return {
      user,
      theme: selectTheme(global),
    };
  })(UserPortrait),
);
