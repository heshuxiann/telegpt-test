/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from 'react';
import type { DotLottie } from '@lottiefiles/dotlottie-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { getActions } from '../../../global';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import RoomStorage from '../room-storage';

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
  const [isSummary, setIsSummary] = useState<boolean>(true);
  const onClick = useCallback(() => {
    openChatAIWithInfo({ chatId });
    RoomStorage.updateRoomAIData(chatId, 'unreadCount', 0);
    setUnreadCount(0);
  }, [chatId]);
  const updateUnreadCount = useCallback((param:{ chatId:string; count:number }) => {
    if (param.chatId === chatId) {
      setUnreadCount(param.count);
    }
  }, [chatId]);
  const updateSummaryState = useCallback((param:{ chatId:string; state:boolean }) => {
    if (param.chatId === chatId) {
      setIsSummary(param.state);
    }
  }, [chatId]);
  const intervalAnimate = useCallback(() => {
    if (dotLottie && !isSummary) {
      dotLottie.play();
    }
  }, [dotLottie, isSummary]);

  useEffect(() => {
    const interval = setInterval(intervalAnimate, 10000);
    return () => clearInterval(interval);
  }, [chatId, intervalAnimate]);

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
  }, [chatId, updateSummaryState, updateUnreadCount]);

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
      {isSummary ? (
        <DotLottieReact
          className="w-[60px] h-[60px]"
          src={serenaWorkUrl}
          loop
          autoplay
          dotLottieRefCallback={dotLottieRefCallback}
          onClick={onClick}
        />
      ) : (
        <DotLottieReact
          className="w-[60px] h-[60px]"
          src={serenaWaitUrl}
          loop={false}
          autoplay={false}
          dotLottieRefCallback={dotLottieRefCallback}
          onClick={onClick}
          onMouseEnter={handleMouseEnter}
        />
      )}
      {unreadCount > 0 && (
        <div className="room-ai-unread-count">{unreadCount}</div>
      )}
    </div>
  );
};
export default RoomAIEntryButton;
