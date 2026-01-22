import React from '@teact';
import {
  memo, useCallback, useEffect, useState,
} from '../../../lib/teact/teact';
import { getActions } from '../../../global';

import type { ApiUser } from '../../../api/types';
import type { UserPortraitInfo } from '../../chatAssistant/store/user-portrait-store';

import buildClassName from '../../../util/buildClassName';
import { checkCredisBalance } from '../../../util/subscriptionHandler';
import { ChataiStores } from '../../chatAssistant/store';

import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';

import { PortraitTagColors } from '../../right/userPortrait/UserPortrait';
import ListItem from '../../ui/ListItem';

const DotIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={12}
    height={3}
    fill="none"
  >
    <path
      fill="currentColor"
      d="M1.268 0a1.267 1.267 0 1 1-.002 2.534A1.267 1.267 0 0 1 1.268 0Zm4.435 0a1.268 1.268 0 1 1 0 2.536 1.268 1.268 0 0 1 0-2.536Zm4.437 0a1.268 1.268 0 1 1 0 2.535 1.268 1.268 0 0 1 0-2.535Z"
    />
  </svg>
);

const PortraitEntry = ({ user, subscriptionType }: { user: ApiUser; subscriptionType: string | undefined }) => {
  const oldLang = useOldLang();
  const { openUserPortrait, openPayPackageModal } = getActions();

  const [userInfo, setUserInfo] = useState<UserPortraitInfo>();

  const handlePortraitClick = useLastCallback(() => {
    if (!checkCredisBalance()) {
      openPayPackageModal();
      return;
    }
    if (subscriptionType === 'plus') {
      openUserPortrait({ userId: user?.id });
    } else {
      openPayPackageModal();
    }
  });

  const getUserPortrait = useCallback(async (senderId: string) => {
    if (!senderId) return;
    const portraitInfo = await ChataiStores.userPortrait?.getUserPortrait(
      senderId,
    );
    if (portraitInfo) {
      setUserInfo(portraitInfo);
    } else {
      setUserInfo(undefined);
    }
  }, []);

  useEffect(() => {
    getUserPortrait(user?.id);
  }, [user?.id, getUserPortrait]);

  return (
    <ListItem
      icon="portrait-large-icon"
      iconClassName={buildClassName(userInfo?.tags?.length ? 'pb-[40px]' : '')}
      multiline
      narrow
      ripple
      onClick={handlePortraitClick}
    >
      <span className="title">
        <span className="font-[600]">{(user?.firstName || '') + (user?.lastName || '')}</span>
        ‘s portrait
      </span>
      {userInfo?.tags && userInfo?.tags?.length > 0 && (
        <div className="flex items-center gap-1 my-1">
          {userInfo?.tags?.slice(0, 1)?.map((tag, index) => (
            <div
              className="flex items-center justify-center px-2 rounded-[4px] h-[24px] text-[12px] font-[500]"
              style={`background: ${PortraitTagColors[index]}`}
            >
              {tag}
            </div>
          ))}
          {userInfo?.tags?.length > 1 && (
            <div
              className="flex items-center justify-center px-2 rounded-[4px] h-[24px]"
              style={`background: ${PortraitTagColors[1]}`}
            >
              <DotIcon />
            </div>
          )}
        </div>
      )}
      <span className="subtitle">{oldLang('User Portrait')}</span>
    </ListItem>
  );
};

export default memo(PortraitEntry);
