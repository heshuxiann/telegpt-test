/* eslint-disable no-null/no-null */
import React from 'react';
import {
  memo,
  useCallback, useEffect, useRef, useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getActions } from '../../../global';

import type { Message } from '../messages/types';
import { AIMessageType } from '../messages/types';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { CHATAI_IDB_STORE } from '../../../util/browser/idb';
import buildClassName from '../../../util/buildClassName';
import { useAgentChat } from '../agent/useAgentChat';
import { useScrollToBottom } from '../hook/use-scroll-to-bottom';
import { Messages } from '../messages';
import RoomStorage from '../room-storage';
import { ChataiStores } from '../store';
import { parseMessage2StoreMessage, parseStoreMessage2Message } from '../store/messages-store';
import RoomActions from './room-actions';
// import RoomAIDescription from './room-ai-des';
import { RoomAIInput } from './room-ai-input';
import {
  createGoogleLoginMessage, createGoogleMeetingMessage,
  createRoomDescriptionMessage, createUpgradeTipMessage,
} from './room-ai-utils';

import PhaseIndicator from './PhaseIndicator';
import SelectedMessagesBanner from './SelectedMessagesBanner';
import ToolCallCard from './ToolCallCard';

import './room-ai.scss';
import styles from './room-ai.module.scss';

interface StateProps {
  chatId: string | undefined;
  selectedMessages?: Array<{
    messageId: string;
    content: string;
    senderId?: string;
    senderName?: string;
    timestamp?: number;
    selectedText?: string;
  }>;
}

