import React from '@teact';
import type { FC } from '../../lib/teact/teact';
import { memo, useEffect, useState } from '../../lib/teact/teact';
import { getActions, getGlobal, withGlobal } from '../../global';

import type { ApiChat } from '../../api/types';
import type { MessageListType } from '../../types';
import type { IconName } from '../../types/icons';

import { getUserFullName } from '../../global/helpers/users';
import {
  selectCanDeleteSelectedMessages,
  selectCanDownloadSelectedMessages,
  selectCanForwardMessages,
  selectCanReportSelectedMessages, selectChatMessages,
  selectCurrentChat,
  selectCurrentMessageList, selectHasProtectedMessage,
  selectHasSvg,
  selectSelectedMessagesCount,
  selectTabState,
} from '../../global/selectors';
import { selectSharedSettings } from '../../global/selectors/sharedState';
import { selectUser } from '../../global/selectors/users';
import buildClassName from '../../util/buildClassName';
import captureKeyboardListeners from '../../util/captureKeyboardListeners';
import { checkCredisBalance } from '../../util/subscriptionHandler';
import SerenaPath from '../chatAssistant/assets/serena.png';

import useFlag from '../../hooks/useFlag';
import useLastCallback from '../../hooks/useLastCallback';
import useOldLang from '../../hooks/useOldLang';
import usePreviousDeprecated from '../../hooks/usePreviousDeprecated';
import useCopySelectedMessages from './hooks/useCopySelectedMessages';

import Icon from '../common/icons/Icon';
import Button from '../ui/Button';
import Checkbox from '../ui/Checkbox';
import ConfirmDialog from '../ui/ConfirmDialog';

import './MessageSelectToolbar.scss';
import { TeleAiIcon } from '../chatAssistant/utils/icons';

export type OwnProps = {
  isActive?: boolean;
  canPost?: boolean;
  messageListType?: MessageListType;
};

type StateProps = {
  chat?: ApiChat;
  isSchedule: boolean;
  selectedMessagesCount?: number;
  canDeleteMessages?: boolean;
  canReportMessages?: boolean;
  canDownloadMessages?: boolean;
  canForwardMessages?: boolean;
  hasProtectedMessage?: boolean;
  isAnyModalOpen?: boolean;
  selectedMessageIds?: number[];
  shouldWarnAboutSvg?: boolean;
  hasSvgs?: boolean;
};

