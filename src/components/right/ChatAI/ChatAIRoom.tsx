/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */
import React, { useState } from 'react';
import type { Message } from '@ai-sdk/react';
import { useChat } from '@ai-sdk/react';
import type { Attachment } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import type { ApiMessage } from '../../../api/types/messages';
import type { ThreadId } from '../../../types';

import { Messages } from './messages';
import { MultimodalInput } from './multimodal-input';

import useLastCallback from '../../../hooks/useLastCallback';

import './ChatAI.scss';

interface StateProps {
  chatId: string | undefined;
  chatTitle:string | undefined;
  chatType: string | undefined;
  threadId: ThreadId;
  messageIds?: number[];
  messagesById?: Record<number, ApiMessage>;
  unreadMessages?: ApiMessage[];
  onClose?: () => void;
}
const ChatAIRoom = (props: StateProps) => {
  const {
    chatId, messageIds, messagesById, unreadMessages, chatTitle,
  } = props;
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const {
    messages, handleSubmit, setMessages, input, setInput, append, isLoading, stop,
  } = useChat({
    api: 'https://ai-api-sdm.vercel.app/chat',
    id: chatId,
    sendExtraMessageFields: true,
  });

  const summaryTodayMessages = useLastCallback(() => {
    const addMessage: Message[] = [];
    messageIds?.forEach((id) => {
      const message = messagesById?.[id];
      if (message && message.content.text) {
        addMessage.push({
          id: uuidv4(),
          content: message.content.text.text,
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
      content: `Please summarize the above messages from ${chatTitle} in Chinese`,
      annotations: [{
        isAuxiliary: true,
      }],
    });
  });
  const summaryUnreadMessage = useLastCallback(() => {
    if (!unreadMessages) return;
    const addMessage: Message[] = [];
    unreadMessages?.forEach((message) => {
      if (message && message.content.text) {
        addMessage.push({
          id: uuidv4(),
          content: message.content.text.text,
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
      content: `Above message from ${chatTitle} I have not read, please summarize in Chinese`,
      annotations: [{
        isAuxiliary: true,
      }],
    });
  });
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
          summaryTodayMessages={summaryTodayMessages}
          summaryUnreadMessage={summaryUnreadMessage}
        />
      </form>
    </div>
  );
};

export default ChatAIRoom;
