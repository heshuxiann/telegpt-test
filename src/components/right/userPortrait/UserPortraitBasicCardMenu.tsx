import React from '@teact';
import type { FC } from '../../../lib/teact/teact';
import { useEffect } from '../../../lib/teact/teact';

import type { MenuPositionOptions } from '../../ui/Menu';

import useMouseInside from '../../../hooks/useMouseInside';

import Menu from '../../ui/Menu';
import UserPortraitBasicCard from './UserPortraitBasicCard';

type OwnProps = {
  menuRef?: React.RefObject<HTMLDivElement|undefined>;
  isOpen: boolean;
  userId: string;
  onClose: () => void;
};
export const UserPortraitBasicCardMenu:FC< OwnProps & MenuPositionOptions> = ({
  menuRef,
  isOpen,
  userId,
  onClose,
  ...menuPositionOptions
}) => {
  const [handleMouseEnter, handleMouseLeave, markMouseInside] = useMouseInside(isOpen, onClose);
  useEffect(() => {
    if (isOpen) {
      markMouseInside();
    }
  }, [isOpen, markMouseInside]);
  return (
    <Menu
      ref={menuRef}
      isOpen={isOpen}
      // eslint-disable-next-line react/jsx-no-bind
      onClose={onClose}
      onCloseAnimationEnd={onClose}
      className="PortraitMenu"
      withPortal
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      noCompact
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...menuPositionOptions}
    >
      {isOpen && <UserPortraitBasicCard userId={userId} onClose={onClose} />}
    </Menu>
  );
};
