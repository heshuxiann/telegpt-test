/* eslint-disable no-null/no-null */
import React, { useRef } from 'react';
import {
  memo,
  useCallback, useEffect, useState,
} from 'react';
import { orderBy, uniqBy } from 'lodash';

import type { Message } from '../messages/types';
import { AIMessageType } from '../messages/types';

import { Actions } from '../lib/EventEmitter';
import buildClassName from '../../../util/buildClassName';
import generateUniqueId from '../../../util/generateUniqueId';
import { useAgentChat } from '../agent/useAgentChat';
import { useScrollToBottom } from '../hook/use-scroll-to-bottom';
import { useEventListener } from '../hook/useEventBus';
import { usePerformanceMonitor } from '../hook/usePerformanceMonitor';
import { Messages } from '../messages';
import { MultiInput } from '../multi-input';
import { RightPanel } from '../rightPanel/right-panel';
import { createUpgradeTipMessage } from '../room-ai/room-ai-utils';
import { ChataiStores } from '../store';
import IntroMessageManager from '../utils/intro-message-manager';
import { GLOBAL_SUMMARY_CHATID } from '../variables';
import SummaryHeaderActions from './summary-header-actions';
import UrgentNotification from './urgent-notification';

import ErrorBoundary from '../ErrorBoundary';
import { useDrawerStore } from './DrawerContext';

import './global-summary.scss';
import styles from './global-summary.module.scss';

import SerenaPath from '../assets/serena.png';

