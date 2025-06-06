/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
import React, { useEffect, useState } from 'react';
import type { Message } from 'ai';
import { getActions, getGlobal } from '../../global';

import { getChatTitle, isUserId } from '../../global/helpers';
import { selectChat } from '../../global/selectors';
import useOldLang from './hook/useOldLang';

import Avatar from './component/Avatar';

export const GroupSearchMessage = ({ message }: { message: Message }) => {
  const [chatIds, setChatIds] = useState<string[]>([]);
  const global = getGlobal();
  const lang = useOldLang();

  const handleClick = (chatId: string) => {
    const chat = selectChat(global, chatId);
    if (chat) {
      getActions().openChat({ id: chatId });
    }
  };
  const renderChatAvatar = (chatId: string) => {
    if (isUserId(chatId)) {
      return null;
    }
    let membersCount:number;
    let title:string;
    const chat = selectChat(global, chatId);
    if (chat) {
      membersCount = chat?.membersCount as number;
      title = getChatTitle(lang, chat);
    } else {
      return null;
    }
    return (
      <div
        className="flex flex-row items-center gap-[8px] cursor-pointer px-[12px] py-[8px] rounded-[12px] hover:bg-[#D9D9D9]"
        onClick={() => { handleClick(chatId); }}
      >
        <Avatar
          key={chatId}
          className="overlay-avatar inline-block cursor-pointer"
          size={44}
          peer={chat}
        />
        <div className="flex flex-col justify-center gap-[4px]">
          <span className="text-[15px] font-semibold text-black leading-[18px]">{title}</span>
          <span className="text-[14px] text-[#5E6272] leading-[18px]">{membersCount} Members</span>
        </div>
      </div>
    );
  };
  useEffect(() => {
    try {
      const ids = JSON.parse(message.content);
      setChatIds(ids || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  }, [message]);
  if (chatIds.length === 0) {
    return <span>未找到相关群组</span>;
  }
  return (
    <div className="p-[10px] mx-[22px] rounded-[16px] border-[1px] border-[#D9D9D9]">
      <div className="flex flex-col gap-[12px]">
        {chatIds.splice(0, 10).map((id) => {
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
