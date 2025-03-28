/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, {
  forwardRef, useEffect, useImperativeHandle, useState,
} from 'react';
import { useChat } from '@ai-sdk/react';
import type { Attachment, Message } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { getGlobal } from '../../../global';

import { type ApiMessage, MAIN_THREAD_ID } from '../../../api/types/messages';

import { ALL_FOLDER_ID } from '../../../config';
import { isSystemBot, isUserId } from '../../../global/helpers';
import {
  selectBot, selectChat, selectChatLastMessageId, selectFirstUnreadId,
} from '../../../global/selectors';
import { getOrderedIds } from '../../../util/folderManager';
import { MultimodalInput } from '../assistantDev/multimodal-input';
import { CloseIcon } from '../icons';
import { Messages } from '../messages';
import MessagePanel from '../rightPanel/message-panel';
import { CHATAI_STORE, GLOBAL_SUMMARY_LAST_TIME, GLOBAL_SUMMARY_READ_TIME } from '../store';
import { fetchChatMessageByDeadline, fetchChatUnreadMessage } from '../utils/fetch-messages';

import './global-summary.scss';

import AISummaryPath from '../assets/ai-summary.png';
import SerenaPath from '../assets/serena.png';

const summaryResponseType = {
  summaryMessageCount: 0,
  summaryStartTime: 0,
  summaryEndTime: 0,
  summaryChatIds: [],
  mainTopic: [{
    chatId: '',
    chatTitle: '',
    summaryItems: [{
      topic: '',
      relevantMessage: [{
        summary: '',
        relevantMessageIds: [],
      }],
    }],
  }],
  pendingMatters: [{
    chatId: '',
    chatTitle: '',
    messageId: '',
    senderId: '',
    summary: '',
  }],
  garbageMessage: [{
    chatId: '',
    chatTitle: '',
    summary: '',
    level: '',
    relevantMessageIds: [],
  }],
};
interface SummaryMessage {
  chatId: string;
  chatTitle: string;
  senderId: string | undefined;
  date: number;
  messageId: number;
  content: string;
}
export interface GlobalSummaryRef {
  addNewMessage: (message: ApiMessage) => void;
}
const GLOBAL_SUMMARY_CHATID = '777888';
const SUMMARY_INTERVAL = 1000 * 60 * 60;
const GlobalSummary = forwardRef<GlobalSummaryRef>(
  (_, ref) => {
    const global = getGlobal();
    const [pendingSummaryMessages, setPendingSummaryMessages] = useState<Record<string, ApiMessage[]>>({});
    const [localChatAiMessages, setLocalChatAiMessages] = useState<Message[]>([]);
    const [summaryModalVisible, setSummaryModalVisible] = useState(false);
    const [attachments, setAttachments] = useState<Array<Attachment>>([]);
    const {
      messages, setMessages, append, isLoading, input, setInput, stop, handleSubmit,
    } = useChat({
      api: 'https://ai-api-sdm.vercel.app/chat',
      sendExtraMessageFields: true,
    });
    const orderedIds = getOrderedIds(ALL_FOLDER_ID) || [];
    useImperativeHandle(ref, () => ({
      addNewMessage,
    }));

    useEffect(() => {
      CHATAI_STORE.GENERAL_IDB_STORE.set(GLOBAL_SUMMARY_READ_TIME, new Date().getTime());
      CHATAI_STORE.MessageStore.getMessage(GLOBAL_SUMMARY_CHATID).then((localChatAiMessages) => {
        setLocalChatAiMessages(localChatAiMessages || []);
      });
      const interval = setInterval(() => {
        startSummary(pendingSummaryMessages);
      }, SUMMARY_INTERVAL);
      if (orderedIds?.length) {
        initUnSummaryMessage();
      }
      return () => clearInterval(interval);
      // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    }, []);

    useEffect(() => {
      if (messages.length > 0) {
        CHATAI_STORE.MessageStore.addMessage(GLOBAL_SUMMARY_CHATID, [...localChatAiMessages, ...messages]);
      }
    }, [messages, localChatAiMessages]);

    const initUnSummaryMessage = async () => {
      const globalSummaryLastTime:number | undefined = await CHATAI_STORE.GENERAL_IDB_STORE.get(GLOBAL_SUMMARY_LAST_TIME);
      if (!globalSummaryLastTime) {
        // TODO 总结所有的未读消息
        summaryAllUnreadMessages();
      } else {
        // TODO: 获取上次总结时间之后的未读消息
        summaryMessageByDeadline(globalSummaryLastTime);
      }
    };

    const summaryAllUnreadMessages = async () => {
      const unreadMap: Record<string, ApiMessage[]> = {};
      for (let i = 0; i < orderedIds.length; i++) {
        const chatId = orderedIds[i];
        const chat = selectChat(global, chatId);
        const chatBot = !isSystemBot(chatId) ? selectBot(global, chatId) : undefined;
        if (chat && chat.unreadCount && !chatBot) {
          const firstUnreadId = selectFirstUnreadId(global, chatId, MAIN_THREAD_ID) || chat.lastReadInboxMessageId;
          const roomUnreadMsgs = await fetchChatUnreadMessage({
            chat,
            offsetId: firstUnreadId || 0,
            addOffset: -30,
            sliceSize: 30,
            threadId: MAIN_THREAD_ID,
            unreadCount: chat.unreadCount,
          });
          unreadMap[chatId] = roomUnreadMsgs;
        }
      }
      if (Object.keys(unreadMap).length) {
        startSummary(unreadMap);
      }
    };

    const summaryMessageByDeadline = async (deadline:number) => {
      const unreadMap: Record<string, ApiMessage[]> = {};
      for (let i = 0; i < orderedIds.length; i++) {
        const chatId = orderedIds[i];
        const chat = selectChat(global, chatId);
        const chatBot = !isSystemBot(chatId) ? selectBot(global, chatId) : undefined;
        const chatLastMessageId = selectChatLastMessageId(global, chatId) || 0;
        if (chat && chat.unreadCount && !chatBot && chatLastMessageId) {
          const roomUnreadMsgs = await fetchChatMessageByDeadline({
            chat,
            deadline: deadline / 1000,
            offsetId: chatLastMessageId,
            addOffset: -30,
            sliceSize: 30,
            threadId: MAIN_THREAD_ID,
          });
          unreadMap[chatId] = roomUnreadMsgs;
        }
      }
      if (Object.keys(unreadMap).length) {
        startSummary(unreadMap);
      }
    };

    const startSummary = async (messages:Record<string, ApiMessage[]>) => {
      // eslint-disable-next-line no-console
      console.log('开始总结', messages);
      const globalSummaryLastTime = await CHATAI_STORE.GENERAL_IDB_STORE.get(GLOBAL_SUMMARY_LAST_TIME) || 0;
      const summaryTime = new Date().getTime();
      //   const summaryMessages:SummaryMessage[] = [];
      if (!Object.keys(messages).length) return;
      const summaryMessages: SummaryMessage[] = Object.entries(messages).flatMap(([chatId, messages]) => {
        const chat = selectChat(global, chatId);
        return messages.map((message) => {
          return {
            chatId,
            chatTitle: chat?.title ?? 'Unknown',
            chatType: isUserId(chatId) ? 'private' : 'group',
            senderId: message.senderId,
            date: message.date,
            messageId: Math.floor(message.id),
            content: message.content.text?.text ?? '',
          };
        });
      });
      // eslint-disable-next-line no-console
      console.log('summaryMessages', summaryMessages);
      if (!summaryMessages.length) return;
      const pendingMessage: Message = {
        id: uuidv4(),
        role: 'user',
        createdAt: new Date(),
        content: `消息列表:${summaryMessages.map((item) => JSON.stringify(item)).join(';')}\n
          消息总数量:${summaryMessages.length};\n
          总结开始时间:${globalSummaryLastTime};\n
          总结结束时间:${summaryTime};\n
          总结的房间列表:${Object.keys(messages).join(';')};\n
        `,
        annotations: [{ isAuxiliary: true }],
      };
      // eslint-disable-next-line no-console
      console.log('pendingMessage', pendingMessage);
      setMessages((prev) => {
        return [...prev, pendingMessage];
      });
      append({
        id: uuidv4(),
        role: 'user',
        content: `请总结上面的聊天内容,按照下面的 json 格式输出：
            ${JSON.stringify(summaryResponseType)};
            消息列表字段解释:
              1.chatId是房间的标识符;
              2.chatTitle是房间的标题;
              3.senderId是消息发送人的标识符;
              4.messageId是消息的唯一标识符;
              5.content是消息的内容;
            总结消息的相关概览:
              1.过滤所有的无意义消息；
              2.尽量总结关键信息,保持简洁明了,仅提及核心内容;
            总结返回的数据结构注释：
              1.mainTopic结构解释:
                a.按照房间的维度总结主要讨论的话题(chatId是房间的标识符),主要讨论的主题放在mainTopic数组中;
                b.summaryItems 房间内消息的话题列表
                c.topic 是话题名称;
                d.relevantMessage 对该话题的相关消息进行二次总结,summary是二次总结的内容,relevantMessageIds是该summary相关联的消息messageId;
              2.pendingMatters结构解:
                a.总结待处理的事项
                b.summary 总结的内容
              3.garbageMessage结构解释:
                a.按照房间的维度总结广告消息(chatId是房间的标识符);
                b.garbageMessage只需要总结chatType是private的消息
                c.summary 总结的内容,relevantMessageIds是该summary相关联的消息messageId,level是消息的级别,level的取值是high和low,分别表示高风险和低风险;
                d.包含敏感词（钱包、投资回报、代币发行、拉盘、割韭菜等）可判定为高风险
              4.summaryStartTime 总结开始时间
              5.summaryEndTime 总结结束时间
              6.summaryMessageCount 消息总数量
              7.summaryChatIds 总结的房间列表。
        `,
        annotations: [{
          isAuxiliary: true,
          template: 'global-summary',
        }],
      });
      CHATAI_STORE.GENERAL_IDB_STORE.set(GLOBAL_SUMMARY_LAST_TIME, new Date().getTime());
    };
    const addNewMessage = (message: ApiMessage) => {
      // eslint-disable-next-line no-console
      console.log('addNewMessage');
      // eslint-disable-next-line no-console
      console.log('chat---->', selectChat(global, message.chatId));
      if (message.content.text) {
        const chatId = message.chatId;
        setPendingSummaryMessages((messages) => {
          if (messages[chatId]) {
            messages[chatId].push(message);
          } else {
            messages[chatId] = [message];
          }
          return messages;
        });
      }
    };
    const openGlobalSummaryModal = async () => {
      setSummaryModalVisible(true);
      // 距离上次浏览到现在间隔超过2个周期
      const lastReadTime:number | undefined = await CHATAI_STORE.GENERAL_IDB_STORE.get(GLOBAL_SUMMARY_READ_TIME);
      if (lastReadTime && (lastReadTime + SUMMARY_INTERVAL * 2 < Date.now())) {
        summaryMessageByDeadline(lastReadTime);
      }
      CHATAI_STORE.GENERAL_IDB_STORE.set(GLOBAL_SUMMARY_READ_TIME, new Date().getTime());
    };
    return (
      <>
        <button className="w-full h-full flex justify-center items-center" onClick={openGlobalSummaryModal}>
          <img className="w-[24px] h-[24px]" src={AISummaryPath} alt="AI Summary" />
        </button>
        {summaryModalVisible && (
          <div className="globa-summary-container fixed top-0 bottom-0 left-0 right-0 z-[2147483647] flex flex-col">
            <div className="h-[56px] w-full px-[20px] flex items-center bg-white/50">
              <img className="w-[40px] h-[40px] rounded-full mr-[12px]" src={SerenaPath} alt="Serena" />
              <span className="text-[15px] font-semibold">Serena AI</span>
              <div className="ml-auto cursor-pointer" onClick={() => setSummaryModalVisible(false)}>
                <CloseIcon />
              </div>
            </div>
            <div className="flex flex-1 flex-row overflow-hidden">
              <div className="flex-1 flex flex-col">
                <div className="chat-ai-output-wrapper flex-1 overflow-auto">
                  {localChatAiMessages && (
                    <Messages isLoading={false} messages={localChatAiMessages} />
                  )}
                  <Messages
                    isLoading={isLoading}
                    messages={messages}
                  />
                </div>
                <form className="flex mx-auto px-4 pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
                  <MultimodalInput
                    chatId={GLOBAL_SUMMARY_CHATID}
                    input={input}
                    setInput={setInput}
                    handleSubmit={handleSubmit}
                    isLoading={isLoading}
                    stop={stop}
                    attachments={attachments}
                    setAttachments={setAttachments}
                    setMessages={setMessages}
                    append={append}
                  />
                </form>
              </div>
              <MessagePanel />
            </div>
          </div>
        )}

      </>

    );
  },
);

export default GlobalSummary;
