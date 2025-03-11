/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import type { Message } from 'ai';

import { formatTime } from '../../../util/dates/dateFormat';

import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';

enum SummaryType {
  MainTopic = 'Main Topic',
  PendingMatters = 'Pending Matters',
  GarbageMessage = 'Garbage Message',
  MenssionMessage = 'Menssion Message',
}
interface IParsedMessage {
  mainTopic: [];
  pendingMatters: [];
  garbageMessage: [];
  menssionMessage: [];
}
interface IProps {
  isLoading: boolean;
  message: Message;
}
const SummaryCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="border-[1px] border-[#D9D9D9] px-[15px] pt-[12px] pb-[20px] bg-[#fff] mx-[12px] rounded-[16px]">
      {children}
    </div>
  );
};

const SummaryMessageItem = ({ type, content, time }: { type: SummaryType; content: [];time:Date | undefined }) => {
  const oldLang = useOldLang();
  const renderSummaryTitle = useLastCallback(() => {
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
  });
  return (
    <SummaryCard>
      <div className="flex flex-row items-center">
        {renderSummaryTitle()}
      </div>
      <div>
        {type === SummaryType.GarbageMessage ? (
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
        )}
      </div>
    </SummaryCard>
  );
};

const SummaryMessage = (props:IProps) => {
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
      {parsedMessage?.mainTopic && <SummaryMessageItem type={SummaryType.MainTopic} content={parsedMessage?.mainTopic} time={message.createdAt} />}

      {parsedMessage?.pendingMatters && <SummaryMessageItem type={SummaryType.PendingMatters} content={parsedMessage?.pendingMatters} time={message.createdAt} />}

      {parsedMessage?.menssionMessage && <SummaryMessageItem type={SummaryType.MenssionMessage} content={parsedMessage.menssionMessage} time={message.createdAt} />}

      {parsedMessage?.garbageMessage && <SummaryMessageItem type={SummaryType.GarbageMessage} content={parsedMessage.garbageMessage} time={message.createdAt} />}
    </>
  );
};

export default SummaryMessage;
