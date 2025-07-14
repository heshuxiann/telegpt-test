/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
import React, {
  memo, useRef,
} from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { Message } from 'ai';
import equal from 'fast-deep-equal';
import { motion } from 'framer-motion';

import { useMessages } from './hook/use-messages';
import { cn } from './utils/util';
import { PreviewMessage, ThinkingMessage } from './message';
import RoomStorage from './room-storage';
import { GLOBAL_SUMMARY_CHATID } from './variables';

import './messages.scss';

interface MessagesProps {
  chatId: string;
  className?: string;
  isLoading?: boolean;
  status: UseChatHelpers['status'];
  messages: Array<Message>;
  hasMore?: boolean;
  deleteMessage?: (messageId: string) => void;
  loadMore: () => Promise<void>;
}
function PureMessages({
  chatId,
  className,
  isLoading,
  status,
  messages,
  hasMore,
  deleteMessage,
  loadMore,
}: MessagesProps) {
  const upLoadRef = useRef(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    isAtBottom,
    onViewportEnter,
    onViewportLeave,
  } = useMessages({
    chatId: chatId!,
    status,
  });
  if (isAtBottom) {
    RoomStorage.updateRoomAIData(GLOBAL_SUMMARY_CHATID, 'unreadCount', 0);
  }
  const isAuxiliary = (message: Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'isAuxiliary' in item && item.isAuxiliary === true) ?? false;
  };
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || upLoadRef.current) return;

    const { scrollTop } = container;

    if (scrollTop === 0 && hasMore) {
      upLoadRef.current = true;
      const anchor = container.firstChild?.firstChild as HTMLDivElement || null;
      anchorRef.current = anchor;
      loadMore().finally(() => {
        upLoadRef.current = false;
        if (anchorRef.current) {
          anchorRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
        // scrollBuffer.current = calculateBuffer();
      });
    }
  };

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className={cn('flex flex-col min-w-0 gap-[10px] h-full overflow-y-auto relative pt-4 ai-message-container', className)}
    >
      {messages.map((message, index) => {
        if (!isAuxiliary(message)) {
          return (
            <PreviewMessage
              message={message}
              deleteMessage={deleteMessage}
              key={message.id}
              isLoading={status === 'streaming' && messages.length - 1 === index}
            />
          );
        } else {
          return null;
        }
      })}

      {
        (
          (status === 'submitted'
          && messages.length > 0
          && messages[messages.length - 1].role === 'user') || isLoading
        ) && <ThinkingMessage />
      }
      <motion.div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>

  );
}
export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;

  return true;
});
