/* eslint-disable max-len */
import React, { useEffect, useState } from '../../../lib/teact/teact';
import { getActions } from '../../../global';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import RoomStorage from '../room-storage';

import useLastCallback from '../../../hooks/useLastCallback';

import Button from '../../ui/Button';

import './room-ai.scss';

import SerenaLogoPath from '../assets/serena.png';

interface OwnProps {
  chatId: string;
}

const RoomAIActionButton = (props: OwnProps) => {
  const { chatId } = props;
  const { openChatAIWithInfo } = getActions();
  const [unreadCount, setUnreadCount] = useState(0);
  const onClick = useLastCallback(() => {
    openChatAIWithInfo({ chatId });
    RoomStorage.updateRoomAIData(chatId, 'unreadCount', 0);
    setUnreadCount(0);
  });
  const updateUnreadCount = useLastCallback((param:{ chatId:string; count:number }) => {
    if (param.chatId === chatId) {
      setUnreadCount(param.count);
    }
  });
  useEffect(() => {
    const count = RoomStorage.getRoomAIUnreadCount(chatId);
    setUnreadCount(count);
    RoomStorage.summary(chatId);
    eventEmitter.on(Actions.UpdateRoomAIUnreadCount, updateUnreadCount);
    return () => {
      eventEmitter.off(Actions.UpdateRoomAIUnreadCount, updateUnreadCount);
    };
  }, [chatId, updateUnreadCount]);
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
