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
import IntroMessageManager from '../utils/intro-message-manager';
import RoomActions from './room-actions';
import { RoomAIInput } from './room-ai-input';
import {
  createGoogleLoginMessage, createGoogleMeetingMessage,
  createUpgradeTipMessage,
} from './room-ai-utils';

import SelectedMessagesBanner from './SelectedMessagesBanner';

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

  // 存储单条或多条消息的辅助函数
  const storeMessagesToDB = useCallback((messagesToStore: Message | Message[]) => {
    if (!chatId) return;

    const messagesArray = Array.isArray(messagesToStore) ? messagesToStore : [messagesToStore];
    const storeMsgs = parseMessage2StoreMessage(chatId, messagesArray);

    storeMsgs.forEach((msg) => {
      ChataiStores.message?.storeMessage(msg);
    });
  }, [chatId]);

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
          storeMessagesToDB(upgradeTip);
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
      // AI 回复完成后，存储最后一条 assistant 消息
      // 使用 setMessages 获取最新的 messages
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          storeMessagesToDB(lastMessage);
        }
        return prev;
      });
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
        storeMessagesToDB(message);
        return newMessages;
      }
      storeMessagesToDB(message);
      return [...prev, message];
    });
  }, [setMessages, storeMessagesToDB]);

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

      // 检查是否需要创建 IntroMessage
      const introMessage = IntroMessageManager.getIntroMessage(chatId);
      if (introMessage) {
        // 第一次访问该房间，创建并存储 IntroMessage
        storeMessagesToDB(introMessage);
      }

      // 从 store 加载历史消息
      ChataiStores.message?.getMessages(chatId, undefined, 10)?.then((res) => {
        if (res.messages.length > 0) {
          // Store 中有历史消息，直接加载
          const localChatAiMessages = parseStoreMessage2Message(res.messages);
          setMessages(localChatAiMessages);
        } else if (introMessage) {
          // Store 中没有消息，但刚创建了 introMessage
          setMessages([introMessage]);
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
      RoomStorage.updateRoomAIData(chatId, 'unreadCount', 0);
    }
  }, [chatId, initDate, setMessages, storeMessagesToDB, scrollToBottom]);

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
    storeMessagesToDB(message);
  }, [setMessages, storeMessagesToDB]);

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
        const loginMessage = createGoogleLoginMessage();
        insertMessage(loginMessage);
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
          role: 'teleai-system' as const,
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
      // 存储新增的消息
      storeMessagesToDB(appendMessage);
    }
  }, [chatId, insertMessage, messages, setMessages, storeMessagesToDB]);

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
      timestamp: Date.now(),
    };
    append(newMessage);
    // 存储用户消息
    storeMessagesToDB(newMessage);
  }, [append, scrollToBottom, storeMessagesToDB,chatId]);

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
        currentPhase={currentPhase}
        toolCalls={toolCalls}
        deleteMessage={deleteMessage}
        loadMore={handleLoadMore}
        hasMore={pageInfo.hasMore}
        chatId={chatId!}
      />

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
