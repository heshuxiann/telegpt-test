/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
import React, { memo } from 'react';
import type { Message } from 'ai';
import equal from 'fast-deep-equal';

import GlobalSummaryMessage from './global-summary-message';
import { PreviewMessage, ThinkingMessage } from './message';
import SummaryMessage from './summary-message';
import { useScrollToBottom } from './use-scroll-to-bottom';

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
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();
  const isAuxiliary = (message:Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'isAuxiliary' in item && item.isAuxiliary === true) ?? false;
  };
  const isSummary = (message:Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'isSummary' in item && item.isSummary === true) ?? false;
  };
  const isGlobalSummary = (message:Message) => {
    return message?.annotations?.some((item) => item && typeof item === 'object' && 'template' in item && item.template === 'global-summary') ?? false;
  };
  const handleDeleteMessage = (message:Message, prevMessage:Message) => {
    deleteMessage?.(message.id);
    deleteMessage?.(prevMessage.id);
  };
  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-[10px] flex-1 overflow-y-scroll pt-4 ai-message-container"
    >
      {messages.map((message, index) => {
        if (!isAuxiliary(message)) {
          if (index > 0 && isSummary(messages[index - 1])) {
            return <SummaryMessage isLoading={isLoading} message={message} />;
          } else if (index > 0 && isGlobalSummary(messages[index - 1])) {
            return (
              <GlobalSummaryMessage
                isLoading={isLoading}
                message={message}
                // eslint-disable-next-line react/jsx-no-bind
                deleteMessage={() => handleDeleteMessage(message, messages[index - 1])}
              />
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

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
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
