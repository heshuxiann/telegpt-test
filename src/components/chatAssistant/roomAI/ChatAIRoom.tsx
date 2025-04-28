/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable max-len */
/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */
import React, { useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { v4 as uuidv4 } from 'uuid';

import type { ApiChat } from '../../../api/types';
import type { ApiMessage } from '../../../api/types/messages';
import type { ThreadId } from '../../../types';

import { Messages } from '../messages';
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
  const {
    messages, handleSubmit, setMessages, input, setInput, append, isLoading, stop,
  } = useChat({
    api: 'https://telegpt-three.vercel.app/chat',
    id: chatId,
    sendExtraMessageFields: true,
  });

  const toolsHitCheck = useCallback((inputValue: string) => {
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
  }, [append]);
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
