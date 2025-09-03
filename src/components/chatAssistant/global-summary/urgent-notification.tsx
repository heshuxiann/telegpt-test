
/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
/* eslint-disable max-len */
import type { CSSProperties } from 'react';
import React, { useEffect } from 'react';
import type { Message } from 'ai';
import { notification } from 'antd';

import DangerIcon from '../assets/danger.png';
import SerenaLogoPath from '../assets/serena.png';

const UrgentNotification = ({ message }:{ message:Message | null }) => {
  const [api, contextHolder] = notification.useNotification();
  const notificationUrgentMessage = (msg: Message) => {
    const parsedMessage = JSON.parse(msg.content);
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
    if (message) {
      notificationUrgentMessage(message);
    }
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [message]);
  return (
    <>
      { contextHolder }
      <span />
    </>
  );
};

export default UrgentNotification;
