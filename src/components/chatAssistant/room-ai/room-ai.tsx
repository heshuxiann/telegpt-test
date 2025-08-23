/* eslint-disable no-null/no-null */

import {
  memo,
  useCallback, useEffect, useRef, useState,
} from 'react';
import type { Message } from '@ai-sdk/react';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { getActions } from '../../../global';

import { SERVER_API_URL } from '../../../config';
import eventEmitter, { Actions } from '../lib/EventEmitter';
import { CHATAI_IDB_STORE } from '../../../util/browser/idb';
import buildClassName from '../../../util/buildClassName';
import { searchPortrait } from '../../../util/userPortrait';
import { useScrollToBottom } from '../hook/use-scroll-to-bottom';
import { Messages } from '../messages';
import RoomStorage from '../room-storage';
import { ChataiStores } from '../store';
import { parseMessage2StoreMessage, parseStoreMessage2Message } from '../store/messages-store';
import { sendGAEvent } from '../utils/analytics';
import { getCurrentUserInfo, getHitTools } from '../utils/chat-api';
import { getAuthState, isTokenValid } from '../utils/google-auth';
import { toolsEmbeddingStore } from '../vector-store';
import RoomActions from './room-actions';
// import RoomAIDescription from './room-ai-des';
import { RoomAIInput } from './room-ai-input';
import {
  createGoogleLoginMessage, createGoogleMeetingMessage,
  createRoomDescriptionMessage, createUserPortraitMessage,
} from './room-ai-utils';

import './room-ai.scss';
import styles from './room-ai.module.scss';

interface StateProps {
  chatId: string | undefined;
}
const RoomAIInner = (props: StateProps) => {
  const { showNotification } = getActions();
  const { chatId } = props;
  const { userId, userName } = getCurrentUserInfo();
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
    messages, setMessages, append, stop, status,
  } = useChat({
    api: `${SERVER_API_URL}/chat?userId=${userId}&userName=${userName}&platform=web`,
    id: chatId,
    sendExtraMessageFields: true,
  });

  useEffect(() => {
    if (!isScrollLock) {
      scrollToBottom();
    }
  }, [isScrollLock, messages, scrollToBottom]);

  useEffect(() => {
    CHATAI_IDB_STORE.get('google-token').then((token) => {
      if (token) {
        tokenRef.current = token as string;
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
  }, [insertMessage, messages, setMessages]);

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
    if (status === 'ready' && chatId) {
      const msgs = parseMessage2StoreMessage(chatId, messages);
      ChataiStores.message?.storeMessages([...msgs]);
    }
  }, [messages, status, chatId]);

  const toolsHitCheck = (formMessage: Message) => {
    getHitTools(formMessage.content).then((toolResults) => {
      setIsLoading(false);
      if (toolResults && toolResults.length > 0) {
        toolResults.forEach((toolCall: any) => {
          if (toolCall.toolName === 'checkIsCreateMeet') {
            // TODO createMeet
            const auth = getAuthState();
            if (!auth || !isTokenValid(auth)) {
              insertMessage(createGoogleLoginMessage());
            } else {
              insertMessage(createGoogleMeetingMessage());
            }
            sendGAEvent('google_meet');
          } else if (toolCall.toolName === 'checkIsUserPortrait') {
            const userName = toolCall.result?.keyword;
            insertMessage(createUserPortraitMessage(userName));
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
    }).catch((error) => {
      setIsLoading(false);
      // eslint-disable-next-line no-console
      console.log(error);
    });
  };

  const handleInputSubmit = async (value: string) => {
    scrollToBottom();
    const newMessage: Message = {
      role: 'user',
      content: value,
      id: uuidv4(),
      createdAt: new Date(),
    };
    setMessages((messages) => {
      return [...messages, newMessage];
    });
    setIsLoading(true);
    // local tool embending check
    const vectorSearchResults = await toolsEmbeddingStore.similaritySearch({
      query: value,
      k: 10,
    });
    const matchs = vectorSearchResults.similarItems.filter((item: any) => item.score > 0.8);
    if (matchs.length > 0 || searchPortrait(value)) {
      toolsHitCheck(newMessage);
    } else {
      setIsLoading(false);
      setMessages((prev) => prev.slice(0, prev.length - 1));
      ChataiStores.message?.delMessage(newMessage.id);
      append(newMessage);
    }
  };
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
      <div>
        <RoomActions setIsLoading={(status) => setIsLoading(status)} insertMessage={insertMessage} chatId={chatId} />
        <form className="flex mx-auto px-[12px] pb-4  gap-2 w-full">
          <RoomAIInput
            status={status}
            stop={stop}
            setMessages={setMessages}
            handleInputSubmit={handleInputSubmit}
          />
        </form>
      </div>
    </div>
  );
};

const RoomAI = memo(RoomAIInner, (prevProps, nextProps) => {
  if (prevProps.chatId !== nextProps.chatId) return false;
  return true;
});

export default RoomAI;
