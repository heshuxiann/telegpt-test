import React from '@teact';
import cx from 'classnames';
import type { FC } from '../../../lib/teact/teact';
import { memo, useState } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type { ApiMessage } from '../../../api/types';
import type { MessageListType } from '../../../types';

import eventEmitter from '../lib/EventEmitter';
import {
  hasMessageText, isOwnMessage, isUserRightBanned,
} from '../../../global/helpers';
import {
  selectAllowedMessageActionsSlow, selectCanTranslateMessage, selectChat, selectChatFullInfo, selectCurrentMessageList,
  selectMessageTranslations,
  selectRequestedChatTranslationLanguage,
  selectRequestedMessageTranslationLanguage,
} from '../../../global/selectors';
import { isUserId } from '../../../util/entities/ids';
import { checkCredisBalance } from '../../../util/subscriptionHandler';
import {
  audioSummary, canSummarize,
  checkIsUrl, documentSummary, photoSummary, videoSummary, voiceToAudioSummary, webPageSummary,
} from '../utils/ai-analyse-message';
import { autoReply } from '../utils/chat-api';
import { createAuthConfirmModal } from '../utils/google-api';
import { getAuthState, isTokenValid } from '../utils/google-auth';
import {
  AIReplyIcon, AITranslateIcon, MeetingIcon, SummarizeIcon,
} from '../utils/icons';
import { getBestKnowledgeMatch } from '../utils/knowledge-match';
import ScheduleMeeting from '../utils/schedule-meeting';

import useLastCallback from '../../../hooks/useLastCallback';

import './message-gpt-menu.scss';

import SerenaPath from '../assets/serena.png';

const menuItemClass = 'w-[20px] h-[20px] text-[16px] cursor-pointer flex items-center justify-center';

type StateProps = {
  message: ApiMessage;
  canScheduleMeeting: boolean;
  canAISummarize: any;
  canSmartReply: boolean | undefined;
  canTranslate: boolean | undefined;
  canShowOriginal: boolean | undefined;
  subscriptionType: string;
};
 type OwnProps = {
   message: ApiMessage;
   messageListType: MessageListType;
   detectedLanguage?: string;
   position: 'top' | 'bottom';
 };

