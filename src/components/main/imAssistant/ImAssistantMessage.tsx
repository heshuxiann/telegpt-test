/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import type { Message } from 'ai';

interface IAssistantMessage {
  sender: string;
  content: string[];
}
interface IParsedMessage {
  mainTopic: IAssistantMessage[];
  pendingMatters: IAssistantMessage[];
  garbageMessage: IAssistantMessage[];
  menssionMessage: IAssistantMessage[];
}
interface IProps {
  isLoading: boolean;
  message: Message;
}

const ImAssistantMessageItem = ({ title, content }: { title: string; content: IAssistantMessage[] }) => {
  return (
    <div>
      <div className="text-[24px] font-bold">{title}</div>
      <div>
        {content.map((item) => (
          <div>
            <div className="text-[18px] font-medium">{item.sender}</div>
            {item.content.map((message) => (
              <span>{message}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
const ImAssistantMessage = (props: IProps) => {
  const { isLoading, message } = props;
  const [parsedMessage, setParsedMessage] = useState<IParsedMessage>({
    mainTopic: [], pendingMatters: [], garbageMessage: [], menssionMessage: [],
  });
  useEffect(() => {
    if (!isLoading) {
      const messageContent = JSON.parse(message.content.replace(/^```json\n/, '').replace(/```$/, ''));
      setParsedMessage(messageContent);
    }
  }, [isLoading, message]);
  return (
    <>
      <div className="shadow-[0_2px_12px_0_rgba(0,0,0,0.1)] radius-[12px]">
        {parsedMessage?.mainTopic && <ImAssistantMessageItem title="🗂 主要讨论话题" content={parsedMessage?.mainTopic} />}
        {parsedMessage?.pendingMatters && <ImAssistantMessageItem title="❗ 待处理事项" content={parsedMessage?.pendingMatters} />}
        {parsedMessage?.garbageMessage && <ImAssistantMessageItem title="🚫 垃圾消息" content={parsedMessage.garbageMessage} />}
      </div>
      {parsedMessage?.menssionMessage && (
        <div className="shadow-[0_2px_12px_0_rgba(0,0,0,0.1)] radius-[12px]">
          {parsedMessage?.garbageMessage && <ImAssistantMessageItem title="🗂  @ Mention you" content={parsedMessage.garbageMessage} />}
        </div>
      )}
    </>
  );
};

export default ImAssistantMessage;
