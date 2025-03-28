/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Skeleton } from 'antd';
import VirtualList from 'rc-virtual-list';
import { getActions, getGlobal } from '../../../global';

import { type ApiMessage, type ApiUser, MESSAGE_DELETED } from '../../../api/types';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { updateChatMessage } from '../../../global/reducers/messages';
import { selectChat, selectUser } from '../../../global/selectors';
import { selectChatMessage } from '../../../global/selectors/messages';
import { callApi } from '../../../api/gramjs';
import { ArrowRightIcon, CloseIcon, SendIcon } from '../icons';
import { cn, formatTimestamp } from '../utils/util';

import Avatar from '../ui/Avatar';

import './message-panel.scss';

import MingcuteaiIcon from '../assets/mingcute-ai.png';

const Message = ({ chatId, messageId }: { chatId: string; messageId: number }) => {
  const global = getGlobal();
  const chat = selectChat(global, chatId);
  const [message, setMessage] = useState<ApiMessage | undefined>();
  const [peer, setPeer] = useState<ApiUser | undefined>();
  const [showSmartReply, setShowSmartReply] = useState(false);
  const [replyResponse, setReplyResponse] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, append } = useChat({
    api: 'https://ai-api-sdm.vercel.app/chat',
    sendExtraMessageFields: true,
  });
  const { updateDraftReplyInfo, sendMessage, clearDraft } = getActions();
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };
  useEffect(() => {
    const message = selectChatMessage(global, chatId, messageId);
    if (message) {
      setMessage(message);
    } else if (chat) {
      callApi('fetchMessage', { chat, messageId }).then((result) => {
        if (result && result !== MESSAGE_DELETED) {
          setMessage(result.message);
          updateChatMessage(global, chat.id, messageId, result.message);
        }
      });
    }
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [chatId, messageId]);
  useEffect(() => {
    if (message) {
      const senderId = message.senderId;
      const peer = senderId ? selectUser(global, senderId) : undefined;
      setPeer(peer);
    }
  }, [message, global]);
  useEffect(() => {
    if (messages.length > 0) {
      console.log(messages, '--------message');
      messages.forEach((message) => {
        if (message.role === 'assistant') {
          console.log(message.content);
          setReplyResponse(message.content);
          adjustHeight();
        }
      });
    }
  }, [messages]);
  const handleSmaryReply = (message:ApiMessage) => {
    append({
      role: 'user',
      content: `你是一个普通用户，和朋友在聊天。请用自然、轻松的语气回复对方的消息，像一个真实的人一样互动，不要过于正式或像客服。。请回复下面的消息: ${message.content.text?.text};`,
    });
  };

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyResponse(e.target.value);
    adjustHeight();
  };

  const handleReply = () => {
    updateDraftReplyInfo({
      replyToMsgId: message?.id,
      replyToPeerId: undefined,
      chatId,
    });
    sendMessage({
      messageList: {
        chatId,
        threadId: -1,
        type: 'thread',
      },
      text: replyResponse,
    });
    clearDraft({ chatId, isLocalOnly: true });
    setReplyResponse('');
    setShowSmartReply(false);
  };

  return (
    <div className="right-panel-message-item pb-[20px] pt-[16px] border-solid border-b-[1px] border-[rgba(0,0,0,0.1)]">
      <div className="flex flex-row items-center mb-[12px]">
        <Avatar
          key={chatId}
          className="overlay-avatar"
          size={34}
          peer={peer}
          withStory
        />
        <span className="text-[16px] font-semibold mr-[8px] ml-[12px]">{peer ? (peer?.firstName || '') + (peer?.lastName || '') : ''}</span>
        <span className="text-[#979797] text-[13px]">{message ? formatTimestamp(message.date * 1000) : ''}</span>
      </div>
      {message ? (
        <>
          <div className="text-[15px] relative">
            <div>{message.content.text?.text}</div>
            <div className={cn('right-panel-message-actions flex items-center flex-row justify-end gap-[4px] absolute bottom-0 right-0', {
              '!flex': showSmartReply,
            })}
            >
              <img src={MingcuteaiIcon} alt="ai-reply" className="w-[15px] h-[15px] cursor-pointer" />
              <div
                className="text-[#9F9F9F] cursor-pointer"
                onClick={() => { setShowSmartReply(true); handleSmaryReply(message); }}
                aria-label="Smart Reply"
              >
                <ArrowRightIcon size={16} />
              </div>
            </div>
          </div>
          {showSmartReply ? (
            <div>
              <div className="flex flex-row items-center gap-[6px]">
                <img className="w-[15px] h-[15px]" src={MingcuteaiIcon} alt="MingcuteaiIcon" />
                <span className="text-[14px] text-[#757575]">Reply suggested by Serena AI</span>
              </div>
              <div className="flex flex-row items-end gap-[12px]">
                <textarea
                  ref={textareaRef}
                  className="w-full py-[8px] px-[12px] border border-[#7949FF] rounded-[8px] mt-[12px] resize-none leading-[18px]"
                  placeholder="Type your reply here..."
                  rows={1}
                  value={replyResponse}
                  onChange={handleInput}
                />
                <button
                  className="w-[36px] h-[36px] bg-[#8C59D0] flex items-center justify-center text-white rounded-full flex-shrink-0"
                  aria-label="Send message"
                  onClick={handleReply}
                >
                  <SendIcon size={15} />
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <Skeleton active paragraph={{ rows: 2 }} />
      )}
    </div>
  );
};

const CustomVirtualList = ({ chatId, messageIds, height }:{ chatId:string;messageIds:number[];height:number }) => {
  return (
    // eslint-disable-next-line react/jsx-no-bind
    <VirtualList data={messageIds} height={height} itemHeight={50} itemKey={(item:number) => item}>
      {(item) => <Message chatId={chatId} messageId={item} />}
    </VirtualList>
  );
};

const MessagePanel = () => {
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [chats, setChats] = useState<{ chatId: string; messageIds: number[] }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setHeight(containerRef.current.getBoundingClientRect().height);
    }
  }, []);
  const handleOpenRightPanle = (payload: { chats: { chatId: string; messageIds: number[] }[] }) => {
    setRightPanelOpen(true);
    const { chats } = payload;
    setChats(chats);
  };
  useEffect(() => {
    eventEmitter.on(Actions.ShowGlobalSummaryMessagePanel, handleOpenRightPanle);
    return () => {
      eventEmitter.off(Actions.ShowGlobalSummaryMessagePanel, handleOpenRightPanle);
    };
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, []);
  const handleClose = () => {
    setRightPanelOpen(false);
    setChats([]);
  };
  return (
    <div>
      {rightPanelOpen ? (
        <div className="summary-right-panel w-[375px] h-full bg-white/50 flex flex-col">
          <div className="h-[50px] flex items-center justify-center relative">
            <span className="text-[16px] font-semibold">Original Messages</span>
            <div
              className="w-[20px] h-[20px] rounded-full bg-[#B1B1B1] flex items-center justify-center absolute right-[18px] top-[15px] cursor-pointer"
              onClick={handleClose}
            >
              <CloseIcon size={14} />
            </div>
          </div>
          <div className="flex-1 overflow-y-scroll px-[18px]" ref={containerRef}>
            {chats.map((item) => {
              const { chatId, messageIds } = item;
              if (!messageIds) return null;
              return (
                <CustomVirtualList chatId={chatId} messageIds={messageIds} height={height} />
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MessagePanel;
