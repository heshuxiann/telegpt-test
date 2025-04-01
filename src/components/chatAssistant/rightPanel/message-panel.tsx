/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
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

import ErrorBoundary from '../ErrorBoundary';
import Avatar from '../ui/Avatar';

import './message-panel.scss';

import MingcuteaiIcon from '../assets/mingcute-ai.png';

const Message = ({ chatId, messageId, closeSummaryModal }: { chatId: string; messageId: number;closeSummaryModal:()=>void }) => {
  const global = getGlobal();
  const chat = selectChat(global, chatId);
  const [message, setMessage] = useState<ApiMessage | undefined>();
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
  const { focusMessage } = getActions();
  useEffect(() => {
    const message = selectChatMessage(global, chatId, messageId);
    if (message) {
      setMessage(message);
    } else if (chat) {
      callApi('fetchMessage', { chat, messageId }).then((result) => {
        if (result && result !== MESSAGE_DELETED && result.message.content.text?.text) {
          setMessage(result.message);
          console.log('result.message----->', result.message.content.text?.text);
          updateChatMessage(global, chat.id, messageId, result.message);
        }
      });
    }
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [chatId, messageId]);
  useEffect(() => {
    if (messages.length > 0) {
      messages.forEach((message) => {
        if (message.role === 'assistant') {
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

  const handleFocusMessage = () => {
    closeSummaryModal();
    focusMessage({ chatId, messageId });
  };

  const renderMessage = () => {
    if (!message || !message.content.text?.text) {
      return undefined;
    }
    const text = message.content.text?.text;
    const date = formatTimestamp(message.date * 1000);
    const senderId = message.senderId;
    const peer = senderId ? selectUser(global, senderId) : undefined;
    const name = peer ? (peer?.firstName || '') + (peer?.lastName || '') : '';
    return (
      <>
        <div className="flex flex-row items-center mb-[12px]">
          <Avatar
            key={chatId}
            className="overlay-avatar"
            size={34}
            peer={peer}
            withStory
          />
          <span className="text-[16px] font-semibold mr-[8px] ml-[12px]">{name}</span>
          <span className="text-[#979797] text-[13px]">{date}</span>
        </div>
        <div className="text-[15px] relative">
          <div>{text}</div>
          <div className={cn('right-panel-message-actions flex items-center flex-row justify-end gap-[4px] absolute bottom-0 right-0', {
            '!flex': showSmartReply,
          })}
          >
            <div
              className="w-[15px] h-[15px] cursor-pointer"
              onClick={() => { setShowSmartReply(true); handleSmaryReply(message); }}
            >
              <img src={MingcuteaiIcon} alt="ai-reply" className="w-full h-full" />
            </div>
            <div
              className="text-[#9F9F9F] cursor-pointer"
              onClick={handleFocusMessage}
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
    );
  };

  return (
    <div className="right-panel-message-item pb-[20px] pt-[16px] border-solid border-b-[1px] border-[rgba(0,0,0,0.1)]">
      {message ? (
        renderMessage()
      ) : (
        <Skeleton active paragraph={{ rows: 2 }} />
      )}
    </div>
  );
};

const CustomVirtualList = ({
  chatId, messageIds, height, closeSummaryModal,
}:
{
  chatId:string;
  messageIds:number[];
  height:number;
  closeSummaryModal:()=>void;
}) => {
  return (
    // eslint-disable-next-line react/jsx-no-bind
    <VirtualList data={messageIds} height={height} itemHeight={50} itemKey={(item:number) => `${chatId}-${item}`}>
      {(item) => {
        return (
          <ErrorBoundary>
            <Message chatId={chatId} messageId={item} closeSummaryModal={closeSummaryModal} />
          </ErrorBoundary>
        );
      }}
    </VirtualList>
  );
};

const MessagePanel = ({ closeSummaryModal }:{ closeSummaryModal:()=>void }) => {
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [relevantMessages, setRelevantMessages] = useState<{ chatId: string; messageIds: number[] }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setHeight(containerRef.current.getBoundingClientRect().height);
    }
  }, []);
  const handleOpenRightPanle = (payload: { relevantMessages: { chatId: string; messageIds: number[] }[] }) => {
    setRightPanelOpen(true);
    const { relevantMessages } = payload;
    setRelevantMessages(relevantMessages);
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
    setRelevantMessages([]);
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
            {relevantMessages.map((item) => {
              const { chatId, messageIds } = item;
              if (!messageIds || !chatId) return null;
              return (
                <CustomVirtualList chatId={chatId} messageIds={messageIds} height={height} closeSummaryModal={closeSummaryModal} />
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MessagePanel;
