import type { FC } from '../../lib/teact/teact';
import React, { memo, useEffect } from '../../lib/teact/teact';
import { withGlobal } from '../../global';

import type { ApiUser } from '../../api/types';
import type { ThemeKey } from '../../types';

import {
  selectTabState, selectTheme, selectUser,
} from '../../global/selectors';

import Avatar from '../common/Avatar';
import FullNameTitle from '../common/FullNameTitle';
import InfiniteScroll from '../ui/InfiniteScroll';

import './UserPortrait.scss';
import styles from '../common/ProfileInfo.module.scss';

type StateProps = {
  theme: ThemeKey;
  user?: ApiUser;
};

const UserPortrait: FC<StateProps> = ({
  user,
}) => {
  function renderBasicInfo() {
    return (
      <div className="rounded-[16px] bg-[#fff] p-2 text-[14px]">
        <div className="text-[16px] font-[700] mb-2">Basic Description</div>
        <div className="flex flex-col gap-1">
          <div>
            <span className="font-[600]">Username: </span>
            {user?.usernames?.[0]?.username}
          </div>
          <div>
            <span className="font-[600]">Alias/Nickname: </span>
            {user?.firstName} {user?.lastName}
          </div>
          <div>
            <span className="font-[600]">Role: </span>
            Crypto Investor / Community KOL
          </div>
          <div>
            <span className="font-[600]">Language: </span>
            Chinese (Primary), English (Secondary)
          </div>
        </div>
      </div>
    );
  }

  function renderBehaGroup() {
    return (
      <div className="rounded-[16px] bg-[#fff] p-2 text-[14px]">
        <div className="text-[16px] font-[700] mb-2">Behavioral Features & Group Participation</div>
        <div>
          <div className="font-[600]">Group Coverage</div>
          <div>articipates in 30+ TG groups (DeFi, airdrops, exchanges, governance, etc.)</div>
        </div>
        <div className="mt-2">
          <div className="font-[600]">Key Groups</div>
          <div>
            1
          </div>
        </div>
      </div>
    );
  }

  function renderActivity() {
    return (
      <div className="rounded-[16px] bg-[#fff] p-2 text-[14px]">
        <div
          className="text-[16px] font-[700] pb-2 sticky top-[-10px] z-10 bg-[#fff]"
        >
          Activity Stream (Last 7 Days)
        </div>
        <div className="flex flex-col gap-2">
          <ActivityMessageItem user={user} />
          <ActivityMessageItem user={user} />
          <ActivityMessageItem user={user} />
          <ActivityMessageItem user={user} />
          <ActivityMessageItem user={user} />
          <ActivityMessageItem user={user} />
          <ActivityMessageItem user={user} />
          <ActivityMessageItem user={user} />
          <ActivityMessageItem user={user} />
          <ActivityMessageItem user={user} />
          <ActivityMessageItem user={user} />
          <ActivityMessageItem user={user} />
          <ActivityMessageItem user={user} />
          <ActivityMessageItem user={user} />
          <ActivityMessageItem user={user} />
          <ActivityMessageItem user={user} />

          <div className="font-[600] text-center my-2">More</div>
        </div>
      </div>
    );
  }

  useEffect(() => {}, []);

  return (
    <InfiniteScroll
      className="Portrait custom-scroll"
      noFastList
    >
      <div className="flex flex-col gap-2 items-center justify-center">
        <Avatar
          peer={user}
          className={styles.fallbackPhotoAvatar}
          size="giant"
        />
        <FullNameTitle peer={(user)!} canCopyTitle />
      </div>
      {renderBasicInfo()}
      {renderBehaGroup()}
      {renderActivity()}
    </InfiniteScroll>
  );
};

function ActivityMessageItem({ user } : { user? : ApiUser }) {
  return (
    <div>
      <div className="flex items-center gap-1">
        <Avatar
          peer={user}
          className={styles.fallbackPhotoAvatar}
          size="mini"
        />
        <div className="font-[600]">June 7, 21:10</div>
      </div>
      <div className="ml-[2.2rem]">
        Initiated discussion on Has zkSync missed the best interaction window? in the DeFi Alpha Group
      </div>
    </div>
  );
}

export default memo(withGlobal(
  (global): StateProps => {
    const { userPortraitUserId } = selectTabState(global);
    const user = userPortraitUserId ? selectUser(global, userPortraitUserId) : undefined;

    return {
      user,
      theme: selectTheme(global),
    };
  },
)(UserPortrait));
