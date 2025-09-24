/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
import React, { useEffect, useRef, useState } from 'react';
import { Skeleton } from 'antd';
import { getActions, getGlobal } from '../../../global';

import { type ApiMessage, MESSAGE_DELETED } from '../../../api/types';

import { getChatTitle, getUserFullName } from '../../../global/helpers';
import { isApiPeerUser } from '../../../global/helpers/peers';
import { updateChatMessage } from '../../../global/reducers/messages';
import { selectChat, selectUser } from '../../../global/selectors';
import { selectChatMessage } from '../../../global/selectors/messages';
import { callApi } from '../../../api/gramjs';
import useOldLang from '../hook/useOldLang';
import { ArrowRightIcon, SendIcon } from '../icons';
import { autoReply } from '../utils/chat-api';
import { cn, formatTimestamp } from '../utils/util';
import { getBestKnowledgeMatch } from '../utils/knowledge-match';

import Avatar from '../component/Avatar';
import ChatAvatar from '../component/ChatAvatar';
import ErrorBoundary from '../ErrorBoundary';

import './message-panel.scss';

import ChatAILogoPath from '../assets/cgat-ai-logo.png';

const Message = ({ chatId, messageId }: { chatId: string; messageId: number }) => {
  const global = getGlobal();
  const lang = useOldLang();
  const chat = selectChat(global, chatId);
  const [message, setMessage] = useState<ApiMessage | undefined>(undefined);
  const [showSmartReply, setShowSmartReply] = useState(false);
  const [replyResponse, setReplyResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(undefined);
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
  const handleSmaryReply = async (message: ApiMessage) => {
    if (message.content.text?.text) {
      const bestMatch = await getBestKnowledgeMatch(message.content.text.text);
      if (bestMatch && bestMatch.score > 0.8) {
        setReplyResponse(bestMatch.answer);
      } else {
        autoReply({
          message: message.content.text?.text,
          message_id: message.id,
        }).then((res) => {
          setReplyResponse(res.data.reply);
        }).catch(() => {
          console.log('error');
        });
      }
    }
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
    const isUser = peer && isApiPeerUser(peer);
    const chat = selectChat(global, chatId);
    const title = peer && isUser ? getUserFullName(peer) : getChatTitle(lang, chat!);
    return (
      <>
        <div className="flex flex-row items-center mb-[12px]">
          {isUser ? (
            <Avatar peer={peer} size={34} />
          ) : (
            <ChatAvatar chatId={chatId} size={34} />
          )}

          <span className="text-[16px] font-semibold mr-[8px] ml-[12px] flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
            {title}
          </span>
          <span className="text-[#979797] text-[13px]">{date}</span>
        </div>
        <div className="text-[15px] relative flex flex-row items-end justify-between">
          <div className="w-full">{text}</div>
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
              <span className="text-[14px] text-[#757575]">Reply suggested by TelyAI</span>
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
  relevantMessages,
}:
  {
    relevantMessages: { chatId: string; messageIds: number[] }[];
  }) => {
  const listData = relevantMessages.flatMap((item) => item.messageIds.map((messageId) => ({
    chatId: item.chatId,
    messageId,
  })));
  return (
    <div className="h-full overflow-y-auto">
      {listData.map((item) => {
        return (
          <ErrorBoundary>
            <Message chatId={item.chatId} messageId={item.messageId} />
          </ErrorBoundary>
        );
      })}
    </div>
  );
};

export interface MessagePanelPayload {
  relevantMessages: { chatId: string; messageIds: number[] }[];
}
const MessagePanel = ({ relevantMessages }: MessagePanelPayload) => {
  return (
    <div className="h-full">
      {relevantMessages.length > 0 && (
        <CustomVirtualList relevantMessages={relevantMessages} />
      )}
    </div>
  );
};

export default MessagePanel;
