/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
import React, { memo } from 'react';
import type { Message } from 'ai';
import equal from 'fast-deep-equal';

import GlobalSummaryMessage from './global-summary-message';
import { GroupSearchMessage } from './group-search-message';
import { PreviewMessage, ThinkingMessage } from './message';
import SummaryMessage from './summary-message';
import UrgentCheckMessage from './urgent-check-message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { UserSearchMessage } from './user-search-message';

import './messages.scss';

interface MessagesProps {
  isLoading: boolean;
  messages: Array<Message>;
  deleteMessage?: (messageId: string) => void;
}

function PureMessages({
  isLoading,
  messages,
  deleteMessage,
}: MessagesProps) {
  // const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();
  const isAuxiliary = (message:Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'isAuxiliary' in item && item.isAuxiliary === true) ?? false;
  };
  const isSummary = (message:Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'isSummary' in item && item.isSummary === true) ?? false;
  };
  const isGlobalSummary = (message:Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'global-summary') ?? false;
  };
  const isUrgentCheck = (message:Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'urgent-message-check') ?? false;
  };

  const isGroupSearch = (message:Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'group-search') ?? false;
  };
  const isUserSearch = (message:Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'user-search') ?? false;
  };
  const handleDeleteMessage = (message:Message, prevMessage:Message) => {
    deleteMessage?.(message.id);
    deleteMessage?.(prevMessage.id);
  };
  return (
    <div
      className="flex flex-col min-w-0 gap-[10px] flex-1 overflow-y-scroll pt-4 ai-message-container"
    >
      {messages.map((message, index) => {
        if (!isAuxiliary(message)) {
          // if (index > 0 && isSummary(messages[index - 1])) {
          //   return <SummaryMessage isLoading={isLoading} message={message} />;
          // }
          if (isGlobalSummary(message)) {
            return (
              <GlobalSummaryMessage
                message={message}
                // eslint-disable-next-line react/jsx-no-bind
                deleteMessage={() => handleDeleteMessage(message, messages[index - 1])}
              />
            );
          } else if (isUrgentCheck(message)) {
            return (
              <UrgentCheckMessage
                message={message}
                // eslint-disable-next-line react/jsx-no-bind
                deleteMessage={() => handleDeleteMessage(message, messages[index - 1])}
              />
            );
          } else if (isGroupSearch(message)) {
            return (
              <GroupSearchMessage message={message} />
            );
          } else if (isUserSearch(message)) {
            return (
              <UserSearchMessage message={message} />
            );
          } else {
            return (
              <PreviewMessage
                key={message.id}
                message={message}
                isLoading={isLoading && messages.length - 1 === index}
              />
            );
          }
        } else {
          return null;
        }
      })}

      {isLoading
        && messages.length > 0
        && messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

      {/* <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      /> */}
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.isLoading && nextProps.isLoading) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;

  return true;
});
