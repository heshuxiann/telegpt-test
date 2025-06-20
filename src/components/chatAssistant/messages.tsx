/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
import React, { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { Message } from 'ai';
import equal from 'fast-deep-equal';

import GlobalSummaryMessage from './messages/global-summary-message';
import GoogleEventCreateMessage from './messages/google-event-create-messages';
import GoogleEventDetailMessage from './messages/google-event-detail-message';
import GoogleLoginAuthMessage from './messages/google-login-auth-message';
import { GroupSearchMessage } from './messages/group-search-message';
import IntroducePortraitMessage from './messages/introduce-portrait-message';
import IntroduceSmartreplyMessage from './messages/introduce-smartreply-message';
import IntroduceSummaryMessage from './messages/introduce-summary-message';
import IntroduceTranslationMessage from './messages/introduce-translation-message';
import RoomActionMessage from './messages/room-actions-message';
import RoomSummaryMessage from './messages/room-summary-message';
// import SummaryMessage from './summary-message';
import UrgentCheckMessage from './messages/urgent-check-message';
// import { useScrollToBottom } from './use-scroll-to-bottom';
import { UserSearchMessage } from './messages/user-search-message';
import { PreviewMessage, ThinkingMessage } from './message';

import ErrorBoundary from './ErrorBoundary';

import './messages.scss';

interface MessagesProps {
  isLoading?: boolean;
  status: UseChatHelpers['status'];
  messages: Array<Message>;
  deleteMessage?: (messageId: string) => void;
}

function PureMessages({
  isLoading,
  status,
  messages,
  deleteMessage,
}: MessagesProps) {
  // const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();
  const isAuxiliary = (message: Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'isAuxiliary' in item && item.isAuxiliary === true) ?? false;
  };
  const isGlobalSummary = (message: Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'global-summary') ?? false;
  };
  const isUrgentCheck = (message: Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'urgent-message-check') ?? false;
  };

  const isGroupSearch = (message: Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'group-search') ?? false;
  };
  const isUserSearch = (message: Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'user-search') ?? false;
  };
  const isGoogleAuth = (message: Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'google-auth') ?? false;
  };
  const isGoogleEventInsert = (message: Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'google-event-insert') ?? false;
  };
  const isGoogleEventDetail = (message: Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'google-event-detail') ?? false;
  };

  const isRoomSummary = (message: Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'room-summary') ?? false;
  };

  const isRoomActions = (message: Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'room-actions') ?? false;
  };
  const isSmartreplyIntroduce = (message: Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'global-smartreply-introduce') ?? false;
  };
  const isSummaryIntroduce = (message: Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'global-summary-introduce') ?? false;
  };
  const isTranslationIntroduce = (message: Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'global-translation-introduce') ?? false;
  };
  const isPortraitIntroduce = (message: Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'type' in item && item.type === 'global-portrait-introduce') ?? false;
  };
  const handleDeleteMessage = (message: Message, prevMessage: Message) => {
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
              ) : isRoomSummary(message) ? (
                <RoomSummaryMessage
                  message={message}
                  // eslint-disable-next-line react/jsx-no-bind
                  deleteMessage={() => handleDeleteMessage(message, messages[index - 1])}
                />
              ) : isRoomActions(message) ? (
                <RoomActionMessage
                  message={message}
                  // eslint-disable-next-line react/jsx-no-bind
                  deleteMessage={() => handleDeleteMessage(message, messages[index - 1])}
                />
              ) : isSmartreplyIntroduce(message) ? (
                <IntroduceSmartreplyMessage />
              ) : isSummaryIntroduce(message) ? (
                <IntroduceSummaryMessage />
              ) : isTranslationIntroduce(message) ? (
                <IntroduceTranslationMessage />
              ) : isPortraitIntroduce(message) ? (
                <IntroducePortraitMessage />
              ) : (
                <PreviewMessage
                  message={message}
                  isLoading={status === 'streaming' && messages.length - 1 === index}
                />
              )}
            </div>
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
