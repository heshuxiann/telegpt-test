/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
/* eslint-disable max-len */
import type { CSSProperties } from 'react';
import React, { useEffect } from 'react';
import type { Message } from 'ai';
import { notification } from 'antd';

import { isUrgentCheckMessage } from '../utils/util';

import DangerIcon from '../assets/danger.png';
import SerenaLogoPath from '../assets/serena.png';

const UrgentNotification = ({ messages, isLoading }:{ messages:Message[];isLoading:boolean }) => {
  const [api, contextHolder] = notification.useNotification();
  const extractContent = (content: string) => {
    const regex = /<!--\s*json-start\s*-->([\s\S]*?)<!--\s*json-end\s*-->/s;
    const match = content.match(regex);
    if (match) {
      try {
        const result = JSON.parse(match[1].trim());
        return result;
      } catch (error) {
        console.error('JSON 解析错误:', error);
        return null;
      }
    }
    return null;
  };

  const notificationUrgentMessage = (message: Message) => {
    const parsedMessage = extractContent(message.content);
    if (parsedMessage && typeof parsedMessage === 'object' && parsedMessage.length > 0) {
      parsedMessage.forEach((item:any) => {
        api.open({
          style: { padding: '12px 20px' } as CSSProperties,
          message: (
            <div className="flex flex-row gap-[12px]">
              <img className="w-[52px] h-[52px] rounded-full" src={SerenaLogoPath} alt="" />
              <div>
                <div className="flex flex-row items-center gap-[8px] mb-[10px]">
                  <img src={DangerIcon} alt="" className="w-[26px] h-[26px]" />
                  <span className="text-[20px] text-[#FF543D] font-bold">Urgent Alert</span>
                </div>
                <div className="text-[18px] font-semibold line-clamp-2 overflow-hidden text-ellipsis">{item.content}</div>
              </div>
            </div>
          ),
        });
      });
    }
  };

  useEffect(() => {
    if (!isLoading) {
      const lastMessage = messages[messages.length - 1];
      const prevMessage = messages[messages.length - 2];
      if (isUrgentCheckMessage(prevMessage)) {
        notificationUrgentMessage(lastMessage);
      }
    }
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [messages, isLoading]);
  return (
    <>
      { contextHolder }
      <span />
    </>
  );
};

export default UrgentNotification;
