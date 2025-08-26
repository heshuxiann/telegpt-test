import React from '@teact';
/* eslint-disable max-len */
import type { FC } from '../../../lib/teact/teact';
import React, { memo, useEffect, useState } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type { ApiUser } from '../../../api/types';
import type { UserPortraitInfo } from '../../chatAssistant/store/user-portrait-store';

import {
  selectUser,
} from '../../../global/selectors';
import { ChataiStores } from '../../chatAssistant/store';

import useLastCallback from '../../../hooks/useLastCallback';

import './UserPortrait.scss';

type StateProps = {
  user?: ApiUser;
};

type OwnProps = {
  userId: string;
  onClose: () => void;
};

export const PortraitTagColors = [
  '#E5D9FF',
  '#CCD6FF',
  '#B6FFCE',
  '#FFD9D9',
  '#FFD9FF',
];

const UserPortraitBaseCard: FC<StateProps & OwnProps> = ({ userId, user, onClose }) => {
//   const { loading, userPortraitInfo } = usePortrait({ userId });
  const [portraitInfo, setPortraitInfo] = useState<UserPortraitInfo | undefined>(undefined);

  const getPortraitInfo = useLastCallback(async () => {
    const info = await ChataiStores.userPortrait?.getUserPortrait(
      userId,
    );
    setPortraitInfo(info);
  });

  useEffect(() => {
    getPortraitInfo();
  }, [userId]);

  const handlePortraitClick = useLastCallback(() => {
    getActions().openUserPortrait({ userId });
    onClose();
  });

  function renderBasicInfo() {
    return (
      <div className="border-b-[1px] border-[#F3F3F3] px-[12px] pb-[12px]">
        <div className="text-[20px] font-[700] mb-2">Portrait</div>
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
          {portraitInfo && (
            <>
              {portraitInfo.langs && (
                <div>
                  <span className="font-[600]">Language: </span>
                  {`${
                    portraitInfo.langs?.[0]
                      ? `${portraitInfo.langs?.[0]}(Primary)`
                      : ''
                  } ${
                    portraitInfo.langs?.[1]
                      ? `, ${portraitInfo.langs?.[1]}(Secondary)`
                      : ''
                  }`}
                </div>
              )}
              {portraitInfo?.tags && portraitInfo?.tags?.length > 0 && (
                <>
                  <div>
                    <span className="font-[600]">Tags: </span>
                  </div>
                  <div className="flex flex-row flex-wrap items-center gap-2">
                    {portraitInfo?.tags?.map((tag, index) => (
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
            </>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="w-[24rem]">
      {renderBasicInfo()}
      <div
        className="h-[42px] flex items-center justify-center text-[var(--color-primary)] text-[14px] font-semibold pt-[0.5rem] cursor-pointer"
        onClick={handlePortraitClick}
      >
        View details
      </div>
    </div>
  );
};

export default memo(
  withGlobal((global, { userId }): StateProps => {
    const user = userId
      ? selectUser(global, userId)
      : undefined;

    return {
      user,
    };
  })(UserPortraitBaseCard),
);
