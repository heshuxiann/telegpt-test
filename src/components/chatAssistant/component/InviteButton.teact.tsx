import React from '@teact';
import { memo } from '../../../lib/teact/teact';
import { getActions } from '../../../global';

import useLastCallback from '../../../hooks/useLastCallback';

import './InviteButton.scss';

import InviteGif from '../assets/invite/invite-gift.png';
const InviteButton = () => {
  const handleInviteFriendsClick = useLastCallback(() => {
    getActions().openInviteFriendsModal();
  });
  return (
    <div className="invite-button" onClick={handleInviteFriendsClick}>
      <img className="w-[20px] h-[20px]" src={InviteGif} alt="" />
      <span className="text-[12px] font-medium">Invite</span>
    </div>
  );
};

export default memo(InviteButton);
