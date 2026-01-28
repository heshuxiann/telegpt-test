// @ts-nocheck
import React from 'react';
import { memo, useMemo } from 'react';
import { Popover } from 'antd';
import cx from 'classnames';
import copy from 'copy-to-clipboard';
import { AnimatePresence, motion } from 'framer-motion';
import { getActions } from '../../global';

import type { Message } from './messages/types';

import { cn } from '../../lib/utils';
// import AISearchSugesstionsMessage from './messages/ai-search-sugesstion-message';
import { GlobalIntroduceMessage } from './messages/global-introduce-message';
import GlobalSummaryMessage from './messages/global-summary-message';
import GoogleEventCreateMessage from './messages/google-event-create-messages';
import GoogleEventDetailMessage from './messages/google-event-detail-message';
import GoogleLoginAuthMessage from './messages/google-login-auth-message';
import GoogleMeetInformationSuggestMessage from './messages/google-meet-information-suggest-message';
import GoogleMeetMentionMessage from './messages/google-meet-mention-message';
import GoogleMeetTimeConfirmMessage from './messages/google-meet-time-confirm-message';
import { GroupSearchMessage } from './messages/group-search-message';
import IntroduceActionsMessage from './messages/introduce-actions-message';
import IntroduceMeetingMessage from './messages/introduce-meeting-message';
import IntroduceSummaryMessage from './messages/introduce-summary-message';
import IntroduceTranslationMessage from './messages/introduce-translation-message';
import RoomActionMessage from './messages/room-actions-message';
import RoomAIDescriptionMessage from './messages/room-ai-des-message';
import RoomAIMediaMessage from './messages/room-ai-media-message';
import ReplyMentionMessage from './messages/room-ai-reply-mention-message';
import RoomAIUserPortraitMessage from './messages/room-ai-user-portrait';
import RoomSummaryMessage from './messages/room-summary-message';
import UpgradeTipMessage from './messages/upgrade-tip-message';
// import SummaryMessage from './summary-message';
import UrgentCheckMessage from './messages/urgent-check-message';
// import { useScrollToBottom } from './use-scroll-to-bottom';
import { UserSearchMessage } from './messages/user-search-message';
import { CopyIcon, LoadingIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
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
  GoogleMeetInformationSuggest = 'google-meet-information-suggest',
  RoomSummary = 'room-summary',
  RoomActions = 'room-actions',
  MeetingIntroduce = 'global-meeting-introduce',
  SummaryIntroduce = 'global-summary-introduce',
  TranslationIntroduce = 'global-translation-introduce',
  ActionsIntroduce = 'global-actions-introduce',
  GlobalIntroduce = 'global-introduce',
  RoomAIDescription = 'room-ai-description',
  AISearchSugesstion = 'ai-search-sugesstion',
  AIReplyMention = 'room-ai-reply-mention',
  AIMediaSummary = 'room-ai-media-summary',
  UserPortrait = 'user-portrait',
  UpgradeTip = 'upgrade-tip',
  Default = 'default',
}

