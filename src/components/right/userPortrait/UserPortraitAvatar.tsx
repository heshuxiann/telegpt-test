import React from '../../../lib/teact/teact';
import { getActions, getGlobal } from '../../../global';

import type { ApiChat, ApiUser } from '../../../api/types';

import { isUserId } from '../../../global/helpers';
import { selectChat, selectUser } from '../../../global/selectors';
import { cn } from '../../chatAssistant/utils/util';

import Avatar from '../../common/Avatar';

const UserPortraitAvatar = ({
  chatId,
  showName,
  size,
}: {
  chatId: string;
  showName?: boolean;
  size?: number;
}) => {
  const { openChat } = getActions();
  const global = getGlobal();
  const isUser = isUserId(chatId);
  let peer;
  if (isUser) {
    peer = selectUser(global, chatId);
  } else {
    peer = selectChat(global, chatId);
  }

  return (
    <div
      className="flex items-center gap-2 cursor-pointer"
      onClick={() => {
        openChat({ id: chatId });
      }}
    >
      <Avatar
        key={chatId}
        className={cn('overlay-avatar inline-block')}
        size={size ?? 20}
        peer={peer}
      />
      {showName && (
        <div>
          {isUser
            ? `${(peer as ApiUser)?.firstName ?? ''} ${(peer as ApiUser)?.lastName ?? ''}`
            : (peer as ApiChat)?.title}
        </div>
      )}
    </div>
  );
};

export default UserPortraitAvatar;
