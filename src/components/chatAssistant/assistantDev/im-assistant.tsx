/* eslint-disable max-len */
import type { CSSProperties } from 'react';
import React, { useState } from 'react';
import { Modal } from 'antd';
import List from 'rc-virtual-list';

import type { ApiMessage } from '../../../api/types';

import { Chat } from './chat';

import './imAssistant.scss';

import SerenaPath from '../assets/serena.png';

export interface IFetchUnreadMessage {
  chatId:string;
  offsetId:number;
  unreadCount:number ;
}

interface ImAssistantProps {
  chatList:ImAssistantChat[];
  currentUser:{
    id:string;
    name:string;
    phoneNumber:string;
  } | undefined;
  getRoomUnreadMessages:(params:IFetchUnreadMessage)=>Promise<ApiMessage[]>;
  getRoomTodayMessage:(chatId:string)=>Promise<ApiMessage[]>;
}
export interface ImAssistantChat {
  chatId:string;
  name: string;
  nameFirstLetters: string;
  avatar: string | undefined;
  avatarColor:string;
  unreadCount: number | undefined;
  lastReadInboxMessageId: number | undefined;
  lastReadOutboxMessageId: number | undefined;
  chatType: 'single' | 'group' | 'channel';
}

const ImAssistant = (props:ImAssistantProps) => {
  const {
    chatList, currentUser, getRoomUnreadMessages, getRoomTodayMessage,
  } = props;
  const [assiatantModalOpen, setAssiatantModalOpen] = useState(false);

  const [currentChat, setCurrentChat] = useState<ImAssistantChat>();

  return (
    <div className="im-assistant-main">
      <div className="w-[60px] h-[60px] fixed left-[260px] bottom-[100px] cursor-pointer" onClick={() => setAssiatantModalOpen(true)}>
        <img className="w-full h-full rounded-full" src={SerenaPath} alt="" />
      </div>
      {assiatantModalOpen && (
        <Modal
          open={assiatantModalOpen}
          width={window.innerWidth * 0.9}
          height={window.innerHeight * 0.9}
          className="im-assistant-modal"
          closable={false}
          // eslint-disable-next-line react/jsx-no-bind
          onClose={() => setAssiatantModalOpen(false)}
          // eslint-disable-next-line no-null/no-null
          footer={null}
        >
          <div className="im-assistant-inner relative  w-full h-full flex flex-row bg-white rounded-[16px] overflow-hidden">
            <div className="absolute cursor-pointer text-[24px] right-[24px] top-[12px]" onClick={() => setAssiatantModalOpen(false)}>X</div>
            <div className="im-assistant-left w-[320px]">
              {chatList ? (
                <List data={chatList} height={window.innerHeight * 0.9} itemKey="id" itemHeight={30}>
                  {(item) => {
                    return (
                      <div
                        className={`im-assiatant-chat-item flex flex-row items-center p-[9px] cursor-pointer relative ${currentChat?.chatId === item.chatId ? 'active' : ''}`}
                        onClick={() => setCurrentChat(item)}
                      >
                        <div className="w-[54px] h-[54px] rounded-full overflow-hidden mr-[0.5rem]">
                          {item.avatar ? (
                            <img className="w-full h-full" src={item.avatar} alt="" />
                          ) : (
                            <div className="w-full h-full text-[25px] font-bold flex items-center justify-center text-white" style={{ backgroundImage: `linear-gradient(#ffffff -300%, ${item.avatarColor})` } as React.CSSProperties}>{item.nameFirstLetters}</div>
                          )}
                        </div>
                        <div className="text-[16px] font-semibold flex-1 overflow-hidden whitespace-nowrap text-ellipsis">{item.name}</div>
                        <div className="w-[24px] h-[24px] absolute right-[8px] bottom-[8px] rounded-full bg-[#00C73E] flex items-center justify-center text-white">{item.unreadCount}</div>
                      </div>
                    );
                  }}
                </List>
              ) : (
                <span>empty</span>
              )}

            </div>
            {currentChat && (
              <div className="im-assistant-right flex-1 flex flex-col" style={{ background: 'linear-gradient(135deg, rgba(172, 182, 229, 0.5) 10%, rgba(116, 235, 213, 0.5) 90%)' } as CSSProperties}>
                <Chat
                  currentUser={currentUser}
                  currentChat={currentChat}
                  getRoomTodayMessage={getRoomTodayMessage}
                  getRoomUnreadMessages={getRoomUnreadMessages}
                />
              </div>
            )}
          </div>
        </Modal>
      )}

    </div>
  );
};

export default ImAssistant;
