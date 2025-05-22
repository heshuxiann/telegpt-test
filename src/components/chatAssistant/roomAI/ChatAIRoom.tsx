/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable max-len */
/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */
import React, {
  memo,
  useCallback, useEffect, useRef, useState,
} from 'react';
import type { Message } from '@ai-sdk/react';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { getActions } from '../../../global';

import type { InfiniteScrollRef } from '../component/InfiniteScroll';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { CHATAI_IDB_STORE } from '../../../util/browser/idb';
import { Messages } from '../messages';
import { ChataiStores } from '../store';
import { parseMessage2StoreMessage, parseStoreMessage2Message } from '../store/messages-store';
import { sendGAEvent } from '../utils/analytics';
import { checkGoogleAuthStatus } from '../utils/google-api';
import { RoomAIInput } from './room-ai-input';

import { InfiniteScroll } from '../component/InfiniteScroll';

import './ChatAI.scss';

interface StateProps {
  chatId: string | undefined;
}
const ChatAIRoomInner = (props: StateProps) => {
  const { showNotification } = getActions();
  const { chatId } = props;
  const [pageInfo, setPageInfo] = useState<{ lastTime: number | undefined; hasMore: boolean }>({ lastTime: undefined, hasMore: true });
  const tokenRef = useRef<string | null>(null);
  const messageListRef = useRef<InfiniteScrollRef | null>(null);
  const {
    messages, setMessages, append, isLoading, stop,
  } = useChat({
    api: 'https://telegpt-three.vercel.app/chat',
    id: chatId,
    sendExtraMessageFields: true,
  });

  useEffect(() => {
    CHATAI_IDB_STORE.get('google-token').then((token) => {
      if (token) {
        tokenRef.current = token as string;
      }
    });
  }, []);

  const initDate = useCallback(() => {
    setMessages([]);
    setPageInfo({ lastTime: undefined, hasMore: true });
  }, [setMessages]);

  useEffect(() => {
    if (chatId) {
      initDate();
      ChataiStores.message?.getMessages(chatId, undefined, 10)?.then((res) => {
        if (res.messages) {
          const localChatAiMessages = parseStoreMessage2Message(res.messages);
          setMessages(localChatAiMessages);
        }
        setPageInfo({
          lastTime: res.lastTime,
          hasMore: res.hasMore,
        });
      });
    }
  }, [chatId, initDate, setMessages]);

  const handleLoadMore = useCallback(() => {
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
  }, [chatId, pageInfo?.lastTime, setMessages]);

  const addAuthMessage = useCallback(() => {
    setMessages((prev) => [...prev, {
      role: 'assistant',
      id: uuidv4(),
      createdAt: new Date(),
      content: 'Please login first',
      annotations: [{
        type: 'google-auth',
      }],
    }]);
  }, [setMessages]);

  const addInsertGoogleEventMessage = useCallback(() => {
    setMessages((prev) => [...prev, {
      role: 'assistant',
      id: uuidv4(),
      createdAt: new Date(),
      content: '',
      annotations: [{
        type: 'google-event-insert',
      }],
    }]);
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
        setMessages(newMessage as UIMessage[]);
        addAuthMessage();
      }
    } else {
      ChataiStores.message?.delMessage(message?.id);
      const newMessage = messages.filter((item) => item.id !== message?.id);
      const appendMessage = [
        {
          id: uuidv4(),
          role: 'assistant',
          content: 'I\'ll send the meeting invitation shortly. Please check your inbox in the next few minutes.',
          createdAt: new Date(),
          parts: [],
        }, {
          id: uuidv4(),
          role: 'assistant',
          content: JSON.stringify(response),
          createdAt: new Date(),
          annotations: [{
            type: 'google-event-detail',
          }],
        },
      ];
      const mergeMesssage = [...newMessage, ...appendMessage];
      setMessages(mergeMesssage as UIMessage[]);
    }
  }, [addAuthMessage, messages, setMessages]);
  const handleGoogleAuthSuccess = useCallback(() => {
    addInsertGoogleEventMessage();
  }, [addInsertGoogleEventMessage]);
  const updateToken = useCallback((payload:{ message:Message;token:string }) => {
    const { message, token } = payload;
    tokenRef.current = token;
    if (message) {
      ChataiStores.message?.delMessage(message.id);
      setMessages((prev) => prev.filter((item) => item.id !== message.id));
    }
  }, [setMessages]);

  useEffect(() => {
    eventEmitter.on(Actions.CreateCalendarSuccess, handleCreateCalendarSuccess);
    eventEmitter.on(Actions.UpdateGoogleToken, updateToken);
    eventEmitter.on(Actions.GoogleAuthSuccess, handleGoogleAuthSuccess);
    return () => {
      eventEmitter.off(Actions.CreateCalendarSuccess, handleCreateCalendarSuccess);
      eventEmitter.off(Actions.UpdateGoogleToken, updateToken);
      eventEmitter.off(Actions.GoogleAuthSuccess, handleGoogleAuthSuccess);
    };
  }, [handleCreateCalendarSuccess, handleGoogleAuthSuccess, updateToken]);

  useEffect(() => {
    if (!isLoading && chatId) {
      const msgs = parseMessage2StoreMessage(chatId, messages);
      ChataiStores.message?.storeMessages([...msgs]);
    }
  }, [messages, isLoading, chatId]);

  const toolsHitCheck = (formMessage: Message) => {
    fetch('https://telegpt-three.vercel.app/tool-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          id: uuidv4(),
          content: formMessage.content,
          role: 'user',
        }],
      }),
    }).then((res) => res.json())
      .then((toolResults) => {
        if (toolResults && toolResults.length > 0) {
          toolResults.forEach(async (toolCall: any) => {
            if (toolCall.toolName === 'checkIsCreateMeet') {
              // TODO createMeet
              const loginStatus = await checkGoogleAuthStatus();
              if (loginStatus) {
                addInsertGoogleEventMessage();
              } else {
                addAuthMessage();
              }
              sendGAEvent('google_meet');
            } else if (toolCall.toolName === 'nullTool') {
              // eslint-disable-next-line no-console
              console.log('没有命中工具');
              setMessages((prev) => prev.slice(0, prev.length - 1));
              ChataiStores.message?.delMessage(formMessage.id);
              append({
                role: 'user',
                content: formMessage.content,
                id: uuidv4(),
                createdAt: new Date(),
              });
            }
          });
        }
      });
  };
  const handleInputSubmit = (value: string) => {
    const newMessage:Message = {
      role: 'user',
      content: value,
      id: uuidv4(),
      createdAt: new Date(),
    };
    setMessages((messages) => {
      return [...messages, newMessage];
    });
    toolsHitCheck(newMessage);
  };
  return (
    <div className="right-panel-chat-ai w-full h-full overflow-hidden">
      <InfiniteScroll
        className="chat-ai-output-wrapper"
        loadMore={handleLoadMore}
        hasMore={pageInfo.hasMore}
        ref={messageListRef}
      >
        {messages.length > 0 && (
          <Messages
            isLoading={isLoading}
            messages={messages}
          />
        )}
      </InfiniteScroll>
      <form className="flex mx-auto px-[12px] pb-4  gap-2 w-full">
        <RoomAIInput
          isLoading={isLoading}
          stop={stop}
          setMessages={setMessages}
          handleInputSubmit={handleInputSubmit}
        />
      </form>
    </div>
  );
};

const ChatAIRoom = memo(ChatAIRoomInner, (prevProps, nextProps) => {
  if (prevProps.chatId !== nextProps.chatId) return false;
  return true;
});

export default ChatAIRoom;
