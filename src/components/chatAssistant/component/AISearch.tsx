/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import type { Attachment, Message, UIMessage } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import generateChatgpt from '../lib/generate-chat';
import { Messages } from '../messages';
import { ChataiMessageStore } from '../store';
import { parseMessage2StoreMessage, parseStoreMessage2Message } from '../store/messages-store';
import vectorStore from '../vector-store';

import { AISearchInput } from './AISearchInput';

const GLOBAL_SEARCH_CHATID = '777889';

const getChatToolsHit = (message: UIMessage) => {
  if (message?.toolInvocations) {
    return message?.toolInvocations.map((tool) => {
      return {
        toolName: tool.toolName,
        queryContext: 'result' in tool && tool.result ? tool.result.queryContext : undefined,
      };
    });
  }
  return [];
};
export const AISearch = () => {
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [mergedMessages, setMergedMessages] = useState<Message[]>([]);
  const {
    messages, setMessages, append, isLoading, input, setInput, stop, handleSubmit,
  } = useChat({
    id: GLOBAL_SEARCH_CHATID,
    // api: 'https://telegpt-three.vercel.app/chat',
    api: 'http://localhost:3000/api/chat',
    sendExtraMessageFields: true,
  });

  useEffect(() => {
    ChataiMessageStore.getMessages(GLOBAL_SEARCH_CHATID, undefined, 10)?.then((res) => {
      if (res.messages) {
        const localChatAiMessages = parseStoreMessage2Message(res.messages);
        setMergedMessages(localChatAiMessages);
      }
    });
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, []);

  //   const deleteMessage = useCallback((messageId: string) => {
  //     ChataiMessageStore.delMessage(messageId).then(() => {
  //       setLocalChatAiMessages((prev) => prev.filter((message) => message.id !== messageId));
  //       setMessages((prev) => prev.filter((message) => message.id !== messageId));
  //     });
  //   }, [setMessages]);

  const searchGroup = useCallback(async (query: string) => {
    const vectorSearchResults = await vectorStore.similaritySearch({
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
    if (similarItems.length > 0) {
      const chatIds = Array.from(new Set(similarItems.map((item) => (item?.metadata as { chatId: string })?.chatId).filter(Boolean)));
      const message: UIMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: JSON.stringify(chatIds),
        createdAt: new Date(),
        parts: [],
        annotations: [{
          type: 'group-search',
        }],
      };
      setMergedMessages((prev) => [...prev, message]);
    }
  }, []);
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const toolsHit = getChatToolsHit(messages[messages.length - 1]);
      if (toolsHit.length > 0) {
        toolsHit.forEach((tool) => {
          if (tool.toolName === 'checkIsSearchGroup') {
            searchGroup(tool.queryContext);
          }
        });
      }
    }
  }, [messages, isLoading, searchGroup]);

  useEffect(() => {
    if (messages.length > 0) {
      const newMergedMessages = Array.from(
        new Map<string, Message>([...mergedMessages, ...messages].map((item) => [item.id, item])).values(),
      );
      setMergedMessages(newMergedMessages);
    }
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    if (mergedMessages.length > 0 && !isLoading) {
      const parsedMessage = parseMessage2StoreMessage(GLOBAL_SEARCH_CHATID, mergedMessages);
      ChataiMessageStore.storeMessages([...parsedMessage]);
    }
  }, [isLoading, mergedMessages]);

  return (
    <div className="px-[22px] py-[28px] flex-1 flex flex-col h-full">
      <div
        className="chat-ai-output-wrapper flex-1 overflow-auto"
      >
        <Messages
          isLoading={isLoading}
          messages={mergedMessages}
        />
      </div>
      <form className="flex mx-auto gap-2 w-full">
        <AISearchInput
          input={input}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          stop={stop}
          setInput={setInput}
          attachments={attachments}
          setAttachments={setAttachments}
          setMessages={setMessages}
        />
      </form>
    </div>
  );
};
