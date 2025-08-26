import React from 'react';
import { getGlobal } from '../../../global';

import { selectChat, selectUser } from '../../../global/selectors';
import { isUserId } from '../../../util/entities/ids';
import { cn } from '../utils/util';

import Avatar from './Avatar';

const ChatAvatar = ({
  chatId, classNames, size, style,
}: { chatId: string; classNames?: string; size: number; style?: Record<string, string> }) => {
  const global = getGlobal();
  let peer;
  if (isUserId(chatId)) {
    peer = selectUser(global, chatId);
  } else {
    peer = selectChat(global, chatId);
  }

  return (
    <Avatar
      style={style}
      key={chatId}
      className={cn(classNames, 'overlay-avatar inline-block cursor-pointer')}
      size={size}
      peer={peer}
    />
  );
};

export default ChatAvatar;