const MessageGptMenu: FC<OwnProps & StateProps> = ({
  message, position, canScheduleMeeting, canAISummarize, canSmartReply, canTranslate, canShowOriginal, subscriptionType,
}) => {
  const canSerenaAI = canScheduleMeeting || canAISummarize || canSmartReply || canTranslate;
  const [isSchedulingMeeting, setIsSchedulingMeeting] = useState(false);
  const { openPayPackageModal, updateDraftReplyInfo, openChatAIWithInfo, requestMessageTranslation, showOriginalMessage } = getActions();

  const handleScheduleMeeting = useLastCallback(async () => {
    if (!checkCredisBalance()) {
      openPayPackageModal();
      return;
    }
    if (!subscriptionType || subscriptionType === 'free' || subscriptionType === 'basic') {
      openPayPackageModal();
      return;
    }
    if (isSchedulingMeeting) return;
    const chatId = message.chatId;
    if (ScheduleMeeting.get(chatId)) {
      return;
    }
    setIsSchedulingMeeting(true);
    const targetUserId = isUserId(chatId) ? undefined : message.senderId;
    const auth = getAuthState();

    const startMeeting = () => {
      const scheduleMeeting = ScheduleMeeting.create({ chatId, targetUserId });
      scheduleMeeting.handleTargetMessage(message);
      // Reset the flag after a delay to prevent rapid clicks
      setTimeout(() => setIsSchedulingMeeting(false), 2000);
    };

    if (!auth || !(await isTokenValid(auth))) {
      createAuthConfirmModal({
        onOk: startMeeting,
        onCancel: () => setIsSchedulingMeeting(false),
      });
    } else {
      startMeeting();
    }
  });
  const handleSmartReply = useLastCallback(async () => {
    if (!checkCredisBalance()) {
      openPayPackageModal();
      return;
    }
    if (message.content.text?.text) {
      updateDraftReplyInfo({
        replyToMsgId: message.id, replyToPeerId: undefined, quoteText: undefined, quoteOffset: undefined,
      });
      const bestMatch = await getBestKnowledgeMatch(message.content.text.text);
      if (bestMatch && bestMatch.score > 0.8) {
        eventEmitter.emit('update-input-text', bestMatch.answer);
      } else {
        eventEmitter.emit('update-input-spiner', true);
        autoReply({
          message: message.content.text?.text,
          message_id: message.id,
        }).then((res) => {
          eventEmitter.emit('update-input-text', res.data.reply);
        }).catch(() => {
          eventEmitter.emit('update-input-spiner', false);
        });
      }
    }
  });
  const handleSummarize = useLastCallback(() => {
    if (!checkCredisBalance()) {
      openPayPackageModal();
      return;
    }
    const {
      photo, document, webPage, voice, audio, text, video,
    } = message.content;
    const isUrl = checkIsUrl(text?.text);
    openChatAIWithInfo({ chatId: message.chatId });
    if (photo) {
      photoSummary(message);
    } else if ((webPage && !text?.text) || isUrl) {
      webPageSummary(message);
    } else if (document) {
      documentSummary(message);
    } else if (voice) {
      voiceToAudioSummary(message);
    } else if (audio) {
      audioSummary(message);
    } else if (video) {
      videoSummary(message);
    }
  });

  const handleTranslate = useLastCallback(() => {
    if (!checkCredisBalance()) {
      openPayPackageModal();
      return;
    }
    requestMessageTranslation({
      chatId: message.chatId,
      id: message.id,
    });
  });

  const handleShowOriginal = useLastCallback(() => {
    showOriginalMessage({
      chatId: message.chatId,
      id: message.id,
    });
  });

  if (!canSerenaAI) {
    return undefined;
  }

  return (
    <div className={cx('message-gpt-menu z-100', position === 'top' ? 'top-[-32px]' : 'bottom-[-32px]')}>
      <div className="message-gpt-menu-inner">
        <div className={cx('!cursor-auto', menuItemClass)}>
          <img className="w-[20px] h-[20px] mt-[-4px]" src={SerenaPath} alt="" />
        </div>
        {canTranslate && (
          <div className={menuItemClass} onClick={handleTranslate} title="Translate">
            <AITranslateIcon size={16} />
          </div>
        )}
        {canShowOriginal && (
          <div className={menuItemClass} onClick={handleShowOriginal} title="Show original">
            <AITranslateIcon size={16} />
          </div>
        )}
        {canScheduleMeeting && (
          <div className={menuItemClass} onClick={handleScheduleMeeting} title="Schedule meeting">
            <MeetingIcon size={16} />
          </div>
        )}
        {canAISummarize && (
          <div className={menuItemClass} onClick={handleSummarize} title="Summarize">
            <SummarizeIcon size={16} />
          </div>
        )}
        {canSmartReply && (
          <div className={menuItemClass} onClick={handleSmartReply} title="Smart Reply">
            <AIReplyIcon size={16} />
          </div>
        )}
      </div>
    </div>
  );
};
export default memo(withGlobal<OwnProps>((global, { message, messageListType, detectedLanguage }): StateProps => {
  const { subscriptionInfo } = global;
  const { subscriptionType } = subscriptionInfo;
  const isOwn = isOwnMessage(message);
  const hasTextContent = hasMessageText(message);
  const canAISummarize = canSummarize(message);
  const isPinned = messageListType === 'pinned';
  const isScheduled = messageListType === 'scheduled';
  const chat = selectChat(global, message.chatId);
  const isPrivate = chat && isUserId(chat.id);
  const chatFullInfo = !isPrivate ? selectChatFullInfo(global, message.chatId) : undefined;
  const { threadId } = selectCurrentMessageList(global) || {};
  const {
    canReplyGlobally,
  } = (threadId && selectAllowedMessageActionsSlow(global, message, threadId)) || {};
  const canSendText = chat && !isUserRightBanned(chat, 'sendPlain', chatFullInfo);
  const translationRequestLanguage = selectRequestedMessageTranslationLanguage(global, message.chatId, message.id);
  const hasTranslation = translationRequestLanguage
    ? Boolean(selectMessageTranslations(global, message.chatId, translationRequestLanguage)[message.id]?.text)
    : undefined;
  const isChatTranslated = selectRequestedChatTranslationLanguage(global, message.chatId);
  const canTranslate = !hasTranslation && selectCanTranslateMessage(global, message, detectedLanguage);
  const canShowOriginal = hasTranslation && !isChatTranslated;
  return {
    message,
    canScheduleMeeting: !isOwn && hasTextContent,
    canAISummarize,
    canSmartReply: !isOwn && !isPinned && !isScheduled && canReplyGlobally && canSendText && hasTextContent,
    canTranslate,
    canShowOriginal,
    subscriptionType,
  };
})(MessageGptMenu));
