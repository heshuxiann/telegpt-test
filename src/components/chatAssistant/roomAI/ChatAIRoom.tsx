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
import { loadAuth2, loadGapiInsideDOM } from 'gapi-script';
import { v4 as uuidv4 } from 'uuid';

import type { ApiChat } from '../../../api/types';
import type { ApiMessage } from '../../../api/types/messages';
import type { ThreadId } from '../../../types';

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
  const { chatId } = props;
  const [localChatAiMessages, setLocalChatAiMessages] = useState<Message[]>([]);
  const [pageInfo, setPageInfo] = useState<{ lastTime: number | undefined; hasMore: boolean }>({ lastTime: undefined, hasMore: true });
  const [gapi, setGapi] = useState(null);
  const [user, setUser] = useState<any>(null);
  const tokenRef = useRef(null);
  const GOOGLE_APP_CLIENT_ID = useRef('847573679345-qq64ofbqhv7gg61e04dbrk8b92djf1fb.apps.googleusercontent.com');
  const {
    messages, handleSubmit, setMessages, input, setInput, append, isLoading, stop,
  } = useChat({
    api: 'https://telegpt-three.vercel.app/chat',
    id: chatId,
    sendExtraMessageFields: true,
  });

  useEffect(() => {
    if (chatId) {
      ChataiMessageStore.getMessages(chatId, undefined, 10)?.then((res) => {
        if (res.messages) {
          const localChatAiMessages = parseStoreMessage2Message(res.messages);
          setLocalChatAiMessages(localChatAiMessages);
        }
        setPageInfo({
          lastTime: res.lastTime,
          hasMore: res.hasMore,
        });
      });
    }
  }, [chatId]);

  const updateUser = (currentUser: any) => {
    const name = currentUser.getBasicProfile().getName();
    const profileImg = currentUser.getBasicProfile().getImageUrl();
    setUser({
      name,
      profileImg,
    });
  };

  const updateToken = (currentUser: any) => {
    const token = currentUser.getAuthResponse().access_token;
    // setToken(token);
    tokenRef.current = token;
  };

  useEffect(() => {
    const loadGapi = async () => {
      const newGapi = await loadGapiInsideDOM();
      setGapi(newGapi);
    };
    loadGapi();
  }, []);

  useEffect(() => {
    if (!gapi) return;
    const setAuth2 = async () => {
      const auth2 = await loadAuth2(gapi, GOOGLE_APP_CLIENT_ID.current, 'https://www.googleapis.com/auth/calendar');
      if (auth2.isSignedIn.get()) {
        updateUser(auth2.currentUser.get());
        updateToken(auth2.currentUser.get());
      }
    };
    setAuth2();
  }, [gapi]);

  useEffect(() => {
    if (!isLoading && chatId) {
      const msgs = parseMessage2StoreMessage(chatId, messages);
      ChataiMessageStore.storeMessages([...msgs]);
    }
  }, [messages, isLoading, chatId]);

  const toolsHitCheck = (inputValue: string) => {
    fetch('http://10.1.4.120:3001/api/toolcheck', {
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
                setMessages((prev) => [...prev, {
                  role: 'assistant',
                  id: uuidv4(),
                  createdAt: new Date(),
                  content: 'Please login first',
                  annotations: [{
                    type: 'google-auth',
                  }],
                }]);
              } else {
                setMessages((prev) => [...prev, {
                  role: 'assistant',
                  id: uuidv4(),
                  createdAt: new Date(),
                  content: '',
                  annotations: [{
                    type: 'google-event-insert',
                  }],
                }]);
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
        {localChatAiMessages && <Messages isLoading messages={localChatAiMessages} />}
        <Messages
          isLoading={isLoading}
          messages={messages}
        />
      </div>
      <form className="flex mx-auto px-4 pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
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
