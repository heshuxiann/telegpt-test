/* eslint-disable max-len */
import React, { useEffect, useState } from '../../../lib/teact/teact';
import { getActions } from '../../../global';

import type { ThreadId } from '../../../types';

import RoomAIAssistant from '../utils/room-ai-assistant';

import useLastCallback from '../../../hooks/useLastCallback';

import Button from '../../ui/Button';

import './room-ai.scss';

import SerenaLogoPath from '../assets/serena.png';

interface OwnProps {
  chatId: string;
  threadId: ThreadId;
}

const RoomAIActionButton = (props: OwnProps) => {
  const { chatId, threadId } = props;
  const { openChatAIWithInfo } = getActions();
  const [unreadCount, setUnreadCount] = useState(0);
  const onClick = useLastCallback(() => {
    openChatAIWithInfo({ chatId, threadId });
    RoomAIAssistant.updateRoomAIData(chatId, 'unreadCount', 0);
    setUnreadCount(0);
  });
  useEffect(() => {
    const count = RoomAIAssistant.getRoomAIUnreadCount(chatId);
    setUnreadCount(count);
    RoomAIAssistant.summary(chatId);
  }, [chatId]);
  return (
    <div className="room-ai-floating-button">
      <Button
        color="translucent"
        round
        onClick={onClick}
      >
        <img className="w-[60px] h-[60px]" src={SerenaLogoPath} alt="" />
      </Button>
      {unreadCount > 0 && (
        <div className="room-ai-floating-button-unread-count">{unreadCount}</div>
      )}
    </div>
  );
};
export default RoomAIActionButton;
