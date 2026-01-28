/* eslint-disable no-null/no-null */
import React from 'react';
import {
  useCallback, useEffect, useState,
} from 'react';
import { getGlobal } from '../../../global';

import type { Message } from '../messages/types';
import { AIMessageType } from '../messages/types';

import { SERVER_API_URL } from '../../../config';
import { selectChat, selectUser } from '../../../global/selectors';
import generateUniqueId from '../../../util/generateUniqueId';
import { useAgentChat } from '../agent/useAgentChat';
import { useScrollToBottom } from '../hook/use-scroll-to-bottom';
import { Messages } from '../messages';
import { createUpgradeTipMessage } from '../room-ai/room-ai-utils';
import { ChataiStores } from '../store';
import { parseMessage2StoreMessage, parseStoreMessage2Message } from '../store/messages-store';
import { messageEmbeddingStore } from '../vector-store';

import { AISearchInput } from './AISearchInput';

const GLOBAL_SEARCH_CHATID = '777889';

export const AISearch = () => {
  const global = getGlobal();

  const [pageInfo, setPageInfo] = useState<{ lastTime: number | undefined; hasMore: boolean }>({ lastTime: undefined, hasMore: true });
  const {
    scrollToBottom, scrollLocked, isScrollLock,
  } = useScrollToBottom();
  const {
    messages, setMessages, append, status, stop, currentPhase,
  } = useAgentChat({
    chatId: GLOBAL_SEARCH_CHATID,
    onError: (error) => {
      try {
        const data = JSON.parse(error.message);
        if (data.code === 102 || data.code === 103) {
          const upgradeTip = createUpgradeTipMessage();
          setMessages((prev) => [...prev, upgradeTip]);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('error.message is not JSON:', error.message);
      }
    },
  });

  useEffect(() => {
    if (!isScrollLock) {
      scrollToBottom();
    }
  }, [isScrollLock, messages, scrollToBottom]);

  useEffect(() => {
    ChataiStores.message?.getMessages(GLOBAL_SEARCH_CHATID, undefined, 20)?.then((res) => {
      if (res.messages.length > 0) {
        const localChatAiMessages = parseStoreMessage2Message(res.messages);
        setMessages((prev) => [...localChatAiMessages, ...prev]);
      } else {
        const suggestionMessage: Message = {
          role: 'teleai-system',
          id: generateUniqueId(),
          createdAt: new Date(),
          content: '',
          type: AIMessageType.AISearchSugesstion,
        };
        setMessages([suggestionMessage]);
      }
      setPageInfo({
        lastTime: res.lastTime,
        hasMore: res.hasMore,
      });
    });
    return () => {
      setMessages([]);
    };
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, []);
  useEffect(() => {
    if (messages.length > 0 && status === 'ready') {
      const parsedMessage = parseMessage2StoreMessage(GLOBAL_SEARCH_CHATID, messages);
      ChataiStores.message?.storeMessages([...parsedMessage]);
    }
  }, [status, messages]);

  const handleLoadMore = useCallback(() => {
    scrollLocked();
    return new Promise<void>((resolve) => {
      ChataiStores.message?.getMessages(GLOBAL_SEARCH_CHATID, pageInfo?.lastTime, 20)?.then((res) => {
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
  }, [pageInfo?.lastTime, scrollLocked, setMessages]);

  //   const deleteMessage = useCallback((messageId: string) => {
  //     ChataiStores.message?.delMessage(messageId).then(() => {
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
      const chatIds = Array.from(new Set(similarItems.map((item: any) => {
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
      const message: Message = {
        id: generateUniqueId(),
        role: 'assistant',
        content: searchResult,
        createdAt: new Date(),
        type: AIMessageType.GroupSearch,
      };
      setMessages((prev) => [...prev, message]);
    } else {
      const message: Message = {
        id: generateUniqueId(),
        role: 'assistant',
        content: 'No relevant group was found',
        createdAt: new Date(),
        type: AIMessageType.Default,
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
      const senderIds = Array.from(new Set(similarItems.map((item: any) => {
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
      const message: Message = {
        id: generateUniqueId(),
        role: 'assistant',
        content: searchResult,
        createdAt: new Date(),
        type: AIMessageType.UserSearch,
      };
      setMessages((prev) => [...prev, message]);
    } else {
      const message: Message = {
        id: generateUniqueId(),
        role: 'assistant',
        content: 'No relevant users was found',
        createdAt: new Date(),
        type: AIMessageType.Default,
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
      const messageList = similarItems.map((item: any) => {
        const { chatId, senderId } = item.metadata as { chatId: string; senderId: string };
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
        id: generateUniqueId(),
        createdAt: new Date(),
        type: AIMessageType.Default,
      });
      scrollToBottom();
    }
  }, [append, global, scrollToBottom]);

  const toolsHitCheck = useCallback((inputValue: string) => {
    fetch(`${SERVER_API_URL}/tool-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          id: generateUniqueId(),
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
        id: generateUniqueId(),
        createdAt: new Date(),
        type: AIMessageType.Default,
      }];
    });
    toolsHitCheck(query);
  }, [setMessages, toolsHitCheck]);

  return (
    <div className="pb-[28px] flex-1 flex flex-col h-full gap-[8px] overflow-hidden">
      <Messages
        className="chat-ai-output-wrapper flex-1"
        status={status}
        messages={messages}
        currentPhase={currentPhase}
        loadMore={handleLoadMore}
        hasMore={pageInfo.hasMore}
        chatId={GLOBAL_SEARCH_CHATID}
      />
      <form className="flex mx-auto gap-2 w-full">
        <AISearchInput
          status={status}
          stop={stop}
          setMessages={setMessages}
          handleSearch={handleSearch}
        />
      </form>
    </div>
  );
};
