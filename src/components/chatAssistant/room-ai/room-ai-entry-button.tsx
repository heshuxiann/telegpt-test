import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import type { DotLottie } from '@lottiefiles/dotlottie-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { getActions, getGlobal } from '../../../global';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { selectSharedSettings } from '../../../global/selectors/sharedState';
import RoomStorage from '../room-storage';

import './room-ai.scss';

import { serenaWaitUrl, serenaWorkUrl } from '../assets/lottieData/index';

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
  const containerRef = useRef<HTMLDivElement>(undefined);
  const onClick = useCallback((e: React.MouseEvent) => {
    // 检查是否正在拖拽，如果是则阻止点击
    const wrapper = e.currentTarget.closest('.room-ai-entry-wrapper');
    if (wrapper && wrapper.getAttribute('data-dragging') === 'true') {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    openChatAIWithInfo({ chatId });
    RoomStorage.updateRoomAIData(chatId, 'unreadCount', 0);
    setUnreadCount(0);
  }, [chatId, openChatAIWithInfo]);
  const updateUnreadCount = useCallback((param: { chatId: string; count: number }) => {
    if (param.chatId === chatId) {
      setUnreadCount(param.count);
    }
  }, [chatId]);
  const updateSummaryState = useCallback((param: { chatId: string; state: boolean }) => {
    if (param.chatId === chatId) {
      setIsSummary(param.state);
    }
  }, [chatId]);
  const intervalAnimate = useCallback(() => {
    if (dotLottie && !isSummary) {
      dotLottie.play();
    }
  }, [dotLottie, isSummary]);

  const handleAutoSummary = useCallback(() => {
    const global = getGlobal();
    const { realTimeAssistants } = selectSharedSettings(global);
    const realTimeAssistantById = realTimeAssistants?.[chatId] ? realTimeAssistants?.[chatId] : false;
    if (realTimeAssistantById) {
      RoomStorage.summary(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    const interval = setInterval(intervalAnimate, 10000);
    return () => clearInterval(interval);
  }, [chatId, intervalAnimate]);

  useEffect(() => {
    eventEmitter.on(Actions.UpdateRoomAIUnreadCount, updateUnreadCount);
    eventEmitter.on(Actions.UpdateRoomAISummaryState, updateSummaryState);
    const count = RoomStorage.getRoomAIUnreadCount(chatId);
    const summaryState = RoomStorage.getRoomAISummaryState(chatId);
    setUnreadCount(count);
    setIsSummary(summaryState);
    handleAutoSummary();
    return () => {
      eventEmitter.off(Actions.UpdateRoomAIUnreadCount, updateUnreadCount);
      eventEmitter.off(Actions.UpdateRoomAISummaryState, updateSummaryState);
    };
  }, [chatId, handleAutoSummary, updateSummaryState, updateUnreadCount]);

  const dotLottieRefCallback = useCallback((dotLottie: DotLottie) => {
    setDotLottie(dotLottie);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (dotLottie) {
      dotLottie?.play();
    }
  }, [dotLottie]);
  // 确保当 isSummary 为 true 时动画播放
  useEffect(() => {
    if (isSummary && dotLottie) {
      dotLottie.play();
    }
  }, [isSummary, dotLottie]);

  return (
    <div
      ref={containerRef}
      className="room-ai-entry-button"

    >
      {isSummary ? (
        <DotLottieReact
          key="serenaWork"
          className="w-[62px] h-[62px]"
          src={serenaWorkUrl}
          loop
          autoplay
          dotLottieRefCallback={dotLottieRefCallback}
          onClick={onClick}
        />
      ) : (
        <DotLottieReact
          key="serenaWait"
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
