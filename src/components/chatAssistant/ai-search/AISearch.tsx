/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { useChat } from '@ai-sdk/react';
import type { Attachment, Message, UIMessage } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { getGlobal } from '../../../global';

import type { InfiniteScrollRef } from '../component/InfiniteScroll';

import generateChatgpt from '../lib/generate-chat';
import { selectChat, selectUser } from '../../../global/selectors';
import { Messages } from '../messages';
import { ChataiMessageStore } from '../store';
import { parseMessage2StoreMessage, parseStoreMessage2Message } from '../store/messages-store';
import { messageEmbeddingStore } from '../vector-store';

import { InfiniteScroll } from '../component/InfiniteScroll';
import { AISearchInput } from './AISearchInput';
import AISearchSugesstions from './AISearchSugesstions';

const GLOBAL_SEARCH_CHATID = '777889';

export const AISearch = () => {
  const global = getGlobal();
  const messageListRef = useRef<InfiniteScrollRef | null>(null);
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [pageInfo, setPageInfo] = useState<{ lastTime: number | undefined; hasMore: boolean }>({ lastTime: undefined, hasMore: true });
  const {
    messages, setMessages, append, isLoading, input, setInput, stop, handleSubmit,
  } = useChat({
    id: GLOBAL_SEARCH_CHATID,
    // api: 'https://telegpt-three.vercel.app/chat',
    api: 'https://telegpt-three.vercel.app/chat',
    sendExtraMessageFields: true,
  });

  useEffect(() => {
    ChataiMessageStore.getMessages(GLOBAL_SEARCH_CHATID, undefined, 20)?.then((res) => {
      if (res.messages) {
        const localChatAiMessages = parseStoreMessage2Message(res.messages);
        setMessages((prev) => [...localChatAiMessages, ...prev]);
      }
      setPageInfo({
        lastTime: res.lastTime,
        hasMore: res.hasMore,
      });
    });
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, []);
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      const parsedMessage = parseMessage2StoreMessage(GLOBAL_SEARCH_CHATID, messages);
      ChataiMessageStore.storeMessages([...parsedMessage]);
    }
  }, [isLoading, messages]);

  const handleLoadMore = useCallback(() => {
    return new Promise<void>((resolve) => {
      ChataiMessageStore.getMessages(GLOBAL_SEARCH_CHATID, pageInfo?.lastTime, 20)?.then((res) => {
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
    });
  }, [pageInfo?.lastTime, setMessages]);

  //   const deleteMessage = useCallback((messageId: string) => {
  //     ChataiMessageStore.delMessage(messageId).then(() => {
  //       setLocalChatAiMessages((prev) => prev.filter((message) => message.id !== messageId));
  //       setMessages((prev) => prev.filter((message) => message.id !== messageId));
  //     });
  //   }, [setMessages]);

  const searchGroup = useCallback(async (query: string) => {
    const vectorSearchResults = await messageEmbeddingStore.similaritySearch({
      query,
      k: 100,
      filterOptions: {
        include: {
          metadata: {
            chatType: 'group',
          },
        },
      },
    });
    const similarItems = vectorSearchResults.similarItems;
    let searchResult = null;
    if (similarItems.length > 0) {
      const chatIds = Array.from(new Set(similarItems.map((item) => {
        if (item.score > 0.7) {
          return (item?.metadata as { chatId: string })?.chatId;
        }
        return undefined;
      }).filter(Boolean)));
      if (chatIds.length > 0) {
        searchResult = JSON.stringify(chatIds);
      }
    }
    if (searchResult) {
      const message: UIMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: searchResult,
        createdAt: new Date(),
        parts: [],
        annotations: [{
          type: 'group-search',
        }],
      };
      setMessages((prev) => [...prev, message]);
    } else {
      const message: UIMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'No relevant group was found',
        createdAt: new Date(),
        parts: [],
      };
      setMessages((prev) => [...prev, message]);
    }
  }, [setMessages]);

  const searchUser = useCallback(async (query: string) => {
    const vectorSearchResults = await messageEmbeddingStore.similaritySearch({
      query,
      k: 100,
      filterOptions: {
        include: {
          metadata: {
            chatType: 'private',
          },
        },
      },
    });
    const similarItems = vectorSearchResults.similarItems;
    let searchResult = null;
    if (similarItems.length > 0) {
      const senderIds = Array.from(new Set(similarItems.map((item) => {
        if (item.score > 0.7) {
          return (item?.metadata as { senderId: string })?.senderId;
        }
        return undefined;
      }).filter(Boolean)));
      if (senderIds.length > 0) {
        searchResult = JSON.stringify(senderIds);
      }
    }
    if (searchResult) {
      const message: UIMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: searchResult,
        createdAt: new Date(),
        parts: [],
        annotations: [{
          type: 'user-search',
        }],
      };
      setMessages((prev) => [...prev, message]);
    } else {
      const message: UIMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'No relevant users was found',
        createdAt: new Date(),
        parts: [],
      };
      setMessages((prev) => [...prev, message]);
    }
  }, [setMessages]);
  const searchMessage = useCallback(async (query: string) => {
    const vectorSearchResults = await messageEmbeddingStore.similaritySearch({
      query,
      k: 100,
    });
    const similarItems = vectorSearchResults.similarItems;
    if (similarItems.length > 0) {
      const messageList = similarItems.map((item) => {
        const { chatId, senderId } = item.metadata as { chatId:string;senderId:string };
        const chat = selectChat(global, chatId);
        if (chat) {
          const peer = senderId ? selectUser(global, senderId) : undefined;
          return {
            chatId,
            chatTitle: chat?.title ?? 'Unknown',
            senderName: peer ? `${peer.firstName || ''} ${peer.lastName || ''}` : '',
            content: item.text,
          };
        }
        return null;
      });
      append({
        role: 'user',
        content: `你是一个专业的聊天记录分析师,用户输入的关键词是${query},下面是根据关键词检索出来的相关的聊天记录,请对此加以总结:
          # 总结消息偏好:
              ## 根据消息的内容选择合适的语种进行总结
              ## 过滤所有的无意义消息；
              ## 尽量提取关键信息(如任务、问题、请求等),并简要总结。
              ## 为保证输出内容的完整性,尽量精简总结内容；
              ## 主话题不超过5个,子话题总数不超过15个
          # 消息内容
          ${JSON.stringify(messageList)}  
        `,
        id: Math.random().toString(),
        annotations: [{
          isAuxiliary: true,
        }],
      });
    }
  }, [append, global]);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('messages------->', messages);
    if (messages.length > 0 && !isLoading) {
      const parsedMessage = parseMessage2StoreMessage(GLOBAL_SEARCH_CHATID, messages);
      ChataiMessageStore.storeMessages([...parsedMessage]);
    }
  }, [isLoading, messages]);

  const toolsHitCheck = useCallback((inputValue: string) => {
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
            if (toolCall.toolName === 'checkIsSearchGroup') {
              searchGroup(toolCall.result.keyword);
            } else if (toolCall.toolName === 'checkIsSearchUser') {
              searchUser(toolCall.result.keyword);
            } else if (toolCall.toolName === 'nullTool') {
              // eslint-disable-next-line no-console
              console.log('没有命中工具');
              searchMessage(inputValue);
            }
          });
        }
      });
  }, [searchGroup, searchMessage, searchUser]);

  const handleSearch = useCallback((query: string) => {
    setMessages((messages) => {
      return [...messages, {
        role: 'user',
        content: query,
        id: Math.random().toString(),
        createdAt: new Date(),
      }];
    });
    toolsHitCheck(query);
    messageListRef.current?.scrollToBottom();
  }, [setMessages, toolsHitCheck]);

  return (
    <div className="pb-[28px] flex-1 flex flex-col h-full gap-[8px] overflow-hidden">
      <InfiniteScroll
        className="chat-ai-output-wrapper flex-1"
        loadMore={handleLoadMore}
        hasMore={pageInfo.hasMore}
        ref={messageListRef}
      >
        {!pageInfo.hasMore && (
          <AISearchSugesstions handleSearch={handleSearch} />
        )}
        <Messages
          isLoading={isLoading}
          messages={messages}
        />
      </InfiniteScroll>
      <form className="flex mx-auto gap-2 w-full">
        <AISearchInput
          isLoading={isLoading}
          stop={stop}
          setMessages={setMessages}
          handleSearch={handleSearch}
        />
      </form>
    </div>
  );
};
