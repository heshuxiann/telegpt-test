/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-use-before-define */
import type { Dispatch, SetStateAction } from 'react';
import React, {
  forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState,
} from 'react';
import { useChat } from '@ai-sdk/react';
import type {
  Attachment, ChatRequestOptions, CreateMessage, Message,
} from 'ai';
import { Modal } from 'antd';
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
import MessageStore, { parseMessage2StoreMessage, parseStoreMessage2Message } from '../store/messages-store';
import { fetchChatMessageByDeadline, fetchChatUnreadMessage } from '../utils/fetch-messages';
import summaryPrompt from './summary-prompt';

import ErrorBoundary from '../ErrorBoundary';

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
const summaryInfo = {
  summaryMessageCount: 0,
  summaryStartTime: 0,
  summaryEndTime: 0,
  summaryChatIds: [],
};

const mainTopic = [
  {
    chatId: '房间ID',
    chatTitle: '房间标题',
    summaryItems: [{
      topic: '话题',
      relevantMessage: [{
        summary: '总结',
        relevantMessageIds: [],
      }],
    }],
  },
];

const pendingMatters = {
  chatId: '',
  chatTitle: '',
  messageId: '',
  senderId: '',
  summary: '',
};

const garbageMessage = {
  chatId: '',
  chatTitle: '',
  summary: '',
  level: '',
  relevantMessageIds: [],
};

const summaryInfoTemplate = '<!-- code-id: summary-info --><!-- end-code-id -->';
const mainTopicTemplate = '<!-- code-id: main-topic --><!-- end-code-id -->';
const pendingMattersTemplate = '<!-- code-id: pending-matters --><!-- end-code-id -->';
const garbageMessageTemplate = '<!-- code-id: garbage-message --><!-- end-code-id -->';
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
const GlobalSummary = forwardRef<GlobalSummaryRef>(
  (_, ref) => {
    const global = getGlobal();
    const [pendingSummaryMessages, setPendingSummaryMessages] = useState<Record<string, ApiMessage[]>>({});
    const [localChatAiMessages, setLocalChatAiMessages] = useState<Message[]>([]);
    const [summaryModalVisible, setSummaryModalVisible] = useState(false);
    const [attachments, setAttachments] = useState<Array<Attachment>>([]);
    const [unreadSummaryCount, setUnreadSummaryCount] = useState(0);
    const {
      messages, setMessages, append, isLoading, input, setInput, stop, handleSubmit,
    } = useChat({
      api: 'https://sdm-ai-api.vercel.app/chat',
      sendExtraMessageFields: true,
    });
    const orderedIds = getOrderedIds(ALL_FOLDER_ID) || [];
    useImperativeHandle(ref, () => ({
      addNewMessage,
    }));
    const startSummary = useCallback(async (messages: Record<string, ApiMessage[]>) => {
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
        content: summaryPrompt,
        annotations: [{
          isAuxiliary: true,
          template: 'global-summary',
        }],
      });
      CHATAI_STORE.GENERAL_IDB_STORE.set(GLOBAL_SUMMARY_LAST_TIME, new Date().getTime());
      setUnreadSummaryCount(unreadSummaryCount + 1);
    }, [append, global, setMessages, unreadSummaryCount]);
    useEffect(() => {
      const executeTask = () => {
        const currentTime = new Date();
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();

        // 9:00 - 12:00 每30分钟执行一次
        if (hours >= 9 && hours < 12 && minutes % 30 === 0) {
          startSummary(pendingSummaryMessages);
        }

        // 14:00 - 17:00 每30分钟执行一次
        if (hours >= 14 && hours < 17 && minutes % 30 === 0) {
          startSummary(pendingSummaryMessages);
        }

        // 17:00 - 23:00 每2小时执行一次
        if (hours >= 17 && hours < 23 && hours % 2 === 0 && minutes === 0) {
          startSummary(pendingSummaryMessages);
        }
      };

      // 每分钟执行一次来检查时间段
      const intervalId = setInterval(executeTask, 60000);

      return () => clearInterval(intervalId); // 清理定时器
    }, [pendingSummaryMessages, startSummary]);

    useEffect(() => {
      CHATAI_STORE.GENERAL_IDB_STORE.set(GLOBAL_SUMMARY_READ_TIME, new Date().getTime());
      MessageStore.getMessages(GLOBAL_SUMMARY_CHATID, undefined, 10)?.then((res) => {
        if (res.messages) {
          const localChatAiMessages = parseStoreMessage2Message(res.messages);
          setLocalChatAiMessages(localChatAiMessages);
        }
      });
      if (orderedIds?.length) {
        initUnSummaryMessage();
      }
      // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    }, []);

    useEffect(() => {
      if (messages.length > 0) {
        const parsedMessage = parseMessage2StoreMessage(GLOBAL_SUMMARY_CHATID, messages);
        MessageStore.storeMessages([...parsedMessage]);
      }
    }, [messages]);

    const initUnSummaryMessage = async () => {
      const globalSummaryLastTime: number | undefined = await CHATAI_STORE.GENERAL_IDB_STORE.get(GLOBAL_SUMMARY_LAST_TIME);
      if (!globalSummaryLastTime || globalSummaryLastTime < Date.now() - 1000 * 60 * 60 * 12) {
        // TODO 总结所有的未读消息
        summaryAllUnreadMessages();
      }
    };

    const summaryAllUnreadMessages = async () => {
      const unreadMap: Record<string, ApiMessage[]> = {};
      for (let i = 0; i < orderedIds.length; i++) {
        const chatId = orderedIds[i];
        const chat = selectChat(global, chatId);
        const chatBot = !isSystemBot(chatId) ? selectBot(global, chatId) : undefined;
        if (chat && chat.unreadCount && !chatBot) {
          if (chat?.membersCount && chat?.membersCount > 100) {
            continue;
          }
          const firstUnreadId = selectFirstUnreadId(global, chatId, MAIN_THREAD_ID) || chat.lastReadInboxMessageId;
          const roomUnreadMsgs = await fetchChatUnreadMessage({
            chat,
            offsetId: firstUnreadId || 0,
            addOffset: -30,
            sliceSize: 30,
            threadId: MAIN_THREAD_ID,
            unreadCount: chat.unreadCount,
            maxCount: 100,
          });
          if (roomUnreadMsgs.length > 0) {
            unreadMap[chatId] = roomUnreadMsgs;
          }
        }
      }
      if (Object.keys(unreadMap).length) {
        startSummary(unreadMap);
      }
    };

    const summaryMessageByDeadline = async (deadline: number) => {
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
            maxCount: 100,
          });
          unreadMap[chatId] = roomUnreadMsgs;
        }
      }
      if (Object.keys(unreadMap).length) {
        startSummary(unreadMap);
      }
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
    const handleClose = React.useCallback(() => {
      setSummaryModalVisible(false);
    }, []);

    const openGlobalSummaryModal = async () => {
      setSummaryModalVisible(true);
      // 距离上次浏览到现在间隔超过2个周期
      const lastReadTime: number | undefined = await CHATAI_STORE.GENERAL_IDB_STORE.get(GLOBAL_SUMMARY_READ_TIME);
      if (lastReadTime && unreadSummaryCount > 2) {
        summaryMessageByDeadline(lastReadTime);
      }
      CHATAI_STORE.GENERAL_IDB_STORE.set(GLOBAL_SUMMARY_READ_TIME, new Date().getTime());
      setUnreadSummaryCount(0);
    };

    return (
      <ErrorBoundary>
        <div className="w-full h-full flex justify-center items-center cursor-pointer" onClick={openGlobalSummaryModal}>
          <img className="w-[24px] h-[24px]" src={AISummaryPath} alt="AI Summary" />
        </div>
        <Modal
          open={summaryModalVisible}
          width="100vw"
          height="100vh"
          footer={null}
          closeIcon={null}
          className="global-summary-modal"
          wrapClassName="global-summary-modal-wrap"
        >
          <SummaryModalContent
            localChatAiMessages={localChatAiMessages}
            messages={messages}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            onClose={handleClose}
            setMessages={setMessages}
            handleSubmit={handleSubmit}
            append={append}
          />
        </Modal>

      </ErrorBoundary>

    );
  },
);
interface SummaryContentProps {
  localChatAiMessages: Message[];
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
  append: (message: Message | CreateMessage, chatRequestOptions?: ChatRequestOptions) => Promise<string | null | undefined>;
  onClose: () => void;
}