const RoomAIInner = (props: StateProps) => {
  const { showNotification } = getActions();
  const { chatId, selectedMessages } = props;
  const [pageInfo, setPageInfo] = useState<{
    lastTime: number | undefined;
    hasMore: boolean;
  }>({ lastTime: undefined, hasMore: true });
  const [isLoading, setIsLoading] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const {
    scrollToBottom, scrollLocked, isScrollLock,
  } = useScrollToBottom();

  const {
    messages,
    setMessages,
    append,
    stop,
    status,
    currentPhase,
    toolCalls,
  } = useAgentChat({
    chatId,
    selectedMessages,
    showThinking: false,
    showToolCalls: true,
    detailedCitations: true,
    onError: (error) => {
      try {
        const data = JSON.parse(error.message);
        if (data.code === 102 || data.code === 103) {
          const upgradeTip = createUpgradeTipMessage();
          setMessages((prev) => [...prev, upgradeTip]);
        }
      } catch (e) {
        showNotification({
          message: error.message || 'An error occurred',
        });
      }
    },
    onFinish: (result) => {
      // eslint-disable-next-line no-console
      console.log('[RoomAI] Finished:', result);
    },
  });

  useEffect(() => {
    if (!isScrollLock) {
      scrollToBottom();
    }
  }, [isScrollLock, messages, scrollToBottom]);

  useEffect(() => {
    CHATAI_IDB_STORE.get('google-token').then((token: string) => {
      if (token) {
        tokenRef.current = token;
      }
    });
  }, []);

  const handleAddSummaryMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      const index = prev.findIndex((item) => item.id === message.id);
      if (index !== -1) {
        const newMessages = [...prev];
        newMessages[index] = message;
        return newMessages;
      }
      return [...prev, message];
    });
  }, [setMessages]);

  useEffect(() => {
    eventEmitter.on(Actions.AddRoomAIMessage, handleAddSummaryMessage);
    return () => {
      eventEmitter.off(Actions.AddRoomAIMessage, handleAddSummaryMessage);
    };
  }, [handleAddSummaryMessage]);

  const initDate = useCallback(() => {
    setMessages([]);
    setPageInfo({ lastTime: undefined, hasMore: true });
  }, [setMessages]);

  useEffect(() => {
    if (chatId) {
      initDate();
      ChataiStores.message?.getMessages(chatId, undefined, 10)?.then((res) => {
        if (res.messages.length > 0) {
          const localChatAiMessages = parseStoreMessage2Message(res.messages);
          setMessages(localChatAiMessages);
        } else {
          const roomDescription = createRoomDescriptionMessage(chatId);
          setMessages([roomDescription]);
        }
        setPageInfo({
          lastTime: res.lastTime,
          hasMore: res.hasMore,
        });
      });
      RoomStorage.updateRoomAIData(chatId, 'unreadCount', 0);
    }
  }, [chatId, initDate, setMessages]);

  const handleLoadMore = useCallback(() => {
    scrollLocked();
    return new Promise<void>((resolve) => {
      if (chatId) {
        ChataiStores.message?.getMessages(chatId, pageInfo?.lastTime, 10)?.then((res) => {
          if (res.messages) {
            const localChatAiMessages = parseStoreMessage2Message(res.messages);
            setMessages((prev) => [...localChatAiMessages, ...prev]);
          }
          setPageInfo({
            lastTime: res.lastTime,
            hasMore: res.hasMore,
          });
          resolve();
        });
      }
    });
  }, [chatId, pageInfo?.lastTime, scrollLocked, setMessages]);

  const insertMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, [setMessages]);

  const handleCreateCalendarSuccess = useCallback((payload: any) => {
    const { message, response } = payload;
    if (response?.error) {
      showNotification({
        message: response.error?.message || 'Create Calendar Failed',
      });
      if (response.error?.code === 401 || response.error?.code === 403) {
        ChataiStores.message?.delMessage(message?.id);
        const newMessage = messages.filter((item) => item.id !== message?.id);
        setMessages(newMessage);
        insertMessage(createGoogleLoginMessage());
      }
    } else {
      ChataiStores.message?.delMessage(message?.id);
      const newMessage = messages.filter((item) => item.id !== message?.id);
      const appendMessage: Message[] = [
        {
          id: uuidv4(),
          role: 'assistant' as const,
          content: 'I\'ll send the meeting invitation shortly. Please check your inbox in the next few minutes.',
          createdAt: new Date(),
          type: AIMessageType.Default,
        }, {
          id: uuidv4(),
          role: 'system' as const,
          content: JSON.stringify({
            chatId,
            eventData: response,
          }),
          createdAt: new Date(),
          type: AIMessageType.GoogleEventDetail,
        },
      ];
      const mergeMesssage = [...newMessage, ...appendMessage];
      setMessages(mergeMesssage);
    }
  }, [chatId, insertMessage, messages, setMessages]);

  const updateToken = useCallback((payload: { message: Message; token: string }) => {
    const { message, token } = payload;
    tokenRef.current = token;
    if (message) {
      ChataiStores.message?.delMessage(message.id);
      setMessages((prev) => prev.filter((item) => item.id !== message.id));
    }
  }, [setMessages]);

  const handleGoogleAuthSuccess = useCallback(() => {
    insertMessage(createGoogleMeetingMessage());
  }, [insertMessage]);

  const handleInputSubmit = useCallback((value: string) => {
    scrollToBottom();
    const newMessage: Message = {
      role: 'user',
      content: value,
      id: uuidv4(),
      createdAt: new Date(),
      type: AIMessageType.Default,
    };
    append(newMessage);
  }, [append, scrollToBottom]);

  useEffect(() => {
    eventEmitter.on(Actions.CreateCalendarSuccess, handleCreateCalendarSuccess);
    eventEmitter.on(Actions.UpdateGoogleToken, updateToken);
    eventEmitter.on(Actions.GoogleAuthSuccess, handleGoogleAuthSuccess);
    eventEmitter.on(Actions.AskRoomAI, handleInputSubmit);
    return () => {
      eventEmitter.off(Actions.CreateCalendarSuccess, handleCreateCalendarSuccess);
      eventEmitter.off(Actions.UpdateGoogleToken, updateToken);
      eventEmitter.off(Actions.GoogleAuthSuccess, handleGoogleAuthSuccess);
      eventEmitter.off(Actions.AskRoomAI, handleInputSubmit);
    };
  }, [handleCreateCalendarSuccess, handleGoogleAuthSuccess, handleInputSubmit, updateToken]);

  useEffect(() => {
    if ((status === 'ready' || status === 'error') && chatId) {
      const msgs = parseMessage2StoreMessage(chatId, messages);
      ChataiStores.message?.storeMessages([...msgs]);
    }
  }, [messages, status, chatId]);

  const deleteMessage = useCallback((messageId: string) => {
    ChataiStores.message?.delMessage(messageId).then(() => {
      setMessages((prev) => prev.filter((message) => message.id !== messageId));
    });
  }, [setMessages]);
  return (
    <div className={buildClassName(styles.rightPanelBg, 'right-panel-chat-ai')}>
      <Messages
        className="chat-ai-output-wrapper flex-1"
        isLoading={isLoading}
        status={status}
        messages={messages}
        deleteMessage={deleteMessage}
        loadMore={handleLoadMore}
        hasMore={pageInfo.hasMore}
        chatId={chatId!}
      />

      {/* 阶段指示器 */}
      {currentPhase && status === 'streaming' && (
        <div className={styles.phaseIndicatorContainer}>
          <PhaseIndicator phase={currentPhase} />
        </div>
      )}

      {/* 工具调用卡片 */}
      {toolCalls.length > 0 && (
        <div className={styles.toolCallsContainer}>
          {toolCalls.map((tool, index) => (
            <ToolCallCard key={`${tool.toolName}_${index}`} tool={tool} />
          ))}
        </div>
      )}

      <div className="px-[16px] pb-4">
        <RoomActions setIsLoading={(status) => setIsLoading(status)} insertMessage={insertMessage} chatId={chatId} />
        <div className="flex flex-col gap-2 w-full rounded-[20px] border border-[#E5E5E5] bg-white dark:bg-black px-[14px] py-[10px]">
          <div>
            {/* 渲染选中的消息文本片段 */}
            {selectedMessages && selectedMessages.length > 0 && (
              <SelectedMessagesBanner selectedMessages={selectedMessages} />
            )}
            <RoomAIInput
              status={status}
              stop={stop}
              setMessages={setMessages}
              handleInputSubmit={handleInputSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const RoomAI = memo(RoomAIInner, (prevProps, nextProps) => {
  if (prevProps.chatId !== nextProps.chatId) return false;
  if (prevProps.selectedMessages !== nextProps.selectedMessages) return false;
  return true;
});

export default RoomAI;
