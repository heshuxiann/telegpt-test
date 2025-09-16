import React, { memo } from 'react';
import { getActions } from '../../../global';

import './InviteButton.scss';

import InviteGif from '../assets/invite/invite-gift.png';
const InviteButton = () => {
  const handleInviteFriendsClick = () => {
    getActions().openInviteFriendsModal();
  };
  return (
    <div className="invite-button" onClick={handleInviteFriendsClick}>
      <img className="w-[20px] h-[20px]" src={InviteGif} alt="" />
      <span className="text-[12px] font-medium">Invite</span>
    </div>
  );
};

export default memo(InviteButton);