const MessageSelectToolbar: FC<OwnProps & StateProps> = ({
  chat,
  canPost,
  isActive,
  messageListType,
  isSchedule,
  selectedMessagesCount,
  canDeleteMessages,
  canReportMessages,
  canDownloadMessages,
  canForwardMessages,
  hasProtectedMessage,
  isAnyModalOpen,
  selectedMessageIds,
  shouldWarnAboutSvg,
  hasSvgs,
}) => {
  const {
    exitMessageSelectMode,
    openForwardMenuForSelectedMessages,
    downloadSelectedMessages,
    copySelectedMessages,
    showNotification,
    reportMessages,
    openDeleteMessageModal,
    setSharedSettingOption,
    openPayPackageModal,
    openChatAIWithInfo,

  } = getActions();
  const lang = useOldLang();

  useCopySelectedMessages(isActive);

  const [isSvgDialogOpen, openSvgDialog, closeSvgDialog] = useFlag();
  const [shouldNotWarnAboutSvg, setShouldNotWarnAboutSvg] = useState(false);

  const handleExitMessageSelectMode = useLastCallback(() => {
    exitMessageSelectMode();
  });

  const handleDelete = useLastCallback(() => {
    if (!selectedMessageIds || !chat) return;
    openDeleteMessageModal({
      chatId: chat.id,
      messageIds: selectedMessageIds,
      isSchedule,
    });
  });

  useEffect(() => {
    return isActive && !isAnyModalOpen
      ? captureKeyboardListeners({
        onBackspace: canDeleteMessages ? handleDelete : undefined,
        onDelete: canDeleteMessages ? handleDelete : undefined,
        onEsc: handleExitMessageSelectMode,
      })
      : undefined;
  }, [
    isActive, handleDelete, handleExitMessageSelectMode, isAnyModalOpen,
    canDeleteMessages,
  ]);

  const handleCopy = useLastCallback(() => {
    copySelectedMessages();
    showNotification({
      message: lang('Share.Link.Copied'),
    });
    exitMessageSelectMode();
  });

  const handleDownload = useLastCallback(() => {
    downloadSelectedMessages();
    exitMessageSelectMode();
  });

  const handleMessageDownload = useLastCallback(() => {
    if (shouldWarnAboutSvg && hasSvgs) {
      openSvgDialog();
      return;
    }

    handleDownload();
  });

  const handleSvgConfirm = useLastCallback(() => {
    setSharedSettingOption({ shouldWarnAboutSvg: !shouldNotWarnAboutSvg });
    closeSvgDialog();
    handleDownload();
  });

  const prevSelectedMessagesCount = usePreviousDeprecated(selectedMessagesCount || undefined, true);
  const renderingSelectedMessagesCount = isActive ? selectedMessagesCount : prevSelectedMessagesCount;

  const formattedMessagesCount = lang('VoiceOver.Chat.MessagesSelected', renderingSelectedMessagesCount, 'i');

  const openMessageReport = useLastCallback(() => {
    if (!selectedMessageIds || !chat) return;
    reportMessages({
      chatId: chat.id,
      messageIds: selectedMessageIds,
    });
    exitMessageSelectMode();
  });

  const handleAskAi = useLastCallback(() => {
    if (!selectedMessageIds || !chat) return;
    if (!checkCredisBalance()) {
      openPayPackageModal();
      return;
    }

    // 获取全局状态
    const global = getGlobal();

    // 获取选中的消息完整数据
    const messagesById = selectChatMessages(global, chat.id);
    if (!messagesById) return;

    // 构建选中消息数组，只保留文本消息
    const selectedMessages = selectedMessageIds
      .map((messageId) => messagesById[messageId])
      .filter((message) => message && message.content.text?.text) // 过滤非文本消息
      .map((message) => {
        // 获取发送者名称
        const sender = message.senderId ? selectUser(global, message.senderId) : undefined;
        const senderName = sender ? getUserFullName(sender) : 'Unknown';

        return {
          messageId: String(message.id),
          content: message.content.text!.text,
          senderId: message.senderId || message.chatId,
          senderName,
          timestamp: message.date * 1000, // 转换为毫秒
        };
      });

    openChatAIWithInfo({
      chatId: chat.id,
      selectedMessages,
    });
  });

  const className = buildClassName(
    'MessageSelectToolbar',
    canPost && 'with-composer',
    isActive && 'shown',
  );

  const renderButton = (
    icon: IconName, label: string, onClick: AnyToVoidFunction, destructive?: boolean,
  ) => {
    return (
      <div
        role="button"
        tabIndex={0}
        className={buildClassName(
          'div-button',
          'item',
          destructive && 'destructive',
        )}
        onClick={onClick}
        title={label}
        aria-label={label}
      >
        <Icon name={icon} />
      </div>
    );
  };

  return (
    <>
      <div className={className}>
        <div className="MessageSelectToolbar-inner">
          <Button
            color="translucent"
            round
            onClick={handleExitMessageSelectMode}
            ariaLabel="Exit select mode"
          >
            <Icon name="close" />
          </Button>
          <span className="MessageSelectToolbar-count" title={formattedMessagesCount}>
            {formattedMessagesCount}
          </span>

          {Boolean(selectedMessagesCount) && (
            <div className="MessageSelectToolbar-actions">
              <div
                role="button"
                tabIndex={0}
                className="div-button item"
                onClick={handleAskAi}
                title="Ask TelyAI"
                aria-label="Ask TelyAI"
              >
                <img className="w-[24px] h-[24px]" src={SerenaPath} alt="" />
              </div>
              {messageListType !== 'scheduled' && canForwardMessages && (
                renderButton(
                  'forward', lang('Chat.ForwardActionHeader'), openForwardMenuForSelectedMessages,
                )
              )}
              {canReportMessages && (
                renderButton('flag', lang('Conversation.ReportMessages'), openMessageReport)
              )}
              {canDownloadMessages && !hasProtectedMessage && (
                renderButton('download', lang('lng_media_download'), handleMessageDownload)
              )}
              {!hasProtectedMessage && (
                renderButton('copy', lang('lng_context_copy_selected_items'), handleCopy)
              )}
              {canDeleteMessages && (
                renderButton('delete', lang('EditAdminGroupDeleteMessages'), handleDelete, true)
              )}
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={isSvgDialogOpen}
        onClose={closeSvgDialog}
        confirmHandler={handleSvgConfirm}
      >
        {lang('lng_launch_svg_warning')}
        <Checkbox
          className="dialog-checkbox"
          checked={shouldNotWarnAboutSvg}
          label={lang('lng_launch_exe_dont_ask')}
          onCheck={setShouldNotWarnAboutSvg}
        />
      </ConfirmDialog>
    </>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const tabState = selectTabState(global);
    const { shouldWarnAboutSvg } = selectSharedSettings(global);
    const chat = selectCurrentChat(global);

    const { type: messageListType, chatId } = selectCurrentMessageList(global) || {};
    const isSchedule = messageListType === 'scheduled';
    const { canDelete } = selectCanDeleteSelectedMessages(global);
    const canReport = Boolean(!isSchedule && selectCanReportSelectedMessages(global));
    const canDownload = selectCanDownloadSelectedMessages(global);
    const { messageIds: selectedMessageIds } = tabState.selectedMessages || {};
    const hasProtectedMessage = chatId ? selectHasProtectedMessage(global, chatId, selectedMessageIds) : false;
    const canForward = !isSchedule && chatId ? selectCanForwardMessages(global, chatId, selectedMessageIds) : false;
    const hasSvgs = selectedMessageIds && chatId ? selectHasSvg(global, chatId, selectedMessageIds) : false;
    const isShareMessageModalOpen = tabState.isShareMessageModalShown;
    const isAnyModalOpen = Boolean(isShareMessageModalOpen || tabState.requestedDraft
      || tabState.requestedAttachBotInChat || tabState.requestedAttachBotInstall || tabState.reportModal
      || tabState.deleteMessageModal);

    return {
      chat,
      isSchedule,
      selectedMessagesCount: selectSelectedMessagesCount(global),
      canDeleteMessages: canDelete,
      canReportMessages: canReport,
      canDownloadMessages: canDownload,
      canForwardMessages: canForward,
      selectedMessageIds,
      hasProtectedMessage,
      isAnyModalOpen,
      shouldWarnAboutSvg,
      hasSvgs,
    };
  },
)(MessageSelectToolbar));