const GlobalSummary = () => {
  // 性能监控
  usePerformanceMonitor('ChatAssistant/GlobalSummary', { logThreshold: 30 });

  const { isOpen } = useDrawerStore();
  const [notificationMessage, setNotificationMessage] = useState<Message | null>(null);
  const [summaryMessages, setSummaryMessages] = useState<Message[]>([]);
  const [viewMessages, setViewMessages] = useState<Message[]>([]);
  const [pageInfo, setPageInfo] = useState<{ lastTime: number | undefined; hasMore: boolean }>({
    lastTime: undefined,
    hasMore: true,
  });
  const {
    scrollToBottom, scrollLocked, isScrollLock,
  } = useScrollToBottom();

  // 存储单条或多条消息的辅助函数
  const storeMessagesToDB = useCallback((messagesToStore: Message | Message[]) => {
    const messagesArray = Array.isArray(messagesToStore) ? messagesToStore : [messagesToStore];
    messagesArray.forEach((msg) => {
      ChataiStores.summary?.storeMessage(msg);
    });
  }, []);

  const {
    messages, setMessages, append, stop, status, currentPhase,
  } = useAgentChat({
    chatId: GLOBAL_SUMMARY_CHATID,
    onError: (error) => {
      try {
        const data = JSON.parse(error.message);
        if (data.code === 102 || data.code === 103) {
          const upgradeTip = createUpgradeTipMessage();
          setMessages((prev) => [...prev, upgradeTip]);
          storeMessagesToDB(upgradeTip);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('error.message is not JSON:', error.message);
      }
    },
    onFinish: (result) => {
      // eslint-disable-next-line no-console
      console.log('[GlobalSummary] Finished:', result);
      // AI 回复完成后，存储最后一条 assistant 消息
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          storeMessagesToDB(lastMessage);
        }
        return prev;
      });
    },
  });

  // 使用 ref 跟踪上一次的消息长度，避免不必要的滚动
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    const sorted = orderBy(
      uniqBy(
        [...messages, ...summaryMessages],
        (item: Message) => item.id,
      ),
      [(item: Message) => new Date(item.createdAt as Date).getTime()],
      ['asc'],
    );
    setViewMessages(sorted);

    // 只在消息数量增加时触发滚动，避免排序导致的重复滚动
    const currentLength = sorted.length;
    if (currentLength > prevMessagesLengthRef.current && !isScrollLock) {
      // 使用 requestAnimationFrame 优化性能
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
    prevMessagesLengthRef.current = currentLength;
  }, [messages, summaryMessages, isScrollLock, scrollToBottom]);

  const handleLoadMore = useCallback(() => {
    scrollLocked();
    return new Promise<void>((resolve) => {
      ChataiStores.summary?.getMessages(pageInfo?.lastTime, 10)?.then((res) => {
        if (res.messages) {
          const localChatAiMessages = res?.messages ?? [];
          setSummaryMessages((prev) => [...localChatAiMessages, ...prev]);
        }
        setPageInfo({
          lastTime: res.lastTime,
          hasMore: res.hasMore,
        });
        resolve();
      });
    });
  }, [pageInfo?.lastTime, scrollLocked, setSummaryMessages]);

  const handleAddSummaryMessage = useCallback((message: Message) => {
    setSummaryMessages((prev) => [...prev, message]);
    storeMessagesToDB(message);
  }, [storeMessagesToDB]);

  const handleAddUrgentMessage = useCallback((message: Message) => {
    setSummaryMessages((prev) => [...prev, message]);
    setNotificationMessage(message);
    storeMessagesToDB(message);
  }, [storeMessagesToDB]);

  const getSummaryHistory = useCallback(() => {
    // 检查是否需要创建 IntroMessage
    const introMessage = IntroMessageManager.getIntroMessage(GLOBAL_SUMMARY_CHATID);
    if (introMessage) {
      // 第一次访问全局总结，创建并存储 IntroMessage
      storeMessagesToDB(introMessage);
    }

    // 从 store 加载历史消息
    ChataiStores.summary?.getMessages(undefined, 30)?.then((res) => {
      if (res.messages.length > 0) {
        // Store 中有历史消息，直接加载
        const localChatAiMessages = res?.messages ?? [];
        setSummaryMessages(localChatAiMessages);
      } else if (introMessage) {
        // Store 中没有消息，但刚创建了 introMessage
        setSummaryMessages([introMessage]);
      }
      setPageInfo({
        lastTime: res.lastTime,
        hasMore: res.hasMore,
      });
      // 初次加载完成后立即滚动到底部
      requestAnimationFrame(() => {
        scrollToBottom('instant');
      });
    });
  }, [storeMessagesToDB, scrollToBottom]);

  // useEffect(() => {
  //   const lastFocusTime = RoomStorage.getRoomLastFocusTime(GLOBAL_SUMMARY_CHATID);
  //   // 再次聚焦间隔6小时触发一次总结
  //   if (lastFocusTime && lastFocusTime < Date.now() - 1000 * 60 * 60 * 6) {
  //     globalSummaryTask.initSummaryChats(false);
  //   }
  //   RoomStorage.updateRoomAIData(GLOBAL_SUMMARY_CHATID, 'lastFocusTime', new Date().getTime());
  // }, []);

  const deleteMessage = useCallback((messageId: string) => {
    scrollLocked();
    ChataiStores.summary?.delMessage(messageId).then(() => {
      setViewMessages((prev) => prev.filter((message) => message.id !== messageId));
    });
  }, [scrollLocked]);

  const handleInputSubmit = useCallback((value: string) => {
    scrollToBottom();
    const newMessage: Message = {
      role: 'user',
      content: value,
      id: generateUniqueId(),
      createdAt: new Date(),
      type: AIMessageType.Default,
      timestamp: Date.now(),
    };
    append(newMessage);
    // 存储用户消息
    storeMessagesToDB(newMessage);
  }, [append, scrollToBottom, storeMessagesToDB]);

  useEventListener(Actions.AskGlobalAI, handleInputSubmit);
  useEventListener(Actions.AddUrgentMessage, handleAddUrgentMessage);
  useEventListener(Actions.AddSummaryMessage, handleAddSummaryMessage);
  useEventListener(Actions.ChatAIStoreReady, getSummaryHistory);

  useEffect(() => {
    getSummaryHistory();
  }, [getSummaryHistory]);

  const className = buildClassName(
    styles.globaSummaryBg,
    'flex flex-col w-full h-full',
    'global-summary-inner',
    isOpen && 'right-panel-open',
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-row w-full">
        <div className={className}>
          <div className="h-[56px] w-full px-[20px] flex items-center bg-[var(--color-background)]">
            <img className="w-[40px] h-[40px] rounded-full mr-[12px]" src={SerenaPath} alt="TelyAI" />
            <span className="text-[15px] font-semibold">TelyAI</span>
            <div className="flex items-center ml-auto gap-[20px]">
              <SummaryHeaderActions />
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <Messages
              className="px-[15%] flex-1"
              status={status}
              messages={viewMessages}
              currentPhase={currentPhase}
              deleteMessage={deleteMessage}
              loadMore={handleLoadMore}
              hasMore={pageInfo.hasMore}
              chatId={GLOBAL_SUMMARY_CHATID}
            />
            <div className="mb-[26px] px-[15%]">
              <MultiInput
                status={status}
                setMessages={setMessages}
                stop={stop}
                handleInputSubmit={handleInputSubmit}
              />
            </div>
          </div>
        </div>
        <RightPanel />
      </div>
      <UrgentNotification message={notificationMessage} />
    </ErrorBoundary>

  );
};

export default memo(GlobalSummary);
