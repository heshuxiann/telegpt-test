import { useCallback } from 'react';
import { getActions } from '../../../global';
import React from 'react';
import type { FC } from 'react';

import buildClassName from '../../../util/buildClassName';

import styles from './SelectedMessagesBanner.module.scss';

type OwnProps = {
  selectedMessages: Array<{
    messageId: string;
    content: string;
    senderId?: string;
    senderName?: string;
    timestamp?: number;
  }>;
};

const SelectedMessagesBanner: FC<OwnProps> = ({ selectedMessages }) => {
  const { clearChatAISelectedMessages } = getActions();

  const handleClearSelectedMessages = useCallback(() => {
    clearChatAISelectedMessages({});
  }, [clearChatAISelectedMessages]);


  if (!selectedMessages || selectedMessages.length === 0) {
    return null;
  }

  const message = selectedMessages[0];
  const truncatedContent = message.content.length > 100
    ? `${message.content.substring(0, 100)}...`
    : message.content;

  return (
    <div className={buildClassName(styles.banner, 'selected-messages-banner')}>
      <div className={styles.content}>
        <div className={styles.label}>
          Selected Message
          {selectedMessages.length > 1 && ` (+${selectedMessages.length - 1} more)`}
        </div>
        <div className={styles.messagePreview}>
          {message.senderName && (
            <span className={styles.senderName}>{message.senderName}: </span>
          )}
          <span className={styles.text}>{truncatedContent}</span>
        </div>
      </div>
      <button
        color="translucent"
        onClick={handleClearSelectedMessages}
        className={styles.closeButton}
      >
        <i className="icon icon-close" />
      </button>
    </div>
  );
};

export default SelectedMessagesBanner;
