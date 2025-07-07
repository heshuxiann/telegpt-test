/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable jsx-quotes */
/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
// @ts-nocheck

import React, { memo, useMemo } from 'react';
import type { Message } from 'ai';
import cx from 'classnames';
import equal from 'fast-deep-equal';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '../../lib/utils';
import AISearchSugesstionsMessage from './messages/ai-search-sugesstion-message';
import { GlobalIntroduceMessage } from './messages/global-introduce-message';
import GlobalSummaryMessage from './messages/global-summary-message';
import GoogleEventCreateMessage from './messages/google-event-create-messages';
import GoogleEventDetailMessage from './messages/google-event-detail-message';
import GoogleLoginAuthMessage from './messages/google-login-auth-message';
import GoogleMeetMentionMessage from './messages/google-meet-mention-message';
import GoogleMeetTimeConfirmMessage from './messages/google-meet-time-confirm-message';
import { GroupSearchMessage } from './messages/group-search-message';
import IntroducePortraitMessage from './messages/introduce-portrait-message';
import IntroduceSmartreplyMessage from './messages/introduce-smartreply-message';
import IntroduceSummaryMessage from './messages/introduce-summary-message';
import IntroduceTranslationMessage from './messages/introduce-translation-message';
import RoomActionMessage from './messages/room-actions-message';
import RoomAIDescriptionMessage from './messages/room-ai-des-message';
import RoomAIMediaMessage from './messages/room-ai-media-message';
import ReplyMentionMessage from './messages/room-ai-reply-mention-message';
import RoomSummaryMessage from './messages/room-summary-message';
// import SummaryMessage from './summary-message';
import UrgentCheckMessage from './messages/urgent-check-message';
// import { useScrollToBottom } from './use-scroll-to-bottom';
import { UserSearchMessage } from './messages/user-search-message';
import { LoadingIcon } from './icons';
import { Markdown } from './markdown';
import { MessageReasoning } from './message-reasoning';
import { PreviewAttachment } from './preview-attachment';

import ErrorBoundary from './ErrorBoundary';

export enum AIMessageType {
  GlobalSummary = 'global-summary',
  UrgentCheck = 'urgent-message-check',
  GroupSearch = 'group-search',
  UserSearch = 'user-search',
  GoogleAuth = 'google-auth',
  GoogleEventInsert = 'google-event-insert',
  GoogleEventDetail = 'google-event-detail',
  GoogleMeetTimeConfirm = 'google-meet-time-confirm',
  GoogleMeetMention = 'google-meet-mention',
  RoomSummary = 'room-summary',
  RoomActions = 'room-actions',
  SmartreplyIntroduce = 'global-smartreply-introduce',
  SummaryIntroduce = 'global-summary-introduce',
  TranslationIntroduce = 'global-translation-introduce',
  PortraitIntroduce = 'global-portrait-introduce',
  GlobalIntroduce = 'global-introduce',
  RoomAIDescription = 'room-ai-description',
  AISearchSugesstion = 'ai-search-sugesstion',
  AIReplyMention = 'room-ai-reply-mention',
  AIMediaSummary = 'room-ai-media-summary',
  Default = 'default',
}

