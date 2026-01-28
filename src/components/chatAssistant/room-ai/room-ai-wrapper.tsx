import React, { memo } from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';

import { selectTabState } from '../../../global/selectors';
import { getCurrentTabId } from '../../../util/establishMultitabRole';
import { injectComponent } from '../injectComponent';
import RoomAI from './room-ai';

interface StateProps {
  chatId: string | undefined;
  selectedMessages?: Array<{
    messageId: string;
    content: string;
    senderId?: string;
    senderName?: string;
    timestamp?: number;
    selectedText?: string;
  }>;
}

const RoomAIWrapper = (props: StateProps) => {
  const containerRef = injectComponent({
    component: RoomAI,
    props,
  });
  return (
    <div className="chat-ai-room flex overflow-hidden" ref={containerRef} />
  );
};

export default memo(withGlobal(
  (global, { chatId }): StateProps => {
    const tabId = getCurrentTabId();
    const tabState = selectTabState(global, tabId);

    return {
      chatId,
      selectedMessages: tabState.chatAISelectedMessages,
    };
  },
)(RoomAIWrapper));
