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
import { knowledgeEmbeddingStore } from '../vector-store';

import ChatAvatar from '../component/ChatAvatar';
import ErrorBoundary from '../ErrorBoundary';
import chatAIGenerate from '../utils/ChatApiGenerate';

import './message-panel.scss';

import ChatAILogoPath from '../assets/cgat-ai-logo.png';

const Message = ({ chatId, messageId, closeSummaryModal }: { chatId: string; messageId: number;closeSummaryModal:()=>void }) => {
  const global = getGlobal();
  const chat = selectChat(global, chatId);
  const [message, setMessage] = useState<ApiMessage | undefined>(undefined);
  const [showSmartReply, setShowSmartReply] = useState(false);
  const [replyResponse, setReplyResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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
    if (messageId) {
      const message = selectChatMessage(global, chatId, Number(messageId));
      if (message) {
        setMessage(message);
        setIsLoading(false);
      } else if (chat) {
        callApi('fetchMessage', { chat, messageId }).then((result) => {
          if (result) {
            if (result === MESSAGE_DELETED) {
              setMessage(undefined);
            } else if (result.message.content.text?.text) {
              setMessage(result.message);
              updateChatMessage(global, chat.id, messageId, result.message);
            }
          }
          setIsLoading(false);
        }).catch(() => {
          setIsLoading(false);
        });
      }
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
  const handleSmaryReply = async (message:ApiMessage) => {
    if (message.content.text?.text) {
      const vectorSearchResults = await knowledgeEmbeddingStore.similaritySearch({
        query: message.content.text?.text,
      });
      type Metadata = { answer: string }; // Define the type for metadata
      const similarResult = vectorSearchResults.similarItems[0] as { metadata: Metadata; score: number } | undefined;
      if (similarResult && similarResult.score > 0.8) {
        setReplyResponse(similarResult.metadata.answer);
      } else {
        chatAIGenerate({
          data: {
            messages: [
              {
                role: 'system',
                content: '你是一个多语种智能助手。接收用户消息后，自动识别其使用的语言，并用相同的语言进行自然、得体的回复。你应该理解消息的语境，确保回复简洁、友好且符合语言习惯。',
                id: '1',
              },
              {
                role: 'user',
                content: `请回复下面的消息: ${message.content.text?.text}`,
                id: '2',
              },
            ],
          },
          onResponse: (response) => {
            setReplyResponse(response);
          },
          onFinish: () => {
            // eslint-disable-next-line no-console
            console.log('Finish');
          },
        });
      }
    }

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
    });
    setTimeout(() => {
      sendMessage({
        messageList: {
          chatId,
          threadId: -1,
          type: 'thread',
        },
        text: replyResponse,
      });
    });
    setReplyResponse('');
    setShowSmartReply(false);
    setTimeout(() => { clearDraft({ chatId, isLocalOnly: true }); });
  };

  const handleFocusMessage = () => {
    closeSummaryModal();
    if (messageId) {
      focusMessage({
        chatId, messageId: Number(messageId),
      });
    }
  };

  const renderMessage = () => {
    if (!message || !message.content.text?.text) {
      return (
        <div className="text-[15px] text-[#979797]">
          Message Deleted
        </div>
      );
    }
    const text = message.content.text?.text;
    const date = formatTimestamp(message.date * 1000);
    const senderId = message.senderId;
    const peer = senderId ? selectUser(global, senderId) : undefined;
    const name = peer ? (peer?.firstName || '') + (peer?.lastName || '') : '';
    return (
      <>
        <div className="flex flex-row items-center mb-[12px]">
          <ChatAvatar chatId={chatId} size={34} />
          <span className="text-[16px] font-semibold mr-[8px] ml-[12px]">{name}</span>
          <span className="text-[#979797] text-[13px]">{date}</span>
        </div>
        <div className="text-[15px] relative flex flex-row items-end justify-between">
          <div>{text}</div>
          <div className={cn('right-panel-message-actions flex items-center flex-row justify-end gap-[4px]', {
            '!flex': showSmartReply,
          })}
          >
            <div
              className="w-[15px] h-[15px] cursor-pointer"
              onClick={() => { setShowSmartReply(true); handleSmaryReply(message); }}
            >
              <img src={ChatAILogoPath} alt="ai-reply" className="w-full h-full" />
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
              <img className="w-[15px] h-[15px]" src={ChatAILogoPath} alt="MingcuteaiIcon" />
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
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        renderMessage()
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
  // const listData = relevantMessages.flatMap(({ chatId, messageIds }) => messageIds.map((messageId) => ({ chatId, messageId })));
  const listData = relevantMessages.flatMap((item) => item.messageIds.map((messageId) => ({
    chatId: item.chatId,
    messageId,
  })));
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
