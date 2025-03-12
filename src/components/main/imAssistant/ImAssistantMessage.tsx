/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import type { Message } from 'ai';

import { formatTime } from '../../../util/dates/dateFormat';

import useOldLang from '../../../hooks/useOldLang';

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

enum SummaryType {
  MainTopic = 'Main Topic',
  PendingMatters = 'Pending Matters',
  GarbageMessage = 'Garbage Message',
  MenssionMessage = 'Menssion Message',
}

const SummaryCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="border-[1px] border-[#D9D9D9] px-[15px] pt-[12px] pb-[20px] bg-[#fff] mx-[12px] rounded-[16px] my-[12px]">
      {children}
    </div>
  );
};

const SummaryMessageItem = ({ type, content, time }: { type: SummaryType; content: IAssistantMessage[];time:Date | undefined }) => {
  const oldLang = useOldLang();
  const renderSummaryTitle = () => {
    switch (type) {
      case SummaryType.MainTopic:
        return (
          <>
            <span className="mr-[10px]">🗂</span>
            <span className="text-[16px] font-bold">Message Summary:</span>
            <span className="text-[14px]">{formatTime(oldLang, time as Date)}</span>
          </>
        );
      case SummaryType.PendingMatters:
        return <span className="text-[16px] font-bold">❗ Waiting for your confirmation</span>;
      case SummaryType.GarbageMessage:
        return <span className="text-[16px] font-bold">❗ Spam Alert</span>;
      case SummaryType.MenssionMessage:
        return (
          <>
            <span className="mr-[10px]">🗂</span>
            <span className="text-[16px] font-bold">@ Mention you</span>
          </>
        );
      default:
        return 'Summary';
    }
  };
  return (
    <SummaryCard>
      <div className="flex flex-row items-center">
        {renderSummaryTitle()}
      </div>
      <div>
        {content.map((item) => (
          <div>
            <div className="text-[18px] font-medium">{item.sender}</div>
            {type === SummaryType.GarbageMessage ? (
              <div className="pt-[8px] text-[16px]">
                <div>Spam messages: <i className="not-italic font-bold">{item.content.length}</i></div>
                <div>Risk level: <i className="not-italic text-[#FCA34B] text-[16px] font-bold">Low Risk</i></div>
              </div>
            ) : (
              <ul className="m-0 list-decimal text-[16px] pl-[20px] pt-[8px]">
                {item.content.map((message) => (
                  <li>{message}</li>
                ))}
              </ul>
            )}
            {/* {item.content.map((message) => (
                <span>{message}</span>
              ))} */}
          </div>
        ))}
        {/* {type === SummaryType.GarbageMessage ? (
          <div className="pt-[8px] text-[16px]">
            <div>Spam messages: <i className="not-italic font-bold">{content.length}</i></div>
            <div>Risk level: <i className="not-italic text-[#FCA34B] text-[16px] font-bold">Low Risk</i></div>
          </div>
        ) : (
          <ul className="m-0 list-decimal text-[16px] pl-[20px] pt-[8px]">
            {content.map((message) => (
              <li>{message}</li>
            ))}
          </ul>
        )} */}
      </div>
    </SummaryCard>
  );
};
const ImAssistantMessage = (props: IProps) => {
  const { isLoading, message } = props;
  const [parsedMessage, setParsedMessage] = useState<IParsedMessage>({
    mainTopic: [], pendingMatters: [], garbageMessage: [], menssionMessage: [],
  });
  useEffect(() => {
    if (!isLoading) {
      try {
        const messageContent = JSON.parse(message.content.replace(/^```json\n/, '').replace(/```$/, ''));
        setParsedMessage(messageContent);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }
  }, [isLoading, message]);
  return (
    <>
      {parsedMessage?.mainTopic && parsedMessage?.mainTopic.length > 0 && <SummaryMessageItem type={SummaryType.MainTopic} content={parsedMessage?.mainTopic} time={message.createdAt} />}

      {parsedMessage?.pendingMatters && parsedMessage?.pendingMatters.length > 0 && <SummaryMessageItem type={SummaryType.PendingMatters} content={parsedMessage?.pendingMatters} time={message.createdAt} />}

      {parsedMessage?.menssionMessage && parsedMessage?.menssionMessage.length > 0 && <SummaryMessageItem type={SummaryType.MenssionMessage} content={parsedMessage.menssionMessage} time={message.createdAt} />}

      {parsedMessage?.garbageMessage && parsedMessage?.garbageMessage.length > 0 && <SummaryMessageItem type={SummaryType.GarbageMessage} content={parsedMessage.garbageMessage} time={message.createdAt} />}
    </>
  );
};

export default ImAssistantMessage;
