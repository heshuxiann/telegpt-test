import cx from 'classnames';
import type { FC } from '../../../lib/teact/teact';
import React, { memo, useState } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type { ApiMessage } from '../../../api/types';
import type { MessageListType } from '../../../types';

import eventEmitter from '../lib/EventEmitter';
import {
  getMessageContent, hasMessageText, isOwnMessage, isUserId, isUserRightBanned,
} from '../../../global/helpers';
import {
  selectAllowedMessageActionsSlow, selectCanTranslateMessage, selectChat, selectChatFullInfo, selectCurrentMessageList,
  selectMessageTranslations,
  selectRequestedMessageTranslationLanguage,
} from '../../../global/selectors';
import {
  audioSummary, canSummarize,
  checkIsUrl, documentSummary, photoSummary, videoSummary, voiceToAudioSummary, webPageSummary,
} from '../utils/ai-analyse-message';
import { chatAIGenerate } from '../utils/chat-api';
import { createAuthConfirmModal } from '../utils/google-api';
import { getAuthState, isTokenValid } from '../utils/google-auth';
import {
  AIReplyIcon, AITranslateIcon, MeetingIcon, SummarizeIcon,
} from '../utils/icons';
import ScheduleMeeting from '../utils/schedule-meeting';
import { knowledgeEmbeddingStore } from '../vector-store';

import useLastCallback from '../../../hooks/useLastCallback';

import './message-gpt-menu.scss';

import SerenaPath from '../assets/serena.png';

const menuItemClass = 'w-[20px] h-[20px] text-[16px] cursor-pointer flex items-center justify-center';

type StateProps = {
  message:ApiMessage;
  canScheduleMeeting:boolean;
  canAISummarize:any;
  canSmartReply:boolean | undefined;
  canTranslate:boolean | undefined;
};
 type OwnProps = {
   message: ApiMessage;
   messageListType: MessageListType;
   detectedLanguage?: string;
   position:'top' | 'bottom';
 };

const MessageGptMenu:FC<OwnProps & StateProps> = ({
  message, position, canScheduleMeeting, canAISummarize, canSmartReply, canTranslate,
}) => {
  const canSerenaAI = canScheduleMeeting || canAISummarize || canSmartReply || canTranslate;
  const [isSchedulingMeeting, setIsSchedulingMeeting] = useState(false);

  const handleScheduleMeeting = useLastCallback(() => {
    if (isSchedulingMeeting) return;

    setIsSchedulingMeeting(true);
    const chatId = message.chatId;
    const text = getMessageContent(message)?.text?.text || '';
    const scheduleMeeting = ScheduleMeeting.create({ chatId });
    const auth = getAuthState();

    const startMeeting = () => {
      scheduleMeeting.start({
        chatId,
        text,
      });
      // Reset the flag after a delay to prevent rapid clicks
      setTimeout(() => setIsSchedulingMeeting(false), 2000);
    };

    if (!auth || !isTokenValid(auth)) {
      createAuthConfirmModal({
        onOk: startMeeting,
        onCancel: () => setIsSchedulingMeeting(false),
      });
    } else {
      startMeeting();
    }
  });
  const handleSmartReply = useLastCallback(async () => {
    if (message.content.text?.text) {
      getActions().updateDraftReplyInfo({
        replyToMsgId: message.id, replyToPeerId: undefined, quoteText: undefined, quoteOffset: undefined,
      });
      const vectorSearchResults = await knowledgeEmbeddingStore.similaritySearch({
        query: message.content.text?.text,
      });
        type Metadata = { answer: string }; // Define the type for metadata
        const similarResult = vectorSearchResults.similarItems[0] as { metadata: Metadata; score: number } | undefined;
        if (similarResult && similarResult.score > 0.8) {
          eventEmitter.emit('update-input-text', similarResult.metadata.answer);
        } else {
          eventEmitter.emit('update-input-spiner', true);
          chatAIGenerate({
            data: {
              messages: [
                {
                  role: 'system',
                  content: '你是一个多语种智能助手。接收用户消息后，自动识别其使用的语言，并用相同的语言进行自然、得体的回复。你应该理解消息的语境，确保回复简洁、友好且符合语言习惯。',
                  id: '1',
                },
                {
                  role: 'user',
                  content: `请回复下面的消息: ${message.content.text?.text}`,
                  id: '2',
                },
              ],
            },
            onResponse: (response) => {
              eventEmitter.emit('update-input-text', response);
            },
            onFinish: () => {
              // eslint-disable-next-line no-console
              console.log('Finish');
            },
          });
        }
    }
  });
  const handleSummarize = useLastCallback(async () => {
    const {
      photo, document, webPage, voice, audio, text, video,
    } = message.content;
    const isUrl = checkIsUrl(text?.text);
    await getActions().openChatAIWithInfo({ chatId: message.chatId });
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
    getActions().requestMessageTranslation({
      chatId: message.chatId,
      id: message.id,
    });
  });

  if (!canSerenaAI) {
    return undefined;
  }

  return (
    <div className={cx('message-gpt-menu', position === 'top' ? 'top-[-32px]' : 'bottom-[-32px]')}>
      <div className="message-gpt-menu-inner">
        <div className={cx('!cursor-auto', menuItemClass)}>
          <img className="w-[20px] h-[20px] mt-[-4px]" src={SerenaPath} alt="" />
        </div>
        {canTranslate && (
          <div className={menuItemClass} onClick={handleTranslate} title="Translate">
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
  const canTranslate = !hasTranslation && selectCanTranslateMessage(global, message, detectedLanguage);
  return {
    message,
    canScheduleMeeting: !isOwn && hasTextContent,
    canAISummarize,
    canSmartReply: !isOwn && !isPinned && !isScheduled && canReplyGlobally && canSendText && hasTextContent,
    canTranslate,
  };
})(MessageGptMenu));
