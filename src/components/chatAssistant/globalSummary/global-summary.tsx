/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-use-before-define */
// import type { Dispatch, SetStateAction } from 'react';
import React, {
  forwardRef,
  memo,
  useCallback, useEffect, useState,
} from 'react';
import { useChat } from '@ai-sdk/react';
import type { Message } from 'ai';
import { useSWRConfig } from 'swr';
import { v4 as uuidv4 } from 'uuid';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import buildClassName from '../../../util/buildClassName';
import { Messages } from '../messages';
import { MultiInput } from '../multi-input';
import { RightPanel } from '../rightPanel/right-panel';
import { ChataiStores } from '../store';
import { parseMessage2SummaryStoreMessage, parseSummaryStoreMessage2Message, type SummaryStoreMessage } from '../store/summary-store';
import { GLOBAL_SUMMARY_CHATID } from '../variables';
import SummaryHeaderActions from './summary-header-actions';
import { createGlobalIntroduceMessage } from './summary-utils';
import UrgentNotification from './urgent-notification';

import ErrorBoundary from '../ErrorBoundary';

import './global-summary.scss';
import styles from './global-summary.module.scss';

import SerenaPath from '../assets/serena.png';

const GlobalSummary = forwardRef(() => {
  const { mutate } = useSWRConfig();
  const [notificationMessage, setNotificationMessage] = useState<Message | null>(null);
  const [pageInfo, setPageInfo] = useState<{ lastTime: number | undefined; hasMore: boolean }>({ lastTime: undefined, hasMore: true });
  const {
    messages, setMessages, append, stop, status,
  } = useChat({
    api: 'https://telegpt-three.vercel.app/chat',
    id: GLOBAL_SUMMARY_CHATID,
    sendExtraMessageFields: true,
    onFinish: () => {
      mutate('messages:should-scroll', 'auto');
    },
  });
  const handleLoadMore = useCallback(() => {
    return new Promise<void>((resolve) => {
      ChataiStores.summary?.getMessages(pageInfo?.lastTime, 10)?.then((res) => {
        if (res.messages) {
          const localChatAiMessages = parseSummaryStoreMessage2Message(res.messages);
          setMessages((prev) => [...localChatAiMessages, ...prev]);
        }
        setPageInfo({
          lastTime: res.lastTime,
          hasMore: res.hasMore,
        });
        resolve();
      });
    });
  }, [pageInfo?.lastTime, setMessages]);

  const handleAddSummaryMessage = useCallback((message: SummaryStoreMessage) => {
    setMessages((prev) => [...prev, message]);
  }, [setMessages]);
  const handleAddUrgentMessage = useCallback((message: SummaryStoreMessage) => {
    setMessages((prev) => [...prev, message]);
    setNotificationMessage(message);
  }, [setMessages]);

  const getSummaryHistory = useCallback(() => {
    ChataiStores.summary?.getMessages(undefined, 10)?.then((res) => {
      if (res.messages.length > 0) {
        const localChatAiMessages = parseSummaryStoreMessage2Message(res.messages);
        setMessages((prev) => [...localChatAiMessages, ...prev]);
      } else {
        const globalIntroduce = createGlobalIntroduceMessage();
        setMessages([globalIntroduce]);
      }
      setPageInfo({
        lastTime: res.lastTime,
        hasMore: res.hasMore,
      });
    });
  }, [setMessages]);

  useEffect(() => {
    eventEmitter.on(Actions.AddUrgentMessage, handleAddUrgentMessage);
    eventEmitter.on(Actions.AddSummaryMessage, handleAddSummaryMessage);
    eventEmitter.on(Actions.ChatAIStoreReady, getSummaryHistory);
    return () => {
      eventEmitter.off(Actions.AddUrgentMessage, handleAddUrgentMessage);
      eventEmitter.off(Actions.AddSummaryMessage, handleAddSummaryMessage);
      eventEmitter.off(Actions.ChatAIStoreReady, getSummaryHistory);
      setMessages([]);
    };
  }, [getSummaryHistory, handleAddSummaryMessage, handleAddUrgentMessage, setMessages]);

  useEffect(() => {
    if (ChataiStores.summary) {
      getSummaryHistory();
    }
  }, [getSummaryHistory]);

  const deleteMessage = useCallback((messageId: string) => {
    ChataiStores.summary?.delMessage(messageId).then(() => {
      setMessages((prev) => prev.filter((message) => message.id !== messageId));
    });
  }, [setMessages]);

  const handleInputSubmit = useCallback((value:string) => {
    append({
      role: 'user',
      content: value,
      id: uuidv4(),
      createdAt: new Date(),
    });
    mutate('messages:should-scroll', 'smooth');
  }, [append, mutate]);

  useEffect(() => {
    if (status === 'ready') {
      const msgs = parseMessage2SummaryStoreMessage(messages);
      ChataiStores.summary?.storeMessages(msgs);
    }
  }, [messages, status]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (status === 'streaming') {
      timer = setInterval(() => {
        mutate('messages:should-scroll', 'smooth');
      }, 500);
    } else if (timer !== undefined) {
      clearInterval(timer);
    }
    return () => {
      if (timer !== undefined) {
        clearInterval(timer);
      }
    };
  }, [mutate, status]);

  return (
    <ErrorBoundary>
      <div className="flex flex-row w-full">
        <div className={buildClassName(styles.globaSummaryBg, 'flex flex-col w-full h-full flex-1')}>
          <div className="h-[56px] w-full px-[20px] flex items-center bg-[var(--color-background)]">
            <img className="w-[40px] h-[40px] rounded-full mr-[12px]" src={SerenaPath} alt="Serena" />
            <span className="text-[15px] font-semibold">Serena AI</span>
            <div className="flex items-center ml-auto gap-[20px]">
              <SummaryHeaderActions />
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* <InfiniteScroll
              loadMore={handleLoadMore}
              hasMore={pageInfo.hasMore}
              className="px-[15%] flex-1"
            >
              {!pageInfo.hasMore && <GlobalSummaryIntroduce />}
              <Messages
                status={status}
                messages={messages}
                deleteMessage={deleteMessage}
              />
            </InfiniteScroll> */}
            <Messages
              className="px-[15%] flex-1"
              status={status}
              messages={messages}
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
