/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable max-len */
/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import type { Message } from '@ai-sdk/react';
import { useChat } from '@ai-sdk/react';
import type { Attachment } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import type { ApiMessage } from '../../../api/types/messages';
import type { ThreadId } from '../../../types';

import { fetchChatUnreadMessage } from './fetch-messages';
import { Messages } from './messages';
import { MultimodalInput } from './multimodal-input';

// import useLastCallback from '../../../hooks/useLastCallback';
import './ChatAI.scss';

const summaryData = {
  mainTopic: [],
  pendingMatters: [],
  menssionMessage: [],
  garbageMessage: [],
};

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
  const {
    chatId, messageIds, messagesById, unreadCount, memoUnreadId, chat, threadId,
  } = props;
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [unreadMessages, setUnreadMessages] = useState<ApiMessage[]>([]);
  const {
    messages, handleSubmit, setMessages, input, setInput, append, isLoading, stop,
  } = useChat({
    api: 'https://telegpt-three.vercel.app/chat',
    id: chatId,
    sendExtraMessageFields: true,
  });

  useEffect(() => {
    // get unread message
    if (unreadCount > 0) {
      fetchChatUnreadMessage({
        chat,
        offsetId: memoUnreadId,
        addOffset: -31,
        sliceSize: 30,
        threadId,
        unreadCount,
      }).then((messages) => {
        setUnreadMessages(messages);
      });
    }
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [chatId]);
  const summaryTodayMessages = () => {
    const addMessage: Message[] = [];
    messageIds?.forEach((id) => {
      const message = messagesById?.[id];
      if (message && message.content.text) {
        const { entities } = message.content.text;
        const hasMention = entities?.some((entity) => entity?.userId !== undefined);
        addMessage.push({
          id: uuidv4(),
          content: `content:${message.content.text?.text},hasUnreadMention:${hasMention}`,
          role: 'user',
          annotations: [{
            isAuxiliary: true,
          }],
        });
      }
    });
    setMessages([...messages, ...addMessage]);
    append({
      role: 'user',
      id: uuidv4(),
      content: `请总结上面的聊天内容,按照下面的 json 格式输出：
            ${JSON.stringify(summaryData)};\n 主要讨论的主题放在mainTopic数组中,待处理事项放在pendingMatters数组中,被@的消息总结放在menssionMessage数组中(传入的消息中hasUnreadMention表示被@了),垃圾消息放在garbageMessage数组中;返回的消息添加额外的字段标记内容是一个 json 类型的数据`,
      annotations: [{
        isAuxiliary: true,
        isSummary: true,
      }],
    });
  };
  const summaryUnreadMessage = () => {
    if (!unreadMessages) return;
    const addMessage: Message[] = [];
    unreadMessages?.forEach((message) => {
      if (message && message.content.text) {
        const { entities } = message.content.text;
        const hasMention = entities?.some((entity) => entity?.userId !== undefined);
        addMessage.push({
          id: uuidv4(),
          content: `content:${message.content.text?.text},hasUnreadMention:${hasMention}`,
          role: 'user',
          annotations: [{
            isAuxiliary: true,
          }],
        });
      }
    });
    setMessages([...messages, ...addMessage]);
    append({
      role: 'user',
      id: uuidv4(),
      content: `请总结上面的聊天内容,按照下面的 json 格式输出：
            ${JSON.stringify(summaryData)};\n 主要讨论的主题放在mainTopic数组中,待处理事项放在pendingMatters数组中,被@的消息总结放在menssionMessage数组中(传入的消息中hasUnreadMention表示被@了),垃圾消息放在garbageMessage数组中;返回的消息添加额外的字段标记内容是一个 json 类型的数据`,
      annotations: [{
        isAuxiliary: true,
        isSummary: true,
      }],
    });
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
      <form className="flex mx-auto px-4 pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
        <MultimodalInput
          chatId={chatId as string}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          stop={stop}
          attachments={attachments}
          setAttachments={setAttachments}
          setMessages={setMessages}
          showUnreadSummary={unreadMessages.length > 0}
          summaryTodayMessages={summaryTodayMessages}
          summaryUnreadMessage={summaryUnreadMessage}
        />
      </form>
    </div>
  );
};

export default ChatAIRoom;