const DefaultMessage = ({ message, isLoading }: {
  message: Message;
  isLoading: boolean;
}) => {
  const { showNotification } = getActions();
  const handleCopy = () => {
    copy(message.content);
    showNotification({
      message: 'TextCopied',
    });
  };
  return (
    <motion.div
      className="w-full px-[12px] group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >
      <div className="flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl">
        <div className="flex flex-col gap-4 w-full">
          {message.content && (
            <div className="flex flex-row gap-2 items-start w-full">
              {message.role === 'user' ? (
                <Popover
                  placement="topRight"
                  content={(
                    <div className="w-[24px] h-[24px] text-[#676B74] cursor-pointer" onClick={handleCopy}>
                      <CopyIcon size={24} />
                    </div>
                  )}
                >
                  <div
                    className={cn('w-auto flex flex-col gap-4 bg-[#E8D7FF] text-[var(--color-text)] px-3 py-2 rounded-xl ml-auto dark:bg-[var(--color-background-own)]')}
                  >
                    <Markdown>{message.content}</Markdown>
                  </div>
                </Popover>
              ) : (
                <div
                  className={cn('w-auto flex flex-col gap-4 bg-white text-[var(--color-text)] px-3 py-2 rounded-xl dark:bg-[#292929]', {
                    '!bg-[#E8D7FF] text-black ml-auto':
                      message.role === 'user',
                  })}
                >
                  <Markdown>{message.content}</Markdown>
                  {message.role !== 'user' && (
                    <MessageActions message={message} />
                  )}
                </div>
              )}

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
  const messageType: AIMessageType = useMemo(() => {
    // 使用自定义 Message 类型的 type 字段
    return message.type || AIMessageType.Default;
  }, [message.type]);

  const renderMessageComponent = () => {
    switch (messageType) {
      case AIMessageType.GlobalSummary:
        return (
          <ErrorBoundary>
            <GlobalSummaryMessage
              message={message}
              deleteMessage={() => deleteMessage?.(message.id)}
            />
          </ErrorBoundary>
        );
      case AIMessageType.UrgentCheck:
        return (
          <UrgentCheckMessage
            message={message}
            deleteMessage={() => deleteMessage?.(message.id)}
          />
        );
      case AIMessageType.GroupSearch:
        return <GroupSearchMessage message={message} />;
      case AIMessageType.UserSearch:
        return <UserSearchMessage message={message} />;
      case AIMessageType.GoogleAuth:
        return (
          <GoogleLoginAuthMessage
            deleteMessage={() => deleteMessage?.(message.id)}
          />
        );
      case AIMessageType.GoogleEventInsert:
        return <GoogleEventCreateMessage message={message} />;
      case AIMessageType.GoogleEventDetail:
        return <GoogleEventDetailMessage message={message} />;
      case AIMessageType.GoogleMeetTimeConfirm:
        return <GoogleMeetTimeConfirmMessage message={message} />;
      case AIMessageType.GoogleMeetMention:
        return <GoogleMeetMentionMessage message={message} />;
      case AIMessageType.GoogleMeetInformationSuggest:
        return <GoogleMeetInformationSuggestMessage message={message} />;
      case AIMessageType.RoomSummary:
        return <RoomSummaryMessage message={message} />;
      case AIMessageType.RoomActions:
        return <RoomActionMessage message={message} />;
      case AIMessageType.MeetingIntroduce:
        return <IntroduceMeetingMessage />;
      case AIMessageType.SummaryIntroduce:
        return <IntroduceSummaryMessage />;
      case AIMessageType.TranslationIntroduce:
        return <IntroduceTranslationMessage />;
      case AIMessageType.ActionsIntroduce:
        return <IntroduceActionsMessage />;
      case AIMessageType.GlobalIntroduce:
        return <GlobalIntroduceMessage />;
      case AIMessageType.RoomAIDescription:
        return <RoomAIDescriptionMessage message={message} />;
      // case AIMessageType.AISearchSugesstion:
      //   return <AISearchSugesstionsMessage />;
      case AIMessageType.AIReplyMention:
        return <ReplyMentionMessage message={message} />;
      case AIMessageType.AIMediaSummary:
        return <RoomAIMediaMessage message={message} />;
      case AIMessageType.UserPortrait:
        return <RoomAIUserPortraitMessage userId={message?.content} />;
      case AIMessageType.UpgradeTip:
        return <UpgradeTipMessage message={message} deleteMessage={deleteMessage} />;
      case AIMessageType.Default:
      default:
        return <DefaultMessage message={message} isLoading={isLoading} />;
    }
  };

  return (
    <AnimatePresence>
      {renderMessageComponent()}
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.content !== nextProps.message.content) return false;
    if (prevProps.message.type !== nextProps.message.type) return false;
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
