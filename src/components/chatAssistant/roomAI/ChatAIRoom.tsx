/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable max-len */
/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */
import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import type { Message } from '@ai-sdk/react';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { getActions } from '../../../global';

import type { ApiChat } from '../../../api/types';
import type { ApiMessage } from '../../../api/types/messages';
import type { ThreadId } from '../../../types';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { CHATAI_IDB_STORE } from '../../../util/browser/idb';
import { Messages } from '../messages';
import { ChataiMessageStore } from '../store';
import { parseMessage2StoreMessage, parseStoreMessage2Message } from '../store/messages-store';
import { RoomAIInput } from './room-ai-input';

import './ChatAI.scss';

interface StateProps {
  chat:ApiChat;
  chatId: string | undefined;
  chatTitle:string | undefined;
  // chatType: string | undefined;
  threadId: ThreadId;
  messageIds?: number[];
  messagesById?: Record<number, ApiMessage>;
  unreadMessages?: ApiMessage[];
  memoUnreadId:number;
  unreadCount:number;
  onClose?: () => void;
}
const ChatAIRoom = (props: StateProps) => {
  const { showNotification } = getActions();
  const { chatId } = props;
  const [pageInfo, setPageInfo] = useState<{ lastTime: number | undefined; hasMore: boolean }>({ lastTime: undefined, hasMore: true });
  const tokenRef = useRef<string | null>(null);
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

  useEffect(() => {
    if (chatId) {
      ChataiMessageStore.getMessages(chatId, undefined, 10)?.then((res) => {
        if (res.messages) {
          const localChatAiMessages = parseStoreMessage2Message(res.messages);
          setMessages((prev) => [...prev, ...localChatAiMessages]);
        }
        setPageInfo({
          lastTime: res.lastTime,
          hasMore: res.hasMore,
        });
      });
    }
  }, [chatId, setMessages]);

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
      if (response.error?.code === 401) {
        addAuthMessage();
        return;
      }
      showNotification({
        message: response.error?.message || 'Create Calendar Failed',
      });
    } else {
      ChataiMessageStore.delMessage(message?.id);
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
      ChataiMessageStore.delMessage(message.id);
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
      ChataiMessageStore.storeMessages([...msgs]);
    }
  }, [messages, isLoading, chatId]);

  const toolsHitCheck = (inputValue: string) => {
    fetch('https://telegpt-three.vercel.app/tool-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          id: uuidv4(),
          content: inputValue,
          role: 'user',
        }],
      }),
    }).then((res) => res.json())
      .then((toolResults) => {
        if (toolResults && toolResults.length > 0) {
          toolResults.forEach((toolCall: any) => {
            if (toolCall.toolName === 'checkIsCreateMeet') {
              // TODO createMeet
              if (!tokenRef.current) {
                addAuthMessage();
              } else {
                addInsertGoogleEventMessage();
              }
            } else if (toolCall.toolName === 'nullTool') {
              // eslint-disable-next-line no-console
              console.log('没有命中工具');
              append({
                role: 'user',
                content: inputValue,
                id: uuidv4(),
                createdAt: new Date(),
              });
            }
          });
        }
      });
  };
  const handleInputSubmit = (value: string) => {
    setMessages((messages) => {
      return [...messages, {
        role: 'user',
        content: value,
        id: Math.random().toString(),
        createdAt: new Date(),
      }];
    });
    toolsHitCheck(value);
  };
  return (
    <div className="right-panel-chat-ai">
      <div className="chat-ai-output-wrapper">
        {/* {messages.map((message) => {
          return <StatusResponse content={message.content} />;
        })} */}
        <Messages
          isLoading={isLoading}
          messages={messages}
        />
      </div>
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

export default ChatAIRoom;