const SummaryModalContent = (props: SummaryContentProps) => {
  const {
    localChatAiMessages, isLoading, messages, input, setInput, handleSubmit, attachments, setAttachments, setMessages, append, stop, onClose,
  } = props;
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const sentinelTopRef = useRef<HTMLDivElement>(null);
  const sentinelBottomRef = useRef<HTMLDivElement>(null);
  return (
    <div className="globa-summary-container flex flex-col w-full h-full">
      <div className="h-[56px] w-full px-[20px] flex items-center bg-white/50">
        <img className="w-[40px] h-[40px] rounded-full mr-[12px]" src={SerenaPath} alt="Serena" />
        <span className="text-[15px] font-semibold">Serena AI</span>
        <div className="ml-auto cursor-pointer" onClick={onClose}>
          <CloseIcon />
        </div>
      </div>
      <div className="flex flex-1 flex-row overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div
            className="chat-ai-output-wrapper flex-1 overflow-auto"
            ref={messageContainerRef}
          >
            <div ref={sentinelTopRef} className="h-[1px]" />
            {localChatAiMessages && (
              <Messages isLoading={false} messages={localChatAiMessages} />
            )}
            <Messages
              isLoading={isLoading}
              messages={messages}
            />
            <div ref={sentinelBottomRef} className="h-[1px]" />
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
        <MessagePanel closeSummaryModal={onClose} />
      </div>
    </div>
  );
};

export default GlobalSummary;
