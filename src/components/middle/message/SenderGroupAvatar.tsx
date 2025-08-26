import React from '@teact';
import type { FC } from '../../../lib/teact/teact';
import {
  useCallback,
  useRef,
  useState,
} from '../../../lib/teact/teact';
import { getActions } from '../../../global';

import type {
  ApiPeer,
} from '../../../api/types';
import type { IAnchorPosition } from '../../../types';

import buildClassName from '../../../util/buildClassName';

import useFlag from '../../../hooks/useFlag';
import useLastCallback from '../../../hooks/useLastCallback';

import Avatar from '../../common/Avatar';
import { UserPortraitBasicCardMenu } from '../../right/userPortrait/UserPortraitBasicCardMenu';
import ResponsiveHoverButton from '../../ui/ResponsiveHoverButton';

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
  const { openUserPortrait } = getActions();
  const hiddenName = (!avatarPeer && forwardInfo) ? forwardInfo.hiddenUserName : undefined;
  const [isSymbolMenuOpen, openSymbolMenu, closeSymbolMenu] = useFlag();
  const [contextMenuAnchor, setContextMenuAnchor] = useState<IAnchorPosition | undefined>(undefined);
  const triggerRef = useRef<HTMLDivElement>();
  const menuRef = useRef<HTMLDivElement>();
  const ref = useRef<HTMLDivElement>();
  const getTriggerElement = useCallback(() => ref.current, []);
  const getMenuElement = useCallback(() => menuRef.current!, []);
  const getRootElement = useCallback(
    () => ref.current!.closest('.custom-scroll, .no-scrollbar'),
    [],
  );
  const getLayout = useLastCallback(() => ({ withPortal: true, shouldAvoidNegativePosition: true }));

  const handleActivateSymbolMenu = useLastCallback(() => {
    openSymbolMenu();
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;
    const { x, y } = triggerEl.getBoundingClientRect();
    setContextMenuAnchor({ x, y });
  });

  return (
    <div className="inline-block" ref={ref}>
      <ResponsiveHoverButton
        round
        className={buildClassName('!p-0 !w-auto !h-auto')}
        color="translucent"
        onActivate={handleActivateSymbolMenu}
      >
        <div ref={triggerRef} className="symbol-menu-trigger" />
        <Avatar
          size="small"
          className={styles.senderAvatar}
          peer={avatarPeer}
          text={hiddenName}
          onClick={avatarPeer ? handleAvatarClick : undefined}
        />
      </ResponsiveHoverButton>
      <UserPortraitBasicCardMenu
        isOpen={isSymbolMenuOpen}
        onClose={closeSymbolMenu}
        userId={avatarPeer?.id!}
        anchor={contextMenuAnchor}
        menuRef={menuRef}
        getTriggerElement={getTriggerElement}
        getMenuElement={getMenuElement}
        getRootElement={getRootElement}
        getLayout={getLayout}
      />
    </div>
  )
};

export default SenderGroupAvatar;