const DefaultMessage = ({ message, isLoading }:{ message: Message;isLoading:boolean }) => {
  return (
    <motion.div
      className="w-full px-[12px] group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >
      <div className='flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl'>
        <div className="flex flex-col gap-4 w-full">
          {message.experimental_attachments && (
            <div className="flex flex-row justify-end gap-2">
              {message.experimental_attachments.map((attachment) => (
                <PreviewAttachment
                  key={attachment.url}
                  attachment={attachment}
                />
              ))}
            </div>
          )}

          {message.reasoning && (
            <MessageReasoning
              isLoading={isLoading}
              reasoning={message.reasoning}
            />
          )}

          {(message.content || message.reasoning) && (
            <div className="flex flex-row gap-2 items-start w-full">
              <div
                className={cn('w-auto flex flex-col gap-4 bg-white text-[var(--color-text)] px-3 py-2 rounded-xl dark:bg-[#292929]', {
                  '!bg-[#E8D7FF] text-black ml-auto':
                      message.role === 'user',
                })}
              >
                <Markdown>{message.content as string}</Markdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
const PurePreviewMessage = ({
  message,
  isLoading,
  deleteMessage,
}: {
  message: Message;
  isLoading: boolean;
  deleteMessage?: (messageId: string) => void;
}) => {
  const messageType:AIMessageType | undefined = useMemo(() => {
    const matched = message?.annotations?.find(
      (item) => item
      && typeof item === 'object'
      && 'type' in item
      && Object.values(AIMessageType).includes(item.type as AIMessageType),
    );

    const type = matched?.type as AIMessageType || AIMessageType.Default;
    return type;
  }, [message]);

  return (
    <AnimatePresence>
      {messageType === AIMessageType.GlobalSummary && (
        <ErrorBoundary>
          <GlobalSummaryMessage
            message={message}
            // eslint-disable-next-line react/jsx-no-bind
            deleteMessage={() => deleteMessage?.(message.id)}
          />
        </ErrorBoundary>
      )}
      {messageType === AIMessageType.UrgentCheck && (
        <UrgentCheckMessage
          message={message}
          // eslint-disable-next-line react/jsx-no-bind
          deleteMessage={() => deleteMessage?.(message.id)}
        />
      )}
      {messageType === AIMessageType.GroupSearch && (<GroupSearchMessage message={message} />)}
      {messageType === AIMessageType.UserSearch && (<UserSearchMessage message={message} />)}
      {messageType === AIMessageType.GoogleAuth && (
        <GoogleLoginAuthMessage
          // eslint-disable-next-line react/jsx-no-bind
          deleteMessage={() => deleteMessage?.(message.id)}
        />
      )}
      {messageType === AIMessageType.GoogleEventInsert && (<GoogleEventCreateMessage message={message} />)}
      {messageType === AIMessageType.GoogleEventDetail && (<GoogleEventDetailMessage message={message} />)}
      {messageType === AIMessageType.GoogleMeetTimeConfirm && (<GoogleMeetTimeConfirmMessage message={message} />)}
      {messageType === AIMessageType.GoogleMeetMention && (<GoogleMeetMentionMessage message={message} />)}
      {messageType === AIMessageType.RoomSummary && (
        <RoomSummaryMessage
          message={message}
          // eslint-disable-next-line react/jsx-no-bind
          deleteMessage={() => deleteMessage?.(message.id)}
        />
      )}
      {messageType === AIMessageType.RoomActions && (
        <RoomActionMessage
          message={message}
          // eslint-disable-next-line react/jsx-no-bind
          deleteMessage={() => deleteMessage?.(message.id)}
        />
      )}
      {messageType === AIMessageType.SmartreplyIntroduce && (<IntroduceSmartreplyMessage />)}
      {messageType === AIMessageType.SummaryIntroduce && (<IntroduceSummaryMessage />)}
      {messageType === AIMessageType.TranslationIntroduce && (<IntroduceTranslationMessage />)}
      {messageType === AIMessageType.PortraitIntroduce && (<IntroducePortraitMessage />)}
      {messageType === AIMessageType.GlobalIntroduce && (<GlobalIntroduceMessage />)}
      {messageType === AIMessageType.RoomAIDescription && (<RoomAIDescriptionMessage message={message} />)}
      {messageType === AIMessageType.AISearchSugesstion && (<AISearchSugesstionsMessage />)}
      {messageType === AIMessageType.AIReplyMention && (<ReplyMentionMessage message={message} />)}
      {messageType === AIMessageType.AIMediaSummary && (<RoomAIMediaMessage message={message} />)}
      {messageType === AIMessageType.Default && (<DefaultMessage message={message} isLoading={isLoading} />)}
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.reasoning !== nextProps.message.reasoning) return false;
    if (prevProps.message.content !== nextProps.message.content) return false;
    if (
      !equal(
        prevProps.message.toolInvocations,
        nextProps.message.toolInvocations,
      )
    ) return false;
    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      className="w-full px-[12px] group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <LoadingIcon size={40} />
      </div>
    </motion.div>
  );
};
