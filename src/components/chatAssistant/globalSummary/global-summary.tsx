/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-use-before-define */
// import type { Dispatch, SetStateAction } from 'react';
import React, {
  forwardRef,
  useCallback, useEffect, useRef, useState,
} from 'react';
import type { Message } from 'ai';
import { getActions } from '../../../global';

import type { InfiniteScrollRef } from '../component/InfiniteScroll';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import buildClassName from '../../../util/buildClassName';
import { Messages } from '../messages';
import { RightPanel } from '../rightPanel/right-panel';
import { ChataiStores } from '../store';
import { parseSummaryStoreMessage2Message, type SummaryStoreMessage } from '../store/summary-store';
import { sendGAEvent } from '../utils/analytics';
import { GLOBAL_SUMMARY_CHATID } from '../variables';
import SummaryHeaderActions from './summary-header-actions';
import TestActions from './test-actions';
import UrgentNotification from './urgent-notification';

import { InfiniteScroll } from '../component/InfiniteScroll';
import ErrorBoundary from '../ErrorBoundary';
import { DrawerProvider } from './DrawerContext';

import './global-summary.scss';
import styles from './global-summary.module.scss';

import SerenaPath from '../assets/serena.png';

const GlobalSummary = forwardRef(() => {
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [notificationMessage, setNotificationMessage] = useState<Message | null>(null);
  const [pageInfo, setPageInfo] = useState<{ lastTime: number | undefined; hasMore: boolean }>({ lastTime: undefined, hasMore: true });
  const handleLoadMore = useCallback(() => {
    return new Promise<void>((resolve) => {
      ChataiStores.summary?.getMessages(pageInfo?.lastTime, 10)?.then((res) => {
        if (res.messages) {
          const localChatAiMessages = parseSummaryStoreMessage2Message(res.messages);
          setMessageList((prev) => [...localChatAiMessages, ...prev]);
        }
        setPageInfo({
          lastTime: res.lastTime,
          hasMore: res.hasMore,
        });
        resolve();
      });
    });
  }, [pageInfo?.lastTime]);

  const handleAddSummaryMessage = (message: SummaryStoreMessage) => {
    setMessageList((prev) => [...prev, message]);
    // 通知
    window.Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        const notification = new Notification('Chat Summary', {
          body: 'You have received a new Chat Summary',
        });
        notification.onclick = () => {
          getActions().openChat({ id: GLOBAL_SUMMARY_CHATID });
          sendGAEvent('summary_view');
        };
        setTimeout(() => notification.close(), 5000);
      }
    });
  };
  const handleAddUrgentMessage = (message: SummaryStoreMessage) => {
    setMessageList((prev) => [...prev, message]);
    setNotificationMessage(message);
  };

  useEffect(() => {
    eventEmitter.on(Actions.AddUrgentMessage, handleAddUrgentMessage);
    eventEmitter.on(Actions.AddSummaryMessage, handleAddSummaryMessage);
    eventEmitter.on(Actions.ChatAIStoreReady, getSummaryHistory);
    return () => {
      eventEmitter.off(Actions.AddUrgentMessage, handleAddUrgentMessage);
      eventEmitter.off(Actions.AddSummaryMessage, handleAddSummaryMessage);
      eventEmitter.off(Actions.ChatAIStoreReady, getSummaryHistory);
    };
  }, []);

  const getSummaryHistory = () => {
    ChataiStores.summary?.getMessages(undefined, 10)?.then((res) => {
      if (res.messages) {
        const localChatAiMessages = parseSummaryStoreMessage2Message(res.messages);
        setMessageList((prev) => [...localChatAiMessages, ...prev]);
      }
      setPageInfo({
        lastTime: res.lastTime,
        hasMore: res.hasMore,
      });
    });
  };

  useEffect(() => {
    if (ChataiStores.summary) {
      getSummaryHistory();
    }
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    ChataiStores.summary?.delMessage(messageId).then(() => {
      setMessageList((prev) => prev.filter((message) => message.id !== messageId));
    });
  }, []);

  return (
    <ErrorBoundary>
      <DrawerProvider>
        <SummaryModalContent
          messages={messageList}
          deleteMessage={deleteMessage}
          loadMore={handleLoadMore}
          hasMore={pageInfo?.hasMore}
        />
        <UrgentNotification message={notificationMessage} />
      </DrawerProvider>
    </ErrorBoundary>

  );
});
interface SummaryContentProps {
  loadMore: () => Promise<void>;
  hasMore: boolean;
  messages: Message[];
  deleteMessage: (messageId: string) => void;
}

const SummaryModalContent = (props: SummaryContentProps) => {
  // input, setInput, handleSubmit, attachments, setAttachments, setMessages, append, stop,
  const {
    messages, deleteMessage, loadMore, hasMore,
  } = props;
  const messageListRef = useRef<InfiniteScrollRef | null>(null);
  return (
    <div className="flex flex-row w-full">
      <div className={buildClassName(styles.globaSummaryBg, 'flex flex-col w-full h-full flex-1')}>
        <div className="h-[56px] w-full px-[20px] flex items-center bg-[var(--color-background)]">
          <img className="w-[40px] h-[40px] rounded-full mr-[12px]" src={SerenaPath} alt="Serena" />
          <span className="text-[15px] font-semibold">Serena AI</span>
          <div className="flex items-center ml-auto gap-[20px]">
            <SummaryHeaderActions />
          </div>
        </div>
        <div className="chat-ai-output-wrapper flex-1 overflow-hidden">
          <InfiniteScroll
            className="chat-ai-output-wrapper"
            loadMore={loadMore}
            hasMore={hasMore}
            ref={messageListRef}
          >
            <Messages
              isLoading={false}
              messages={messages}
              deleteMessage={deleteMessage}
            />
          </InfiniteScroll>
        </div>
      </div>
      <RightPanel />
      <TestActions />
    </div>
  );
};

export default GlobalSummary;
