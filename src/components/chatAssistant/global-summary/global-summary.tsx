/* eslint-disable no-null/no-null */
import React, {
  forwardRef,
  memo,
  useCallback, useEffect, useState,
} from 'react';
import { useChat } from '@ai-sdk/react';
import type { Message } from 'ai';
import { orderBy } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { SERVER_API_URL } from '../../../config';
import eventEmitter, { Actions } from '../lib/EventEmitter';
import buildClassName from '../../../util/buildClassName';
import { globalSummaryTask } from '../ai-task/global-summary-task';
import { useScrollToBottom } from '../hook/use-scroll-to-bottom';
import { Messages } from '../messages';
import { MultiInput } from '../multi-input';
import { RightPanel } from '../rightPanel/right-panel';
import RoomStorage from '../room-storage';
import { ChataiStores } from '../store';
import {
  parseMessage2SummaryStoreMessage,
  parseSummaryStoreMessage2Message,
  type SummaryStoreMessage,
} from '../store/summary-store';
import { getCurrentUserInfo } from '../utils/chat-api';
import { GLOBAL_SUMMARY_CHATID } from '../variables';
import SummaryHeaderActions from './summary-header-actions';
import { createGlobalIntroduceMessage } from './summary-utils';
import UrgentNotification from './urgent-notification';

import ErrorBoundary from '../ErrorBoundary';
import { useDrawerStore } from './DrawerContext';

import './global-summary.scss';
import styles from './global-summary.module.scss';

import SerenaPath from '../assets/serena.png';

const GlobalSummary = forwardRef(() => {
  const { isOpen } = useDrawerStore();
  const { userId, userName } = getCurrentUserInfo();
  const [notificationMessage, setNotificationMessage] = useState<Message | null>(null);
  const [summaryMessages, setSummaryMessages] = useState<Message[]>([]);
  const [viewMessages, setViewMessages] = useState<Message[] >([]);
  const [pageInfo, setPageInfo] = useState<{ lastTime: number | undefined; hasMore: boolean }>({
    lastTime: undefined,
    hasMore: true,
  });
  const {
    scrollToBottom, scrollLocked, isScrollLock,
  } = useScrollToBottom();
  const {
    messages, setMessages, append, stop, status,
  } = useChat({
    api: `${SERVER_API_URL}/chat?userId=${userId}&userName=${userName}&platform=web`,
    id: GLOBAL_SUMMARY_CHATID,
    sendExtraMessageFields: true,
  });

  useEffect(() => {
    const sorted = orderBy(
      [...messages, ...summaryMessages],
      [(item:Message) => new Date(item.createdAt as Date).getTime()],
      ['asc'],
    );
    setViewMessages(sorted);
  }, [messages, summaryMessages]);

  useEffect(() => {
    if (!isScrollLock) {
      scrollToBottom();
    }
  }, [isScrollLock, viewMessages, scrollToBottom]);

  const handleLoadMore = useCallback(() => {
    scrollLocked();
    return new Promise<void>((resolve) => {
      ChataiStores.summary?.getMessages(pageInfo?.lastTime, 10)?.then((res) => {
        if (res.messages) {
          const localChatAiMessages = parseSummaryStoreMessage2Message(res.messages);
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

  const handleAddSummaryMessage = useCallback((message: SummaryStoreMessage) => {
    setSummaryMessages((prev) => [...prev, message]);
  }, [setSummaryMessages]);

  const handleAddUrgentMessage = useCallback((message: SummaryStoreMessage) => {
    setSummaryMessages((prev) => [...prev, message]);
    setNotificationMessage(message);
  }, [setSummaryMessages]);

  const getSummaryHistory = useCallback(() => {
    ChataiStores.summary?.getMessages(undefined, 30)?.then((res) => {
      if (res.messages.length > 0) {
        const localChatAiMessages = parseSummaryStoreMessage2Message(res.messages);
        setSummaryMessages((prev) => [...localChatAiMessages, ...prev]);
      } else {
        const globalIntroduce = createGlobalIntroduceMessage();
        setSummaryMessages([globalIntroduce]);
      }
      setPageInfo({
        lastTime: res.lastTime,
        hasMore: res.hasMore,
      });
    });
  }, [setSummaryMessages]);

  useEffect(() => {
    eventEmitter.on(Actions.AddUrgentMessage, handleAddUrgentMessage);
    eventEmitter.on(Actions.AddSummaryMessage, handleAddSummaryMessage);
    eventEmitter.on(Actions.ChatAIStoreReady, getSummaryHistory);
    return () => {
      eventEmitter.off(Actions.AddUrgentMessage, handleAddUrgentMessage);
      eventEmitter.off(Actions.AddSummaryMessage, handleAddSummaryMessage);
      eventEmitter.off(Actions.ChatAIStoreReady, getSummaryHistory);
      setViewMessages([]);
    };
  }, [getSummaryHistory, handleAddSummaryMessage, handleAddUrgentMessage]);

  useEffect(() => {
    if (ChataiStores.summary) {
      getSummaryHistory();
    }
  }, [getSummaryHistory]);

  useEffect(() => {
    const lastFocusTime = RoomStorage.getRoomLastFocusTime(GLOBAL_SUMMARY_CHATID);
    // 再次聚焦间隔6小时触发一次总结
    if (lastFocusTime && lastFocusTime < Date.now() - 1000 * 60 * 60 * 6) {
      globalSummaryTask.initSummaryChats(false);
    }
    RoomStorage.updateRoomAIData(GLOBAL_SUMMARY_CHATID, 'lastFocusTime', new Date().getTime());
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    scrollLocked();
    ChataiStores.summary?.delMessage(messageId).then(() => {
      // setMessages((prev) => prev.filter((message) => message.id !== messageId));
      // setSummaryMessages((prev) => prev.filter((message) => message.id !== messageId));
      setViewMessages((prev) => prev.filter((message) => message.id !== messageId));
    });
  }, [scrollLocked]);

  const handleInputSubmit = useCallback((value:string) => {
    scrollToBottom();
    append({
      role: 'user',
      content: value,
      id: uuidv4(),
      createdAt: new Date(),
    });
  }, [append, scrollToBottom]);

  useEffect(() => {
    if (status === 'ready') {
      const msgs = parseMessage2SummaryStoreMessage(messages);
      ChataiStores.summary?.storeMessages(msgs);
    }
  }, [messages, status]);
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
            <img className="w-[40px] h-[40px] rounded-full mr-[12px]" src={SerenaPath} alt="Tely" />
            <span className="text-[15px] font-semibold">Tely</span>
            <div className="flex items-center ml-auto gap-[20px]">
              <SummaryHeaderActions />
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <Messages
              className="px-[15%] flex-1"
              status={status}
              messages={viewMessages}
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
});

export default memo(GlobalSummary);
