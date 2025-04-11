/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import type { Message } from 'ai';

interface IProps {
  isLoading: boolean;
  message: Message;
}
interface ISummaryItems {
  sender: string;
  summaryItems: {
    summary: string;
    relevantMessageIds: number[];
  }[];
}
interface IParsedMessage {
  summaryMessageCount: number;
  summaryStartTime: number;
  summaryEndTime: number;
  summaryChatIds: Array<string>;
  mainTopic: ISummaryItems[];
  pendingMatters: ISummaryItems[];
  garbageMessage: ISummaryItems[];
}

enum SummaryType {
  MainTopic = 'Main Topic',
  PendingMatters = 'Pending Matters',
  GarbageMessage = 'Garbage Message',
}

const SummaryMessageItem = ({
  type, content,
}: { type: SummaryType; content: ISummaryItems[] }) => {
  const renderSummaryTitle = () => {
    switch (type) {
      case SummaryType.MainTopic:
        return (
          <span className="text-[16px] font-bold">Message Summary</span>
        );
      case SummaryType.PendingMatters:
        return (
          <span className="text-[16px] font-bold">❗ Action Items</span>
        );
      case SummaryType.GarbageMessage:
        return (
          <span className="text-[16px] font-bold">❗ Spam Alert</span>
        );
      default:
        return 'Summary';
    }
  };
  return (
    <div>
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
          <>
            {content.map((item) => {
              const { sender, summaryItems } = item;
              return (
                <div>
                  <div>{sender}</div>
                  <ul className="m-0 list-decimal text-[16px] pl-[20px] pt-[8px]">
                    {summaryItems.map((summaryItem, index) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <li key={`summary-${index}`}>{summaryItem.summary}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
const SummaryContent = ({ message }: { message: IParsedMessage }) => {
  const {
    mainTopic, pendingMatters, garbageMessage,
  } = message;
  return (
    <div>
      <div>
        <img src="" alt="" />
      </div>
      {mainTopic && mainTopic.length > 0 && (<SummaryMessageItem type={SummaryType.MainTopic} content={mainTopic} />)}
      {pendingMatters && pendingMatters.length > 0 && (<SummaryMessageItem type={SummaryType.PendingMatters} content={pendingMatters} />)}
      {garbageMessage && garbageMessage.length > 0 && (<SummaryMessageItem type={SummaryType.GarbageMessage} content={garbageMessage} />)}
    </div>
  );
};
const GlobalSummaryMessage = (props: IProps) => {
  const { isLoading, message } = props;
  const [parsedMessage, setParsedMessage] = useState<IParsedMessage>({
    summaryMessageCount: 0,
    summaryStartTime: 0,
    summaryEndTime: 0,
    summaryChatIds: [],
    mainTopic: [],
    pendingMatters: [],
    garbageMessage: [],
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
  return parsedMessage ? <SummaryContent message={parsedMessage} /> : undefined;
};

export default GlobalSummaryMessage;
