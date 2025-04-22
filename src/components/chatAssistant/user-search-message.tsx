/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
import React, { useEffect, useState } from 'react';
import type { Message } from 'ai';
import { getActions, getGlobal } from '../../global';

import { getUserFullName, isUserId } from '../../global/helpers';
import { selectChat, selectUser } from '../../global/selectors';

import Avatar from './ui/Avatar';

export const UserSearchMessage = ({ message }: { message: Message }) => {
  const [senderIds, setSenderIds] = useState<string[]>([]);
  const global = getGlobal();
  const handleClick = (userId: string) => {
    const chat = selectChat(global, userId);
    if (chat) {
      getActions().openChat({ id: userId });
    }
  };
  const renderChatAvatar = (userId: string) => {
    if (!isUserId(userId)) {
      return null;
    }
    let title:string | undefined;
    const peer = selectUser(global, userId);
    if (peer) {
      title = getUserFullName(peer);
    } else {
      return null;
    }
    return (
      <div
        className="flex flex-row items-center gap-[8px] cursor-pointer px-[12px] py-[8px] rounded-[12px] hover:bg-[#D9D9D9]"
        onClick={() => { handleClick(userId); }}
      >
        <Avatar
          key={userId}
          className="overlay-avatar inline-block cursor-pointer"
          size={44}
          peer={peer}
        />
        <div className="flex flex-col justify-center gap-[4px]">
          <span className="text-[15px] font-semibold text-black leading-[18px]">{title}</span>
        </div>
      </div>
    );
  };
  useEffect(() => {
    try {
      const ids = JSON.parse(message.content);
      setSenderIds(ids || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  }, [message]);
  if (senderIds.length === 0) {
    return null;
  }
  return (
    <div className="p-[10px] mx-[22px] rounded-[16px] border-[1px] border-[#D9D9D9]">
      <div className="flex flex-col gap-[12px]">
        {senderIds.splice(0, 10).map((id) => {
          return (
            <>
              {renderChatAvatar(id)}
            </>
          );
        })}
      </div>
    </div>
  );
};
