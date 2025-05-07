/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
import React, { memo } from 'react';
import type { Message } from 'ai';
import equal from 'fast-deep-equal';

import GlobalSummaryMessage from './global-summary-message';
import GoogleEventCreateMessage from './google-event-create-messages';
import GoogleEventDetailMessage from './google-event-detail-message';
import GoogleLoginAuthMessage from './google-login-auth-message';
import { GroupSearchMessage } from './group-search-message';
import { PreviewMessage, ThinkingMessage } from './message';
// import SummaryMessage from './summary-message';
import UrgentCheckMessage from './urgent-check-message';
// import { useScrollToBottom } from './use-scroll-to-bottom';
import { UserSearchMessage } from './user-search-message';

import ErrorBoundary from './ErrorBoundary';

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
  const isGoogleAuth = (message:Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'google-auth') ?? false;
  };
  const isGoogleEventInsert = (message:Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'google-event-insert') ?? false;
  };
  const isGoogleEventDetail = (message:Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'google-event-detail') ?? false;
  };
  const handleDeleteMessage = (message:Message, prevMessage:Message) => {
    deleteMessage?.(message.id);
    deleteMessage?.(prevMessage.id);
  };
  return (
    <div
      className="flex flex-col min-w-0 gap-[10px] flex-1 pt-4 ai-message-container"
    >
      {messages.map((message, index) => {
        if (!isAuxiliary(message)) {
          return (
            <div data-message-id={message.id} key={message.id}>
              {isGlobalSummary(message) ? (
                <ErrorBoundary>
                  <GlobalSummaryMessage
                    message={message}
                    // eslint-disable-next-line react/jsx-no-bind
                    deleteMessage={() => handleDeleteMessage(message, messages[index - 1])}
                  />
                </ErrorBoundary>
              ) : isUrgentCheck(message) ? (
                <UrgentCheckMessage
                  message={message}
                  // eslint-disable-next-line react/jsx-no-bind
                  deleteMessage={() => handleDeleteMessage(message, messages[index - 1])}
                />
              ) : isGroupSearch(message) ? (
                <GroupSearchMessage message={message} />
              ) : isUserSearch(message) ? (
                <UserSearchMessage message={message} />
              ) : isGoogleAuth(message) ? (
                <GoogleLoginAuthMessage message={message} />
              ) : isGoogleEventInsert(message) ? (
                <GoogleEventCreateMessage message={message} />
              ) : isGoogleEventDetail(message) ? (
                <GoogleEventDetailMessage message={message} />
              ) : (
                <PreviewMessage
                  message={message}
                  isLoading={isLoading && messages.length - 1 === index}
                />
              )}
            </div>
          );
        } else {
          return null;
        }
      })}

      {isLoading
        && messages.length > 0
        && messages[messages.length - 1].role === 'user' && <ThinkingMessage />}
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
