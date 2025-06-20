/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import type { Message } from 'ai';

import { formatTime } from '../../../util/dates/dateFormat';
import useOldLang from '../hook/useOldLang';

enum SummaryType {
  MainTopic = 'Main Topic',
  PendingMatters = 'Pending Matters',
  GarbageMessage = 'Garbage Message',
  MenssionMessage = 'Menssion Message',
}
interface IParsedMessage {
  summaryCount:number;
  mainTopic: [];
  pendingMatters: [];
  garbageMessage: [];
  menssionMessage: [];
  range: {
    startTime: number;
    endTime: number;
  };
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
const SummaryTime = ({ startTime, endTime }:{ startTime:number;endTime:number }) => {
  const oldLang = useOldLang();
  return (
    <>
      <span>{formatTime(oldLang, startTime)}</span>
      <span> - </span>
      <span>{formatTime(oldLang, endTime)}</span>
    </>
  );
};
const SummaryMessageItem = ({
  type, content, range, summaryCount,
}: { type: SummaryType; content: [];range:{ startTime:number;endTime:number }; summaryCount:number }) => {
  const { startTime, endTime } = range;
  const renderSummaryTitle = () => {
    switch (type) {
      case SummaryType.MainTopic:
        return (
          <>
            <span className="mr-[10px]">🗂</span>
            <span className="text-[16px] font-bold">Message Summary: </span>
            {/* <span className="text-[14px]">{formatTime(oldLang, time as Date)}</span> */}
            {startTime && endTime && <SummaryTime startTime={startTime} endTime={endTime} />}
            {summaryCount && <span className="text-[16px]">({summaryCount}messages)</span>}
          </>
        );
      case SummaryType.PendingMatters:
        return (
          <>
            <span className="text-[16px] font-bold">❗ Action Items: </span>
            {startTime && endTime && <SummaryTime startTime={startTime} endTime={endTime} />}
            {summaryCount && <span className="text-[16px]">({summaryCount}messages)</span>}
          </>
        );
      case SummaryType.GarbageMessage:
        return (
          <>
            <span className="text-[16px] font-bold">❗ Spam Alert: </span>
            {startTime && endTime && <SummaryTime startTime={startTime} endTime={endTime} />}
            {summaryCount && <span className="text-[16px]">({summaryCount}messages)</span>}
          </>
        );
      case SummaryType.MenssionMessage:
        return (
          <>
            <span className="mr-[10px]">🗂</span>
            <span className="text-[16px] font-bold">@ Mention you: </span>
            {startTime && endTime && <SummaryTime startTime={startTime} endTime={endTime} />}
            {summaryCount && <span className="text-[16px]">({summaryCount}messages)</span>}
          </>
        );
      default:
        return 'Summary';
    }
  };
  return (
    <SummaryCard>
      <div className="items-center">
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
            {content.map((message, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={`summary-${index}`}>{message}</li>
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
    summaryCount: 0,
    mainTopic: [],
    pendingMatters: [],
    garbageMessage: [],
    menssionMessage: [],
    range: { startTime: 0, endTime: 0 },
  });
  useEffect(() => {
    if (!isLoading) {
      try {
        const messageContent = JSON.parse(message.content.replace(/^```json\n?/, '').replace(/```\n?$/, ''));
        setParsedMessage(messageContent);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }
  }, [isLoading, message]);
  return (
    <>
      {parsedMessage?.mainTopic && parsedMessage?.mainTopic.length > 0 && <SummaryMessageItem type={SummaryType.MainTopic} content={parsedMessage?.mainTopic} range={parsedMessage.range} summaryCount={parsedMessage.summaryCount} />}

      {parsedMessage?.pendingMatters && parsedMessage?.pendingMatters.length > 0 && <SummaryMessageItem type={SummaryType.PendingMatters} content={parsedMessage?.pendingMatters} range={parsedMessage.range} summaryCount={parsedMessage.summaryCount} />}

      {parsedMessage?.menssionMessage && parsedMessage?.menssionMessage.length > 0 && <SummaryMessageItem type={SummaryType.MenssionMessage} content={parsedMessage.menssionMessage} range={parsedMessage.range} summaryCount={parsedMessage.summaryCount} />}

      {parsedMessage?.garbageMessage && parsedMessage?.garbageMessage.length > 0 && <SummaryMessageItem type={SummaryType.GarbageMessage} content={parsedMessage.garbageMessage} range={parsedMessage.range} summaryCount={parsedMessage.summaryCount} />}
    </>
  );
};

export default SummaryMessage;
