/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import type { Attachment, Message, UIMessage } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { getGlobal } from '../../../global';

import generateChatgpt from '../lib/generate-chat';
import { selectChat, selectUser } from '../../../global/selectors';
import { Messages } from '../messages';
import { ChataiMessageStore } from '../store';
import { parseMessage2StoreMessage, parseStoreMessage2Message } from '../store/messages-store';
import vectorStore from '../vector-store';

import { AISearchInput } from './AISearchInput';

import SerenaIcon from '../assets/serena.png';

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
  const global = getGlobal();
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const {
    messages, setMessages, append, isLoading, input, setInput, stop, handleSubmit,
  } = useChat({
    id: GLOBAL_SEARCH_CHATID,
    // api: 'https://telegpt-three.vercel.app/chat',
    api: 'https://telegpt-three.vercel.app/chat',
    sendExtraMessageFields: true,
  });

  useEffect(() => {
    ChataiMessageStore.getMessages(GLOBAL_SEARCH_CHATID, undefined, 10)?.then((res) => {
      if (res.messages) {
        const localChatAiMessages = parseStoreMessage2Message(res.messages);
        setLocalMessages(localChatAiMessages);
      }
    });
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, []);
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      const parsedMessage = parseMessage2StoreMessage(GLOBAL_SEARCH_CHATID, messages);
      ChataiMessageStore.storeMessages([...parsedMessage]);
    }
  }, [isLoading, messages]);

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
      setMessages((prev) => [...prev, message]);
    }
  }, [setMessages]);

  const searchUser = useCallback(async (query: string) => {
    const vectorSearchResults = await vectorStore.similaritySearch({
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
    // eslint-disable-next-line no-console
    console.log('similarItems------>', similarItems);
    if (similarItems.length > 0) {
      const senderIds = Array.from(new Set(similarItems.map((item) => (item?.metadata as { senderId: string })?.senderId).filter(Boolean)));
      const message: UIMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: JSON.stringify(senderIds),
        createdAt: new Date(),
        parts: [],
        annotations: [{
          type: 'user-search',
        }],
      };
      setMessages((prev) => [...prev, message]);
    }
  }, [setMessages]);
  const searchMessage = useCallback(async (query: string) => {
    const vectorSearchResults = await vectorStore.similaritySearch({
      query,
      k: 100,
    });
    const similarItems = vectorSearchResults.similarItems;
    // eslint-disable-next-line no-console
    console.log('similarItems------>', similarItems);
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
              searchGroup(inputValue);
            } else if (toolCall.toolName === 'checkIsSearchUser') {
              searchUser(inputValue);
            } else if (toolCall.toolName === 'nullTool') {
              // eslint-disable-next-line no-console
              console.log('没有命中工具');
              searchMessage(inputValue);
            }
          });
        }
      });
  }, [searchGroup, searchMessage, searchUser]);

  return (
    <div className="py-[28px] flex-1 flex flex-col h-full">
      <div
        className="chat-ai-output-wrapper flex-1 overflow-auto"
      >
        <div className="flex flex-col mx-[22px]">
          <img className="w-[52px] h-[52px] rounded-full" src={SerenaIcon} alt="" />
          <span className="font-bold text-[24px]">AI Search</span>
          <span className="mb-[12px] text-[14px]">Intelligent deep search experience.</span>
          <div className="px-[10px] py-[6px] mb-[8px] rounded-[8px] bg-[#F8F2FF] text-[14px]">
            Who is interested in early investments in GameFi projects?
          </div>
          <div className="px-[10px] py-[6px] mb-[8px] rounded-[8px] bg-[#F8F2FF] text-[14px]">
            Which meme KOLs are worth following?
          </div>
          <div className="px-[10px] py-[6px] mb-[8px] rounded-[8px] bg-[#F8F2FF] text-[14px]">
            Which of my contacts interacts with Paulo the most?
          </div>
          <div className="px-[10px] py-[6px] mb-[8px] rounded-[8px] bg-[#F8F2FF] text-[14px]">
            Which friends do Paulo and I share?
          </div>
          <div className="px-[10px] py-[6px] mb-[8px] rounded-[8px] bg-[#F8F2FF] text-[14px]">
            Find messages about Twitter Space collaboration.
          </div>
        </div>
        {localMessages.length > 0 && (
          <Messages
            isLoading={false}
            messages={localMessages}
          />
        )}
        <Messages
          isLoading={isLoading}
          messages={messages}
        />
      </div>
      <form className="flex mx-auto gap-2 w-full">
        <AISearchInput
          input={input}
          append={append}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          stop={stop}
          setInput={setInput}
          attachments={attachments}
          setAttachments={setAttachments}
          setMessages={setMessages}
          toolsHitCheck={toolsHitCheck}
        />
      </form>
    </div>
  );
};
