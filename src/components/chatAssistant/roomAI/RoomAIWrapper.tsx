/* eslint-disable no-null/no-null */
/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */

import React, {
  memo, useEffect, useRef,
} from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';

import type { ApiChat } from '../../../api/types';
import type { ThreadId } from '../../../types';
import { type ApiMessage, MAIN_THREAD_ID } from '../../../api/types/messages';

import { injectComponent } from '../../../lib/injectComponent';
import {
  selectChat,
} from '../../../global/selectors';

import ChatAIRoom from './ChatAIRoom';

interface StateProps {
  chat:ApiChat | undefined;
  chatId: string | undefined;
  chatTitle:string | undefined;
  // chatType: string | undefined;
  threadId: ThreadId;
  messageIds?: number[];
  messagesById?: Record<number, ApiMessage>;
  unreadMessages?: ApiMessage[];
  memoUnreadId:number;
  unreadCount:number;
  onClose?: () => void;
}
const injectMessageAI = injectComponent(ChatAIRoom);
const RoomAIWrapper = (props: StateProps) => {
  const { chatId } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (containerRef.current) {
      injectMessageAI(containerRef.current, { ...props });
    }
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [chatId]);
  return (
    <div className="chat-ai-room" ref={containerRef} />
  );
};

export default memo(withGlobal(
  (global, { chatId, threadId }): StateProps => {
    const chat = selectChat(global, chatId);
    return {
      chat,
      chatId,
      chatTitle: chat?.title,
      // chatType,
      threadId: threadId || MAIN_THREAD_ID,
      memoUnreadId: chat?.memoUnreadId || 0,
      unreadCount: chat?.unreadCount || 0,
    };
  },
)(RoomAIWrapper));
