/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Skeleton } from 'antd';
import VirtualList from 'rc-virtual-list';
import { getActions, getGlobal } from '../../../global';

import { type ApiMessage, MESSAGE_DELETED } from '../../../api/types';

import { updateChatMessage } from '../../../global/reducers/messages';
import { selectChat, selectUser } from '../../../global/selectors';
import { selectChatMessage } from '../../../global/selectors/messages';
import { callApi } from '../../../api/gramjs';
import { ArrowRightIcon, SendIcon } from '../icons';
import { languagePrompt } from '../prompt';
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
    api: 'https://telegpt-three.vercel.app/chat',
    sendExtraMessageFields: true,
    initialMessages: [{
      id: '0',
      role: 'system',
      content: languagePrompt,
    }],
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
      content: `请回复下面的消息: ${message.content.text?.text}`,
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
    <div className="right-panel-message-item pb-[20px] pt-[16px] border-solid border-b-[1px] border-[rgba(0,0,0,0.1)] px-[18px]">
      {message ? (
        renderMessage()
      ) : (
        <Skeleton active paragraph={{ rows: 2 }} />
      )}
    </div>
  );
};

const CustomVirtualList = ({
  relevantMessages, height, closeSummaryModal,
}:
{
  relevantMessages: { chatId: string; messageIds: number[] }[];
  height:number;
  closeSummaryModal:()=>void;
}) => {
  const listData = relevantMessages.flatMap(({ chatId, messageIds }) => messageIds.map((messageId) => ({ chatId, messageId })));
  return (
    // eslint-disable-next-line react/jsx-no-bind
    <VirtualList data={listData} height={height} itemHeight={50} itemKey={(item) => item.messageId}>
      {(item) => {
        return (
          <ErrorBoundary>
            <Message chatId={item.chatId} messageId={item.messageId} closeSummaryModal={closeSummaryModal} />
          </ErrorBoundary>
        );
      }}
    </VirtualList>
  );
};

export interface MessagePanelPayload {
  relevantMessages:{ chatId: string; messageIds: number[] }[];
}
interface MessagePanelProps extends MessagePanelPayload {
  closeSummaryModal:()=>void;
}
const MessagePanel = ({ closeSummaryModal, relevantMessages }:MessagePanelProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setHeight(containerRef.current.getBoundingClientRect().height);
    }
  }, []);

  return (
    <div className="h-full" ref={containerRef}>
      {relevantMessages.length > 0 && (
        <CustomVirtualList relevantMessages={relevantMessages} height={height} closeSummaryModal={closeSummaryModal} />
      )}
    </div>
  );
};

export default MessagePanel;
