/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from 'react';
import type { DotLottie } from '@lottiefiles/dotlottie-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { getActions } from '../../../global';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import RoomStorage from '../room-storage';

import useLastCallback from '../../../hooks/useLastCallback';

// import Button from '../../ui/Button';
import './room-ai.scss';

import { serenaWaitUrl, serenaWorkUrl } from '../assets/lottieData/index';
// import SerenaLogoPath from '../assets/serena.png';

interface OwnProps {
  chatId: string;
}

const RoomAIEntryButton = (props: OwnProps) => {
  const { chatId } = props;
  const { openChatAIWithInfo } = getActions();
  const [unreadCount, setUnreadCount] = useState(0);
  // eslint-disable-next-line no-null/no-null
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);
  const [isSummary, setIsSummary] = useState<boolean>(false);
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
  const updateSummaryState = useLastCallback((param:{ chatId:string; state:boolean }) => {
    if (param.chatId === chatId) {
      setIsSummary(param.state);
    }
  });
  useEffect(() => {
    const count = RoomStorage.getRoomAIUnreadCount(chatId);
    const summaryState = RoomStorage.getRoomAISummaryState(chatId);
    setUnreadCount(count);
    setIsSummary(summaryState);
    RoomStorage.summary(chatId);
    eventEmitter.on(Actions.UpdateRoomAIUnreadCount, updateUnreadCount);
    eventEmitter.on(Actions.UpdateRoomAISummaryState, updateSummaryState);
    return () => {
      eventEmitter.off(Actions.UpdateRoomAIUnreadCount, updateUnreadCount);
      eventEmitter.off(Actions.UpdateRoomAISummaryState, updateSummaryState);
    };
  }, [chatId, updateUnreadCount]);

  const dotLottieRefCallback = useCallback((dotLottie:DotLottie) => {
    setDotLottie(dotLottie);
  }, []);
  const handleMouseEnter = useCallback(() => {
    if (dotLottie) {
      dotLottie?.play();
    }
  }, [dotLottie]);
  return (
    <div className="room-ai-entry-button">
      <DotLottieReact
        className="w-[60px] h-[60px]"
        src={isSummary ? serenaWorkUrl : serenaWaitUrl}
        loop={!!isSummary}
        autoplay={!!isSummary}
        dotLottieRefCallback={dotLottieRefCallback}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
      />
      {unreadCount > 0 && (
        <div className="room-ai-unread-count">{unreadCount}</div>
      )}
    </div>
  );
};
export default RoomAIEntryButton;
