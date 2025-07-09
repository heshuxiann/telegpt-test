import type { FC } from '../../../lib/teact/teact';
import React, {
  useState,
} from '../../../lib/teact/teact';

import type {
  ApiPeer,
} from '../../../api/types';

import { PortraitIcon } from '../../chatAssistant/utils/icons';

import Avatar from '../../common/Avatar';

import styles from './SenderGroupContainer.module.scss';

type OwnProps = {
  avatarPeer?: ApiPeer;
  forwardInfo?: {
    hiddenUserName?: string;
  };
  handleAvatarClick: () => void;
};

const SenderGroupAvatar: FC<OwnProps> = ({
  avatarPeer,
  forwardInfo,
  handleAvatarClick,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const hiddenName = (!avatarPeer && forwardInfo) ? forwardInfo.hiddenUserName : undefined;

  function handlePortraitClick() {
    alert('User Portrait Clicked');
  }

  return (
    <div
      onMouseEnter={() => setMenuVisible(true)}
      onMouseLeave={() => setMenuVisible(false)}
      className="relative inline-block"
    >
      <Avatar
        size="small"
        className={styles.senderAvatar}
        peer={avatarPeer}
        text={hiddenName}
        onClick={avatarPeer ? handleAvatarClick : undefined}
      />
      {menuVisible && (
        <div
          className="absolute top-[-20px] left-[80%] bg-[var(--color-background-compact-menu)]
            text-[var(--color-text)] shadow-lg shadow-black/40 z-10 py-[6px] px-2 rounded-[8px] w-[135px]
            hover:bg-[var(--color-background-compact-menu-hover)]"
        >
          <div
            className="flex items-center gap-2 text-[14px] font-[500] cursor-pointer"
            onClick={handlePortraitClick}
          >
            <PortraitIcon />
            User Portrait
          </div>
        </div>
      )}
    </div>
  );
};

export default SenderGroupAvatar;
