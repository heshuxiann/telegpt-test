/* eslint-disable no-null/no-null */
/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */

import React, {
  memo, useEffect, useRef,
} from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';

import type { ApiMessage } from '../../../api/types/messages';
import type { ThreadId } from '../../../types';

import { getChatTypeString } from '../../../global/helpers/chats';
import {
  selectChat,
  selectChatMessages,
  selectCurrentMessageIds,
  selectFirstUnreadId,
  selectIsMessageUnread,
} from '../../../global/selectors';
import { injectComponent } from './injectComponent';

import ChatAIRoom from './ChatAIRoom';

interface StateProps {
  chatId: string | undefined;
  chatTitle:string | undefined;
  chatType: string | undefined;
  threadId: ThreadId;
  messageIds?: number[];
  messagesById?: Record<number, ApiMessage>;
  unreadMessages?: ApiMessage[];
  onClose?: () => void;
}
const injectMessageAI = injectComponent(ChatAIRoom);
const ChatAI = (props: StateProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      injectMessageAI(containerRef.current, { ...props });
    }
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, []);
  return (
    <div className="chat-ai-room" ref={containerRef} />
  );
};

export default memo(withGlobal(
  (global, { chatId, threadId }): StateProps => {
    const messageIds = selectCurrentMessageIds(global, chatId, threadId, 'thread');
    const chat = selectChat(global, chatId);
    const messagesById = selectChatMessages(global, chatId);
    const unreadMessages = [];
    let chatType;
    if (chat) {
      chatType = getChatTypeString(chat);
      if (chat.memoUnreadId) {
        for (const key of Object.keys(messagesById).map(Number)) {
          if (key > chat.memoUnreadId) {
            unreadMessages.push(messagesById[key]);
          }
        }
      }
    }
    return {
      chatId,
      chatTitle: chat?.title,
      chatType,
      threadId,
      messageIds,
      messagesById,
      unreadMessages,
    };
  },
)(ChatAI));
