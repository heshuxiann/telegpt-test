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
import { Modal } from 'antd';

import type { InfiniteScrollRef } from '../component/InfiniteScroll';
import type { StoreMessage } from '../store/messages-store';

import { ALL_FOLDER_ID } from '../../../config';
import eventEmitter, { Actions } from '../lib/EventEmitter';
import { getOrderedIds } from '../../../util/folderManager';
import { globalSummaryTask } from '../aiTask/global-summary-task';
import { useDidUpdateEffect } from '../hook/useDidUpdateEffect';
import { CloseIcon } from '../icons';
import { Messages } from '../messages';
import { RightPanel } from '../rightPanel/right-panel';
import {
  ChataiStores, GLOBAL_SUMMARY_LAST_TIME,
} from '../store';
import { parseStoreMessage2Message } from '../store/messages-store';
import { sendGAEvent } from '../utils/analytics';
import SummaryHeaderActions from './summary-header-actions';
// import TestActions from './test-actions';
import UrgentNotification from './urgent-notification';

import { InfiniteScroll } from '../component/InfiniteScroll';
import ErrorBoundary from '../ErrorBoundary';
import { DrawerProvider } from './DrawerContext';

import './global-summary.scss';

import AISummaryPath from '../assets/ai-summary.png';
import SerenaPath from '../assets/serena.png';

const GLOBAL_SUMMARY_CHATID = '777888';
const GlobalSummary = forwardRef(() => {
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<Message | null>(null);
  const [pageInfo, setPageInfo] = useState<{ lastTime: number | undefined; hasMore: boolean }>({ lastTime: undefined, hasMore: true });
  const orderedIds = React.useMemo(() => getOrderedIds(ALL_FOLDER_ID) || [], []);
  const handleLoadMore = useCallback(() => {
    return new Promise<void>((resolve) => {
      ChataiStores.message?.getMessages(GLOBAL_SUMMARY_CHATID, pageInfo?.lastTime, 10)?.then((res) => {
        if (res.messages) {
          const localChatAiMessages = parseStoreMessage2Message(res.messages);
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

  const handleClose = React.useCallback(() => {
    setSummaryModalVisible(false);
  }, []);

  const handleAddSummaryMessage = (message: StoreMessage) => {
    setMessageList((prev) => [...prev, message]);
    // 通知
    window.Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        const notification = new Notification('Chat Summary', {
          body: 'You have received a new Chat Summary',
        });
        notification.onclick = () => {
          setSummaryModalVisible(true);
          sendGAEvent('summary_view');
        };
        setTimeout(() => notification.close(), 5000);
      }
    });
  };
  const handleAddUrgentMessage = (message: StoreMessage) => {
    setMessageList((prev) => [...prev, message]);
    setNotificationMessage(message);
  };

  useEffect(() => {
    eventEmitter.on(Actions.HideGlobalSummaryModal, handleClose);
    eventEmitter.on(Actions.AddUrgentMessage, handleAddUrgentMessage);
    eventEmitter.on(Actions.AddSummaryMessage, handleAddSummaryMessage);
    eventEmitter.on(Actions.ChatAIStoreReady, getSummaryHistory);
    return () => {
      eventEmitter.off(Actions.HideGlobalSummaryModal, handleClose);
      eventEmitter.off(Actions.AddUrgentMessage, handleAddUrgentMessage);
      eventEmitter.off(Actions.AddSummaryMessage, handleAddSummaryMessage);
      eventEmitter.off(Actions.ChatAIStoreReady, getSummaryHistory);
    };
  }, [handleClose]);

  const initUnSummaryMessage = async () => {
    const globalSummaryLastTime: number | undefined = await ChataiStores.general?.get(GLOBAL_SUMMARY_LAST_TIME);
    if (!globalSummaryLastTime) {
      // TODO 总结所有的未读消息
      globalSummaryTask.summaryAllUnreadMessages();
    } else if (globalSummaryLastTime < Date.now() - 1000 * 60 * 60 * 10) {
      globalSummaryTask.summaryMessageByDeadline(globalSummaryLastTime);
    }
  };

  useDidUpdateEffect(() => {
    if (orderedIds?.length) {
      initUnSummaryMessage();
    }
  }, [orderedIds?.length]);

  const getSummaryHistory = () => {
    ChataiStores.message?.getMessages(GLOBAL_SUMMARY_CHATID, undefined, 10)?.then((res) => {
      if (res.messages) {
        const localChatAiMessages = parseStoreMessage2Message(res.messages);
        setMessageList((prev) => [...localChatAiMessages, ...prev]);
      }
      setPageInfo({
        lastTime: res.lastTime,
        hasMore: res.hasMore,
      });
    });
  };

  useEffect(() => {
    if (ChataiStores.message) {
      getSummaryHistory();
    }
  }, []);

  const openGlobalSummaryModal = () => {
    setSummaryModalVisible(true);
    globalSummaryTask.mergeUnreadSummarys();
    sendGAEvent('summary_view');
  };

  const deleteMessage = useCallback((messageId: string) => {
    ChataiStores.message?.delMessage(messageId).then(() => {
      setMessageList((prev) => prev.filter((message) => message.id !== messageId));
    });
  }, []);

  return (
    <ErrorBoundary>
      <DrawerProvider>
        <div className="w-full h-full flex justify-center items-center cursor-pointer" onClick={openGlobalSummaryModal}>
          <img className="w-[24px] h-[24px]" src={AISummaryPath} alt="AI Summary" />
        </div>
        <Modal
          open={summaryModalVisible}
          width="100vw"
          height="100vh"
          footer={null}
          closeIcon={null}
          className="global-summary-modal"
          wrapClassName="global-summary-modal-wrap"
        >
          <SummaryModalContent
            messages={messageList}
            onClose={handleClose}
            deleteMessage={deleteMessage}
            loadMore={handleLoadMore}
            hasMore={pageInfo?.hasMore}
          />
          {/* <TestActions /> */}
        </Modal>
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
  onClose: () => void;
}

const SummaryModalContent = (props: SummaryContentProps) => {
  // input, setInput, handleSubmit, attachments, setAttachments, setMessages, append, stop,
  const {
    messages, onClose, deleteMessage, loadMore, hasMore,
  } = props;
  const messageListRef = useRef<InfiniteScrollRef | null>(null);
  return (
    <div className="globa-summary-container flex flex-col w-full h-full">
      <div className="h-[56px] w-full px-[20px] flex items-center bg-white/50">
        <img className="w-[40px] h-[40px] rounded-full mr-[12px]" src={SerenaPath} alt="Serena" />
        <span className="text-[15px] font-semibold">Serena AI</span>
        <div className="flex items-center ml-auto gap-[20px]">
          <SummaryHeaderActions />
          <div className="cursor-pointer text-black" onClick={onClose}>
            <CloseIcon />
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-row overflow-hidden">
        <div className="chat-ai-output-wrapper flex-1 h-full">
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
        <RightPanel closeSummaryModal={onClose} />
      </div>
    </div>
  );
};

export default GlobalSummary;
